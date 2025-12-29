"use client";

import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { ChevronLeft, ChevronRight, CheckCircle, Wrench, Zap, Building2, MapPin, Target, Shield, AlertTriangle } from "lucide-react";
import { useComplianceLogging, ComplianceProvider } from "~/lib/complianceContext";
import { useUser } from "@clerk/react-router";
import { isAdminEmail } from "~/utils/admin";

// Step schemas
const step1Schema = z.object({
  tradeType: z.enum(["plumbing", "electrical", "both"]),
});

const step2Schema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  websiteUrl: z.string().url("Valid website URL is required").optional().or(z.literal("")),
});

const step3Schema = z.object({
  city: z.string().min(1, "City is required"),
  postcode: z.string().optional(),
  radius: z.number().min(1).max(50),
});

const step4Schema = z.object({
  serviceOfferings: z.array(z.string()).min(1, "Select at least one service"),
});

const step5Schema = z.object({
  workingHours: z.string().min(1, "Working hours are required"),
  emergencyCallouts: z.boolean(),
  weekendWork: z.boolean(),
  monthlyLeads: z.number().min(1, "Monthly leads target is required"),
  averageJobValue: z.number().min(1, "Average job value is required"),
  monthlyBudget: z.number().min(50, "Minimum budget is £50"),
});

const step6Schema = z.object({
  businessRegistration: z.boolean().refine(val => val === true, "You must confirm business registration"),
  requiredCertifications: z.boolean().refine(val => val === true, "You must confirm required certifications"),
  publicLiabilityInsurance: z.boolean().refine(val => val === true, "You must confirm public liability insurance"),
  businessEmail: z.string().email("Valid business email is required"),
  businessNumber: z.string().min(1, "Business number is required"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept terms of service"),
  complianceUnderstood: z.boolean().refine(val => val === true, "You must acknowledge compliance responsibility"),
  certificationWarning: z.boolean().refine(val => val === true, "You must acknowledge certification verification warning"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;
type Step6Data = z.infer<typeof step6Schema>;

const steps = [
  { title: "Trade Type", icon: Building2, description: "What type of trade services do you provide?" },
  { title: "Contact Info", icon: MapPin, description: "Your business contact information" },
  { title: "Service Area", icon: MapPin, description: "Where do you provide services?" },
  { title: "Services", icon: Wrench, description: "What services do you offer?" },
  { title: "Goals", icon: Target, description: "Your business goals and availability" },
  { title: "Compliance", icon: Shield, description: "Legal requirements and verification" },
  { title: "Summary", icon: CheckCircle, description: "Review your information" },
];

const plumbingServices = [
  "Emergency Plumbing",
  "Boiler Installation",
  "Boiler Repair",
  "Central Heating",
  "Bathroom Installation",
  "Leak Repair",
  "Drainage",
  "Gas Safety Certificates",
];

const electricalServices = [
  "Emergency Electrical",
  "Consumer Unit Installation",
  "Rewiring",
  "Socket Installation",
  "Lighting Installation",
  "Electric Vehicle Charging",
  "Electrical Safety Certificates",
  "Smart Home Installation",
];

interface OnboardingData {
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: Step4Data;
  step5?: Step5Data;
  step6?: Step6Data;
}

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({});
  const navigate = useNavigate();
  const hasCheckedCompleteRef = useRef(false);

  const { user } = useUser();

  const saveOnboardingData = useMutation(api.onboarding.saveOnboardingData);
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);
  const generateCampaign = useAction(api.campaigns.generateCampaign);
  const updateOnboardingAndRegenerate = useAction(api.onboarding.updateOnboardingAndRegenerate);
  const existingData = useQuery(api.onboarding.getOnboardingData);

  // Admin users must still complete onboarding on first signup
  // Only redirect if they've already completed onboarding
  useEffect(() => {
    if (user?.emailAddresses?.[0]?.emailAddress && existingData) {
      const userEmail = user.emailAddresses[0].emailAddress;
      if (isAdminEmail(userEmail) && existingData.isComplete) {
        console.log("Admin user with completed onboarding detected, redirecting to dashboard...");
        navigate("/dashboard", { replace: true });
        return;
      }
    }
  }, [user, existingData, navigate]);


  // Load existing data when available
  useEffect(() => {
    if (existingData && !hasCheckedCompleteRef.current) {
      console.log("Existing onboarding data:", existingData);

      // If onboarding is already complete, redirect to dashboard
      // Only check once on initial load to prevent redirects during manual navigation
      if (existingData.isComplete) {
        console.log("Onboarding is complete, redirecting to dashboard...");
        hasCheckedCompleteRef.current = true;
        navigate("/dashboard", { replace: true });
        return;
      } else {
        console.log("Onboarding not complete, staying on onboarding page");
        hasCheckedCompleteRef.current = true; // Mark as checked even if not complete
      }

      const mappedData: OnboardingData = {};

      if (existingData.tradeType) {
        mappedData.step1 = { tradeType: existingData.tradeType as "plumbing" | "electrical" | "both" };
      }

      if (existingData.businessName || existingData.contactName || existingData.email || existingData.phone) {
        mappedData.step2 = {
          businessName: existingData.businessName || "",
          contactName: existingData.contactName || "",
          email: existingData.email || "",
          phone: existingData.phone || "",
          websiteUrl: existingData.websiteUrl || "",
        };
      }

      if (existingData.serviceArea) {
        mappedData.step3 = {
          city: existingData.serviceArea.city,
          postcode: existingData.serviceArea.postcode,
          radius: existingData.serviceArea.radius,
        };
      }

      if (existingData.serviceOfferings) {
        mappedData.step4 = { serviceOfferings: existingData.serviceOfferings };
      }

      if (existingData.availability || existingData.acquisitionGoals) {
        mappedData.step5 = {
          workingHours: existingData.availability?.workingHours || "",
          emergencyCallouts: existingData.availability?.emergencyCallouts || false,
          weekendWork: existingData.availability?.weekendWork || false,
          monthlyLeads: existingData.acquisitionGoals?.monthlyLeads || 0,
          averageJobValue: existingData.acquisitionGoals?.averageJobValue || 0,
          monthlyBudget: existingData.acquisitionGoals?.monthlyBudget || 0,
        };
      }

      if (existingData.complianceData) {
        mappedData.step6 = {
          businessRegistration: existingData.complianceData.businessRegistration || false,
          requiredCertifications: existingData.complianceData.requiredCertifications || false,
          publicLiabilityInsurance: existingData.complianceData.publicLiabilityInsurance || false,
          businessEmail: existingData.complianceData.businessEmail || "",
          businessNumber: existingData.complianceData.businessNumber || "",
          termsAccepted: existingData.complianceData.termsAccepted || false,
          complianceUnderstood: existingData.complianceData.complianceUnderstood || false,
          certificationWarning: existingData.complianceData.certificationWarning || false,
        };
      }

      setFormData(mappedData);

      // Set current step based on completed data
      if (mappedData.step6) {
        setCurrentStep(5);
      } else if (mappedData.step5) {
        setCurrentStep(4);
      } else if (mappedData.step4) {
        setCurrentStep(3);
      } else if (mappedData.step3) {
        setCurrentStep(2);
      } else if (mappedData.step2) {
        setCurrentStep(1);
      } else if (mappedData.step1) {
        setCurrentStep(1);
      }
    }
  }, [existingData, navigate]);

  const handleNext = async (data: any) => {
    const stepKey = `step${currentStep + 1}` as keyof OnboardingData;
    const updatedData = { ...formData, [stepKey]: data };
    setFormData(updatedData);

    // Save current step data to Convex
    try {
      await saveStepData(updatedData);
    } catch (error) {
      console.error("Failed to save step data:", error);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final submission
      await handleFinalSubmission(updatedData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const saveStepData = async (allData: OnboardingData) => {
    const convexData: any = {};

    if (allData.step1) {
      convexData.tradeType = allData.step1.tradeType;
    }

    if (allData.step2) {
      convexData.businessName = allData.step2.businessName;
      convexData.contactName = allData.step2.contactName;
      convexData.email = allData.step2.email;
      convexData.phone = allData.step2.phone;
      convexData.websiteUrl = allData.step2.websiteUrl || "";
    }

    if (allData.step3) {
      convexData.serviceArea = {
        city: allData.step3.city,
        postcode: allData.step3.postcode,
        radius: allData.step3.radius,
      };
    }

    if (allData.step4) {
      convexData.serviceOfferings = allData.step4.serviceOfferings;
    }

    if (allData.step5) {
      convexData.availability = {
        workingHours: allData.step5.workingHours,
        emergencyCallouts: allData.step5.emergencyCallouts,
        weekendWork: allData.step5.weekendWork,
      };
      convexData.acquisitionGoals = {
        monthlyLeads: allData.step5.monthlyLeads,
        averageJobValue: allData.step5.averageJobValue,
        monthlyBudget: allData.step5.monthlyBudget,
      };
    }

    if (allData.step6) {
      convexData.complianceData = {
        businessRegistration: allData.step6.businessRegistration,
        requiredCertifications: allData.step6.requiredCertifications,
        publicLiabilityInsurance: allData.step6.publicLiabilityInsurance,
        businessEmail: allData.step6.businessEmail,
        businessNumber: allData.step6.businessNumber,
        termsAccepted: allData.step6.termsAccepted,
        complianceUnderstood: allData.step6.complianceUnderstood,
        certificationWarning: allData.step6.certificationWarning,
      };
    }

    await saveOnboardingData(convexData);
  };

  const handleFinalSubmission = async (allData: OnboardingData) => {
    try {
      console.log("Starting final submission...");

      // Prepare data for Convex
      const convexData: any = {};
      if (allData.step1) convexData.tradeType = allData.step1.tradeType;
      if (allData.step2) {
        convexData.businessName = allData.step2.businessName;
        convexData.contactName = allData.step2.contactName;
        convexData.email = allData.step2.email;
        convexData.phone = allData.step2.phone;
        convexData.websiteUrl = allData.step2.websiteUrl || "";
      }
      if (allData.step3) {
        convexData.serviceArea = {
          city: allData.step3.city,
          postcode: allData.step3.postcode,
          radius: allData.step3.radius,
        };
      }
      if (allData.step4) convexData.serviceOfferings = allData.step4.serviceOfferings;
      if (allData.step5) {
        convexData.availability = {
          workingHours: allData.step5.workingHours,
          emergencyCallouts: allData.step5.emergencyCallouts,
          weekendWork: allData.step5.weekendWork,
        };
        convexData.acquisitionGoals = {
          monthlyLeads: allData.step5.monthlyLeads,
          averageJobValue: allData.step5.averageJobValue,
          monthlyBudget: allData.step5.monthlyBudget,
        };
      }
      if (allData.step6) {
        convexData.complianceData = {
          businessRegistration: allData.step6.businessRegistration,
          requiredCertifications: allData.step6.requiredCertifications,
          publicLiabilityInsurance: allData.step6.publicLiabilityInsurance,
          businessEmail: allData.step6.businessEmail,
          businessNumber: allData.step6.businessNumber,
          termsAccepted: allData.step6.termsAccepted,
          complianceUnderstood: allData.step6.complianceUnderstood,
          certificationWarning: allData.step6.certificationWarning,
        };
      }
      convexData.isComplete = true;

      // Check if this is a re-do (user has existing completed onboarding)
      const isRedo = existingData?.isComplete === true;

      if (isRedo) {
        // Use updateOnboardingAndRegenerate - it checks for changes and only regenerates if relevant fields changed
        console.log("Re-doing onboarding - using updateOnboardingAndRegenerate with change detection");
        try {
          const result = await updateOnboardingAndRegenerate(convexData);
          if (result.regenerationTriggered) {
            console.log("Campaign regenerated successfully!");
          } else if (result.regenerationError) {
            console.warn("Campaign regeneration failed:", result.regenerationError);
          } else {
            console.log("No relevant fields changed - campaign not regenerated");
          }
        } catch (error) {
          console.warn("Update failed, but onboarding data saved:", error);
        }
      } else {
        // Initial onboarding - save data, mark complete, and always generate campaign
        console.log("Initial onboarding - generating campaign");
        await saveStepData(allData);
        await completeOnboarding();
        
        try {
          await generateCampaign({});
          console.log("Campaign generated successfully!");
        } catch (campaignError) {
          console.warn("Campaign generation failed, but onboarding completed:", campaignError);
        }
      }

      // Add a small delay to ensure data is persisted before redirect
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to campaigns page to show the generated campaign
      navigate("/dashboard/campaigns", { replace: true });

    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      alert("Failed to complete onboarding: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const getAvailableServices = () => {
    if (!formData.step1?.tradeType) return [];
    if (formData.step1.tradeType === "plumbing") return plumbingServices;
    if (formData.step1.tradeType === "electrical") return electricalServices;
    return [...plumbingServices, ...electricalServices];
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <ComplianceProvider>
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Setup Your Trade Business</h1>
              <Badge variant="secondary">{currentStep + 1} of {steps.length}</Badge>
            </div>
            <Progress value={progress} className="mb-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              {steps.map((step, index) => (
                <div key={index} className={`flex items-center gap-1 ${index <= currentStep ? 'text-primary' : ''}`}>
                  <step.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                {React.createElement(steps[currentStep].icon, { className: "w-6 h-6 text-primary" })}
                <div>
                  <CardTitle className="text-white">{steps[currentStep].title}</CardTitle>
                  <CardDescription>{steps[currentStep].description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Step 1: Trade Type */}
              {currentStep === 0 && <Step1Form onNext={handleNext} defaultValues={formData.step1} />}

              {/* Step 2: Contact Info */}
              {currentStep === 1 && <Step2Form onNext={handleNext} onPrevious={handlePrevious} defaultValues={formData.step2} />}

              {/* Step 3: Service Area */}
              {currentStep === 2 && <Step3Form onNext={handleNext} onPrevious={handlePrevious} defaultValues={formData.step3} />}

              {/* Step 4: Service Offerings */}
              {currentStep === 3 && <Step4Form onNext={handleNext} onPrevious={handlePrevious} defaultValues={formData.step4} availableServices={getAvailableServices()} />}

              {/* Step 5: Availability & Goals */}
              {currentStep === 4 && <Step5Form onNext={handleNext} onPrevious={handlePrevious} defaultValues={formData.step5} />}

              {/* Step 6: Compliance & Verification */}
              {currentStep === 5 && <Step6Form onNext={handleNext} onPrevious={handlePrevious} defaultValues={formData.step6} />}

              {/* Step 7: Summary */}
              {currentStep === 6 && <SummaryStep formData={formData} onNext={handleNext} onPrevious={handlePrevious} onEdit={(step: number) => setCurrentStep(step)} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </ComplianceProvider>
  );
}

// Step 1 Component
function Step1Form({ onNext, defaultValues }: { onNext: (data: Step1Data) => void; defaultValues?: Step1Data }) {
  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: defaultValues || {},
  });

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <RadioGroup
          value={form.watch("tradeType")}
          onValueChange={(value: string) => form.setValue("tradeType", value as Step1Data["tradeType"])}
        >
          <div className="flex items-center space-x-3 p-4 border border-gray-700 rounded-lg hover:border-primary">
            <RadioGroupItem value="plumbing" id="plumbing" />
            <Label htmlFor="plumbing" className="flex items-center gap-2 cursor-pointer flex-1 text-white">
              <Wrench className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium text-white">Plumbing</div>
                <div className="text-sm text-muted-foreground">Boilers, heating, drainage, bathroom installations</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-4 border border-gray-700 rounded-lg hover:border-primary">
            <RadioGroupItem value="electrical" id="electrical" />
            <Label htmlFor="electrical" className="flex items-center gap-2 cursor-pointer flex-1 text-white">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="font-medium text-white">Electrical</div>
                <div className="text-sm text-muted-foreground">Wiring, consumer units, certificates, smart homes</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-4 border border-gray-700 rounded-lg hover:border-primary">
            <RadioGroupItem value="both" id="both" />
            <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer flex-1 text-white">
              <div className="flex gap-1">
                <Wrench className="w-5 h-5 text-blue-500" />
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="font-medium text-white">Both Plumbing & Electrical</div>
                <div className="text-sm text-muted-foreground">Multi-trade services</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
        {form.formState.errors.tradeType && (
          <p className="text-sm text-red-500">{form.formState.errors.tradeType.message}</p>
        )}
      </div>

      <div className="flex justify-end pt-6">
        <Button type="submit" className="flex items-center gap-2">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

// Step 2 Component
function Step2Form({ onNext, onPrevious, defaultValues }: { onNext: (data: Step2Data) => void; onPrevious: () => void; defaultValues?: Step2Data }) {
  const form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: defaultValues || {},
  });

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-white">Business Name *</Label>
          <Input
            id="businessName"
            {...form.register("businessName")}
            placeholder="Your Company Ltd"
            className="bg-[#0A0A0A] border-gray-700"
          />
          {form.formState.errors.businessName && (
            <p className="text-sm text-red-500">{form.formState.errors.businessName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactName" className="text-white">Contact Name *</Label>
          <Input
            id="contactName"
            {...form.register("contactName")}
            placeholder="John Smith"
            className="bg-[#0A0A0A] border-gray-700"
          />
          {form.formState.errors.contactName && (
            <p className="text-sm text-red-500">{form.formState.errors.contactName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="john@yourcompany.co.uk"
            className="bg-[#0A0A0A] border-gray-700"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white">Phone Number *</Label>
          <Input
            id="phone"
            {...form.register("phone")}
            placeholder="01234 567890"
            className="bg-[#0A0A0A] border-gray-700"
          />
          {form.formState.errors.phone && (
            <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl" className="text-white">Website URL (Optional)</Label>
        <Input
          id="websiteUrl"
          type="url"
          {...form.register("websiteUrl")}
          placeholder="https://yourcompany.co.uk"
          className="bg-[#0A0A0A] border-gray-700"
        />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Not required for UK trade businesses. If provided, will be used in your ads.
          </p>
          <div className="p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-300">
            <p className="font-medium mb-1">⚠️ Without a website URL:</p>
            <ul className="list-disc list-inside space-y-0.5 text-yellow-200/80">
              <li>Your ads will use 'example.com' as a fallback</li>
              <li>Quality Score will be lower (3-4/10 vs 6-7/10)</li>
              <li>Ads will have lower performance and visibility</li>
              <li>Higher cost per click (CPC) - you'll pay more for each click</li>
              <li>Lower conversion rates - fewer calls and jobs</li>
            </ul>
            <p className="mt-1.5 text-yellow-200/90">
              Adding a website URL significantly improves ad quality and reduces costs.
            </p>
          </div>
        </div>
        {form.formState.errors.websiteUrl && (
          <p className="text-sm text-red-500">{form.formState.errors.websiteUrl.message}</p>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious} className="flex items-center gap-2 text-white">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="submit" className="flex items-center gap-2">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

// Step 3 Component
function Step3Form({ onNext, onPrevious, defaultValues }: { onNext: (data: Step3Data) => void; onPrevious: () => void; defaultValues?: Step3Data }) {
  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: defaultValues || { radius: 10 },
  });

  const radiusValue = form.watch("radius");

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-white">City/Town *</Label>
            <Input
              id="city"
              {...form.register("city")}
              placeholder="Birmingham"
              className="bg-[#0A0A0A] border-gray-700 text-white"
            />
            {form.formState.errors.city && (
              <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="postcode" className="text-white">Postcode (Optional)</Label>
            <Input
              id="postcode"
              {...form.register("postcode")}
              placeholder="B1 1AA"
              className="bg-[#0A0A0A] border-gray-700 text-white"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="radius" className="text-white">Service Radius: {radiusValue || 10} miles</Label>
          <Input
            id="radius"
            type="range"
            min="1"
            max="50"
            {...form.register("radius", { valueAsNumber: true })}
            className="bg-[#0A0A0A] border-gray-700 text-white"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>1 mile</span>
            <span>50 miles</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious} className="flex items-center gap-2 text-white">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="submit" className="flex items-center gap-2">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

// Step 4 Component
function Step4Form({ onNext, onPrevious, defaultValues, availableServices }: {
  onNext: (data: Step4Data) => void;
  onPrevious: () => void;
  defaultValues?: Step4Data;
  availableServices: string[];
}) {
  const form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: defaultValues || { serviceOfferings: [] },
  });

  const [selectedServices, setSelectedServices] = useState<string[]>(defaultValues?.serviceOfferings || []);

  const handleServiceToggle = (service: string, checked: boolean) => {
    if (checked) {
      const newServices = [...selectedServices, service];
      setSelectedServices(newServices);
      form.setValue("serviceOfferings", newServices);
    } else {
      const newServices = selectedServices.filter(s => s !== service);
      setSelectedServices(newServices);
      form.setValue("serviceOfferings", newServices);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select the services you offer to your customers:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableServices.map((service) => (
            <div key={service} className="flex items-center space-x-2">
              <Checkbox
                id={service}
                checked={selectedServices.includes(service)}
                onCheckedChange={(checked) => handleServiceToggle(service, !!checked)}
              />
              <Label htmlFor={service} className="text-sm font-normal cursor-pointer text-white">
                {service}
              </Label>
            </div>
          ))}
        </div>
        {form.formState.errors.serviceOfferings && (
          <p className="text-sm text-red-500">{form.formState.errors.serviceOfferings.message}</p>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious} className="flex items-center gap-2 text-white">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="submit" className="flex items-center gap-2">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

// Step 5 Component
function Step5Form({ onNext, onPrevious, defaultValues }: { onNext: (data: Step5Data) => void; onPrevious: () => void; defaultValues?: Step5Data }) {
  const form = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    defaultValues: defaultValues || { emergencyCallouts: false, weekendWork: false },
  });

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium text-white">Availability</h3>
          <div className="space-y-2">
            <Label htmlFor="workingHours" className="text-white">Working Hours *</Label>
            <Input
              id="workingHours"
              {...form.register("workingHours")}
              placeholder="Mon-Fri 8AM-6PM"
              className="bg-[#0A0A0A] border-gray-700 text-white"
            />
            {form.formState.errors.workingHours && (
              <p className="text-sm text-red-500">{form.formState.errors.workingHours.message}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emergencyCallouts"
              checked={form.watch("emergencyCallouts")}
              onCheckedChange={(checked) => form.setValue("emergencyCallouts", !!checked)}
            />
            <Label htmlFor="emergencyCallouts" className="text-sm font-normal text-white">
              I offer emergency callouts
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="weekendWork"
              checked={form.watch("weekendWork")}
              onCheckedChange={(checked) => form.setValue("weekendWork", !!checked)}
            />
            <Label htmlFor="weekendWork" className="text-sm font-normal text-white">
              I work weekends
            </Label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-white">Business Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyLeads" className="text-white">Monthly Leads Target *</Label>
              <Input
                id="monthlyLeads"
                type="number"
                {...form.register("monthlyLeads", { valueAsNumber: true })}
                placeholder="10"
                className="bg-[#0A0A0A] border-gray-700 text-white"
              />
              {form.formState.errors.monthlyLeads && (
                <p className="text-sm text-red-500">{form.formState.errors.monthlyLeads.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="averageJobValue" className="text-white">Average Job Value (£) *</Label>
              <Input
                id="averageJobValue"
                type="number"
                {...form.register("averageJobValue", { valueAsNumber: true })}
                placeholder="250"
                className="bg-[#0A0A0A] border-gray-700 text-white"
              />
              {form.formState.errors.averageJobValue && (
                <p className="text-sm text-red-500">{form.formState.errors.averageJobValue.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyBudget" className="text-white">Monthly Advertising Budget (£) *</Label>
            <Input
              id="monthlyBudget"
              type="number"
              {...form.register("monthlyBudget", { valueAsNumber: true })}
              placeholder="300"
              className="bg-[#0A0A0A] border-gray-700 text-white"
            />
            <p className="text-xs text-muted-foreground">
              Minimum £50/month. We recommend 5-10% of your monthly revenue.
            </p>
            {form.formState.errors.monthlyBudget && (
              <p className="text-sm text-red-500">{form.formState.errors.monthlyBudget.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious} className="flex items-center gap-2 text-white">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="submit" className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Complete Setup
        </Button>
      </div>
    </form>
  );
}

// Step 6 Component - Compliance & Verification
function Step6Form({ onNext, onPrevious, defaultValues }: { onNext: (data: Step6Data) => void; onPrevious: () => void; defaultValues?: Step6Data }) {
  const form = useForm<Step6Data>({
    resolver: zodResolver(step6Schema),
    defaultValues: defaultValues || {
      businessRegistration: false,
      requiredCertifications: false,
      publicLiabilityInsurance: false,
      businessEmail: "",
      businessNumber: "",
      termsAccepted: false,
      complianceUnderstood: false,
      certificationWarning: false,
    },
  });

  const { logAcknowledgment } = useComplianceLogging();

  const handleComplianceChange = async (field: string, checked: boolean) => {
    form.setValue(field as keyof Step6Data, checked as any);

    if (checked) {
      try {
        await logAcknowledgment(field, `User acknowledged: ${field}`, 'onboarding');
        console.log(`Compliance logged: ${field}`);
      } catch (error) {
        console.error("Failed to log compliance:", error);
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
      {/* Certification Verification Warning */}
      <div className="bg-yellow-950/50 border border-yellow-800 rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />
          <div className="space-y-3">
            <h3 className="font-semibold text-yellow-300">Certification Verification Notice</h3>
            <div className="space-y-2 text-sm text-yellow-200">
              <p><strong>Important:</strong> TradeBoost AI may contact you to request proof of certifications via email.</p>
              <p><strong>Warning:</strong> Failure to provide required documentation when requested can result in <strong>permanent suspension or ban</strong> from the platform.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Identity Verification */}
      <div className="space-y-4">
        <h3 className="font-medium text-white flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Business Identity Verification
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessEmail" className="text-white">Business Email Address *</Label>
            <Input
              id="businessEmail"
              type="email"
              {...form.register("businessEmail")}
              placeholder="info@yourbusiness.co.uk"
              className="bg-[#0A0A0A] border-gray-700 text-white"
            />
            {form.formState.errors.businessEmail && (
              <p className="text-sm text-red-500">{form.formState.errors.businessEmail.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessNumber" className="text-white">Business Registration Number *</Label>
            <Input
              id="businessNumber"
              {...form.register("businessNumber")}
              placeholder="Company Number, UTR, or VAT Number"
              className="bg-[#0A0A0A] border-gray-700 text-white"
            />
            <p className="text-xs text-muted-foreground">
              Provide your Company Number, UTR (Unique Taxpayer Reference), or VAT Number
            </p>
            {form.formState.errors.businessNumber && (
              <p className="text-sm text-red-500">{form.formState.errors.businessNumber.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Certification Requirements */}
      <div className="space-y-4">
        <h3 className="font-medium text-white">Required Certifications & Registrations</h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-4 border border-gray-700 rounded-lg">
            <Checkbox
              id="businessRegistration"
              checked={form.watch("businessRegistration")}
              onCheckedChange={(checked) => handleComplianceChange('businessRegistration', !!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="businessRegistration" className="text-white font-medium">
                Business Registration *
              </Label>
              <p className="text-sm text-muted-foreground">
                I confirm my business is registered with HMRC or Companies House
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border border-gray-700 rounded-lg">
            <Checkbox
              id="requiredCertifications"
              checked={form.watch("requiredCertifications")}
              onCheckedChange={(checked) => handleComplianceChange('requiredCertifications', !!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="requiredCertifications" className="text-white font-medium">
                Required Trade Certifications *
              </Label>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• <strong>Gas work:</strong> Gas Safe Registration (legally required for boilers, heating, gas appliances)</p>
                <p>• <strong>Electrical work:</strong> Part P Electrical Certification for domestic work</p>
                <p>I confirm I hold all necessary certifications for the services I advertise</p>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 border border-gray-700 rounded-lg">
            <Checkbox
              id="publicLiabilityInsurance"
              checked={form.watch("publicLiabilityInsurance")}
              onCheckedChange={(checked) => handleComplianceChange('publicLiabilityInsurance', !!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="publicLiabilityInsurance" className="text-white font-medium">
                Public Liability Insurance *
              </Label>
              <p className="text-sm text-muted-foreground">
                I confirm I have valid public liability insurance (minimum £1 million coverage recommended)
              </p>
            </div>
          </div>
        </div>

        {(form.formState.errors.businessRegistration || form.formState.errors.requiredCertifications || form.formState.errors.publicLiabilityInsurance) && (
          <p className="text-sm text-red-500">All certifications must be confirmed to continue</p>
        )}
      </div>

      {/* Legal Acknowledgments */}
      <div className="bg-red-950/50 border border-red-800 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Legal Compliance Requirements
        </h3>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="complianceUnderstood"
              className="border-red-400 mt-1"
              checked={form.watch("complianceUnderstood")}
              onCheckedChange={(checked) => handleComplianceChange('complianceUnderstood', !!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="complianceUnderstood" className="text-red-200 font-medium">
                Advertising Compliance Responsibility *
              </Label>
              <p className="text-sm text-red-200">
                I understand I am solely responsible for ensuring all advertising claims are accurate, legal, and compliant with UK regulations. False advertising can result in £5,000+ fines and legal action.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="certificationWarning"
              className="border-red-400 mt-1"
              checked={form.watch("certificationWarning")}
              onCheckedChange={(checked) => handleComplianceChange('certificationWarning', !!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="certificationWarning" className="text-red-200 font-medium">
                Certification Verification Warning *
              </Label>
              <p className="text-sm text-red-200">
                I acknowledge that TradeBoost AI may request proof of certifications and that failure to provide documentation when requested can result in permanent account suspension.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="termsAccepted"
              className="border-red-400 mt-1"
              checked={form.watch("termsAccepted")}
              onCheckedChange={(checked) => handleComplianceChange('termsAccepted', !!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="termsAccepted" className="text-red-200 font-medium">
                Terms of Service *
              </Label>
              <p className="text-sm text-red-200">
                I have read and agree to the <a href="/terms" target="_blank" className="underline hover:text-red-100">Terms of Service</a> and understand that TradeBoost AI provides advertising suggestions only, not legal advice.
              </p>
            </div>
          </div>
        </div>

        {(form.formState.errors.complianceUnderstood || form.formState.errors.certificationWarning || form.formState.errors.termsAccepted) && (
          <p className="text-sm text-red-400">All legal requirements must be acknowledged to continue</p>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious} className="flex items-center gap-2 text-white">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button type="submit" className="flex items-center gap-2">
          Review & Complete
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

// Summary Step Component
function SummaryStep({ formData, onNext, onPrevious, onEdit }: {
  formData: OnboardingData;
  onNext: (data: any) => void;
  onPrevious: () => void;
  onEdit: (step: number) => void;
}) {
  const { logAcknowledgment } = useComplianceLogging();

  const handleSubmit = async () => {
    // Log final onboarding completion
    try {
      await logAcknowledgment(
        'onboarding_completed',
        'User completed onboarding with all compliance acknowledgments',
        'onboarding'
      );
      console.log("Onboarding completed with full compliance acknowledgment");
    } catch (error) {
      console.error("Failed to log onboarding completion:", error);
    }

    onNext({}); // Empty data since this is just confirmation
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Trade Type */}
        {formData.step1 && (
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center gap-2 text-white">
                <Building2 className="w-4 h-4" />
                Trade Type
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onEdit(0)} className="text-white hover:text-gray-300">
                Edit
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {formData.step1.tradeType === "plumbing" && <Wrench className="w-4 h-4 text-blue-500" />}
              {formData.step1.tradeType === "electrical" && <Zap className="w-4 h-4 text-yellow-500" />}
              {formData.step1.tradeType === "both" && (
                <>
                  <Wrench className="w-4 h-4 text-blue-500" />
                  <Zap className="w-4 h-4 text-yellow-500" />
                </>
              )}
              <span className="capitalize text-white">{formData.step1.tradeType}</span>
            </div>
          </div>
        )}

        {/* Contact Info */}
        {formData.step2 && (
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4" />
                Contact Information
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onEdit(1)} className="text-white hover:text-gray-300">
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Business:</span>
                <p className="text-white">{formData.step2.businessName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Contact:</span>
                <p className="text-white">{formData.step2.contactName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="text-white">{formData.step2.email}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <p className="text-white">{formData.step2.phone}</p>
              </div>
              {formData.step2.websiteUrl && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Website:</span>
                  <p className="text-white">{formData.step2.websiteUrl}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Area */}
        {formData.step3 && (
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4" />
                Service Area
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onEdit(2)} className="text-white hover:text-gray-300">
                Edit
              </Button>
            </div>
            <div className="text-sm">
              <p className="text-white">{formData.step3.city}{formData.step3.postcode && `, ${formData.step3.postcode}`}</p>
              <p className="text-muted-foreground">Within {formData.step3.radius} miles</p>
            </div>
          </div>
        )}

        {/* Services */}
        {formData.step4 && (
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center gap-2 text-white">
                <Wrench className="w-4 h-4" />
                Services Offered
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onEdit(3)} className="text-white hover:text-gray-300">
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {formData.step4.serviceOfferings.map((service) => (
                <div key={service} className="flex items-center gap-2 text-white">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  {service}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals & Availability */}
        {formData.step5 && (
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center gap-2 text-white">
                <Target className="w-4 h-4" />
                Business Goals & Availability
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onEdit(4)} className="text-white hover:text-gray-300">
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Working Hours:</span>
                <p className="text-white">{formData.step5.workingHours}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Monthly Lead Target:</span>
                <p className="text-white">{formData.step5.monthlyLeads} leads</p>
              </div>
              <div>
                <span className="text-muted-foreground">Average Job Value:</span>
                <p className="text-white">£{formData.step5.averageJobValue}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Monthly Budget:</span>
                <p className="text-white">£{formData.step5.monthlyBudget}</p>
              </div>
              <div className="col-span-2">
                <div className="flex gap-4">
                  {formData.step5.emergencyCallouts && (
                    <span className="text-green-400 text-xs">✓ Emergency Callouts</span>
                  )}
                  {formData.step5.weekendWork && (
                    <span className="text-green-400 text-xs">✓ Weekend Work</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance & Verification */}
        {formData.step6 && (
          <div className="border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center gap-2 text-white">
                <Shield className="w-4 h-4" />
                Compliance & Verification
              </h3>
              <Button variant="ghost" size="sm" onClick={() => onEdit(5)} className="text-white hover:text-gray-300">
                Edit
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Business Email:</span>
                <p className="text-white">{formData.step6.businessEmail}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Business Number:</span>
                <p className="text-white">{formData.step6.businessNumber}</p>
              </div>
              <div className="space-y-2">
                <span className="text-muted-foreground">Verified Requirements:</span>
                <div className="grid grid-cols-1 gap-1">
                  {formData.step6.businessRegistration && (
                    <span className="text-green-400 text-xs">✓ Business Registration Confirmed</span>
                  )}
                  {formData.step6.requiredCertifications && (
                    <span className="text-green-400 text-xs">✓ Trade Certifications Confirmed</span>
                  )}
                  {formData.step6.publicLiabilityInsurance && (
                    <span className="text-green-400 text-xs">✓ Public Liability Insurance Confirmed</span>
                  )}
                  {formData.step6.termsAccepted && (
                    <span className="text-green-400 text-xs">✓ Terms of Service Accepted</span>
                  )}
                  {formData.step6.complianceUnderstood && (
                    <span className="text-green-400 text-xs">✓ Compliance Responsibility Acknowledged</span>
                  )}
                  {formData.step6.certificationWarning && (
                    <span className="text-green-400 text-xs">✓ Verification Warning Acknowledged</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Final Confirmation */}
      <div className="bg-green-950/50 border border-green-800 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="font-semibold text-green-300">Ready to Launch</h3>
            <p className="text-sm text-green-200">
              You've completed all requirements and can now access your dashboard to start generating campaigns.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onPrevious} className="flex items-center gap-2 text-white">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Complete Setup
        </Button>
      </div>
    </div>
  );
}
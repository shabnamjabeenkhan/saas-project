"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useNavigate } from "react-router";
import { CheckCircle, Edit3, AlertCircle } from "lucide-react";
import SubscriptionStatus from "~/components/subscription-status";

export default function Page() {
  const navigate = useNavigate();
  const onboardingData = useQuery(api.onboarding.getOnboardingData);
  const restartOnboarding = useMutation(api.onboarding.restartOnboarding);

  const handleEditOnboarding = async () => {
    try {
      await restartOnboarding({});
      navigate("/onboarding");
    } catch (error) {
      console.error("Failed to restart onboarding:", error);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-[#0A0A0A] text-white">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6 space-y-6">
            {/* Business Information Card */}
            {onboardingData && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-white">Business Information</CardTitle>
                      {onboardingData.isComplete ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Complete
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Incomplete
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditOnboarding}
                      className="flex items-center gap-2 border-gray-700 text-gray-300 hover:text-white"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Information
                    </Button>
                  </div>
                  <CardDescription className="text-gray-400">
                    Your business details collected during onboarding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">Trade Type</label>
                      <p className="text-sm text-gray-200">{onboardingData.tradeType || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Business Name</label>
                      <p className="text-sm text-gray-200">{onboardingData.businessName || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Contact Name</label>
                      <p className="text-sm text-gray-200">{onboardingData.contactName || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Email</label>
                      <p className="text-sm text-gray-200">{onboardingData.email || "Not specified"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">Phone</label>
                      <p className="text-sm text-gray-200">{onboardingData.phone || "Not specified"}</p>
                    </div>
                  </div>

                  {onboardingData.serviceArea && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Service Area</label>
                      <p className="text-sm text-gray-200">
                        {onboardingData.serviceArea.city}
                        {onboardingData.serviceArea.postcode && ` (${onboardingData.serviceArea.postcode})`}
                        - {onboardingData.serviceArea.radius} mile radius
                      </p>
                    </div>
                  )}

                  {onboardingData.serviceOfferings && onboardingData.serviceOfferings.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Services Offered</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {onboardingData.serviceOfferings.map((service, index) => (
                          <Badge key={index} variant="secondary" className="bg-gray-800 text-gray-300">{service}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {onboardingData.availability && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Availability</label>
                      <div className="text-sm text-gray-200 space-y-1">
                        <p>Working Hours: {onboardingData.availability.workingHours}</p>
                        <p>Emergency Callouts: {onboardingData.availability.emergencyCallouts ? "Yes" : "No"}</p>
                        <p>Weekend Work: {onboardingData.availability.weekendWork ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  )}

                  {onboardingData.acquisitionGoals && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Business Goals</label>
                      <div className="text-sm text-gray-200 space-y-1">
                        <p>Monthly Leads Target: {onboardingData.acquisitionGoals.monthlyLeads}</p>
                        <p>Average Job Value: £{onboardingData.acquisitionGoals.averageJobValue}</p>
                        <p>Monthly Budget: £{onboardingData.acquisitionGoals.monthlyBudget}</p>
                      </div>
                    </div>
                  )}

                  {onboardingData.completedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">Completed On</label>
                      <p className="text-sm text-gray-200">{new Date(onboardingData.completedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {onboardingData && !onboardingData.isComplete && (
              <Card className="border-amber-200 bg-amber-950">
                <CardHeader>
                  <CardTitle className="text-amber-200">Incomplete Onboarding</CardTitle>
                  <CardDescription className="text-amber-300">
                    Complete your onboarding to access all features and get the most out of your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/onboarding")} className="w-full sm:w-auto">
                    Complete Onboarding
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Subscription Status */}
            <SubscriptionStatus />
          </div>
        </div>
      </div>
    </div>
  );
}

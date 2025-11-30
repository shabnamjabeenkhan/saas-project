"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useNavigate } from "react-router";
import { CheckCircle, Edit3, AlertCircle, Lock, Info } from "lucide-react";
import SubscriptionStatus from "~/components/subscription-status";
import { useAuth } from "@clerk/react-router";
import { toast } from "sonner";

export default function Page() {
  const navigate = useNavigate();
  const { userId: clerkUserId } = useAuth();
  const onboardingData = useQuery(api.onboarding.getOnboardingData);
  const restartOnboarding = useMutation(api.onboarding.restartOnboarding);
  
  // Get campaign to find userId (campaigns store userId as tokenIdentifier)
  const campaign = useQuery(api.campaigns.getCampaign, {});
  
  // Use campaign userId if available, otherwise use Clerk userId (which should match tokenIdentifier)
  const userId = campaign?.userId || clerkUserId;
  
  // Check regeneration limits to determine if editing should be disabled
  const regenerationLimits = useQuery(
    api.campaigns.checkRegenerationLimits,
    userId ? { userId } : "skip"
  );
  
  // Check subscription state for trial expiry and cancellation
  const subscriptionState = useQuery(
    api.subscriptions.getSubscriptionState,
    userId ? { userId } : "skip"
  );
  
  const canRegenerate = regenerationLimits?.allowed ?? false;
  const isTrialExpired = subscriptionState?.isTrialExpired ?? false;
  const isCancelledPeriodEnded = subscriptionState?.isCancelledPeriodEnded ?? false;
  const isCooldown = regenerationLimits && regenerationLimits.cooldownSecondsRemaining > 0;
  
  // Allow editing if:
  // - Can regenerate AND not trial expired AND not cancelled period ended
  // - OR cancelled but period not ended (still active until billingPeriodEndsAt)
  const canEdit = (canRegenerate && !isTrialExpired && !isCancelledPeriodEnded) || 
                  (subscriptionState?.isCancelled && !subscriptionState.isCancelledPeriodEnded);

  const handleEditOnboarding = async () => {
    if (!canEdit) {
      toast.error((regenerationLimits as { reason?: string }).reason || "Editing is currently disabled");
      return;
    }
    
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
              <Card className="bg-[#1a1a1a] border-gray-800">
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditOnboarding}
                        disabled={!canEdit}
                        className="flex items-center gap-2 border-gray-700 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {!canEdit ? (
                          <>
                            <Lock className="h-4 w-4" />
                            Edit Disabled
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-4 w-4" />
                            Edit Information
                          </>
                        )}
                      </Button>
                      {(isTrialExpired || isCancelledPeriodEnded) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate("/pricing")}
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          {isTrialExpired ? "Upgrade Plan" : "Renew Subscription"}
                        </Button>
                      )}
                    </div>
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

            {/* Trial Expired / Cancellation Warning */}
            {subscriptionState && (subscriptionState.isTrialExpired || subscriptionState.isCancelledPeriodEnded) && (
              <Card className="border-amber-200 bg-amber-950">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <CardTitle className="text-amber-200">
                        {subscriptionState.isTrialExpired ? "Trial Expired" : "Subscription Ended"}
                      </CardTitle>
                      <CardDescription className="text-amber-300 mt-2">
                        {subscriptionState.isTrialExpired
                          ? "Your free trial has ended. Upgrade to continue editing your business information and managing campaigns."
                          : "Your subscription period has ended. Renew your subscription to continue using all features."}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="default"
                    onClick={() => navigate("/pricing")}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    {subscriptionState.isTrialExpired ? "Upgrade Now" : "Renew Subscription"}
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Cancelled Subscription Info (still active until period end) */}
            {subscriptionState?.isCancelled && !subscriptionState.isCancelledPeriodEnded && subscriptionState.billingPeriodEndsAt && (
              <Card className="border-blue-200 bg-blue-950">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <CardTitle className="text-blue-200">Subscription Cancelled</CardTitle>
                      <CardDescription className="text-blue-300 mt-2">
                        Your subscription will remain active until {new Date(subscriptionState.billingPeriodEndsAt).toLocaleDateString()}. 
                        You can continue editing your business information and using all features until then.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
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

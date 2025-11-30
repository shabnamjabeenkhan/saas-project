"use client";
import { SimpleSyncStatus } from "~/components/dashboard/simple-sync-status";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { AlertCircle, Info } from "lucide-react";
import { useAuth } from "@clerk/react-router";

export default function Page() {
  const navigate = useNavigate();
  const { userId: clerkUserId } = useAuth();
  
  // Fetch campaign status (no userId needed - uses auth context)
  const campaign = useQuery(api.campaigns.getCampaign, {});
  
  // Get userId for subscription state check
  const userId = campaign?.userId || clerkUserId;
  
  // Check subscription state for trial expiry and cancellation
  const subscriptionState = useQuery(
    api.subscriptions.getSubscriptionState,
    userId ? { userId } : "skip"
  );

  return (
    <div className="flex flex-1 flex-col bg-[#0a0a0a] text-white">
      <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
        <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="px-2 sm:px-0 text-center">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
                Dashboard
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Here's how your Google Ads campaigns are performing today.
              </p>
            </div>

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
                          ? "Your free trial has ended. Upgrade to continue generating and managing campaigns."
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
                        You can continue viewing and using all features until then.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            {/* Campaign Status Card */}
            <div className="mt-6">
              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <h3 className="text-lg font-medium text-white mb-4">Campaign Status</h3>
                {campaign === undefined ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Loading...</p>
                  </div>
                ) : campaign === null ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm mb-4">No campaigns yet</p>
                    <Link to="/onboarding">
                      <Button disabled={subscriptionState?.isTrialExpired || subscriptionState?.isCancelledPeriodEnded}>
                        Create Your First Campaign
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="text-green-400 font-medium">Active campaign</span>
                    </div>
                    <div className="pt-4 border-t border-gray-700">
                      <Link to="/dashboard/campaigns">
                        <Button className="w-full">View Campaign</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sync Status */}
            <div className="mt-6">
              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <h3 className="text-lg font-medium text-white mb-4">Sync Status</h3>
                <SimpleSyncStatus />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

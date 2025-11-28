import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import AnimatedGenerateButton from "~/components/ui/animated-generate-button";
import {
  Zap,
  Sparkles,
  Loader2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useGoogleAdsAuth } from "~/lib/useGoogleAdsAuth";

interface CampaignHeaderControlsProps {
  campaign: any; // TODO: Type this properly
  onboardingData: any; // TODO: Type this properly
}

export function CampaignHeaderControls({
  campaign,
  onboardingData
}: CampaignHeaderControlsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const generateCampaign = useAction(api.campaigns.generateCampaign);
  const pushToGoogleAds = useAction(api.campaigns.pushToGoogleAds);
  const { connectGoogleAds, disconnectGoogleAds, isLoading: isConnecting, isConnected: isGoogleAdsConnected } = useGoogleAdsAuth();

  // Check regeneration limits
  const regenerationLimits = useQuery(api.campaigns.checkRegenerationLimits,
    campaign?.userId ? { userId: campaign.userId } : "skip"
  );

  const handleGenerateCampaign = async () => {
    if (!onboardingData?.isComplete) {
      toast.error("Please complete your onboarding first");
      return;
    }

    // Check regeneration limits
    if (regenerationLimits && !regenerationLimits.allowed) {
      toast.error((regenerationLimits as { reason?: string }).reason || 'Regeneration not allowed');
      return;
    }

    setIsGenerating(true);
    try {
      await generateCampaign({});
      toast.success("Campaign generated successfully!");
    } catch (error) {
      toast.error("Failed to generate campaign: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePushToGoogleAds = async () => {
    console.log('🚀 Push to Google Ads button clicked');

    if (!campaign) {
      console.error('❌ No campaign available to push');
      toast.error("No campaign to push");
      return;
    }

    if (!isGoogleAdsConnected) {
      console.error('❌ Google Ads not connected');
      toast.error("Please connect your Google Ads account first");
      return;
    }

    console.log('🎯 Starting campaign push process...', {
      campaignId: campaign._id,
      campaignName: campaign.campaignName,
      adGroups: campaign.adGroups?.length || 0
    });

    setIsProcessing(true);
    try {
      console.log('📤 Calling pushToGoogleAds action...');

      // Use Convex action to push campaign to Google Ads
      const result = await pushToGoogleAds({
        campaignId: campaign._id,
        pushOptions: {
          createAsDraft: true,
          testMode: false, // FORCE REAL API USAGE
        },
      });

      console.log('📥 Received result from pushToGoogleAds:', result);

      if (result.success) {
        console.log('✅ Campaign push successful!', result);

        const description = result.details ||
          `Campaign ID: ${result.googleCampaignId} | Budget: £${result.budget}/day | Status: ${result.status}`;

        toast.success(`🎯 ${result.message}`, {
          description: description,
          duration: 8000,
        });

        // 🔄 Convex real-time queries will automatically update the UI
        // No manual refresh needed - data syncs automatically
        console.log('✅ Campaign push complete - Convex will sync UI automatically');
      } else {
        console.error('❌ Campaign push failed - success=false');
        throw new Error('Failed to create campaign');
      }
    } catch (error) {
      console.error('❌ Campaign push error occurred:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');

      toast.error(`❌ Failed to push to Google Ads`, {
        description: error instanceof Error ? error.message : 'Check API connection and try again',
        duration: 8000,
      });
    } finally {
      console.log('🔄 Campaign push process completed, resetting UI state');
      setIsProcessing(false);
    }
  };


  return (
    <div className="mb-6">
      {/* Main Header */}
      <div className="flex items-center justify-center mb-6">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
            Your Campaign Preview
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            AI-generated Google Ads campaign based on your business information
          </p>
        </div>
      </div>

      {/* Sticky Campaign Controls */}
      <div className="sticky top-0 z-10 backdrop-blur-sm border-b border-gray-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-6" style={{backgroundColor: "#0A0A0A"}}>
        <div className="max-w-7xl mx-auto">
          {campaign && (
            <>
              {/* Compliance Reminder */}
              <div className="rounded-lg p-3 mb-4" style={{backgroundColor: "#1a1a2e", border: "1px solid rgba(59, 130, 246, 0.2)"}}>
                <div className="text-xs text-gray-300 text-center">
                  <span>Reminder: You are responsible for the accuracy of all claims. See </span>
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Terms
                  </a>
                  <span>.</span>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="flex flex-col space-y-6 lg:grid lg:grid-cols-3 lg:gap-4 lg:items-center lg:space-y-0">
                {/* Google Ads Connection */}
                <div className="flex justify-center lg:justify-start">
                  {isGoogleAdsConnected ? (
                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePushToGoogleAds}
                        disabled={isProcessing}
                        className="text-white border-gray-700 hover:bg-gray-800 text-xs sm:text-sm"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        {isProcessing ? "Pushing..." : "Push to Google Ads"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={disconnectGoogleAds}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs sm:text-sm"
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <AnimatedGenerateButton
                      labelIdle="Connect Google Ads"
                      labelActive="Connecting..."
                      generating={isConnecting}
                      highlightHueDeg={200}
                      onClick={connectGoogleAds}
                      disabled={isConnecting}
                      variant="outline"
                      className="w-full sm:w-auto"
                    />
                  )}
                </div>

                {/* Regeneration Status */}
                <div className="flex justify-center order-last lg:order-none">
                  {regenerationLimits && (
                    <div className="w-full max-w-xs lg:w-auto">
                      {regenerationLimits.testing ? (
                        <div className="rounded-full px-3 sm:px-4 py-2 text-xs font-medium text-center" style={{backgroundColor: "#0f2419", border: "1px solid #22c55e", color: "#22c55e"}}>
                          Testing mode - unlimited regenerations
                        </div>
                      ) : regenerationLimits.allowed ? (
                        <div className="text-xs text-gray-400 text-center py-1">
                          {regenerationLimits.remaining}/10 regenerations remaining this month
                        </div>
                      ) : (
                        <div className="rounded-full px-3 sm:px-4 py-2 text-xs font-medium text-center flex items-center justify-center gap-1" style={{backgroundColor: "#2d1b0d", border: "1px solid #f59e0b", color: "#f59e0b"}}>
                          <Clock className="w-3 h-3" />
                          <span className="hidden sm:inline">{(regenerationLimits as { reason?: string }).reason || 'Regeneration not allowed'}</span>
                          <span className="sm:hidden">Limit reached</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Regenerate Button */}
                <div className="flex justify-center lg:justify-end">
                  <AnimatedGenerateButton
                    labelIdle={campaign ? 'Regenerate Campaign' : 'Generate Campaign'}
                    labelActive="Generating..."
                    generating={isGenerating}
                    highlightHueDeg={160}
                    onClick={handleGenerateCampaign}
                    disabled={isGenerating || !onboardingData?.isComplete || (regenerationLimits && !regenerationLimits.allowed)}
                    className="w-full sm:w-auto font-semibold pb-4"
                  />
                </div>
              </div>
            </>
          )}

          {/* Generate Button for when no campaign exists */}
          {!campaign && (
            <div className="flex justify-center">
              <AnimatedGenerateButton
                labelIdle="Generate Campaign"
                labelActive="Generating..."
                generating={isGenerating}
                highlightHueDeg={160}
                onClick={handleGenerateCampaign}
                disabled={isGenerating || !onboardingData?.isComplete || (regenerationLimits && !regenerationLimits.allowed)}
                className="w-full sm:w-auto max-w-xs sm:max-w-none font-semibold"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
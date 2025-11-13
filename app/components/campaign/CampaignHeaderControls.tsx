import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import {
  Zap,
  Sparkles,
  Download,
  Link,
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
      toast.error(regenerationLimits.reason);
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

    // Check for placeholder URLs and warn user
    const placeholderUrls = ["https://example.com", "https://yoursite.com", "www.example.com"];
    const hasPlaceholders = campaign.adGroups?.some((adGroup: any) =>
      !adGroup.adCopy?.finalUrl || placeholderUrls.includes(adGroup.adCopy.finalUrl)
    );

    if (hasPlaceholders) {
      toast.warning("⚠️ No website URL detected", {
        description: "Your ads will show 'example.com' which may waste your budget. Consider adding a website URL in your profile or using call-only ads.",
        duration: 10000,
      });
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
          testMode: true,
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

  const handleExportCampaign = () => {
    if (!campaign) return;

    const exportData = JSON.stringify(campaign, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campaign.campaignName.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Campaign exported!");
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Your Campaign Preview
        </h1>
        <p className="text-muted-foreground mt-2">
          AI-generated Google Ads campaign based on your business information
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {campaign && (
          <>
            {/* Compliance Reminder */}
            <div className="text-xs text-gray-400 text-right">
              <span>Reminder: You are responsible for the accuracy of all claims. See </span>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Terms
              </a>
              <span>.</span>
            </div>

            <div className="flex gap-2">
              {isGoogleAdsConnected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePushToGoogleAds}
                    disabled={isProcessing}
                    className="text-white border-gray-700 hover:bg-gray-800"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {isProcessing ? "Pushing..." : "Push to Google Ads"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCampaign}
                    className="text-white border-gray-700 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={disconnectGoogleAds}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectGoogleAds}
                  disabled={isConnecting}
                  className="text-white border-gray-700 hover:bg-gray-800"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4 mr-2" />
                  )}
                  {isConnecting ? "Connecting..." : "Connect Google Ads"}
                </Button>
              )}
            </div>
          </>
        )}

        {/* Regeneration limit indicator */}
        {regenerationLimits && campaign && (
          <div className="text-xs text-gray-400 text-right mb-1">
            {regenerationLimits.testing ? (
              <span className="text-green-400">Testing mode - unlimited regenerations</span>
            ) : regenerationLimits.allowed ? (
              <span>{regenerationLimits.remaining}/10 regenerations remaining this month</span>
            ) : (
              <span className="text-orange-400 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                {(regenerationLimits as any).reason || 'Regeneration not allowed'}
              </span>
            )}
          </div>
        )}

        <Button
          onClick={handleGenerateCampaign}
          disabled={isGenerating || !onboardingData?.isComplete || (regenerationLimits && !regenerationLimits.allowed)}
          className="bg-primary hover:bg-primary/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {campaign ? 'Regenerate' : 'Generate'} Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
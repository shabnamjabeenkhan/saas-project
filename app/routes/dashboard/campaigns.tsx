import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Zap,
  MapPin,
  Phone,
  Target,
  DollarSign,
  Eye,
  Sparkles,
  Download,
  Copy,
  AlertTriangle,
  Loader2,
  Link
} from "lucide-react";
import { toast } from "sonner";
import { useGoogleAdsAuth } from "~/lib/useGoogleAdsAuth";
import { CampaignQualityChecker } from "~/components/campaign/CampaignQualityChecker";
import { CampaignPreviewCard } from "~/components/campaign/CampaignPreviewCard";
import { validateCampaignCompliance, type CampaignData } from "~/lib/ukComplianceRules";
import { mockCampaignScenarios } from "~/lib/mockCampaignData";
import { campaignApprovalWorkflow, type CampaignWithApproval } from "~/lib/campaignApprovalWorkflow";
import type { Route } from "./+types/campaigns";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Campaigns - TradeBoost AI" },
    { name: "description", content: "Manage your AI-generated Google Ads campaigns" },
  ];
}

export default function Campaigns() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignWithApproval[]>([]);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  const campaign = useQuery(api.campaigns.getCampaign, {});
  const generateCampaign = useAction(api.campaigns.generateCampaign);
  const onboardingData = useQuery(api.onboarding.getOnboardingData);
  const { connectGoogleAds, disconnectGoogleAds, isLoading: isConnecting, isConnected: isGoogleAdsConnected } = useGoogleAdsAuth();

  // Initialize campaigns with mock data for demo
  useEffect(() => {
    if (campaigns.length === 0) {
      const mockCampaigns = Object.values(mockCampaignScenarios).map(campaign =>
        campaignApprovalWorkflow.initializeCampaign(campaign)
      );
      setCampaigns(mockCampaigns);
    }
  }, []);

  // Campaign approval handlers
  const handleApproveCampaign = async (campaignId: string) => {
    setIsProcessingApproval(true);
    try {
      const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
      if (campaignIndex === -1) return;

      const updatedCampaign = campaignApprovalWorkflow.approveCampaign(
        campaigns[campaignIndex],
        'current-user', // In real app, get from auth
        { pushToGoogleAds: true, notes: 'Quick approval' }
      );

      const newCampaigns = [...campaigns];
      newCampaigns[campaignIndex] = updatedCampaign;
      setCampaigns(newCampaigns);

      toast.success("Campaign approved and pushed to Google Ads!");
    } catch (error) {
      toast.error("Failed to approve campaign");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRejectCampaign = async (campaignId: string, reason: string) => {
    setIsProcessingApproval(true);
    try {
      const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
      if (campaignIndex === -1) return;

      const updatedCampaign = campaignApprovalWorkflow.rejectCampaign(
        campaigns[campaignIndex],
        'current-user',
        reason
      );

      const newCampaigns = [...campaigns];
      newCampaigns[campaignIndex] = updatedCampaign;
      setCampaigns(newCampaigns);

      toast.success("Campaign rejected");
    } catch (error) {
      toast.error("Failed to reject campaign");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRequestChanges = async (campaignId: string, changes: string) => {
    setIsProcessingApproval(true);
    try {
      const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
      if (campaignIndex === -1) return;

      const updatedCampaign = campaignApprovalWorkflow.requestChanges(
        campaigns[campaignIndex],
        'current-user',
        changes
      );

      const newCampaigns = [...campaigns];
      newCampaigns[campaignIndex] = updatedCampaign;
      setCampaigns(newCampaigns);

      toast.success("Change request sent");
    } catch (error) {
      toast.error("Failed to request changes");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleGenerateCampaign = async () => {
    if (!onboardingData?.isComplete) {
      toast.error("Please complete your onboarding first");
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
    if (!campaign) {
      toast.error("No campaign to push");
      return;
    }

    if (!isGoogleAdsConnected) {
      toast.error("Please connect your Google Ads account first");
      return;
    }

    setIsProcessingApproval(true);
    try {
      // Simulate pushing to Google Ads
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success("Campaign pushed to Google Ads successfully! (Development Mode)");
    } catch (error) {
      toast.error("Failed to push campaign to Google Ads");
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
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
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Your Campaign Preview
            </h1>
            <p className="text-muted-foreground mt-2">
              AI-generated Google Ads campaign based on your business information
            </p>
          </div>

          <div className="flex gap-2">
            {campaign && (
              <>
                {isGoogleAdsConnected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePushToGoogleAds}
                      disabled={isProcessingApproval}
                      className="text-white border-gray-700 hover:bg-gray-800"
                    >
                      {isProcessingApproval ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      {isProcessingApproval ? "Pushing..." : "Push to Google Ads"}
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
              </>
            )}

            <Button
              onClick={handleGenerateCampaign}
              disabled={isGenerating || !onboardingData?.isComplete}
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

        {!onboardingData?.isComplete && (
          <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                <p>Please complete your onboarding to generate a campaign.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mock Campaign Previews */}
        {campaigns.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Campaign Previews</h2>
              <Badge variant="outline" className="text-gray-400">
                {campaigns.length} campaigns generated
              </Badge>
            </div>

            {/* Show campaign preview cards */}
            {campaigns.map((campaignWithApproval) => (
              <CampaignPreviewCard
                key={campaignWithApproval.id}
                campaign={campaignWithApproval}
                onApprove={handleApproveCampaign}
                onReject={handleRejectCampaign}
                onRequestChanges={handleRequestChanges}
                isLoading={isProcessingApproval}
              />
            ))}
          </div>
        )}

        {campaign ? (
          <div className="space-y-6">
            {/* Campaign Quality Check */}
            <CampaignQualityChecker
              complianceChecks={validateCampaignCompliance({
                tradeType: 'electrical', // TODO: Get from onboarding data
                serviceArea: {
                  city: 'London',
                  postcode: 'SW1A 0AA',
                  radius: 24,
                },
                serviceOfferings: ['Emergency Electrical Services', 'Electrical Installation'],
                adCopy: {
                  headlines: campaign.adGroups[0]?.adCopy.headlines || [],
                  descriptions: campaign.adGroups[0]?.adCopy.descriptions || [],
                },
                keywords: campaign.adGroups[0]?.keywords || [],
              })}
              optimizationSuggestions={[
                'Add location-specific keywords for better local targeting',
                'Include "Gas Safe Registered" in headlines for gas services',
                'Consider adding negative keywords to reduce irrelevant clicks',
                'Increase mobile bid adjustments for emergency services',
              ]}
              seasonalRecommendations={[
                'Winter season: Emphasize emergency heating and boiler repair services',
                'Add "frozen pipes" and "no heating" keywords for winter peak demand',
                'Consider increasing budget during cold weather forecasts',
              ]}
              onApprove={() => toast.success('Campaign approved and ready for launch!')}
              onRegenerate={handleGenerateCampaign}
            />

            {/* Campaign Overview */}
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      {campaign.campaignName}
                    </CardTitle>
                    <CardDescription>
                      Campaign for {campaign.businessInfo.businessName}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    Draft
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Budget</p>
                      <p className="font-semibold text-white">£{campaign.dailyBudget}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-sm text-muted-foreground">Target Location</p>
                      <p className="font-semibold text-white">{campaign.targetLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-semibold text-white">{campaign.businessInfo.phone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ad Groups */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Ad Groups ({campaign.adGroups.length})
              </h2>

              {campaign.adGroups.map((adGroup, index) => (
                <Card key={index} className="bg-[#1a1a1a] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">{adGroup.name}</CardTitle>
                    <CardDescription>
                      {adGroup.keywords.length} keywords targeting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Keywords */}
                    <div>
                      <h4 className="font-medium text-white mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {adGroup.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-gray-800 text-gray-300">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-800 my-4"></div>

                    {/* Ad Preview */}
                    <div>
                      <h4 className="font-medium text-white mb-2 flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        Ad Preview
                      </h4>
                      <div className="bg-[#0A0A0A] border border-gray-700 rounded-lg p-4 max-w-md mx-auto">
                        <div className="space-y-2">
                          {/* Headlines */}
                          {adGroup.adCopy.headlines.map((headline, idx) => (
                            <div key={idx} className="text-blue-400 text-sm font-medium">
                              {headline}
                            </div>
                          ))}

                          {/* Descriptions */}
                          {adGroup.adCopy.descriptions.map((description, idx) => (
                            <div key={idx} className="text-gray-300 text-sm">
                              {description}
                            </div>
                          ))}

                          {/* URL */}
                          <div className="text-green-400 text-sm">
                            {adGroup.adCopy.finalUrl}
                          </div>

                          {/* Call Extension */}
                          {campaign.callExtensions.length > 0 && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                              <Phone className="w-3 h-3 text-blue-400" />
                              <span className="text-blue-400 text-sm font-medium">
                                {campaign.callExtensions[0]}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-700">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToClipboard(
                              `${adGroup.adCopy.headlines.join(' | ')}\n${adGroup.adCopy.descriptions.join(' ')}\n${adGroup.adCopy.finalUrl}`
                            )}
                            className="text-gray-400 hover:text-white"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Compliance Notes */}
            {campaign.complianceNotes && campaign.complianceNotes.length > 0 && (
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    Compliance Notes
                  </CardTitle>
                  <CardDescription>
                    Important considerations for your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {campaign.complianceNotes.map((note, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Next Steps</CardTitle>
                <CardDescription>
                  Ready to launch your campaign?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0A0A0A] border border-gray-700 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Option 1: Manual Setup</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      Copy the campaign data and set up your Google Ads manually
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard(JSON.stringify(campaign, null, 2))}
                      className="text-white border-gray-700 hover:bg-gray-800"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Campaign Data
                    </Button>
                  </div>

                  <div className="p-4 bg-[#0A0A0A] border border-gray-700 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Option 2: Google Ads Integration</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      {isGoogleAdsConnected
                        ? "Push your campaign directly to Google Ads as a draft"
                        : "Connect your Google Ads account for automatic campaign creation"
                      }
                    </p>
                    {isGoogleAdsConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePushToGoogleAds}
                        disabled={isProcessingApproval}
                        className="text-white border-gray-700 hover:bg-gray-800"
                      >
                        {isProcessingApproval ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        {isProcessingApproval ? "Pushing..." : "Push to Google Ads"}
                      </Button>
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
                </div>
              </CardContent>
            </Card>
          </div>
        ) : onboardingData?.isComplete ? (
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="pt-6 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Ready to Generate Your Campaign</h3>
              <p className="text-muted-foreground mb-4">
                Your onboarding is complete! Generate your AI-powered Google Ads campaign now.
              </p>
              <Button
                onClick={handleGenerateCampaign}
                disabled={isGenerating}
                className="bg-primary hover:bg-primary/90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Campaign...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate My Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
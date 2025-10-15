import { useState } from "react";
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
import type { Route } from "./+types/campaigns";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Campaigns - TradeBoost AI" },
    { name: "description", content: "Manage your AI-generated Google Ads campaigns" },
  ];
}

export default function Campaigns() {
  const [isGenerating, setIsGenerating] = useState(false);
  const campaign = useQuery(api.campaigns.getCampaign, {});
  const generateCampaign = useAction(api.campaigns.generateCampaign);
  const onboardingData = useQuery(api.onboarding.getOnboardingData);
  const { connectGoogleAds, disconnectGoogleAds, isLoading: isConnecting, isConnected: isGoogleAdsConnected } = useGoogleAdsAuth();

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
                      onClick={handleExportCampaign}
                      className="text-white border-gray-700 hover:bg-gray-800"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to Google Ads
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

        {campaign ? (
          <div className="space-y-6">
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
                      Connect your Google Ads account for automatic campaign creation
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-gray-500 border-gray-700"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Coming Soon
                    </Button>
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
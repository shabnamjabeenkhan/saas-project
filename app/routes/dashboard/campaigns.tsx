import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import {
  Zap,
  MapPin,
  Phone,
  Target,
  DollarSign,
  Sparkles,
  Copy,
  AlertTriangle,
  Link,
  FileText,
  Palette,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { CampaignQualityChecker } from "~/components/campaign/CampaignQualityChecker";
import { CampaignHeaderControls } from "~/components/campaign/CampaignHeaderControls";
import { AdGroupsPanel } from "~/components/campaign/AdGroupsPanel";
import { validateCampaignCompliance } from "~/lib/ukComplianceRules";

// Conditionally import mock data for development
let mockCampaignScenarios: any = null;
let CampaignPreviewCard: any = null;
let campaignApprovalWorkflow: any = null;

if (process.env.NODE_ENV === 'development') {
  try {
    const mockModule = await import("~/lib/mockCampaignData");
    const previewModule = await import("~/components/campaign/CampaignPreviewCard");
    const workflowModule = await import("~/lib/campaignApprovalWorkflow");

    mockCampaignScenarios = mockModule.mockCampaignScenarios;
    CampaignPreviewCard = previewModule.CampaignPreviewCard;
    campaignApprovalWorkflow = workflowModule.campaignApprovalWorkflow;
  } catch (e) {
    console.warn('Mock components not available in production');
  }
}
import type { Route } from "./+types/campaigns";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Campaigns - TradeBoost AI" },
    { name: "description", content: "Manage your AI-generated Google Ads campaigns" },
  ];
}

export default function Campaigns() {
  // Removed local state - using only Convex queries

  const campaign = useQuery(api.campaigns.getCampaign, {});
  const onboardingData = useQuery(api.onboarding.getOnboardingData);

  // Mock campaigns for development (approval workflow moved to admin panel)
  const mockCampaigns = process.env.NODE_ENV === 'development' && mockCampaignScenarios && campaignApprovalWorkflow
    ? Object.values(mockCampaignScenarios).map((campaign: any) =>
        campaignApprovalWorkflow.initializeCampaign(campaign)
      )
    : [];

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header Controls */}
        <CampaignHeaderControls
          campaign={campaign}
          onboardingData={onboardingData}
        />

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

        {/* Mock Campaign Previews - Development Only (Approval workflow moved to admin panel) */}
        {process.env.NODE_ENV === 'development' && mockCampaigns.length > 0 && CampaignPreviewCard && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Campaign Previews</h2>
              <Badge variant="outline" className="text-gray-400">
                {mockCampaigns.length} campaigns generated (Admin View)
              </Badge>
            </div>

            <div className="p-4 bg-orange-900/20 border border-orange-500/20 rounded-lg mb-4">
              <p className="text-orange-300 text-sm">
                <strong>Note:</strong> Campaign approval workflow has been moved to the admin panel.
                This preview is for development only.
              </p>
            </div>

            {/* Show campaign preview cards without approval actions */}
            {mockCampaigns.map((campaignWithApproval: any) => (
              <Card key={campaignWithApproval.id} className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">{campaignWithApproval.campaignName}</CardTitle>
                  <CardDescription>Preview - Approval actions moved to admin panel</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Campaign data available, approval workflow in admin panel.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {campaign ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border-gray-800">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="creatives" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Creatives
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Compliance
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
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

              {/* Ad Groups Summary */}
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Ad Groups Summary
                  </CardTitle>
                  <CardDescription>
                    {campaign.adGroups.length} ad groups configured
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaign.adGroups.map((adGroup, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg">
                        <div>
                          <p className="font-medium text-white">{adGroup.name}</p>
                          <p className="text-sm text-gray-400">{adGroup.keywords.length} keywords</p>
                        </div>
                        <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                          {adGroup.keywords[0]} +{adGroup.keywords.length - 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                        Use the header controls above to connect your Google Ads account and push campaigns
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-white border-gray-700 hover:bg-gray-800"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Go to Header Controls
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Creatives Tab */}
            <TabsContent value="creatives" className="space-y-6">
              <AdGroupsPanel
                adGroups={campaign.adGroups}
                callExtensions={campaign.callExtensions}
              />
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-6">
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
              />

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
            </TabsContent>
          </Tabs>
        ) : onboardingData?.isComplete ? (
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="pt-6 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Ready to Generate Your Campaign</h3>
              <p className="text-muted-foreground mb-4">
                Your onboarding is complete! Use the generate button in the header above.
              </p>
              <Button
                variant="outline"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-white border-gray-700 hover:bg-gray-800"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Go to Generate Button
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
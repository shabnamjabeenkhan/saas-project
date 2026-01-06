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

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 pt-0 bg-[#0A0A0A] text-white min-h-0">
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

        {campaign ? (
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border-gray-800 text-xs sm:text-sm h-auto">
              <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 lg:px-3 py-2 text-xs sm:text-sm">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Info</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="creatives" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 lg:px-3 py-2 text-xs sm:text-sm">
                <Palette className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Ad Preview</span>
                  <span className="sm:hidden">Ads</span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2 lg:px-3 py-2 text-xs sm:text-sm">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">
                  <span className="hidden sm:inline">Compliance</span>
                  <span className="sm:hidden">Rules</span>
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Campaign Overview */}
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="text-center sm:text-left">
                      <CardTitle className="text-white flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-xl">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        {campaign.campaignName}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">
                        Campaign for {campaign.businessInfo.businessName}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400 text-xs sm:text-sm mx-auto sm:mx-0">
                      Ready to Launch
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-center justify-center sm:justify-start gap-2 p-3 sm:p-0 bg-[#0A0A0A] sm:bg-transparent rounded-lg sm:rounded-none">
                      <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-muted-foreground">Daily Budget</p>
                        <p className="font-semibold text-white text-sm sm:text-base">£{campaign.dailyBudget}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 p-3 sm:p-0 bg-[#0A0A0A] sm:bg-transparent rounded-lg sm:rounded-none">
                      <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-muted-foreground">Target Location</p>
                        <p className="font-semibold text-white text-sm sm:text-base">{campaign.targetLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 p-3 sm:p-0 bg-[#0A0A0A] sm:bg-transparent rounded-lg sm:rounded-none">
                      <Phone className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-muted-foreground">Contact</p>
                        <p className="font-semibold text-white text-sm sm:text-base">{campaign.businessInfo.phone}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ad Groups Summary */}
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader className="text-center sm:text-left">
                  <CardTitle className="text-white flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-xl">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Ad Groups Summary
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {campaign.adGroups.length} ad groups configured
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {campaign.adGroups.map((adGroup, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-4 bg-[#0A0A0A] rounded-lg">
                        <div className="text-center sm:text-left">
                          <p className="font-medium text-white text-sm sm:text-base">{adGroup.name}</p>
                          <p className="text-xs sm:text-sm text-gray-400">{adGroup.keywords.length} keywords</p>
                        </div>
                        <Badge variant="secondary" className="bg-gray-800 text-gray-300 text-xs sm:text-sm mx-auto sm:mx-0 max-w-full truncate">
                          {adGroup.keywords[0]} +{adGroup.keywords.length - 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader className="text-center sm:text-left">
                  <CardTitle className="text-white text-lg sm:text-xl">Next Steps</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Ready to launch your campaign?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 sm:p-4 bg-[#0A0A0A] border border-gray-700 rounded-lg text-center sm:text-left">
                      <h4 className="font-medium text-white mb-2 text-sm sm:text-base">Google Ads Integration</h4>
                      <p className="text-xs sm:text-sm text-gray-300 mb-3">
                        Use the header controls above to connect your Google Ads account and push campaigns
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-white border-gray-700 hover:bg-gray-800 w-full sm:w-auto text-xs sm:text-sm flex items-center justify-center"
                      >
                        <Link className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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
                callExtensions={onboardingData?.phone ? [onboardingData.phone] : []}
              />
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-6">
              {/* Campaign Quality Check */}
              <CampaignQualityChecker
                complianceChecks={validateCampaignCompliance({
                  tradeType: (onboardingData?.tradeType as 'plumbing' | 'electrical' | 'both') || 'electrical',
                  serviceArea: onboardingData?.serviceArea || {
                    city: 'London',
                    postcode: 'SW1A 0AA',
                    radius: 24,
                  },
                  serviceOfferings: onboardingData?.serviceOfferings || ['Emergency Electrical Services', 'Electrical Installation'],
                  adCopy: {
                    headlines: campaign.adGroups[0]?.adCopy.headlines || [],
                    descriptions: campaign.adGroups[0]?.adCopy.descriptions || [],
                  },
                  keywords: campaign.adGroups[0]?.keywords || [],
                })}
                optimizationSuggestions={campaign.optimizationSuggestions || []}
                seasonalRecommendations={campaign.seasonalRecommendations || []}
                adGroups={campaign.adGroups || []}
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
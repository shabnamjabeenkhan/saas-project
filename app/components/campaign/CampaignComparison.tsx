import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ArrowRight, Target, TrendingUp, TrendingDown, Minus, Eye, Copy } from "lucide-react";
import type { MockCampaignData } from "~/lib/mockCampaignData";

interface CampaignComparisonProps {
  campaignA: MockCampaignData;
  campaignB: MockCampaignData;
  onSelectCampaign: (campaign: MockCampaignData) => void;
  onPreviewCampaign: (campaign: MockCampaignData) => void;
}

export function CampaignComparison({
  campaignA,
  campaignB,
  onSelectCampaign,
  onPreviewCampaign
}: CampaignComparisonProps) {
  const getComparison = (valueA: number, valueB: number, higherIsBetter = true) => {
    if (valueA === valueB) return { icon: Minus, color: 'text-gray-400', text: 'Same' };

    const aIsBetter = higherIsBetter ? valueA > valueB : valueA < valueB;

    if (aIsBetter) {
      return { icon: TrendingUp, color: 'text-green-400', text: `+${Math.abs(valueA - valueB)}` };
    } else {
      return { icon: TrendingDown, color: 'text-red-400', text: `-${Math.abs(valueA - valueB)}` };
    }
  };

  const getPerformanceComparison = (metricA: number, metricB: number, format: 'number' | 'currency' = 'number') => {
    const diff = ((metricA - metricB) / metricB) * 100;
    const isPositive = diff > 0;
    const color = isPositive ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-400';

    if (Math.abs(diff) < 1) return { text: '~', color: 'text-gray-400' };

    const prefix = isPositive ? '+' : '';
    const formattedDiff = format === 'currency' ? `£${Math.abs(diff).toFixed(0)}` : `${Math.abs(diff).toFixed(0)}%`;

    return {
      text: `${prefix}${formattedDiff}`,
      color
    };
  };

  const scoreA = campaignA.qualityScore || 0;
  const scoreB = campaignB.qualityScore || 0;
  const scoreComparison = getComparison(scoreA, scoreB);

  const perfA = campaignA.estimatedPerformance;
  const perfB = campaignB.estimatedPerformance;

  return (
    <Card className="bg-[#1a1a1a] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Campaign Comparison
        </CardTitle>
        <CardDescription>
          Compare two campaign variations side by side
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign A */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-white text-lg mb-2">{campaignA.campaignName}</h3>
              <Badge variant="outline" className={
                campaignA.status === 'approved' ? 'text-green-400 border-green-400' :
                campaignA.status === 'rejected' ? 'text-red-400 border-red-400' :
                campaignA.status === 'pending_approval' ? 'text-yellow-400 border-yellow-400' :
                'text-gray-400 border-gray-400'
              }>
                {campaignA.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Quality Score</span>
                <span className={`font-semibold ${scoreA >= 80 ? 'text-green-400' : scoreA >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {scoreA}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Budget</span>
                <span className="text-white font-semibold">£{campaignA.dailyBudget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ad Groups</span>
                <span className="text-white font-semibold">{campaignA.adGroups.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Keywords</span>
                <span className="text-white font-semibold">
                  {campaignA.adGroups.reduce((sum, ag) => sum + ag.keywords.length, 0)}
                </span>
              </div>

              {perfA && (
                <>
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-gray-400 font-medium mb-2">Estimated Performance</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Clicks/Day</span>
                    <span className="text-white font-semibold">{perfA.expectedClicks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Cost/Day</span>
                    <span className="text-white font-semibold">£{perfA.expectedCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Conversions/Day</span>
                    <span className="text-white font-semibold">{perfA.expectedConversions}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                size="sm"
                onClick={() => onPreviewCampaign(campaignA)}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={() => onSelectCampaign(campaignA)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Select
              </Button>
            </div>
          </div>

          {/* Comparison Column */}
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="w-px h-8 bg-gray-700 lg:hidden"></div>
            <ArrowRight className="w-6 h-6 text-gray-400 rotate-90 lg:rotate-0" />

            <div className="text-center space-y-3">
              <div className="flex items-center gap-2">
                <scoreComparison.icon className={`w-4 h-4 ${scoreComparison.color}`} />
                <span className={`text-sm font-medium ${scoreComparison.color}`}>
                  Quality: {scoreComparison.text}
                </span>
              </div>

              {perfA && perfB && (
                <div className="space-y-2 text-xs">
                  <div className={`font-medium ${getPerformanceComparison(perfA.expectedClicks, perfB.expectedClicks).color}`}>
                    Clicks: {getPerformanceComparison(perfA.expectedClicks, perfB.expectedClicks).text}
                  </div>
                  <div className={`font-medium ${getPerformanceComparison(perfA.expectedCost, perfB.expectedCost, 'currency').color}`}>
                    Cost: {getPerformanceComparison(perfA.expectedCost, perfB.expectedCost, 'currency').text}
                  </div>
                  <div className={`font-medium ${getPerformanceComparison(perfA.expectedConversions, perfB.expectedConversions).color}`}>
                    Conversions: {getPerformanceComparison(perfA.expectedConversions, perfB.expectedConversions).text}
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-gray-700 lg:hidden"></div>
          </div>

          {/* Campaign B */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-white text-lg mb-2">{campaignB.campaignName}</h3>
              <Badge variant="outline" className={
                campaignB.status === 'approved' ? 'text-green-400 border-green-400' :
                campaignB.status === 'rejected' ? 'text-red-400 border-red-400' :
                campaignB.status === 'pending_approval' ? 'text-yellow-400 border-yellow-400' :
                'text-gray-400 border-gray-400'
              }>
                {campaignB.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Quality Score</span>
                <span className={`font-semibold ${scoreB >= 80 ? 'text-green-400' : scoreB >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {scoreB}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Budget</span>
                <span className="text-white font-semibold">£{campaignB.dailyBudget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ad Groups</span>
                <span className="text-white font-semibold">{campaignB.adGroups.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Keywords</span>
                <span className="text-white font-semibold">
                  {campaignB.adGroups.reduce((sum, ag) => sum + ag.keywords.length, 0)}
                </span>
              </div>

              {perfB && (
                <>
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-gray-400 font-medium mb-2">Estimated Performance</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Clicks/Day</span>
                    <span className="text-white font-semibold">{perfB.expectedClicks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Cost/Day</span>
                    <span className="text-white font-semibold">£{perfB.expectedCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Conversions/Day</span>
                    <span className="text-white font-semibold">{perfB.expectedConversions}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                size="sm"
                onClick={() => onPreviewCampaign(campaignB)}
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={() => onSelectCampaign(campaignB)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Select
              </Button>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-6 p-4 bg-[#0A0A0A] border border-gray-700 rounded-lg">
          <h4 className="font-medium text-white mb-2">Recommendation</h4>
          <p className="text-sm text-gray-300">
            {scoreA > scoreB ? (
              <>Campaign A has a higher quality score ({scoreA}% vs {scoreB}%) and is recommended for better performance.</>
            ) : scoreB > scoreA ? (
              <>Campaign B has a higher quality score ({scoreB}% vs {scoreA}%) and is recommended for better performance.</>
            ) : (
              <>Both campaigns have similar quality scores. Consider other factors like budget and target audience.</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
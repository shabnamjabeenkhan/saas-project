import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  DollarSign,
  Target,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  generateMockDailyMetrics,
  generateMockCampaignData,
  calculateSummaryMetrics,
  filterDataByDateRange,
  type PerformanceMetrics,
} from "~/lib/mockPerformanceData";
export function meta() {
  return [
    { title: "Performance - TradeBoost AI" },
    { name: "description", content: "View your Google Ads campaign performance and analytics" },
  ];
}

export default function Performance() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Generate mock data
  const allDailyData = generateMockDailyMetrics();
  const campaignData = generateMockCampaignData();
  const filteredData = filterDataByDateRange(allDailyData, dateRange);
  const summary = calculateSummaryMetrics(filteredData);

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              Performance Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your Google Ads campaign performance and ROI
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRange(range)}
                className={dateRange === range ? "" : "text-white border-gray-700 hover:bg-gray-800"}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Last {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{summary.impressions.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{summary.clicks.toLocaleString()}</div>
              <div className="flex items-center text-xs text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8.2% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(summary.cost)}</div>
              <div className="flex items-center text-xs text-red-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5.1% from last period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Conversions</CardTitle>
              <Target className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{summary.conversions}</div>
              <div className="flex items-center text-xs text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                +15.8% from last period
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Click-Through Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{formatPercentage(summary.averageCtr)}</div>
              <p className="text-sm text-muted-foreground">Industry average: 2.5%</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Cost Per Click
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{formatCurrency(summary.averageCpc)}</div>
              <p className="text-sm text-muted-foreground">Industry average: £1.50</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{formatPercentage(summary.conversionRate)}</div>
              <p className="text-sm text-muted-foreground">Industry average: 5.5%</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance Table */}
        <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Campaign Performance</CardTitle>
            <CardDescription>
              Performance breakdown by individual campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-2 text-white font-medium">Campaign</th>
                    <th className="text-left py-3 px-2 text-white font-medium">Status</th>
                    <th className="text-right py-3 px-2 text-white font-medium">Impressions</th>
                    <th className="text-right py-3 px-2 text-white font-medium">Clicks</th>
                    <th className="text-right py-3 px-2 text-white font-medium">Cost</th>
                    <th className="text-right py-3 px-2 text-white font-medium">Conversions</th>
                    <th className="text-right py-3 px-2 text-white font-medium">CTR</th>
                    <th className="text-right py-3 px-2 text-white font-medium">Est. ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignData.map((campaign, index) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-3 px-2">
                        <div className="font-medium text-white">{campaign.campaignName}</div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant="outline"
                          className={
                            campaign.status === 'active'
                              ? "text-green-400 border-green-400"
                              : campaign.status === 'paused'
                              ? "text-yellow-400 border-yellow-400"
                              : "text-gray-400 border-gray-400"
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right text-white">{campaign.totalImpressions.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-white">{campaign.totalClicks}</td>
                      <td className="py-3 px-2 text-right text-white">{formatCurrency(campaign.totalCost)}</td>
                      <td className="py-3 px-2 text-right text-white">{campaign.totalConversions}</td>
                      <td className="py-3 px-2 text-right text-white">{formatPercentage(campaign.averageCtr)}</td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-green-400 font-medium">{formatCurrency(campaign.estimatedROI)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ROI Summary */}
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">ROI Analysis</CardTitle>
            <CardDescription>
              Estimated return on investment for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{formatCurrency(summary.cost)}</div>
                <p className="text-sm text-muted-foreground">Total Ad Spend</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{formatCurrency(summary.conversions * 150)}</div>
                <p className="text-sm text-muted-foreground">Estimated Revenue</p>
                <p className="text-xs text-muted-foreground">(£150 avg job value)</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {summary.cost > 0 ? Math.round(((summary.conversions * 150) / summary.cost) * 100) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">ROI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
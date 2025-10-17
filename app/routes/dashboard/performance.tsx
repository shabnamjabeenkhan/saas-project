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
  calculateAdvancedROI,
  getJobValueMetrics,
  type PerformanceMetrics,
  type AdvancedROIMetrics,
  type JobValueMetrics,
} from "~/lib/mockPerformanceData";
import { googleAdsSyncSimulator } from "~/lib/googleAdsSync";
import { ExportModal } from "~/components/dashboard/export-modal";
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

  // Advanced ROI calculations
  const jobMetrics = getJobValueMetrics();
  const advancedROI = calculateAdvancedROI(filteredData, jobMetrics);

  // Conversion data for export
  const conversionData = googleAdsSyncSimulator.generateConversionData();

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

          {/* Date Range Selector and Export */}
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
            <ExportModal
              performanceData={filteredData}
              roiMetrics={advancedROI}
              jobMetrics={jobMetrics}
              conversionData={conversionData}
              dateRange={`Last ${dateRange === '7d' ? '7 days' : dateRange === '30d' ? '30 days' : '90 days'}`}
            />
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

        {/* Advanced ROI Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Revenue & Profitability
              </CardTitle>
              <CardDescription>
                Advanced revenue tracking with seasonal adjustments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(advancedROI.totalRevenue)}</div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xs text-gray-500">Inc. repeat business</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{formatCurrency(advancedROI.grossProfit)}</div>
                  <p className="text-sm text-muted-foreground">Gross Profit</p>
                  <p className="text-xs text-gray-500">65% margin</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{formatCurrency(advancedROI.netProfit)}</div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-xs text-gray-500">After operating costs</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{advancedROI.profitMargin.toFixed(1)}%</div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className="text-xs text-gray-500">Industry benchmark: 20%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Customer Acquisition Metrics
              </CardTitle>
              <CardDescription>
                Customer lifetime value and acquisition cost analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-red-400">{formatCurrency(advancedROI.customerAcquisitionCost)}</div>
                  <p className="text-sm text-muted-foreground">Customer Acquisition Cost</p>
                  <p className="text-xs text-gray-500">CAC</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(jobMetrics.customerLifetimeValue)}</div>
                  <p className="text-sm text-muted-foreground">Customer Lifetime Value</p>
                  <p className="text-xs text-gray-500">CLV</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{advancedROI.lifetimeValueToCAC.toFixed(1)}x</div>
                  <p className="text-sm text-muted-foreground">LTV:CAC Ratio</p>
                  <p className="text-xs text-gray-500">Target: 3x+</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">{advancedROI.paybackPeriod.toFixed(0)} days</div>
                  <p className="text-sm text-muted-foreground">Payback Period</p>
                  <p className="text-xs text-gray-500">Time to break even</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Return Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">ROAS</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{advancedROI.roas.toFixed(2)}x</div>
              <div className="flex items-center text-xs text-green-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                Return on Ad Spend
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{advancedROI.roi.toFixed(1)}%</div>
              <div className="flex items-center text-xs text-purple-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                Return on Investment
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Revenue per Click</CardTitle>
              <MousePointer className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(advancedROI.revenuePerClick)}</div>
              <div className="flex items-center text-xs text-blue-400">
                <Activity className="w-3 h-3 mr-1" />
                Per click revenue
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Seasonal Boost</CardTitle>
              <Calendar className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{((jobMetrics.seasonalMultiplier - 1) * 100).toFixed(0)}%</div>
              <div className="flex items-center text-xs text-orange-400">
                <TrendingUp className="w-3 h-3 mr-1" />
                {jobMetrics.seasonalMultiplier > 1 ? 'Winter demand' : 'Standard rate'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attribution Analysis */}
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Attribution Analysis</CardTitle>
            <CardDescription>
              Revenue attribution across different customer touchpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[#0A0A0A] rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-green-400">{advancedROI.attribution.direct}%</div>
                <p className="text-sm text-muted-foreground">Direct Conversions</p>
                <p className="text-xs text-gray-500">First-touch attribution</p>
              </div>
              <div className="text-center p-4 bg-[#0A0A0A] rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-blue-400">{advancedROI.attribution.assisted}%</div>
                <p className="text-sm text-muted-foreground">Assisted Conversions</p>
                <p className="text-xs text-gray-500">Multi-touch influence</p>
              </div>
              <div className="text-center p-4 bg-[#0A0A0A] rounded-lg border border-gray-700">
                <div className="text-2xl font-bold text-purple-400">{advancedROI.attribution.lastClick}%</div>
                <p className="text-sm text-muted-foreground">Repeat Business</p>
                <p className="text-xs text-gray-500">Customer lifetime value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
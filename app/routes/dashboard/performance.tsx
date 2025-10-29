import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Phone,
  DollarSign,
  Target,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import type { Route } from "./+types/performance";

// Mock performance data
const mockPerformanceData = {
  overview: {
    totalSpend: 245.67,
    totalImpressions: 12450,
    totalClicks: 523,
    totalConversions: 18,
    averageCPC: 0.47,
    ctr: 4.2,
    conversionRate: 3.4,
    costPerConversion: 13.65,
  },
  campaigns: [
    {
      id: 'camp_1',
      name: 'Emergency Plumbing Services',
      status: 'active',
      impressions: 5420,
      clicks: 245,
      spend: 115.32,
      conversions: 8,
      ctr: 4.5,
      conversionRate: 3.3,
      costPerConversion: 14.42,
    },
    {
      id: 'camp_2',
      name: 'Boiler Installation & Repair',
      status: 'active',
      impressions: 3850,
      clicks: 168,
      spend: 78.94,
      conversions: 6,
      ctr: 4.4,
      conversionRate: 3.6,
      costPerConversion: 13.16,
    },
    {
      id: 'camp_3',
      name: 'Bathroom Plumbing Services',
      status: 'paused',
      impressions: 3180,
      clicks: 110,
      spend: 51.41,
      conversions: 4,
      ctr: 3.5,
      conversionRate: 3.6,
      costPerConversion: 12.85,
    },
  ],
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Performance - TradeBoost AI" },
    { name: "description", content: "Monitor your Google Ads campaign performance and ROI" },
  ];
}

export default function Performance() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const handleSyncMetrics = async () => {
    setIsLoading(true);
    try {
      // Simulate syncing with Google Ads API
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSyncTime(new Date());
      toast.success("Metrics synced successfully! (Development Mode)");
    } catch (error) {
      toast.error("Failed to sync metrics");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600 text-white';
      case 'paused': return 'bg-yellow-600 text-white';
      case 'ended': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-400" />;
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

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
              Monitor your Google Ads campaign performance and ROI
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncMetrics}
              disabled={isLoading}
              className="text-white border-gray-700 hover:bg-gray-800"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Syncing..." : "Sync Metrics"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-white border-gray-700 hover:bg-gray-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Last Sync Info */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          Last synced: {lastSyncTime.toLocaleString()}
          <Badge variant="outline" className="text-green-400 border-green-400 ml-2">
            Development Mode
          </Badge>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(mockPerformanceData.overview.totalSpend)}
                </div>
                {getTrendIcon(245.67, 220.15)}
              </div>
              <p className="text-xs text-green-400 mt-1">+11.6% from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-white">
                  {mockPerformanceData.overview.totalImpressions.toLocaleString()}
                </div>
                {getTrendIcon(12450, 11230)}
              </div>
              <p className="text-xs text-green-400 mt-1">+10.9% from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <MousePointer className="w-4 h-4" />
                Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-white">
                  {mockPerformanceData.overview.totalClicks}
                </div>
                {getTrendIcon(523, 489)}
              </div>
              <p className="text-xs text-green-400 mt-1">+7.0% from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-white">
                  {mockPerformanceData.overview.totalConversions}
                </div>
                {getTrendIcon(18, 15)}
              </div>
              <p className="text-xs text-green-400 mt-1">+20.0% from last week</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Click-Through Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {formatPercentage(mockPerformanceData.overview.ctr)}
              </div>
              <p className="text-sm text-gray-400">Industry average: 3.7%</p>
              <div className="mt-2 text-xs text-green-400">Above average</div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Average CPC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {formatCurrency(mockPerformanceData.overview.averageCPC)}
              </div>
              <p className="text-sm text-gray-400">Industry average: £0.52</p>
              <div className="mt-2 text-xs text-green-400">Below average (good)</div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-400" />
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-2">
                {formatPercentage(mockPerformanceData.overview.conversionRate)}
              </div>
              <p className="text-sm text-gray-400">Industry average: 2.8%</p>
              <div className="mt-2 text-xs text-green-400">Above average</div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance Table */}
        <Card className="bg-[#1a1a1a] border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Campaign Performance</CardTitle>
            <CardDescription>Individual campaign metrics and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-400 font-medium py-3">Campaign</th>
                    <th className="text-left text-gray-400 font-medium py-3">Status</th>
                    <th className="text-right text-gray-400 font-medium py-3">Impressions</th>
                    <th className="text-right text-gray-400 font-medium py-3">Clicks</th>
                    <th className="text-right text-gray-400 font-medium py-3">CTR</th>
                    <th className="text-right text-gray-400 font-medium py-3">Spend</th>
                    <th className="text-right text-gray-400 font-medium py-3">Conversions</th>
                    <th className="text-right text-gray-400 font-medium py-3">Cost/Conv</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPerformanceData.campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-gray-800">
                      <td className="py-4">
                        <div className="text-white font-medium">{campaign.name}</div>
                      </td>
                      <td className="py-4">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="text-right py-4 text-white">
                        {campaign.impressions.toLocaleString()}
                      </td>
                      <td className="text-right py-4 text-white">
                        {campaign.clicks}
                      </td>
                      <td className="text-right py-4 text-white">
                        {formatPercentage(campaign.ctr)}
                      </td>
                      <td className="text-right py-4 text-white">
                        {formatCurrency(campaign.spend)}
                      </td>
                      <td className="text-right py-4 text-white">
                        {campaign.conversions}
                      </td>
                      <td className="text-right py-4 text-white">
                        {formatCurrency(campaign.costPerConversion)}
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
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              ROI Analysis
            </CardTitle>
            <CardDescription>Return on investment calculation and projections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  340%
                </div>
                <p className="text-sm text-gray-400">Current ROI</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  £834
                </div>
                <p className="text-sm text-gray-400">Revenue Generated</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  £589
                </div>
                <p className="text-sm text-gray-400">Profit</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  £2,510
                </div>
                <p className="text-sm text-gray-400">Projected Monthly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
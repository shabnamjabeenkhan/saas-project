"use client";
import { BarChart3, MousePointer, UserCheck, PoundSterling } from 'lucide-react';
import { DashboardCard } from "~/components/dashboard/dashboard-card";
import { OverviewCard } from "~/components/dashboard/overview-card";
import { RevenueChart } from "~/components/dashboard/revenue-chart";
import { CampaignManagement } from "~/components/dashboard/campaign-management";
import { SyncStatusComponent } from "~/components/dashboard/sync-status";
import { AlertsPanel } from "~/components/dashboard/alerts-panel";
import { generateMockDailyMetrics, calculateAdvancedROI, getJobValueMetrics } from "~/lib/mockPerformanceData";
import { googleAdsSyncSimulator } from "~/lib/googleAdsSync";

// Campaign stats data adapted for TradeBoost AI
const stats = [
  {
    title: 'Impressions',
    value: '1,247',
    change: '+12%',
    changeType: 'positive' as const,
    icon: BarChart3,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'Campaign visibility improving',
  },
  {
    title: 'Clicks',
    value: '24',
    change: '+18%',
    changeType: 'positive' as const,
    icon: MousePointer,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Good click-through rate',
  },
  {
    title: 'Leads',
    value: '8',
    change: '+33%',
    changeType: 'positive' as const,
    icon: UserCheck,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Converting well to enquiries',
  },
  {
    title: 'Ad Spend',
    value: '£89.50',
    change: '-5%',
    changeType: 'negative' as const,
    icon: PoundSterling,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'Efficient spend per lead',
  },
];

export default function Page() {
  // Generate mock data for alerts
  const currentData = generateMockDailyMetrics().slice(-7); // Last 7 days
  const previousData = generateMockDailyMetrics().slice(-14, -7); // Previous 7 days
  const jobMetrics = getJobValueMetrics();
  const advancedROI = calculateAdvancedROI(currentData, jobMetrics);
  const syncStatus = googleAdsSyncSimulator.getSyncStatus();

  // Overview stats for the main card
  const overviewStats = [
    {
      label: 'New Leads',
      value: stats[2].value,
      change: stats[2].change,
      changeType: stats[2].changeType
    },
    {
      label: 'Total Clicks',
      value: stats[1].value,
      change: stats[1].change,
      changeType: stats[1].changeType
    },
    {
      label: 'Ad Spend',
      value: stats[3].value,
      change: stats[3].change,
      changeType: stats[3].changeType
    }
  ];

  return (
    <div className="flex flex-1 flex-col bg-[#0a0a0a] text-white">
      <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
        <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="px-2 sm:px-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
                Dashboard
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Here's how your Google Ads campaigns are performing today.
              </p>
            </div>

            {/* Overview Card */}
            <OverviewCard
              title="Overview"
              description="Visualize your main activities data"
              stats={overviewStats}
            />

            {/* Charts Grid */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <h3 className="text-lg font-medium text-white mb-4">Performance Metrics</h3>
                <RevenueChart />
              </div>

              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <h3 className="text-lg font-medium text-white mb-4">Campaign Status</h3>
                <SyncStatusComponent />
              </div>

              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <h3 className="text-lg font-medium text-white mb-4">Alerts & Notifications</h3>
                <AlertsPanel
                  currentData={currentData}
                  previousData={previousData}
                  roiMetrics={advancedROI}
                  syncStatus={syncStatus}
                />
              </div>

              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <h3 className="text-lg font-medium text-white mb-4">Campaign Management</h3>
                <CampaignManagement />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

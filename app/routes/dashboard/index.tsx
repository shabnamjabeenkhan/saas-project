"use client";
import { BarChart3, MousePointer, UserCheck, PoundSterling } from 'lucide-react';
import { OverviewCard } from "~/components/dashboard/overview-card";
import { SimpleSyncStatus } from "~/components/dashboard/simple-sync-status";

// Simplified stats for trades people - focus on what matters most
const stats = [
  {
    title: 'ROI',
    value: '340%',
    change: '+45%',
    changeType: 'positive' as const,
    icon: BarChart3,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: 'Return on ad spend',
  },
  {
    title: 'Clicks on Ads',
    value: '24',
    change: '+18%',
    changeType: 'positive' as const,
    icon: MousePointer,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: 'People clicking your ads',
  },
  {
    title: 'New Jobs',
    value: '8',
    change: '+33%',
    changeType: 'positive' as const,
    icon: UserCheck,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    description: 'Leads this week',
  },
  {
    title: 'Revenue',
    value: '£834',
    change: '+28%',
    changeType: 'positive' as const,
    icon: PoundSterling,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: 'From ads this month',
  },
];

export default function Page() {

  // Overview stats for the main card - simplified for trades people
  const overviewStats = [
    {
      label: 'ROI',
      value: stats[0].value,
      change: stats[0].change,
      changeType: stats[0].changeType
    },
    {
      label: 'New Jobs',
      value: stats[2].value,
      change: stats[2].change,
      changeType: stats[2].changeType
    },
    {
      label: 'Revenue',
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
            <div className="px-2 sm:px-0 text-center">
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

            {/* Simplified Grid - Key Information Only */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <h3 className="text-lg font-medium text-white mb-4">Sync Status</h3>
                <SimpleSyncStatus />
              </div>

              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <h3 className="text-lg font-medium text-white mb-4">Quick Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Ad Spend This Month</span>
                    <span className="text-white font-medium">£89.50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Revenue Generated</span>
                    <span className="text-green-400 font-medium">£834.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Profit Made</span>
                    <span className="text-green-400 font-medium">£744.50</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 font-medium">Return on Investment</span>
                      <span className="text-green-400 font-bold text-xl">340%</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Every £1 spent returns £3.40</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Line - What Matters Most */}
            <div className="mt-6">
              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">Bottom Line</h3>
                </div>
                <div className="text-center">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-4">
                    <h3 className="text-3xl font-bold text-green-400 mb-2">340% ROI</h3>
                    <p className="text-gray-300 mb-4">Every £1 spent returns £3.40</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Spent</p>
                        <p className="text-white font-medium">£89.50</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Revenue</p>
                        <p className="text-white font-medium">£834</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Profit</p>
                        <p className="text-green-400 font-medium">£744.50</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Your ads are performing excellently. Consider increasing budget to get more customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { BarChart3, MousePointer, UserCheck, PoundSterling } from 'lucide-react';
import { OverviewCard } from "~/components/dashboard/overview-card";
import { SimpleSyncStatus } from "~/components/dashboard/simple-sync-status";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatCurrency, formatPercent } from "~/lib/utils";

export default function Page() {
  // Fetch live metrics from Convex
  const metrics = useQuery(api.metrics.getDashboardMetrics) ?? null;

  // Derive safe values with good fallbacks
  const qualifiedCalls = metrics?.qualifiedCalls ?? 0;
  const adSpend = metrics?.adSpend.amount ?? 0;
  const costPerLead = metrics?.costPerLead ?? null;
  const estimatedRoi = metrics?.estimatedRoi ?? 0;
  const hasRealData = metrics?.hasRealData ?? false;

  // Calculate estimated revenue: estimatedRoi = estimatedRevenue - adSpend
  // So: estimatedRevenue = estimatedRoi + adSpend
  const estimatedRevenue = estimatedRoi + adSpend;
  
  // Calculate ROI percentage: ((Revenue - Cost) / Cost) * 100
  // Or: (estimatedRoi / adSpend) * 100
  const roiPercent = adSpend > 0 
    ? (estimatedRoi / adSpend) * 100 
    : 0;

  // Overview stats for the main card - using live metrics
  const overviewStats = metrics
    ? [
        {
          label: "Qualified Calls",
          value: qualifiedCalls,
          // TODO: Add change tracking vs previous period
        },
        {
          label: "Ad Spend (MTD)",
          value: formatCurrency(adSpend, metrics.adSpend.currencyCode),
          // TODO: Add change tracking vs previous period
        },
        {
          label: "Cost Per Lead",
          value: costPerLead != null ? formatCurrency(costPerLead, metrics.adSpend.currencyCode) : "N/A",
          // TODO: Add change tracking vs previous period
        },
      ]
    : // Loading skeleton
      [
        { label: "Qualified Calls", value: "…" },
        { label: "Ad Spend (MTD)", value: "…" },
        { label: "Cost Per Lead", value: "…" },
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
                {!metrics ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Ad Spend This Month</span>
                      <span className="text-white font-medium">…</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Revenue Generated</span>
                      <span className="text-gray-400">…</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Profit Made</span>
                      <span className="text-gray-400">…</span>
                    </div>
                  </div>
                ) : !hasRealData ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Setting up your metrics...</p>
                    <p className="text-gray-500 text-xs mt-2">
                      Connect Google Ads and set up call tracking to see your performance data.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Ad Spend This Month</span>
                      <span className="text-white font-medium">
                        {formatCurrency(adSpend, metrics.adSpend.currencyCode)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Revenue Generated</span>
                      <span className="text-green-400 font-medium">
                        {formatCurrency(estimatedRevenue, metrics.adSpend.currencyCode)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Profit Made</span>
                      <span className={`font-medium ${estimatedRoi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(estimatedRoi, metrics.adSpend.currencyCode)}
                      </span>
                    </div>
                    <div className="border-t border-gray-700 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 font-medium">Estimated Return on Investment</span>
                        <span className={`font-bold text-xl ${roiPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(roiPercent)}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        Every £1 spent returns {formatCurrency(1 + roiPercent / 100, metrics.adSpend.currencyCode)} (estimated)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Line - What Matters Most */}
            <div className="mt-6">
              <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-200">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-medium text-white">Bottom Line</h3>
                </div>
                {!metrics ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-6 mb-4">
                      <h3 className="text-3xl font-bold text-gray-400 mb-2">Loading...</h3>
                      <p className="text-gray-500 mb-4">Fetching your metrics...</p>
                    </div>
                  </div>
                ) : !hasRealData ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-6 mb-4">
                      <h3 className="text-xl font-bold text-gray-400 mb-2">No Data Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Connect Google Ads and set up call tracking to see your estimated ROI.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className={`border rounded-lg p-6 mb-4 ${
                      roiPercent >= 0 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-red-500/10 border-red-500/20'
                    }`}>
                      <h3 className={`text-3xl font-bold mb-2 ${
                        roiPercent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercent(roiPercent)} Estimated ROI
                      </h3>
                      <p className="text-gray-300 mb-4">
                        Every £1 spent returns {formatCurrency(1 + roiPercent / 100, metrics.adSpend.currencyCode)} (estimated)
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Spent</p>
                          <p className="text-white font-medium">
                            {formatCurrency(adSpend, metrics.adSpend.currencyCode)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Revenue</p>
                          <p className="text-white font-medium">
                            {formatCurrency(estimatedRevenue, metrics.adSpend.currencyCode)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Profit</p>
                          <p className={`font-medium ${estimatedRoi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(estimatedRoi, metrics.adSpend.currencyCode)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {roiPercent >= 0 
                        ? "Your ads are performing well. Consider increasing budget to get more customers."
                        : "Your ads need optimization. Review your campaigns and targeting to improve ROI."
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

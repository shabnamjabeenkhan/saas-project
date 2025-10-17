// Mock Google Ads performance data for development
export interface PerformanceMetrics {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number; // Click-through rate
  cpc: number; // Cost per click
  conversionRate: number;
  costPerConversion: number;
}

export interface CampaignPerformance {
  campaignName: string;
  status: 'active' | 'paused' | 'draft';
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  averageCtr: number;
  averageCpc: number;
  conversionRate: number;
  estimatedROI: number;
}

// Generate realistic daily metrics for the last 30 days
export function generateMockDailyMetrics(): PerformanceMetrics[] {
  const data: PerformanceMetrics[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Base metrics with some realistic variation
    const baseImpressions = 150 + Math.random() * 100;
    const baseCtr = 0.03 + Math.random() * 0.02; // 3-5% CTR
    const baseCpc = 0.80 + Math.random() * 0.40; // £0.80-£1.20 CPC
    const baseConversionRate = 0.08 + Math.random() * 0.04; // 8-12% conversion rate

    const clicks = Math.round(baseImpressions * baseCtr);
    const cost = parseFloat((clicks * baseCpc).toFixed(2));
    const conversions = Math.round(clicks * baseConversionRate);

    data.push({
      date: date.toISOString().split('T')[0],
      impressions: Math.round(baseImpressions),
      clicks,
      cost,
      conversions,
      ctr: parseFloat((baseCtr * 100).toFixed(2)),
      cpc: parseFloat(baseCpc.toFixed(2)),
      conversionRate: parseFloat((baseConversionRate * 100).toFixed(2)),
      costPerConversion: conversions > 0 ? parseFloat((cost / conversions).toFixed(2)) : 0,
    });
  }

  return data;
}

// Mock campaign performance data
export function generateMockCampaignData(): CampaignPerformance[] {
  return [
    {
      campaignName: 'Tech Electrical Services London',
      status: 'active',
      totalImpressions: 4520,
      totalClicks: 156,
      totalCost: 142.80,
      totalConversions: 12,
      averageCtr: 3.45,
      averageCpc: 0.92,
      conversionRate: 7.69,
      estimatedROI: 185.50, // Estimated revenue from conversions
    },
    {
      campaignName: 'Emergency Electrical Repair',
      status: 'active',
      totalImpressions: 2840,
      totalClicks: 98,
      totalCost: 89.60,
      totalConversions: 8,
      averageCtr: 3.45,
      averageCpc: 0.91,
      conversionRate: 8.16,
      estimatedROI: 120.00,
    },
    {
      campaignName: 'Boiler Installation Services',
      status: 'paused',
      totalImpressions: 1650,
      totalClicks: 45,
      totalCost: 52.20,
      totalConversions: 3,
      averageCtr: 2.73,
      averageCpc: 1.16,
      conversionRate: 6.67,
      estimatedROI: 75.00,
    },
  ];
}

// Enhanced ROI tracking interfaces
export interface JobValueMetrics {
  averageJobValue: number;
  customerLifetimeValue: number;
  repeatCustomerRate: number;
  revenueByServiceType: Record<string, number>;
  seasonalMultiplier: number;
}

export interface AdvancedROIMetrics {
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  roas: number; // Return on Ad Spend
  roi: number; // Return on Investment
  paybackPeriod: number; // Days to break even
  customerAcquisitionCost: number;
  lifetimeValueToCAC: number;
  profitMargin: number;
  revenuePerClick: number;
  attribution: {
    direct: number;
    assisted: number;
    lastClick: number;
  };
}

// Job value data for UK trades
export function getJobValueMetrics(): JobValueMetrics {
  const currentMonth = new Date().getMonth();
  const isWinterSeason = currentMonth >= 10 || currentMonth <= 2; // Nov-Feb

  return {
    averageJobValue: 245, // £245 average for electrical/plumbing
    customerLifetimeValue: 890, // Repeat business + referrals
    repeatCustomerRate: 0.28, // 28% return rate
    revenueByServiceType: {
      'Emergency Electrical': 180,
      'Boiler Installation': 1200,
      'Electrical Rewiring': 2500,
      'Plumbing Repair': 120,
      'Bathroom Installation': 3500
    },
    seasonalMultiplier: isWinterSeason ? 1.35 : 1.0 // Winter demand boost
  };
}

// Calculate summary metrics with enhanced ROI
export function calculateSummaryMetrics(dailyData: PerformanceMetrics[]) {
  const totals = dailyData.reduce(
    (acc, day) => ({
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
      cost: acc.cost + day.cost,
      conversions: acc.conversions + day.conversions,
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0 }
  );

  const averageCtr = totals.clicks > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const averageCpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
  const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
  const costPerConversion = totals.conversions > 0 ? totals.cost / totals.conversions : 0;

  return {
    ...totals,
    cost: parseFloat(totals.cost.toFixed(2)),
    averageCtr: parseFloat(averageCtr.toFixed(2)),
    averageCpc: parseFloat(averageCpc.toFixed(2)),
    conversionRate: parseFloat(conversionRate.toFixed(2)),
    costPerConversion: parseFloat(costPerConversion.toFixed(2)),
  };
}

// Advanced ROI calculations
export function calculateAdvancedROI(
  performanceData: PerformanceMetrics[],
  jobMetrics: JobValueMetrics
): AdvancedROIMetrics {
  const summary = calculateSummaryMetrics(performanceData);
  const { averageJobValue, customerLifetimeValue, repeatCustomerRate, seasonalMultiplier } = jobMetrics;

  // Apply seasonal adjustment to job values
  const adjustedJobValue = averageJobValue * seasonalMultiplier;
  const adjustedCLV = customerLifetimeValue * seasonalMultiplier;

  // Revenue calculations with attribution modeling
  const directRevenue = summary.conversions * adjustedJobValue;
  const assistedRevenue = summary.conversions * 0.3 * adjustedJobValue; // 30% assisted conversions
  const repeatRevenue = summary.conversions * repeatCustomerRate * adjustedCLV;
  const totalRevenue = directRevenue + assistedRevenue + repeatRevenue;

  // Profit calculations (typical trade business margins)
  const grossProfit = totalRevenue * 0.65; // 65% gross margin
  const netProfit = grossProfit - summary.cost - (totalRevenue * 0.15); // Operating costs

  // Key metrics
  const roas = summary.cost > 0 ? totalRevenue / summary.cost : 0;
  const roi = summary.cost > 0 ? ((netProfit - summary.cost) / summary.cost) * 100 : 0;
  const customerAcquisitionCost = summary.conversions > 0 ? summary.cost / summary.conversions : 0;
  const lifetimeValueToCAC = customerAcquisitionCost > 0 ? adjustedCLV / customerAcquisitionCost : 0;
  const paybackPeriod = customerAcquisitionCost > 0 ? (customerAcquisitionCost / (adjustedJobValue * 0.65)) * 30 : 0; // Days
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const revenuePerClick = summary.clicks > 0 ? totalRevenue / summary.clicks : 0;

  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    roas: parseFloat(roas.toFixed(2)),
    roi: parseFloat(roi.toFixed(1)),
    paybackPeriod: parseFloat(paybackPeriod.toFixed(1)),
    customerAcquisitionCost: parseFloat(customerAcquisitionCost.toFixed(2)),
    lifetimeValueToCAC: parseFloat(lifetimeValueToCAC.toFixed(1)),
    profitMargin: parseFloat(profitMargin.toFixed(1)),
    revenuePerClick: parseFloat(revenuePerClick.toFixed(2)),
    attribution: {
      direct: parseFloat((directRevenue / totalRevenue * 100).toFixed(1)),
      assisted: parseFloat((assistedRevenue / totalRevenue * 100).toFixed(1)),
      lastClick: parseFloat((repeatRevenue / totalRevenue * 100).toFixed(1))
    }
  };
}

// Date range filters
export function filterDataByDateRange(
  data: PerformanceMetrics[],
  range: '7d' | '30d' | '90d'
): PerformanceMetrics[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return data.slice(-days);
}
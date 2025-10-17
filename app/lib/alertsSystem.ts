// Intelligent alerts system for Google Ads performance monitoring
import type { PerformanceMetrics, AdvancedROIMetrics } from "./mockPerformanceData";
import type { SyncStatus } from "./googleAdsSync";

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'opportunity' | 'info';
  category: 'performance' | 'budget' | 'sync' | 'optimization' | 'seasonal';
  title: string;
  message: string;
  recommendation: string;
  actionRequired: boolean;
  timestamp: Date;
  metrics?: {
    current: number;
    previous?: number;
    benchmark?: number;
    change?: number;
  };
  actions?: AlertAction[];
}

export interface AlertAction {
  label: string;
  type: 'primary' | 'secondary';
  action: string;
  params?: Record<string, any>;
}

export interface AlertThresholds {
  ctr: { warning: number; critical: number };
  cpc: { increase: number; spike: number };
  conversionRate: { warning: number; critical: number };
  roas: { warning: number; critical: number };
  budgetUtilization: { warning: number; critical: number };
  syncFailures: { warning: number; critical: number };
}

// Default thresholds for trade businesses
const DEFAULT_THRESHOLDS: AlertThresholds = {
  ctr: { warning: 2.5, critical: 1.5 }, // %
  cpc: { increase: 20, spike: 50 }, // % increase
  conversionRate: { warning: 5, critical: 3 }, // %
  roas: { warning: 3, critical: 2 }, // x
  budgetUtilization: { warning: 80, critical: 95 }, // %
  syncFailures: { warning: 2, critical: 5 } // count
};

export class AlertsSystem {
  private thresholds: AlertThresholds;
  private alertHistory: Alert[] = [];

  constructor(thresholds: AlertThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  // Analyze performance data and generate alerts
  analyzePerformance(
    currentData: PerformanceMetrics[],
    previousData: PerformanceMetrics[],
    roiMetrics: AdvancedROIMetrics,
    syncStatus: SyncStatus
  ): Alert[] {
    const alerts: Alert[] = [];

    // Calculate current vs previous metrics
    const current = this.calculateAverages(currentData);
    const previous = this.calculateAverages(previousData);

    // Performance alerts
    alerts.push(...this.checkCTRAlerts(current, previous));
    alerts.push(...this.checkCPCAlerts(current, previous));
    alerts.push(...this.checkConversionAlerts(current, previous));
    alerts.push(...this.checkROASAlerts(roiMetrics));
    alerts.push(...this.checkBudgetAlerts(current));
    alerts.push(...this.checkSyncAlerts(syncStatus));
    alerts.push(...this.checkSeasonalOpportunities(currentData));
    alerts.push(...this.checkOptimizationOpportunities(currentData, roiMetrics));

    // Store alerts in history
    this.alertHistory.push(...alerts);

    return alerts.sort((a, b) => {
      const priority = { critical: 4, warning: 3, opportunity: 2, info: 1 };
      return priority[b.type] - priority[a.type];
    });
  }

  private calculateAverages(data: PerformanceMetrics[]) {
    if (data.length === 0) return { ctr: 0, cpc: 0, conversionRate: 0, cost: 0, conversions: 0 };

    return {
      ctr: data.reduce((sum, d) => sum + d.ctr, 0) / data.length,
      cpc: data.reduce((sum, d) => sum + d.cpc, 0) / data.length,
      conversionRate: data.reduce((sum, d) => sum + d.conversionRate, 0) / data.length,
      cost: data.reduce((sum, d) => sum + d.cost, 0),
      conversions: data.reduce((sum, d) => sum + d.conversions, 0)
    };
  }

  private checkCTRAlerts(current: any, previous: any): Alert[] {
    const alerts: Alert[] = [];
    const change = previous.ctr > 0 ? ((current.ctr - previous.ctr) / previous.ctr) * 100 : 0;

    if (current.ctr < this.thresholds.ctr.critical) {
      alerts.push({
        id: `ctr_critical_${Date.now()}`,
        type: 'critical',
        category: 'performance',
        title: 'Critical: Low Click-Through Rate',
        message: `CTR has dropped to ${current.ctr.toFixed(2)}%, well below industry standards.`,
        recommendation: 'Review ad copy, test new headlines, and check keyword relevance.',
        actionRequired: true,
        timestamp: new Date(),
        metrics: {
          current: current.ctr,
          previous: previous.ctr,
          benchmark: this.thresholds.ctr.warning,
          change
        },
        actions: [
          { label: 'Review Ad Copy', type: 'primary', action: 'navigate', params: { route: '/campaigns' } },
          { label: 'Keyword Analysis', type: 'secondary', action: 'navigate', params: { route: '/keywords' } }
        ]
      });
    } else if (current.ctr < this.thresholds.ctr.warning) {
      alerts.push({
        id: `ctr_warning_${Date.now()}`,
        type: 'warning',
        category: 'performance',
        title: 'Warning: Below Average CTR',
        message: `CTR is ${current.ctr.toFixed(2)}%, below recommended threshold.`,
        recommendation: 'Consider testing new ad variations and review keyword match types.',
        actionRequired: false,
        timestamp: new Date(),
        metrics: {
          current: current.ctr,
          previous: previous.ctr,
          benchmark: this.thresholds.ctr.warning,
          change
        }
      });
    }

    return alerts;
  }

  private checkCPCAlerts(current: any, previous: any): Alert[] {
    const alerts: Alert[] = [];
    const change = previous.cpc > 0 ? ((current.cpc - previous.cpc) / previous.cpc) * 100 : 0;

    if (change > this.thresholds.cpc.spike) {
      alerts.push({
        id: `cpc_spike_${Date.now()}`,
        type: 'critical',
        category: 'budget',
        title: 'Critical: CPC Spike Detected',
        message: `CPC increased by ${change.toFixed(1)}% to £${current.cpc.toFixed(2)}.`,
        recommendation: 'Check for competitor activity or keyword bid wars. Consider lowering max CPC.',
        actionRequired: true,
        timestamp: new Date(),
        metrics: { current: current.cpc, previous: previous.cpc, change },
        actions: [
          { label: 'Adjust Bids', type: 'primary', action: 'navigate', params: { route: '/bidding' } }
        ]
      });
    } else if (change > this.thresholds.cpc.increase) {
      alerts.push({
        id: `cpc_increase_${Date.now()}`,
        type: 'warning',
        category: 'budget',
        title: 'Warning: CPC Increasing',
        message: `CPC has risen by ${change.toFixed(1)}% over the previous period.`,
        recommendation: 'Monitor closely and consider bid optimizations.',
        actionRequired: false,
        timestamp: new Date(),
        metrics: { current: current.cpc, previous: previous.cpc, change }
      });
    }

    return alerts;
  }

  private checkConversionAlerts(current: any, previous: any): Alert[] {
    const alerts: Alert[] = [];
    const change = previous.conversionRate > 0 ? ((current.conversionRate - previous.conversionRate) / previous.conversionRate) * 100 : 0;

    if (current.conversionRate < this.thresholds.conversionRate.critical) {
      alerts.push({
        id: `conversion_critical_${Date.now()}`,
        type: 'critical',
        category: 'performance',
        title: 'Critical: Low Conversion Rate',
        message: `Conversion rate dropped to ${current.conversionRate.toFixed(2)}%.`,
        recommendation: 'Check landing page performance, call tracking, and lead capture forms.',
        actionRequired: true,
        timestamp: new Date(),
        metrics: {
          current: current.conversionRate,
          previous: previous.conversionRate,
          benchmark: this.thresholds.conversionRate.warning,
          change
        },
        actions: [
          { label: 'Check Landing Pages', type: 'primary', action: 'external', params: { url: '/landing-pages' } },
          { label: 'Review Forms', type: 'secondary', action: 'navigate', params: { route: '/conversions' } }
        ]
      });
    }

    return alerts;
  }

  private checkROASAlerts(roiMetrics: AdvancedROIMetrics): Alert[] {
    const alerts: Alert[] = [];

    if (roiMetrics.roas < this.thresholds.roas.critical) {
      alerts.push({
        id: `roas_critical_${Date.now()}`,
        type: 'critical',
        category: 'performance',
        title: 'Critical: Poor ROAS Performance',
        message: `ROAS is only ${roiMetrics.roas.toFixed(2)}x, below profitable threshold.`,
        recommendation: 'Pause low-performing campaigns and focus budget on high-converting keywords.',
        actionRequired: true,
        timestamp: new Date(),
        metrics: {
          current: roiMetrics.roas,
          benchmark: this.thresholds.roas.warning
        },
        actions: [
          { label: 'Campaign Review', type: 'primary', action: 'navigate', params: { route: '/campaigns' } }
        ]
      });
    } else if (roiMetrics.roas < this.thresholds.roas.warning) {
      alerts.push({
        id: `roas_warning_${Date.now()}`,
        type: 'warning',
        category: 'performance',
        title: 'Warning: ROAS Below Target',
        message: `ROAS of ${roiMetrics.roas.toFixed(2)}x is below optimal performance.`,
        recommendation: 'Review keyword performance and optimize landing pages.',
        actionRequired: false,
        timestamp: new Date(),
        metrics: {
          current: roiMetrics.roas,
          benchmark: this.thresholds.roas.warning
        }
      });
    }

    return alerts;
  }

  private checkBudgetAlerts(current: any): Alert[] {
    const alerts: Alert[] = [];
    const dailyBudget = 50; // £50 daily budget assumption
    const utilization = (current.cost / dailyBudget) * 100;

    if (utilization > this.thresholds.budgetUtilization.critical) {
      alerts.push({
        id: `budget_critical_${Date.now()}`,
        type: 'critical',
        category: 'budget',
        title: 'Budget Depletion Warning',
        message: `Daily budget is ${utilization.toFixed(0)}% utilized.`,
        recommendation: 'Consider increasing budget or pausing low-performing ads.',
        actionRequired: true,
        timestamp: new Date(),
        metrics: { current: utilization, benchmark: 100 },
        actions: [
          { label: 'Increase Budget', type: 'primary', action: 'navigate', params: { route: '/budget' } }
        ]
      });
    }

    return alerts;
  }

  private checkSyncAlerts(syncStatus: SyncStatus): Alert[] {
    const alerts: Alert[] = [];
    const recentFailures = syncStatus.syncHistory.filter(
      s => s.status === 'error' &&
      s.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    if (recentFailures >= this.thresholds.syncFailures.critical) {
      alerts.push({
        id: `sync_critical_${Date.now()}`,
        type: 'critical',
        category: 'sync',
        title: 'Critical: Multiple Sync Failures',
        message: `${recentFailures} sync failures in the last 24 hours.`,
        recommendation: 'Check API credentials and connection status.',
        actionRequired: true,
        timestamp: new Date(),
        actions: [
          { label: 'Check Connection', type: 'primary', action: 'navigate', params: { route: '/settings' } }
        ]
      });
    }

    return alerts;
  }

  private checkSeasonalOpportunities(data: PerformanceMetrics[]): Alert[] {
    const alerts: Alert[] = [];
    const currentMonth = new Date().getMonth();
    const isWinterSeason = currentMonth >= 10 || currentMonth <= 2;

    if (isWinterSeason) {
      const recentPerformance = data.slice(-7);
      const avgConversions = recentPerformance.reduce((sum, d) => sum + d.conversions, 0) / recentPerformance.length;

      if (avgConversions > 2) { // Above average conversions
        alerts.push({
          id: `seasonal_winter_${Date.now()}`,
          type: 'opportunity',
          category: 'seasonal',
          title: 'Winter Demand Spike Detected',
          message: 'Emergency heating calls are 35% higher than average.',
          recommendation: 'Consider increasing bids on emergency/heating keywords by 25-40%.',
          actionRequired: false,
          timestamp: new Date(),
          actions: [
            { label: 'Adjust Seasonal Bids', type: 'primary', action: 'navigate', params: { route: '/bidding' } }
          ]
        });
      }
    }

    return alerts;
  }

  private checkOptimizationOpportunities(data: PerformanceMetrics[], roiMetrics: AdvancedROIMetrics): Alert[] {
    const alerts: Alert[] = [];

    // High ROAS opportunity
    if (roiMetrics.roas > 5) {
      alerts.push({
        id: `optimization_scale_${Date.now()}`,
        type: 'opportunity',
        category: 'optimization',
        title: 'Scale Opportunity: High ROAS Detected',
        message: `ROAS of ${roiMetrics.roas.toFixed(2)}x indicates room for budget increase.`,
        recommendation: 'Consider increasing daily budget by 30-50% to capture more conversions.',
        actionRequired: false,
        timestamp: new Date(),
        actions: [
          { label: 'Increase Budget', type: 'primary', action: 'navigate', params: { route: '/budget' } }
        ]
      });
    }

    // High CAC warning
    if (roiMetrics.customerAcquisitionCost > 40) {
      alerts.push({
        id: `optimization_cac_${Date.now()}`,
        type: 'warning',
        category: 'optimization',
        title: 'High Customer Acquisition Cost',
        message: `CAC of £${roiMetrics.customerAcquisitionCost.toFixed(2)} is above industry average.`,
        recommendation: 'Focus on higher-converting keywords and improve Quality Score.',
        actionRequired: false,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  // Get active alerts (last 24 hours)
  getActiveAlerts(): Alert[] {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.alertHistory.filter(alert => alert.timestamp > yesterday);
  }

  // Get alert summary counts
  getAlertSummary(): Record<Alert['type'], number> {
    const activeAlerts = this.getActiveAlerts();
    return {
      critical: activeAlerts.filter(a => a.type === 'critical').length,
      warning: activeAlerts.filter(a => a.type === 'warning').length,
      opportunity: activeAlerts.filter(a => a.type === 'opportunity').length,
      info: activeAlerts.filter(a => a.type === 'info').length
    };
  }

  // Dismiss alert
  dismissAlert(alertId: string): void {
    this.alertHistory = this.alertHistory.filter(alert => alert.id !== alertId);
  }
}

// Singleton instance
export const alertsSystem = new AlertsSystem();
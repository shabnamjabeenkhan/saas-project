// Google Ads API sync simulation
// This simulates the daily sync job that would fetch real data from Google Ads API

export interface SyncStatus {
  lastSyncTime: Date;
  issyncing: boolean;
  syncFrequency: 'hourly' | 'daily' | 'manual';
  nextScheduledSync: Date;
  syncHistory: SyncEvent[];
}

export interface SyncEvent {
  timestamp: Date;
  status: 'success' | 'error' | 'partial';
  recordsUpdated: number;
  duration: number; // in milliseconds
  errorMessage?: string;
}

export interface ConversionData {
  date: string;
  conversions: number;
  conversionValue: number;
  conversionType: 'phone_call' | 'form_submission' | 'booking' | 'email';
  campaignId: string;
  campaignName: string;
  conversionAction: string;
  attributionModel: 'last_click' | 'first_click' | 'linear' | 'data_driven';
  timeToConversion: number; // hours
  deviceType: 'mobile' | 'desktop' | 'tablet';
  clickId?: string;
}

export interface ConversionTracking {
  conversionActions: ConversionAction[];
  conversionPaths: ConversionPath[];
  conversionWindows: ConversionWindow[];
}

export interface ConversionAction {
  id: string;
  name: string;
  type: 'phone_call' | 'form_submission' | 'booking' | 'email' | 'purchase';
  category: 'lead' | 'sale' | 'signup';
  defaultValue: number;
  countType: 'one_per_click' | 'many_per_click';
  clickThroughLookback: number; // days
  viewThroughLookback: number; // days
  isActive: boolean;
}

export interface ConversionPath {
  conversionId: string;
  touchpoints: Touchpoint[];
  totalValue: number;
  timeToConversion: number; // hours
  devicePath: string[];
}

export interface Touchpoint {
  timestamp: Date;
  campaignId: string;
  adGroupId: string;
  keyword: string;
  matchType: 'exact' | 'phrase' | 'broad';
  device: 'mobile' | 'desktop' | 'tablet';
  interaction: 'click' | 'impression';
  cost: number;
}

export interface ConversionWindow {
  actionId: string;
  clickWindow: number; // days
  viewWindow: number; // days
  conversionsInWindow: number;
  valueInWindow: number;
}

// Simulate Google Ads API data fetch
export class GoogleAdsSyncSimulator {
  private syncStatus: SyncStatus;

  constructor() {
    const now = new Date();
    this.syncStatus = {
      lastSyncTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      issyncing: false,
      syncFrequency: 'daily',
      nextScheduledSync: new Date(now.getTime() + 22 * 60 * 60 * 1000), // 22 hours from now
      syncHistory: this.generateSyncHistory()
    };
  }

  // Simulate a sync job
  async performSync(): Promise<SyncEvent> {
    this.syncStatus.issyncing = true;
    const startTime = Date.now();

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const now = new Date();
    const success = Math.random() > 0.05; // 95% success rate
    const recordsUpdated = Math.floor(50 + Math.random() * 200); // 50-250 records

    const syncEvent: SyncEvent = {
      timestamp: now,
      status: success ? 'success' : 'error',
      recordsUpdated: success ? recordsUpdated : 0,
      duration: Date.now() - startTime,
      errorMessage: success ? undefined : 'API rate limit exceeded'
    };

    // Update sync status
    this.syncStatus.lastSyncTime = now;
    this.syncStatus.issyncing = false;
    this.syncStatus.nextScheduledSync = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    this.syncStatus.syncHistory.unshift(syncEvent);

    // Keep only last 50 sync events
    if (this.syncStatus.syncHistory.length > 50) {
      this.syncStatus.syncHistory = this.syncStatus.syncHistory.slice(0, 50);
    }

    return syncEvent;
  }

  // Get current sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Simulate native Google Ads conversion tracking data
  generateConversionData(): ConversionData[] {
    const conversions: ConversionData[] = [];
    const campaigns = [
      { id: 'camp_001', name: 'Emergency Electrical London' },
      { id: 'camp_002', name: 'Boiler Installation Services' },
      { id: 'camp_003', name: 'Electrical Rewiring' }
    ];

    const conversionTypes: ConversionData['conversionType'][] = [
      'phone_call', 'form_submission', 'booking', 'email'
    ];

    // Generate last 30 days of conversion data
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      campaigns.forEach(campaign => {
        // Random conversions per day per campaign (0-5)
        const dailyConversions = Math.floor(Math.random() * 6);

        for (let j = 0; j < dailyConversions; j++) {
          const conversionType = conversionTypes[Math.floor(Math.random() * conversionTypes.length)];
          let conversionValue = 0;

          // Assign realistic values based on conversion type
          switch (conversionType) {
            case 'phone_call':
              conversionValue = 80 + Math.random() * 120; // £80-200
              break;
            case 'form_submission':
              conversionValue = 60 + Math.random() * 90; // £60-150
              break;
            case 'booking':
              conversionValue = 150 + Math.random() * 200; // £150-350
              break;
            case 'email':
              conversionValue = 40 + Math.random() * 60; // £40-100
              break;
          }

          const deviceTypes: ConversionData['deviceType'][] = ['mobile', 'desktop', 'tablet'];
          const attributionModels: ConversionData['attributionModel'][] = ['last_click', 'first_click', 'linear', 'data_driven'];

          conversions.push({
            date: date.toISOString().split('T')[0],
            conversions: 1,
            conversionValue: Math.round(conversionValue * 100) / 100,
            conversionType,
            campaignId: campaign.id,
            campaignName: campaign.name,
            conversionAction: `${conversionType}_action_${campaign.id}`,
            attributionModel: attributionModels[Math.floor(Math.random() * attributionModels.length)],
            timeToConversion: Math.floor(Math.random() * 72) + 1, // 1-72 hours
            deviceType: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
            clickId: `gclid_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
          });
        }
      });
    }

    return conversions;
  }

  // Generate realistic sync history
  private generateSyncHistory(): SyncEvent[] {
    const history: SyncEvent[] = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
      const success = Math.random() > 0.1; // 90% success rate historically

      history.push({
        timestamp,
        status: success ? 'success' : (Math.random() > 0.5 ? 'error' : 'partial'),
        recordsUpdated: success ? Math.floor(40 + Math.random() * 160) : Math.floor(Math.random() * 20),
        duration: 1500 + Math.random() * 4000,
        errorMessage: success ? undefined :
          ['Rate limit exceeded', 'Authentication failed', 'Network timeout'][Math.floor(Math.random() * 3)]
      });
    }

    return history;
  }

  // Generate conversion tracking setup
  generateConversionTracking(): ConversionTracking {
    const conversionActions: ConversionAction[] = [
      {
        id: 'ca_phone_001',
        name: 'Phone Call Lead',
        type: 'phone_call',
        category: 'lead',
        defaultValue: 25,
        countType: 'one_per_click',
        clickThroughLookback: 30,
        viewThroughLookback: 1,
        isActive: true
      },
      {
        id: 'ca_form_001',
        name: 'Contact Form Submission',
        type: 'form_submission',
        category: 'lead',
        defaultValue: 35,
        countType: 'one_per_click',
        clickThroughLookback: 30,
        viewThroughLookback: 1,
        isActive: true
      },
      {
        id: 'ca_booking_001',
        name: 'Service Booking',
        type: 'booking',
        category: 'sale',
        defaultValue: 200,
        countType: 'one_per_click',
        clickThroughLookback: 30,
        viewThroughLookback: 1,
        isActive: true
      },
      {
        id: 'ca_email_001',
        name: 'Email Enquiry',
        type: 'email',
        category: 'lead',
        defaultValue: 15,
        countType: 'many_per_click',
        clickThroughLookback: 7,
        viewThroughLookback: 1,
        isActive: true
      }
    ];

    const conversionPaths: ConversionPath[] = this.generateConversionPaths();
    const conversionWindows: ConversionWindow[] = this.generateConversionWindows(conversionActions);

    return {
      conversionActions,
      conversionPaths,
      conversionWindows
    };
  }

  // Generate realistic conversion paths
  private generateConversionPaths(): ConversionPath[] {
    const paths: ConversionPath[] = [];
    const campaigns = ['camp_001', 'camp_002', 'camp_003'];
    const keywords = ['emergency electrician', 'boiler repair', 'electrical rewiring', 'bathroom installation'];

    for (let i = 0; i < 15; i++) {
      const numTouchpoints = Math.floor(Math.random() * 3) + 1; // 1-3 touchpoints
      const touchpoints: Touchpoint[] = [];
      const devices: ('mobile' | 'desktop' | 'tablet')[] = ['mobile', 'desktop', 'tablet'];

      for (let j = 0; j < numTouchpoints; j++) {
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - (numTouchpoints - j) * 24); // Spread over days

        touchpoints.push({
          timestamp,
          campaignId: campaigns[Math.floor(Math.random() * campaigns.length)],
          adGroupId: `ag_00${j + 1}`,
          keyword: keywords[Math.floor(Math.random() * keywords.length)],
          matchType: ['exact', 'phrase', 'broad'][Math.floor(Math.random() * 3)] as 'exact' | 'phrase' | 'broad',
          device: devices[Math.floor(Math.random() * devices.length)],
          interaction: j === numTouchpoints - 1 ? 'click' : Math.random() > 0.7 ? 'click' : 'impression',
          cost: Math.random() * 2 + 0.5 // £0.50 - £2.50
        });
      }

      paths.push({
        conversionId: `conv_${Date.now()}_${i}`,
        touchpoints,
        totalValue: Math.floor(Math.random() * 300) + 50, // £50-350
        timeToConversion: Math.floor(Math.random() * 168) + 1, // 1-168 hours (7 days)
        devicePath: touchpoints.map(t => t.device)
      });
    }

    return paths;
  }

  // Generate conversion window analysis
  private generateConversionWindows(actions: ConversionAction[]): ConversionWindow[] {
    return actions.map(action => ({
      actionId: action.id,
      clickWindow: action.clickThroughLookback,
      viewWindow: action.viewThroughLookback,
      conversionsInWindow: Math.floor(Math.random() * 20) + 5, // 5-25 conversions
      valueInWindow: Math.floor(Math.random() * 5000) + 500 // £500-5500
    }));
  }

  // Calculate sync efficiency metrics
  calculateSyncMetrics() {
    const recentSyncs = this.syncStatus.syncHistory.slice(0, 10);
    const successRate = (recentSyncs.filter(s => s.status === 'success').length / recentSyncs.length) * 100;
    const avgDuration = recentSyncs.reduce((sum, s) => sum + s.duration, 0) / recentSyncs.length;
    const totalRecords = recentSyncs.reduce((sum, s) => sum + s.recordsUpdated, 0);

    return {
      successRate: Math.round(successRate * 100) / 100,
      averageDuration: Math.round(avgDuration),
      totalRecordsLast10Syncs: totalRecords,
      lastErrorMessage: recentSyncs.find(s => s.status === 'error')?.errorMessage
    };
  }

  // Analyze conversion attribution
  analyzeConversionAttribution() {
    const tracking = this.generateConversionTracking();
    const deviceBreakdown = tracking.conversionPaths.reduce((acc, path) => {
      const primaryDevice = path.devicePath[path.devicePath.length - 1];
      acc[primaryDevice] = (acc[primaryDevice] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const attributionBreakdown = tracking.conversionPaths.reduce((acc, path) => {
      const touchpointCount = path.touchpoints.length;
      if (touchpointCount === 1) acc.direct += 1;
      else if (touchpointCount === 2) acc.assisted += 1;
      else acc.multiTouch += 1;
      return acc;
    }, { direct: 0, assisted: 0, multiTouch: 0 });

    return {
      deviceBreakdown,
      attributionBreakdown,
      averageTimeToConversion: tracking.conversionPaths.reduce((sum, p) => sum + p.timeToConversion, 0) / tracking.conversionPaths.length,
      averageTouchpoints: tracking.conversionPaths.reduce((sum, p) => sum + p.touchpoints.length, 0) / tracking.conversionPaths.length
    };
  }
}

// Singleton instance for the app
export const googleAdsSyncSimulator = new GoogleAdsSyncSimulator();
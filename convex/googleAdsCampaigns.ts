import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Helper function to get current user's token identifier
async function getCurrentUserToken(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

// Development mode flag
const DEVELOPMENT_MODE = process.env.NODE_ENV === 'development';

// Mock Google Ads API for development
const mockGoogleAdsAPI = {
  campaigns: {
    async create(campaignData: any) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('🔧 Mock Google Ads API: Creating campaign', campaignData.campaignName);

      return {
        success: true,
        campaignId: `gads_${Date.now()}`,
        status: 'PAUSED', // Always start paused in development
        resourceName: `customers/1234567890/campaigns/${Date.now()}`,
      };
    },

    async update(campaignId: string, updates: any) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('🔧 Mock Google Ads API: Updating campaign', campaignId, updates);

      return {
        success: true,
        campaignId,
        status: updates.status || 'PAUSED',
      };
    },

    async get(campaignId: string) {
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        campaignId,
        status: 'PAUSED',
        name: 'Mock Campaign',
        dailyBudget: 1000, // £10.00 in micros
        targetLocation: 'London, UK',
      };
    }
  }
};

// Create campaign draft in Google Ads
export const createGoogleAdsCampaign = action({
  args: {
    campaignId: v.string(), // ID from our campaigns table
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    googleCampaignId?: string;
    error?: string;
  }> => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      // Get the campaign data from our database
      const campaignData = await ctx.runQuery(api.campaigns.getCampaign, { userId });

      if (!campaignData) {
        throw new Error("Campaign not found");
      }

      // Check if user has connected Google Ads
      const isConnected = await ctx.runQuery(api.googleAds.isConnected, {});

      if (!isConnected && !DEVELOPMENT_MODE) {
        throw new Error("Google Ads account not connected");
      }

      let result;

      if (DEVELOPMENT_MODE) {
        // Use mock API in development
        result = await mockGoogleAdsAPI.campaigns.create({
          campaignName: campaignData.campaignName,
          dailyBudget: campaignData.dailyBudget * 1000000, // Convert to micros
          targetLocation: campaignData.targetLocation,
          adGroups: campaignData.adGroups,
          status: 'PAUSED', // Always start paused
        });
      } else {
        // Real Google Ads API call would go here
        // const googleAds = new GoogleAds({ ... });
        // result = await googleAds.campaigns.create({ ... });
        throw new Error("Production Google Ads integration not implemented yet");
      }

      if (result.success) {
        // Update our campaign record with Google Ads ID
        await ctx.runMutation(api.campaigns.updateCampaignStatus, {
          campaignId: args.campaignId,
          googleCampaignId: result.campaignId,
          status: 'pushed_to_google_ads',
        });

        return {
          success: true,
          googleCampaignId: result.campaignId,
        };
      } else {
        return {
          success: false,
          error: 'Failed to create campaign in Google Ads',
        };
      }

    } catch (error) {
      console.error('Failed to create Google Ads campaign:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
});

// Update campaign status in Google Ads
export const updateGoogleAdsCampaignStatus = action({
  args: {
    googleCampaignId: v.string(),
    status: v.union(v.literal('ENABLED'), v.literal('PAUSED')),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      if (DEVELOPMENT_MODE) {
        const result = await mockGoogleAdsAPI.campaigns.update(
          args.googleCampaignId,
          { status: args.status }
        );

        return result;
      } else {
        // Real Google Ads API call would go here
        throw new Error("Production Google Ads integration not implemented yet");
      }
    } catch (error) {
      console.error('Failed to update Google Ads campaign status:', error);
      throw error;
    }
  },
});

// Get campaign performance metrics from Google Ads
export const getGoogleAdsMetrics = action({
  args: {
    googleCampaignId: v.string(),
    dateRange: v.optional(v.object({
      startDate: v.string(),
      endDate: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      if (DEVELOPMENT_MODE) {
        // Return mock metrics
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
          campaignId: args.googleCampaignId,
          metrics: {
            impressions: Math.floor(Math.random() * 5000) + 1000,
            clicks: Math.floor(Math.random() * 200) + 50,
            cost: Math.floor(Math.random() * 10000) + 2000, // In pence
            conversions: Math.floor(Math.random() * 10) + 1,
            costPerClick: Math.floor(Math.random() * 300) + 50, // In pence
            clickThroughRate: (Math.random() * 5 + 1).toFixed(2) + '%',
            conversionRate: (Math.random() * 10 + 2).toFixed(2) + '%',
          },
          dateRange: {
            startDate: args.dateRange?.startDate || '2024-01-01',
            endDate: args.dateRange?.endDate || '2024-01-31',
          },
        };
      } else {
        // Real Google Ads API call would go here
        throw new Error("Production Google Ads integration not implemented yet");
      }
    } catch (error) {
      console.error('Failed to get Google Ads metrics:', error);
      throw error;
    }
  },
});

// List all campaigns from Google Ads account
export const listGoogleAdsCampaigns = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      if (DEVELOPMENT_MODE) {
        // Return mock campaign list
        await new Promise(resolve => setTimeout(resolve, 800));

        return {
          campaigns: [
            {
              id: 'gads_mock_1',
              name: 'Emergency Plumbing Services',
              status: 'PAUSED',
              dailyBudget: 15.00,
              clicks: 45,
              impressions: 1250,
              cost: 67.50,
            },
            {
              id: 'gads_mock_2',
              name: 'Electrical Installation Services',
              status: 'ENABLED',
              dailyBudget: 20.00,
              clicks: 32,
              impressions: 980,
              cost: 58.20,
            },
          ],
        };
      } else {
        // Real Google Ads API call would go here
        throw new Error("Production Google Ads integration not implemented yet");
      }
    } catch (error) {
      console.error('Failed to list Google Ads campaigns:', error);
      throw error;
    }
  },
});
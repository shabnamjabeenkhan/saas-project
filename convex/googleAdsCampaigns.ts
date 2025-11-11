"use node";

import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Helper function to get current user's token identifier
async function getCurrentUserToken(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

// Development mode flag
// const DEVELOPMENT_MODE = process.env.NODE_ENV === 'development';
const DEVELOPMENT_MODE = false;

// Google Ads REST API Client Configuration
async function getGoogleAdsAccessToken(ctx: any) {
  // Get tokens from database
  const tokens = await ctx.runQuery(api.googleAds.getTokens, {});

  if (!tokens) {
    throw new Error("Google Ads not connected");
  }

  // Check if token needs refresh
  if (tokens.isExpired && tokens.refreshToken) {
    await refreshGoogleAdsToken(ctx, tokens);
    // Get updated tokens
    const refreshedTokens = await ctx.runQuery(api.googleAds.getTokens, {});
    if (!refreshedTokens) {
      throw new Error("Failed to refresh Google Ads token");
    }
    return refreshedTokens.accessToken;
  }

  return tokens.accessToken;
}

// Helper function to refresh expired tokens
async function refreshGoogleAdsToken(ctx: any, tokens: any) {
  const refreshUrl = 'https://oauth2.googleapis.com/token';

  const params = new URLSearchParams({
    client_id: process.env.VITE_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: tokens.refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch(refreshUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const tokenData = await response.json();

  if (tokenData.error) {
    throw new Error(`Token refresh failed: ${tokenData.error_description || tokenData.error}`);
  }

  // Update tokens in database
  await ctx.runMutation(api.googleAds.saveTokens, {
    accessToken: tokenData.access_token,
    refreshToken: tokens.refreshToken, // Keep existing refresh token
    expiresAt: Date.now() + (tokenData.expires_in * 1000),
    scope: tokens.scope,
  });
}

// Mock Google Ads API for development
const mockGoogleAdsAPI = {
  campaigns: {
    async create(campaignData: any) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('🔧 Mock Google Ads API: Creating campaign', campaignData.campaignName);

      return {
        success: true,
        googleCampaignId: `gads_${Date.now()}`,
        status: 'PAUSED', // Always start paused in development
        resourceName: `customers/1234567890/campaigns/${Date.now()}`,
        budget: campaignData.dailyBudget / 1000000, // Convert back from micros
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
// Simple test function to verify module is working
export const testGoogleAdsConnection = action({
  args: {},
  handler: async (ctx, args) => {
    console.log('🧪 TEST FUNCTION CALLED - googleAds module is working!');
    return { success: true, message: "Test function working" };
  }
});

export const createGoogleAdsCampaign = action({
  args: {
    campaignId: v.string(), // ID from our campaigns table
  },
  handler: async (ctx, args) => {
    console.log('🎯🎯🎯 REAL FUNCTION CALLED - createGoogleAdsCampaign with args:', args);

    console.log('🔥 ABOUT TO RETURN TEST RESULT');

    // Quick test - just return success for now to see if function is called
    return {
      success: true,
      googleCampaignId: 'test-123',
      error: undefined
    };

    /*
    // Commented out the rest of the function for testing
    */
  }
});

/*
// Temporarily commented out the rest of the original function for debugging
*/

/*
    const userId = await getCurrentUserToken(ctx);
    console.log('👤 User ID:', userId);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      console.log('📊 Getting campaign data for ID:', args.campaignId);
      // Get the campaign data from our database
      const campaignData = await ctx.runQuery(api.campaigns.getCampaignById, { campaignId: args.campaignId });
      console.log('📊 Campaign data retrieved:', !!campaignData);

      if (!campaignData) {
        throw new Error("Campaign not found");
      }

      console.log('🔗 Checking Google Ads connection...');
      // Check if user has connected Google Ads
      const isConnected = await ctx.runQuery(api.googleAds.isConnected, {});
      console.log('🔗 Google Ads connected:', isConnected, 'DEVELOPMENT_MODE:', DEVELOPMENT_MODE);

      if (!isConnected && !DEVELOPMENT_MODE) {
        throw new Error("Google Ads account not connected");
      }

      let result;

      console.log('🌟 DEVELOPMENT_MODE check:', DEVELOPMENT_MODE);

      if (DEVELOPMENT_MODE) {
        console.log('🔧 Using mock API in development mode');
        // Use mock API in development
        result = await mockGoogleAdsAPI.campaigns.create({
          campaignName: campaignData.campaignName,
          dailyBudget: campaignData.dailyBudget * 1000000, // Convert to micros
          targetLocation: campaignData.targetLocation,
          adGroups: campaignData.adGroups,
          status: 'PAUSED', // Always start paused
        });
      } else {
        console.log('🚀 Using REAL Google Ads API');
        console.log('📋 Environment GOOGLE_ADS_MANAGER_ACCOUNT_ID:', process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID);

        // Real Google Ads REST API call
        const accessToken = await getGoogleAdsAccessToken(ctx);
        console.log('🔑 Access token received (first 20 chars):', accessToken?.substring(0, 20) + '...');
        const customerId = process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, '');
        console.log('👤 Customer ID after formatting:', customerId);

        // First, let's test if we can access the customer account
        console.log('🔍 Testing customer access...');
        const testResponse = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            'login-customer-id': process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, ''),
          },
        });
        console.log('🔍 Test response status:', testResponse.status);
        if (!testResponse.ok) {
          const testText = await testResponse.text();
          console.log('🔍 Test response error:', testText.substring(0, 200));
        }

        // Create campaign budget first via REST API
        console.log('💰 Creating budget with URL:', `https://googleads.googleapis.com/v17/customers/${customerId}/campaignBudgets:mutate`);
        const budgetResponse = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/campaignBudgets:mutate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            'login-customer-id': process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, ''),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operations: [{
              create: {
                name: `${campaignData.campaignName} Budget`,
                amountMicros: campaignData.dailyBudget * 1000000,
                deliveryMethod: 'STANDARD',
                type: 'DAILY'
              }
            }]
          })
        });

        console.log('Budget Response Status:', budgetResponse.status);
        console.log('Budget Response Headers:', budgetResponse.headers);

        const budgetText = await budgetResponse.text();
        console.log('Budget Response Text (first 500 chars):', budgetText.substring(0, 500));

        if (!budgetResponse.ok) {
          throw new Error(`Budget API Error: ${budgetResponse.status} - ${budgetText.substring(0, 200)}`);
        }

        let budgetData;
        try {
          budgetData = JSON.parse(budgetText);
        } catch (parseError) {
          throw new Error(`Invalid JSON response from Budget API: ${budgetText.substring(0, 200)}`);
        }

        if (!budgetData.results?.[0]?.resourceName) {
          throw new Error(`Failed to create campaign budget: ${JSON.stringify(budgetData)}`);
        }

        const budgetResourceName = budgetData.results[0].resourceName;

        // Create campaign via REST API
        const campaignResponse = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/campaigns:mutate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            'login-customer-id': process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, ''),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operations: [{
              create: {
                name: campaignData.campaignName,
                status: 'PAUSED',
                advertisingChannelType: 'SEARCH',
                campaignBudget: budgetResourceName,
                networkSettings: {
                  targetGoogleSearch: true,
                  targetSearchNetwork: true,
                  targetContentNetwork: false,
                  targetPartnerSearchNetwork: false,
                }
              }
            }]
          })
        });

        const campaignResponseData = await campaignResponse.json();
        if (!campaignResponseData.results?.[0]?.resourceName) {
          throw new Error('Failed to create campaign');
        }

        const campaignResourceName = campaignResponseData.results[0].resourceName;
        const campaignId = campaignResourceName.split('/').pop();

        result = {
          success: true,
          googleCampaignId: campaignId,
          status: 'PAUSED',
          resourceName: campaignResourceName,
          budget: campaignData.dailyBudget,
        };
      }

      if (result.success) {
        // Update our campaign record with Google Ads ID
        await ctx.runMutation(api.campaigns.updateCampaignStatus, {
          campaignId: args.campaignId,
          googleCampaignId: result.googleCampaignId,
          status: 'pushed_to_google_ads',
        });

        return {
          success: true,
          googleCampaignId: result.googleCampaignId,
          resourceName: result.resourceName,
          budget: result.budget,
          status: result.status,
        };
      } else {
        return {
          success: false,
          error: 'Failed to create campaign in Google Ads',
        };
      }

    } catch (error) {
      console.error('❌ DETAILED ERROR in createGoogleAdsCampaign:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        fullError: error
      });
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
        // Real Google Ads REST API call
        const accessToken = await getGoogleAdsAccessToken(ctx);
        const customerId = process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, '');

        const updateResponse = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/campaigns:mutate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operations: [{
              update: {
                resourceName: `customers/${customerId}/campaigns/${args.googleCampaignId}`,
                status: args.status
              },
              updateMask: 'status'
            }]
          })
        });

        const updateData = await updateResponse.json();
        if (!updateResponse.ok) {
          throw new Error(`Failed to update campaign: ${updateData.error?.message || 'Unknown error'}`);
        }

        return {
          success: true,
          campaignId: args.googleCampaignId,
          status: args.status,
        };
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
        // Real Google Ads REST API call for metrics
        const accessToken = await getGoogleAdsAccessToken(ctx);
        const customerId = process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, '');

        const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.average_cpc, metrics.ctr, metrics.conversions_from_interactions_rate FROM campaign WHERE campaign.id = ${args.googleCampaignId} AND segments.date DURING LAST_30_DAYS`;

        const reportResponse = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query
          })
        });

        const reportData = await reportResponse.json();
        if (!reportResponse.ok) {
          throw new Error(`Failed to get campaign metrics: ${reportData.error?.message || 'Unknown error'}`);
        }

        const results = reportData.results || [];
        if (results.length === 0) {
          throw new Error('Campaign not found');
        }

        // Aggregate metrics from multiple rows (daily data)
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalCost = 0;
        let totalConversions = 0;
        let totalInteractions = 0;

        results.forEach((row: any) => {
          const metrics = row.metrics || {};
          totalImpressions += parseInt(metrics.impressions || 0);
          totalClicks += parseInt(metrics.clicks || 0);
          totalCost += parseInt(metrics.costMicros || 0);
          totalConversions += parseFloat(metrics.conversions || 0);
          totalInteractions += parseInt(metrics.clicks || 0); // For CTR calculation
        });

        return {
          campaignId: args.googleCampaignId,
          metrics: {
            impressions: totalImpressions,
            clicks: totalClicks,
            cost: Math.round(totalCost / 10000), // Convert to pence
            conversions: totalConversions,
            costPerClick: totalClicks > 0 ? Math.round(totalCost / totalClicks / 100) : 0, // Convert to pence
            clickThroughRate: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0%',
            conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) + '%' : '0%',
          },
          dateRange: {
            startDate: args.dateRange?.startDate || '30 days ago',
            endDate: args.dateRange?.endDate || 'today',
          },
        };
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
        // Real Google Ads REST API call for listing campaigns
        const accessToken = await getGoogleAdsAccessToken(ctx);
        const customerId = process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, '');

        const query = `SELECT campaign.id, campaign.name, campaign.status, metrics.clicks, metrics.impressions, metrics.cost_micros FROM campaign WHERE segments.date DURING LAST_30_DAYS`;

        const reportResponse = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query
          })
        });

        const reportData = await reportResponse.json();
        if (!reportResponse.ok) {
          throw new Error(`Failed to list campaigns: ${reportData.error?.message || 'Unknown error'}`);
        }

        const results = reportData.results || [];

        // Group by campaign ID and aggregate metrics
        const campaignMap = new Map();

        results.forEach((row: any) => {
          const campaign = row.campaign || {};
          const metrics = row.metrics || {};
          const campaignId = campaign.id;

          if (campaignMap.has(campaignId)) {
            const existing = campaignMap.get(campaignId);
            existing.clicks += parseInt(metrics.clicks || 0);
            existing.impressions += parseInt(metrics.impressions || 0);
            existing.cost += parseInt(metrics.costMicros || 0);
          } else {
            campaignMap.set(campaignId, {
              id: campaignId,
              name: campaign.name || 'Unknown Campaign',
              status: campaign.status || 'UNKNOWN',
              clicks: parseInt(metrics.clicks || 0),
              impressions: parseInt(metrics.impressions || 0),
              cost: parseInt(metrics.costMicros || 0),
              dailyBudget: 0, // Would need separate query
            });
          }
        });

        const campaigns = Array.from(campaignMap.values()).map(campaign => ({
          ...campaign,
          cost: parseFloat((campaign.cost / 1000000).toFixed(2)), // Convert to pounds
        }));

        return { campaigns };
      }
    } catch (error) {
      console.error('Failed to list Google Ads campaigns:', error);
      throw error;
    }
  },
});*/

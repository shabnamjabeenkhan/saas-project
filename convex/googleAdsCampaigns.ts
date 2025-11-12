"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
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
async function getGoogleAdsAccessToken(ctx: any): Promise<string> {
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
  handler: async (_ctx, _args) => {
    console.log('🧪 TEST FUNCTION CALLED - googleAds module is working!');
    return { success: true, message: "Test function working" };
  }
});

export const createGoogleAdsCampaign = action({
  args: {
    campaignId: v.string(), // ID from our campaigns table
  },
  handler: async (ctx: any, args: { campaignId: string }): Promise<any> => {
    console.log('🎯🎯🎯 REAL FUNCTION CALLED - createGoogleAdsCampaign with args:', args);

    try {
      // Step 1: Get user authentication
      const userId = await getCurrentUserToken(ctx);
      console.log('👤 User ID:', userId);

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Step 2: Get campaign data
      const campaignData = await ctx.runQuery(api.campaigns.getCampaignById, { campaignId: args.campaignId });
      console.log('📊 Campaign data retrieved:', !!campaignData);

      if (!campaignData) {
        throw new Error("Campaign not found");
      }

      // Step 3: Check Google Ads connection
      const isConnected = await ctx.runQuery(api.googleAds.isConnected, {});
      console.log('🔗 Google Ads connected:', isConnected, 'DEVELOPMENT_MODE:', DEVELOPMENT_MODE);

      if (!isConnected && !DEVELOPMENT_MODE) {
        throw new Error("Google Ads account not connected");
      }

      // Step 4: Get access token and customer ID
      const accessToken = await getGoogleAdsAccessToken(ctx);
      console.log('🔑 Access token received (first 20 chars):', accessToken?.substring(0, 20) + '...');

      console.log('🏠 Environment variable GOOGLE_ADS_MANAGER_ACCOUNT_ID:', process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID);
      const customerId = process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, '');
      console.log('👤 Customer ID after formatting:', customerId);

      // First, let's check if this account can create campaigns or if it's a manager account
      console.log('🔍 Checking account type and available customer accounts...');

      const accountListResponse = await fetch(`https://googleads.googleapis.com/v22/customers:listAccessibleCustomers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        }
      });

      if (accountListResponse.ok) {
        const accountData = await accountListResponse.json();
        console.log('📋 Available customer accounts:', JSON.stringify(accountData, null, 2));
      } else {
        console.log('⚠️ Could not list accessible customers:', await accountListResponse.text());
      }

      // Step 5: Create campaign budget first
      console.log('💰 Creating budget for campaign:', campaignData.campaignName);

      const budgetRequestBody = {
        operations: [{
          create: {
            name: `${campaignData.campaignName} Budget ${Date.now()}`,
            amountMicros: campaignData.dailyBudget * 1000000, // Convert to micros
            deliveryMethod: 'STANDARD'
          }
        }]
      };

      console.log('💰 Budget request body:', JSON.stringify(budgetRequestBody, null, 2));

      const budgetResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/campaignBudgets:mutate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'login-customer-id': customerId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetRequestBody)
      });

      if (!budgetResponse.ok) {
        const budgetError = await budgetResponse.text();
        console.error('❌ Budget creation failed:', budgetError);
        throw new Error(`Budget creation failed: ${budgetResponse.status} - ${budgetError}`);
      }

      const budgetData = await budgetResponse.json();
      const budgetResourceName = budgetData.results[0].resourceName;
      console.log('✅ Budget created:', budgetResourceName);

      // Step 6: Create the campaign
      console.log('🏗️ Creating campaign in Google Ads');

      const requestBody = {
        operations: [{
          create: {
            name: campaignData.campaignName,
            status: 'PAUSED',
            advertisingChannelType: 'SEARCH',
            campaignBudget: budgetResourceName,
            manualCpc: {},
            containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING"
          }
        }]
      };

      console.log('📤 Request body being sent:', JSON.stringify(requestBody, null, 2));

      const campaignResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/campaigns:mutate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'login-customer-id': customerId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!campaignResponse.ok) {
        const campaignError = await campaignResponse.text();
        console.error('❌ Campaign creation failed:', campaignError);
        throw new Error(`Campaign creation failed: ${campaignResponse.status} - ${campaignError}`);
      }

      const campaignResponseData = await campaignResponse.json();
      const campaignResourceName = campaignResponseData.results[0].resourceName;
      const googleCampaignId = campaignResourceName.split('/').pop();

      console.log('✅ Campaign created successfully:', {
        googleCampaignId,
        resourceName: campaignResourceName
      });

      return {
        success: true,
        googleCampaignId,
        resourceName: campaignResourceName,
        error: undefined
      };

    } catch (error) {
      console.error('❌ Error in createGoogleAdsCampaign:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
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

        const updateResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/campaigns:mutate`, {
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

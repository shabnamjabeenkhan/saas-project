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

    const results = {
      campaignCreated: false,
      adGroupsCreated: 0,
      adsCreated: 0,
      extensionsCreated: 0,
      errors: [] as string[]
    };

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
      console.log('📊 Ad groups in campaign:', campaignData?.adGroups?.length || 0);

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
      results.campaignCreated = true;

      // Step 7: Create Ad Groups
      console.log('🎯 Creating ad groups...');
      const adGroupResourceNames: string[] = [];

      for (let i = 0; i < campaignData.adGroups.length; i++) {
        const adGroup = campaignData.adGroups[i];
        console.log(`🎯 Creating ad group ${i + 1}/${campaignData.adGroups.length}: ${adGroup.name}`);

        try {
          const adGroupRequestBody = {
            operations: [{
              create: {
                name: adGroup.name,
                campaign: campaignResourceName,
                status: 'ENABLED',
                type: 'SEARCH_STANDARD',
                cpcBidMicros: 1000000 // £1.00 default bid in micros
              }
            }]
          };

          const adGroupResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/adGroups:mutate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adGroupRequestBody)
          });

          if (!adGroupResponse.ok) {
            const adGroupError = await adGroupResponse.text();
            console.error(`❌ Ad group ${adGroup.name} creation failed:`, adGroupError);
            results.errors.push(`Ad group "${adGroup.name}" creation failed`);
            continue;
          }

          const adGroupData = await adGroupResponse.json();
          const adGroupResourceName = adGroupData.results[0].resourceName;
          adGroupResourceNames.push(adGroupResourceName);
          results.adGroupsCreated++;

          console.log(`✅ Ad group created: ${adGroup.name} -> ${adGroupResourceName}`);

          // Step 8: Add keywords to the ad group
          console.log(`🔑 Adding ${adGroup.keywords.length} keywords to ${adGroup.name}...`);

          const keywordOperations = adGroup.keywords.map((keyword: string) => ({
            create: {
              adGroup: adGroupResourceName,
              status: 'ENABLED',
              keyword: {
                text: keyword,
                matchType: 'BROAD'
              },
              cpcBidMicros: 1000000 // £1.00 default bid
            }
          }));

          const keywordRequestBody = {
            operations: keywordOperations
          };

          const keywordResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/adGroupCriteria:mutate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(keywordRequestBody)
          });

          if (!keywordResponse.ok) {
            const keywordError = await keywordResponse.text();
            console.error(`❌ Keywords for ${adGroup.name} failed:`, keywordError);
            results.errors.push(`Keywords for "${adGroup.name}" creation failed`);
          } else {
            console.log(`✅ Added ${adGroup.keywords.length} keywords to ${adGroup.name}`);
          }

          // Step 9: Create ads in the ad group
          console.log(`📝 Creating ads for ${adGroup.name}...`);

          const adOperations = [];
          const headlines = adGroup.adCopy.headlines.slice(0, 3); // Max 3 headlines
          const descriptions = adGroup.adCopy.descriptions.slice(0, 2); // Max 2 descriptions

          adOperations.push({
            create: {
              adGroup: adGroupResourceName,
              status: 'ENABLED',
              ad: {
                type: 'RESPONSIVE_SEARCH_AD',
                finalUrls: [adGroup.adCopy.finalUrl || 'https://example.com'],
                responsiveSearchAd: {
                  headlines: headlines.map((headline: string) => ({
                    text: headline.substring(0, 30) // Ensure max 30 chars
                  })),
                  descriptions: descriptions.map((description: string) => ({
                    text: description.substring(0, 90) // Ensure max 90 chars
                  }))
                }
              }
            }
          });

          const adRequestBody = {
            operations: adOperations
          };

          console.log(`📋 Ad request body for ${adGroup.name}:`, JSON.stringify(adRequestBody, null, 2));

          const adResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/adGroupAds:mutate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adRequestBody)
          });

          if (!adResponse.ok) {
            const adError = await adResponse.text();
            console.error(`❌ Ad creation for ${adGroup.name} failed with status ${adResponse.status}:`, adError);

            // Parse and log detailed Google Ads API error
            try {
              const errorDetails = JSON.parse(adError);
              console.error(`🔍 Google Ads API Error Details for ${adGroup.name}:`, {
                status: adResponse.status,
                statusText: adResponse.statusText,
                error: errorDetails.error,
                details: errorDetails.details || errorDetails.message || errorDetails
              });
              results.errors.push(`Ad creation for "${adGroup.name}" failed: ${errorDetails.error?.message || errorDetails.message || 'API Error'}`);
            } catch (parseError) {
              console.error(`🔍 Raw Google Ads API Error for ${adGroup.name}:`, adError);
              results.errors.push(`Ad creation for "${adGroup.name}" failed: ${adError.substring(0, 100)}`);
            }
          } else {
            const adData = await adResponse.json();
            results.adsCreated++;
            console.log(`✅ Created ad for ${adGroup.name}:`, adData.results?.[0]?.resourceName || 'Success');
          }

        } catch (adGroupError) {
          console.error(`❌ Error processing ad group ${adGroup.name}:`, adGroupError);
          results.errors.push(`Ad group "${adGroup.name}" processing failed: ${adGroupError}`);
        }
      }

      // Step 10: Create call extensions
      const phoneNumber = campaignData.businessInfo?.phone;
      if (phoneNumber) {
        console.log('📞 Creating call extensions with phone:', phoneNumber);

        try {
          // First create the call asset
          const callAssetRequestBody = {
            operations: [{
              create: {
                type: 'CALL',
                callAsset: {
                  phoneNumber: phoneNumber,
                  countryCode: 'GB',
                  callConversionReportingState: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION'
                }
              }
            }]
          };

          const assetResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/assets:mutate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(callAssetRequestBody)
          });

          if (!assetResponse.ok) {
            const assetError = await assetResponse.text();
            console.error(`❌ Call asset creation failed:`, assetError);
            results.errors.push(`Call asset creation failed: ${assetError.substring(0, 100)}`);
            return;
          }

          const assetData = await assetResponse.json();
          const assetResourceName = assetData.results[0].resourceName;
          console.log('✅ Call asset created:', assetResourceName);

          // Then link the asset to the campaign
          const campaignAssetRequestBody = {
            operations: [{
              create: {
                asset: assetResourceName,
                campaign: campaignResourceName,
                fieldType: 'CALL'
              }
            }]
          };

          const extensionResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/campaignAssets:mutate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(campaignAssetRequestBody)
          });

          if (!extensionResponse.ok) {
            const extensionError = await extensionResponse.text();
            console.error(`❌ Campaign asset linking failed with status ${extensionResponse.status}:`, extensionError);

            // Parse and log detailed Google Ads API error
            try {
              const errorDetails = JSON.parse(extensionError);
              console.error(`🔍 Google Ads API Error Details for campaign asset linking:`, {
                status: extensionResponse.status,
                statusText: extensionResponse.statusText,
                error: errorDetails.error,
                details: errorDetails.details || errorDetails.message || errorDetails
              });
              results.errors.push(`Campaign asset linking failed: ${errorDetails.error?.message || errorDetails.message || 'API Error'}`);
            } catch (parseError) {
              console.error(`🔍 Raw Google Ads API Error for campaign asset linking:`, extensionError);
              results.errors.push(`Campaign asset linking failed: ${extensionError.substring(0, 100)}`);
            }
          } else {
            const extensionData = await extensionResponse.json();
            results.extensionsCreated++;
            console.log('✅ Call extension linked to campaign successfully:', extensionData.results?.[0]?.resourceName || 'Success');
          }

        } catch (extensionError) {
          console.error('❌ Error creating call extension:', extensionError);
          results.errors.push(`Call extension error: ${extensionError}`);
        }
      }

      // Final validation
      const success = results.campaignCreated && results.adGroupsCreated > 0 && results.adsCreated > 0;

      console.log('📊 Campaign creation summary:', {
        success,
        campaignCreated: results.campaignCreated,
        adGroupsCreated: results.adGroupsCreated,
        adsCreated: results.adsCreated,
        extensionsCreated: results.extensionsCreated,
        errors: results.errors
      });

      if (!success) {
        throw new Error(`Incomplete campaign creation: ${results.errors.join(', ')}`);
      }

      return {
        success: true,
        googleCampaignId,
        resourceName: campaignResourceName,
        adGroupsCreated: results.adGroupsCreated,
        adsCreated: results.adsCreated,
        extensionsCreated: results.extensionsCreated,
        error: undefined
      };

    } catch (error) {
      console.error('❌ Error in createGoogleAdsCampaign:', error);
      console.error('📊 Partial results:', results);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        partialResults: results
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

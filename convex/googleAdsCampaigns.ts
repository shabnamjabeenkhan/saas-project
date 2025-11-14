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
    console.log('🔥🔥🔥 HANDLER ENTRY - This MUST appear if function called');
    console.log('🔥🔥🔥 Arguments received:', JSON.stringify(args));
    console.log('🔥🔥🔥 Context exists:', !!ctx);

    const results = {
      campaignCreated: false,
      adGroupsCreated: 0,
      adsCreated: 0,
      extensionsCreated: 0,
      errors: [] as string[]
    };

    try {
      console.log('🚨🚨🚨 TRY BLOCK ENTERED - Function execution started');
      console.log('🚨🚨🚨 This log MUST appear if function is executing');

      // Step 1: Get user authentication
      const userId = await getCurrentUserToken(ctx);
      console.log('🚨🚨🚨 User authentication completed:', !!userId);

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Step 2: Get campaign data
      console.log('🚀 DEBUG: Fetching campaign data from database...');
      const campaignData = await ctx.runQuery(api.campaigns.getCampaignById, { campaignId: args.campaignId });
      console.log('📊 Campaign data retrieved:', !!campaignData);
      console.log('📊 Ad groups in campaign:', campaignData?.adGroups?.length || 0);
      console.log('📞 Phone number in campaign data:', campaignData?.businessInfo?.phone || 'NOT FOUND');

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
            name: `${campaignData.campaignName} ${Date.now()}`, // Add timestamp to prevent duplicates
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
      // 🔧 FIX: Get phone from fresh onboarding data instead of stale campaign data
      const freshOnboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
      const phoneNumber = freshOnboardingData?.phone || campaignData.businessInfo?.phone;
      console.log('📞 Attempting call extension creation...');
      console.log('📞 Fresh onboarding phone:', freshOnboardingData?.phone || 'NOT FOUND');
      console.log('📞 Fallback campaign phone:', campaignData.businessInfo?.phone || 'NOT FOUND');
      console.log('📞 Using phone number:', phoneNumber || 'UNDEFINED/NULL');

      // 🔍 ENHANCED PHONE TRACKING: Log phone consistency across all ad groups
      console.log('🔍 PHONE CONSISTENCY CHECK:');
      if (campaignData.adGroups && Array.isArray(campaignData.adGroups)) {
        campaignData.adGroups.forEach((adGroup: any, index: number) => {
          console.log(`  Ad Group ${index + 1} (${adGroup.name}): Using campaign phone ${phoneNumber}`);
          console.log(`  Final URL: ${adGroup.adCopy?.finalUrl || 'MISSING'}`);
        });
      }
      console.log('🔍 Call extensions will use phone:', phoneNumber);

      // 🔍 VALIDATION: Confirm we're using the correct phone number
      if (freshOnboardingData?.phone && campaignData.businessInfo?.phone &&
          freshOnboardingData.phone !== campaignData.businessInfo.phone) {
        console.warn('⚠️ Phone mismatch detected - using fresh onboarding data');
        console.warn('  Onboarding phone (using):', freshOnboardingData.phone);
        console.warn('  Campaign phone (stale):', campaignData.businessInfo.phone);
      }

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

      console.log('🔄 Campaign creation completed, now proceeding to ad groups...');

      // CRITICAL DEBUGGING - Show what we actually have in campaign data
      console.log('🔍 CAMPAIGN DATA INSPECTION:', {
        hasCampaignData: !!campaignData,
        campaignKeys: campaignData ? Object.keys(campaignData) : 'No campaignData',
        hasAdGroups: !!campaignData?.adGroups,
        adGroupsLength: campaignData?.adGroups?.length || 0,
        adGroupsType: typeof campaignData?.adGroups,
        campaignName: campaignData?.campaignName
      });

      // Log first few characters of campaign data to see structure
      if (campaignData) {
        console.log('🔍 Campaign data sample:', JSON.stringify(campaignData).substring(0, 500) + '...');
      }

      // Step 7: Create Ad Groups with Keywords and Ads
      console.log('🎯 About to create ad groups, keywords, and ads...');

      // Critical validation with proper error handling
      if (!campaignData?.adGroups || campaignData.adGroups.length === 0) {
        console.error('🚨 FATAL: Campaign has no ad groups - cannot create ads/keywords!');
        console.error('🚨 FATAL: This explains missing titles, descriptions, phone numbers!');
        console.error('🚨 FATAL: Campaign structure:', {
          hasData: !!campaignData,
          hasAdGroups: !!campaignData?.adGroups,
          adGroupsLength: campaignData?.adGroups?.length || 0,
          availableKeys: campaignData ? Object.keys(campaignData) : []
        });
        return {
          success: false, // FIX: Return failure when no ad content can be created
          error: 'Campaign missing ad groups - no ads/keywords can be created',
          googleCampaignId: undefined,
          resourceName: undefined
        };
      }

      console.log('✅ Campaign data validation passed:', {
        adGroupsCount: campaignData.adGroups.length,
        adGroupNames: campaignData.adGroups.map((ag: any) => ag.name)
      });

      // Process ad groups with comprehensive tracking
      try {
        console.log('🎯 DEBUG: Starting ad groups, keywords, and ads creation...');
        console.log('🎯 DEBUG: Will process', campaignData.adGroups.length, 'ad groups');

        await createAdGroupsWithAdsAndKeywords(campaignData, customerId, accessToken, campaignResourceName);

        console.log('✅ DEBUG: Ad groups creation process completed');
      } catch (error) {
        console.error('🚨 FATAL: Ad groups creation failed completely:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack?.substring(0, 300) : 'No stack'
        });
        return {
          success: false,
          error: `Ad groups creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          googleCampaignId,
          resourceName: campaignResourceName
        };
      }

      // Step 8: Create Ad Extensions
      try {
        console.log('📱 Creating ad extensions...');
        await createAdExtensions(campaignData, customerId, accessToken, campaignResourceName);
        console.log('✅ Ad extensions completed');
      } catch (error) {
        console.error('❌ Ad extensions failed:', error instanceof Error ? error.message : String(error));
        // Continue - extensions are not critical
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

// Helper function to create ad groups with keywords and ads
async function createAdGroupsWithAdsAndKeywords(
  campaignData: any,
  customerId: string,
  accessToken: string,
  campaignResourceName: string
) {
  console.log('🚀🚀 ENTERING createAdGroupsWithAdsAndKeywords function');
  console.log('🚀🚀 Function called at:', new Date().toISOString());

  // Validate parameters immediately
  if (!campaignData) {
    console.error('🚨 FATAL: No campaign data provided to function');
    throw new Error('No campaign data provided');
  }

  if (!campaignData.adGroups || !Array.isArray(campaignData.adGroups)) {
    console.error('🚨 FATAL: Campaign data has no valid adGroups array:', {
      hasAdGroups: !!campaignData.adGroups,
      adGroupsType: typeof campaignData.adGroups,
      isArray: Array.isArray(campaignData.adGroups)
    });
    throw new Error('Invalid ad groups data structure');
  }

  if (!campaignData.adGroups || campaignData.adGroups.length === 0) {
    console.log('⚠️ No ad groups to create - campaign data missing ad groups');
    console.log('⚠️ Available campaign data keys:', Object.keys(campaignData));
    return;
  }

  console.log('🚀🚀 CONFIRMED: Processing', campaignData.adGroups.length, 'ad groups');

  // Log each ad group's structure before processing
  campaignData.adGroups.forEach((adGroup: any, index: number) => {
    console.log(`🔍 Ad Group ${index + 1} structure:`, {
      name: adGroup.name,
      hasKeywords: !!adGroup.keywords,
      keywordsCount: adGroup.keywords?.length || 0,
      hasAdCopy: !!adGroup.adCopy,
      hasHeadlines: !!adGroup.adCopy?.headlines,
      headlinesCount: adGroup.adCopy?.headlines?.length || 0,
      hasDescriptions: !!adGroup.adCopy?.descriptions,
      descriptionsCount: adGroup.adCopy?.descriptions?.length || 0,
      finalUrl: adGroup.adCopy?.finalUrl || 'MISSING'
    });
  });

  for (let i = 0; i < campaignData.adGroups.length; i++) {
    const adGroup = campaignData.adGroups[i];
    console.log(`🎯🎯 PROCESSING Ad Group ${i + 1}/${campaignData.adGroups.length}: ${adGroup.name}`);

    try {
      // Create Ad Group
      console.log('📡 Creating ad group via API...');
      const adGroupResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/adGroups:mutate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'login-customer-id': customerId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations: [{
            create: {
              name: adGroup.name || 'Default Ad Group',
              campaign: campaignResourceName,
              status: 'ENABLED',
              type: 'SEARCH_STANDARD',
              cpcBidMicros: 1000000 // £1.00 default bid
            }
          }]
        })
      });

      if (!adGroupResponse.ok) {
        const error = await adGroupResponse.text();
        console.error('❌ Ad group creation failed:', {
          status: adGroupResponse.status,
          statusText: adGroupResponse.statusText,
          error: error,
          adGroupName: adGroup.name
        });
        continue;
      }

      const adGroupData = await adGroupResponse.json();
      const adGroupResourceName = adGroupData.results[0].resourceName;
      console.log('✅ Ad group created successfully:', {
        name: adGroup.name,
        resourceName: adGroupResourceName,
        adGroupData: JSON.stringify(adGroupData, null, 2)
      });

      // Create Keywords for this ad group
      if (adGroup.keywords && adGroup.keywords.length > 0) {
        await createKeywords(adGroup.keywords, customerId, accessToken, adGroupResourceName);
      }

      // Create Responsive Search Ad for this ad group
      if (adGroup.adCopy) {
        await createResponsiveSearchAd(adGroup.adCopy, customerId, accessToken, adGroupResourceName);
      }

    } catch (error) {
      console.error(`❌ Error creating ad group ${adGroup.name}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        adGroupName: adGroup.name,
        adGroupData: JSON.stringify(adGroup, null, 2)
      });
    }
  }
}

// Helper function to create keywords
async function createKeywords(
  keywords: string[],
  customerId: string,
  accessToken: string,
  adGroupResourceName: string
) {
  console.log('🔑 Creating keywords for ad group:', {
    keywords: keywords,
    keywordCount: keywords.length,
    customerId: customerId,
    adGroupResourceName: adGroupResourceName
  });

  const keywordOperations = keywords.slice(0, 10).map(keyword => ({ // Limit to 10 keywords
    create: {
      adGroup: adGroupResourceName,
      status: 'ENABLED',
      keyword: {
        text: keyword,
        matchType: 'BROAD' // Can be EXACT, PHRASE, or BROAD
      },
      cpcBidMicros: 1500000 // £1.50 keyword bid
    }
  }));

  const keywordResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/adGroupCriteria:mutate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      'login-customer-id': customerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operations: keywordOperations
    })
  });

  if (keywordResponse.ok) {
    const keywordData = await keywordResponse.json();
    console.log('✅ Keywords created successfully:', {
      keywordCount: keywords.length,
      responseData: JSON.stringify(keywordData, null, 2)
    });
  } else {
    const error = await keywordResponse.text();
    console.error('❌ Keywords creation failed:', {
      status: keywordResponse.status,
      statusText: keywordResponse.statusText,
      error: error,
      keywordOperations: JSON.stringify(keywordOperations, null, 2)
    });
  }
}

// Helper function to create responsive search ad
async function createResponsiveSearchAd(
  adCopy: any,
  customerId: string,
  accessToken: string,
  adGroupResourceName: string
) {
  console.log('📝 Creating Responsive Search Ad for ad group:', {
    adGroupResourceName,
    hasAdCopy: !!adCopy,
    headlines: adCopy?.headlines,
    descriptions: adCopy?.descriptions,
    finalUrl: adCopy?.finalUrl
  });

  const headlines = adCopy.headlines?.slice(0, 15) || ['Your Business Name']; // Max 15 headlines
  const descriptions = adCopy.descriptions?.slice(0, 4) || ['Quality service you can trust']; // Max 4 descriptions

  const adResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/adGroupAds:mutate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      'login-customer-id': customerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operations: [{
        create: {
          adGroup: adGroupResourceName,
          status: 'ENABLED',
          ad: {
            responsiveSearchAd: {
              headlines: headlines.map((headline: string) => ({
                text: headline.substring(0, 30) // Max 30 chars per headline
              })),
              descriptions: descriptions.map((description: string) => ({
                text: description.substring(0, 90) // Max 90 chars per description
              })),
              finalUrls: [adCopy.finalUrl || 'https://example.com']
            }
          }
        }
      }]
    })
  });

  if (adResponse.ok) {
    const adData = await adResponse.json();
    console.log('✅ Responsive Search Ad created successfully:', {
      adGroupResourceName,
      responseData: JSON.stringify(adData, null, 2)
    });
  } else {
    const error = await adResponse.text();
    console.error('❌ Ad creation failed:', {
      status: adResponse.status,
      statusText: adResponse.statusText,
      error: error,
      adGroupResourceName,
      requestBody: {
        headlines: headlines.map((h: string) => h.substring(0, 30)),
        descriptions: descriptions.map((d: string) => d.substring(0, 90)),
        finalUrl: adCopy?.finalUrl || 'https://example.com'
      }
    });
  }
}

// Helper function to create ad extensions
async function createAdExtensions(
  campaignData: any,
  customerId: string,
  accessToken: string,
  campaignResourceName: string
) {
  try {
    // Create Call Extension (Phone Number)
    if (campaignData.businessInfo?.phone) {
      await createCallExtension(campaignData.businessInfo.phone, customerId, accessToken, campaignResourceName);
    }

    // Create Sitelink Extensions (if available)
    if (campaignData.sitelinkExtensions && campaignData.sitelinkExtensions.length > 0) {
      await createSitelinkExtensions(campaignData.sitelinkExtensions, customerId, accessToken, campaignResourceName);
    }

  } catch (error) {
    console.error('❌ Error creating ad extensions:', error);
  }
}

// Helper function to create call extension
async function createCallExtension(
  phoneNumber: string,
  customerId: string,
  accessToken: string,
  campaignResourceName: string
) {
  const callExtensionResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/campaignExtensionSettings:mutate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      'login-customer-id': customerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operations: [{
        create: {
          campaign: campaignResourceName,
          extensionType: 'CALL',
          extensionSetting: {
            extensions: [{
              callExtension: {
                phoneNumber: phoneNumber,
                countryCode: 'GB',
                callOnly: false
              }
            }]
          }
        }
      }]
    })
  });

  if (callExtensionResponse.ok) {
    console.log('✅ Call extension created:', phoneNumber);
  } else {
    const error = await callExtensionResponse.text();
    console.error('❌ Call extension creation failed:', error);
  }
}

// Helper function to create sitelink extensions
async function createSitelinkExtensions(
  sitelinks: any[],
  customerId: string,
  accessToken: string,
  campaignResourceName: string
) {
  const sitelinkOperations = sitelinks.slice(0, 6).map(sitelink => ({ // Max 6 sitelinks
    create: {
      campaign: campaignResourceName,
      extensionType: 'SITELINK',
      extensionSetting: {
        extensions: [{
          sitelinkExtension: {
            linkText: sitelink.text?.substring(0, 25) || 'Learn More',
            finalUrls: [sitelink.url || 'https://example.com']
          }
        }]
      }
    }
  }));

  for (const operation of sitelinkOperations) {
    const sitelinkResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/campaignExtensionSettings:mutate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        'login-customer-id': customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operations: [operation]
      })
    });

    if (!sitelinkResponse.ok) {
      const error = await sitelinkResponse.text();
      console.error('❌ Sitelink creation failed:', error);
    }
  }

  console.log('✅ Sitelink extensions created');
}

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

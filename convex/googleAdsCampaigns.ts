"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { GoogleAdsApi, Customer } from "google-ads-api";

// Helper function to get current user's token identifier
async function getCurrentUserToken(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

// Helper function to validate URL accessibility
async function validateUrl(url: string): Promise<{
  isValid: boolean;
  error?: string;
  dnsError?: string;
}> {
  // Check for placeholder URLs
  const placeholderUrls = [
    'https://example.com',
    'https://www.example.com',
    'http://example.com',
    'https://yoursite.com',
    'https://www.yoursite.com',
    'https://yourwebsite.com',
    'https://www.yourwebsite.com'
  ];
  
  const normalizedUrl = url.toLowerCase().trim();
  if (placeholderUrls.some(placeholder => normalizedUrl.includes(placeholder.replace('https://', '').replace('http://', '')))) {
    return {
      isValid: false,
      error: 'Placeholder URL detected',
      dnsError: 'PLACEHOLDER_URL'
    };
  }
  
  try {
    // Extract hostname from URL
    let hostname: string;
    try {
      const urlObj = new URL(url);
      hostname = urlObj.hostname;
    } catch (urlError) {
      return {
        isValid: false,
        error: 'Invalid URL format',
        dnsError: 'INVALID_FORMAT'
      };
    }
    
    // Try to resolve DNS using a HEAD request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URL-Validator/1.0)'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Check if response is successful (2xx or 3xx)
      if (response.status >= 200 && response.status < 400) {
        return { isValid: true };
      } else {
        return {
          isValid: false,
          error: `URL returned status ${response.status}`,
          dnsError: 'HTTP_ERROR'
        };
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Log full error details for debugging
      console.error('🔍 URL validation fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        code: fetchError.code,
        cause: fetchError.cause,
        stack: fetchError.stack?.substring(0, 200)
      });
      
      // Check for DNS errors
      if (fetchError.name === 'AbortError') {
        return {
          isValid: false,
          error: 'URL validation timeout - URL may not be accessible',
          dnsError: 'TIMEOUT'
        };
      }
      
      // Check for DNS resolution errors
      const errorMessage = fetchError.message?.toLowerCase() || '';
      const errorCode = fetchError.code?.toLowerCase() || '';
      
      if (errorMessage.includes('getaddrinfo') || 
          errorMessage.includes('enotfound') ||
          errorMessage.includes('hostname not found') ||
          errorMessage.includes('dns') ||
          errorCode === 'enotfound' ||
          errorMessage.includes('name resolution') ||
          errorMessage.includes('failed to resolve')) {
        return {
          isValid: false,
          error: 'DNS resolution failed - domain not found',
          dnsError: 'HOSTNAME_NOT_FOUND'
        };
      }
      
      // Check for connection errors
      if (errorMessage.includes('econnrefused') ||
          errorCode === 'econnrefused' ||
          errorMessage.includes('connection refused')) {
        return {
          isValid: false,
          error: 'Connection refused - URL may not be accessible',
          dnsError: 'CONNECTION_REFUSED'
        };
      }
      
      // Check for network errors
      if (errorMessage.includes('network') ||
          errorMessage.includes('fetch failed') ||
          errorMessage.includes('econnreset') ||
          errorCode === 'econnreset') {
        // In Convex, network restrictions might cause fetch to fail
        // For now, we'll allow the URL through but log a warning
        // Google Ads will catch invalid URLs anyway
        console.warn(`⚠️ URL validation fetch failed (network issue?), allowing URL through: ${url}`);
        console.warn(`   Error: ${fetchError.message || 'Unknown network error'}`);
        return {
          isValid: true, // Allow through - Google Ads will validate
          error: undefined,
          dnsError: undefined
        };
      }
      
      // For other errors, log but allow through (Google Ads will catch invalid URLs)
      console.warn(`⚠️ URL validation encountered error, allowing URL through: ${url}`);
      console.warn(`   Error: ${fetchError.message || 'Unknown error'}`);
      return {
        isValid: true, // Allow through - Google Ads will validate
        error: undefined,
        dnsError: undefined
      };
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: `URL validation error: ${error.message || 'Unknown error'}`,
      dnsError: 'VALIDATION_ERROR'
    };
  }
}

// Helper function to parse Google Ads API errors and extract policy violation details
function parseGoogleAdsError(errorText: string): {
  message: string;
  isPolicyViolation: boolean;
  policyDetails?: {
    topic: string;
    type: string;
    reason: string;
    url?: string;
  }[];
} {
  try {
    const errorDetails = JSON.parse(errorText);
    const error = errorDetails.error || errorDetails;
    
    // Check if this is a policy violation
    const details = error.details || [];
    const policyViolations: {
      topic: string;
      type: string;
      reason: string;
      url?: string;
    }[] = [];
    
    for (const detail of details) {
      if (detail['@type'] === 'type.googleapis.com/google.ads.googleads.v22.errors.GoogleAdsFailure') {
        const errors = detail.errors || [];
        
        for (const err of errors) {
          // Check for policy finding errors
          if (err.errorCode?.policyFindingError === 'POLICY_FINDING') {
            const policyDetails = err.details?.policyFindingDetails;
            
            if (policyDetails?.policyTopicEntries) {
              for (const entry of policyDetails.policyTopicEntries) {
                const topic = entry.topic || 'UNKNOWN_POLICY_VIOLATION';
                const type = entry.type || 'UNKNOWN';
                
                // Extract specific violation reason
                let reason = '';
                let url = '';
                
                if (entry.evidences && entry.evidences.length > 0) {
                  const evidence = entry.evidences[0];
                  
                  // Check for destination not working
                  if (evidence.destinationNotWorking) {
                    const destError = evidence.destinationNotWorking;
                    reason = `Destination URL not working: ${destError.dnsErrorType || 'DNS_ERROR'}`;
                    url = destError.expandedUrl || '';
                  }
                  // Check for other policy violations
                  else if (evidence.textList) {
                    reason = `Policy violation: ${evidence.textList.texts?.join(', ') || 'See policy details'}`;
                  }
                  else {
                    reason = `Policy violation: ${topic}`;
                  }
                } else {
                  reason = `Policy violation: ${topic}`;
                }
                
                policyViolations.push({
                  topic,
                  type,
                  reason,
                  url: url || undefined
                });
              }
            }
          }
        }
      }
    }
    
    // If we found policy violations, return detailed message
    if (policyViolations.length > 0) {
      const violationMessages = policyViolations.map(v => {
        if (v.url) {
          return `${v.reason} (URL: ${v.url})`;
        }
        return v.reason;
      });
      
      return {
        message: `Policy violation: ${violationMessages.join('; ')}`,
        isPolicyViolation: true,
        policyDetails: policyViolations
      };
    }
    
    // Otherwise return generic error message
    return {
      message: error.message || errorDetails.message || 'Unknown API error',
      isPolicyViolation: false
    };
    
  } catch (parseError) {
    // If parsing fails, return raw error text
    return {
      message: errorText.substring(0, 200),
      isPolicyViolation: false
    };
  }
}

// Development mode flag
// const DEVELOPMENT_MODE = process.env.NODE_ENV === 'development';
const DEVELOPMENT_MODE = false;

// Google Ads SDK Client Configuration
async function getGoogleAdsClient(ctx: any): Promise<Customer> {
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
  }

  // Initialize Google Ads API client
  const client = new GoogleAdsApi({
    client_id: process.env.VITE_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  });

  // Get customer ID
  const customerId = process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, '');

  // Create customer instance with refresh token
  const customer = client.Customer({
    customer_id: customerId,
    refresh_token: tokens.refreshToken || tokens.accessToken, // SDK handles refresh automatically
  });

  return customer;
}

// Legacy function for backward compatibility (kept for token refresh logic)
async function getGoogleAdsAccessToken(ctx: any): Promise<string> {
  const tokens = await ctx.runQuery(api.googleAds.getTokens, {});
  if (!tokens) {
    throw new Error("Google Ads not connected");
  }
  if (tokens.isExpired && tokens.refreshToken) {
    await refreshGoogleAdsToken(ctx, tokens);
    const refreshedTokens = await ctx.runQuery(api.googleAds.getTokens, {});
    if (!refreshedTokens) {
      throw new Error("Failed to refresh Google Ads token");
    }
    return refreshedTokens.accessToken;
  }
  return tokens.accessToken;
}

// 🔒 SECURITY: Shared phone number sanitization function
function sanitizePhoneNumbersFromText(text: string): string {
  // Remove UK phone numbers in various formats (including spaced numbers)
  return text
    // First normalize spaces, then remove phone numbers
    .replace(/(\+44\s?|0)7\d{2}\s?\d{3}\s?\d{4}/g, '') // Remove spaced mobile: 077 684 7429 or 0776847429
    .replace(/(\+44\s?|0)7\d{9}/g, '') // Remove 11-digit mobile numbers (no spaces)
    .replace(/(\+44\s?|0)\d{3}\s?\d{3}\s?\d{4}/g, '') // Remove formatted landline: 012 345 6789
    .replace(/(\+44\s?|0)\d{10}/g, '') // Remove 10-digit landline numbers (no spaces)
    .replace(/\s+/g, ' ') // Clean up extra spaces
    .trim();
}

// Helper function to sanitize and validate text content
function sanitizeAdText(text: string, maxLength: number): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }
  // First remove phone numbers, then trim and validate
  const phoneSanitized = sanitizePhoneNumbersFromText(text);
  // Trim whitespace and remove invalid characters
  const sanitized = phoneSanitized
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, maxLength)
    .trim();
  // Return null if empty after sanitization
  return sanitized.length > 0 ? sanitized : null;
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
    pushOptions: v.optional(v.object({
      createAsDraft: v.boolean(),
      testMode: v.boolean(),
    })),
  },
  handler: async (ctx: any, args: { campaignId: string; pushOptions?: { createAsDraft: boolean; testMode: boolean } }): Promise<any> => {
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

      // Step 4: Get Google Ads SDK client
      console.log('🔑 Initializing Google Ads SDK client...');
      const customer = await getGoogleAdsClient(ctx);
      const customerId = process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, '');
      console.log('👤 Customer ID:', customerId);

      // Step 5: Create campaign budget first using SDK
      console.log('💰 Creating budget for campaign:', campaignData.campaignName);

      let budgetResourceName: string;
      try {
        const budgetResult = await customer.campaignBudgets.create([
          {
            name: `${campaignData.campaignName} Budget ${Date.now()}`,
            amount_micros: campaignData.dailyBudget * 1000000, // Convert to micros
            delivery_method: 'STANDARD'
          }
        ]);

        const budgetResource = budgetResult.results[0]?.resource_name;
        if (!budgetResource) {
          throw new Error('Budget creation succeeded but resource_name is missing');
        }
        budgetResourceName = budgetResource;
        console.log('✅ Budget created:', budgetResourceName);
      } catch (budgetError: any) {
        console.error('❌ Budget creation failed:', budgetError);
        const errorMessage = budgetError?.message || JSON.stringify(budgetError);
        throw new Error(`Budget creation failed: ${errorMessage}`);
      }

      // Step 6: Create the campaign using SDK
      console.log('🏗️ Creating campaign in Google Ads');

      // 🔒 SECURITY: Always create campaigns, ad groups, and ads as PAUSED
      // This prevents accidental spending and allows manual review before going live
      const campaignStatus = 'PAUSED';
      const adGroupStatus = 'PAUSED';
      const adStatus = 'PAUSED';

      console.log('📊 Campaign creation status (all PAUSED for safety):', {
        campaignStatus,
        adGroupStatus,
        adStatus
      });

      let campaignResourceName: string;
      let googleCampaignId: string;
      
      try {
        const campaignResult = await customer.campaigns.create([
          {
            name: `${campaignData.campaignName} ${Date.now()}`, // Add timestamp to prevent duplicates
            status: campaignStatus,
            advertising_channel_type: 'SEARCH',
            campaign_budget: budgetResourceName,
            manual_cpc: {},
            contains_eu_political_advertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING"
          }
        ]);

        const campaignResource = campaignResult.results[0]?.resource_name;
        if (!campaignResource) {
          throw new Error('Campaign creation succeeded but resource_name is missing');
        }
        campaignResourceName = campaignResource;
        googleCampaignId = campaignResourceName.split('/').pop() || '';

        console.log('✅ Campaign created successfully:', {
          googleCampaignId,
          resourceName: campaignResourceName
        });
        results.campaignCreated = true;
      } catch (campaignError: any) {
        console.error('❌ Campaign creation failed:', campaignError);
        const errorMessage = campaignError?.message || JSON.stringify(campaignError);
        throw new Error(`Campaign creation failed: ${errorMessage}`);
      }

      // Step 7: Create Ad Groups
      console.log('🎯 Creating ad groups...');
      const adGroupResourceNames: string[] = [];

      for (let i = 0; i < campaignData.adGroups.length; i++) {
        const adGroup = campaignData.adGroups[i];
        console.log(`🎯 Creating ad group ${i + 1}/${campaignData.adGroups.length}: ${adGroup.name}`);

        try {
          // Create ad group using SDK
          const adGroupResult = await customer.adGroups.create([
            {
              name: adGroup.name,
              campaign: campaignResourceName,
              status: adGroupStatus,
              type: 'SEARCH_STANDARD',
              cpc_bid_micros: 1000000 // £1.00 default bid in micros
            }
          ]);

          const adGroupResourceName = adGroupResult.results[0]?.resource_name;
          if (!adGroupResourceName) {
            throw new Error(`Ad group "${adGroup.name}" creation succeeded but resource_name is missing`);
          }
          adGroupResourceNames.push(adGroupResourceName);
          results.adGroupsCreated++;

          console.log(`✅ Ad group created: ${adGroup.name} -> ${adGroupResourceName}`);

          // Step 8: Add keywords to the ad group using SDK
          console.log(`🔑 Adding ${adGroup.keywords.length} keywords to ${adGroup.name}...`);

          try {
            // SDK supports batch creation
            const keywordCreates = adGroup.keywords.slice(0, 10).map((keyword: string) => ({
              ad_group: adGroupResourceName,
              status: 'ENABLED',
              keyword: {
                text: keyword,
                match_type: 'BROAD'
              },
              cpc_bid_micros: 1000000 // £1.00 default bid
            }));

            // Create keywords in batch
            await Promise.all(
              keywordCreates.map((keywordData: any) => 
                customer.adGroupCriteria.create(keywordData)
              )
            );

            console.log(`✅ Added ${keywordCreates.length} keywords to ${adGroup.name}`);
          } catch (keywordError: any) {
            console.error(`❌ Keywords for ${adGroup.name} failed:`, keywordError);
            results.errors.push(`Keywords for "${adGroup.name}" creation failed: ${keywordError?.message || 'Unknown error'}`);
          }

          // Step 9: Create ads in the ad group
          console.log(`📝 Creating ads for ${adGroup.name}...`);

          // 🔒 SECURITY: Use shared sanitization function (defined above)
          const sanitizeText = (text: string, maxLength: number): string | null => {
            return sanitizeAdText(text, maxLength);
          };

          // Validate and sanitize headlines (min 3 required, max 30 chars each)
          const rawHeadlines = adGroup.adCopy.headlines || [];
          const headlines = rawHeadlines
            .map((h: string) => sanitizeText(h, 30))
            .filter((h: string | null): h is string => h !== null)
            .slice(0, 15); // Google Ads allows up to 15 headlines, we'll use first 15 valid ones

          // Validate and sanitize descriptions (min 2 required, max 90 chars each)
          const rawDescriptions = adGroup.adCopy.descriptions || [];
          const descriptions = rawDescriptions
            .map((d: string) => sanitizeText(d, 90))
            .filter((d: string | null): d is string => d !== null)
            .slice(0, 4); // Google Ads allows up to 4 descriptions, we'll use first 4 valid ones

          // Log validation results for debugging
          console.log(`📋 Ad content validation for ${adGroup.name}:`, {
            rawHeadlinesCount: rawHeadlines.length,
            validHeadlinesCount: headlines.length,
            rawDescriptionsCount: rawDescriptions.length,
            validDescriptionsCount: descriptions.length,
            headlines: headlines.map((h: string) => ({ text: h, length: h.length })),
            descriptions: descriptions.map((d: string) => ({ text: d, length: d.length })),
            finalUrl: adGroup.adCopy.finalUrl || 'https://example.com'
          });

          // Google Ads requires minimum 3 headlines and 2 descriptions for Responsive Search Ads
          if (headlines.length < 3) {
            const errorMsg = `Insufficient valid headlines for "${adGroup.name}": ${headlines.length}/3 required. Raw headlines: ${JSON.stringify(rawHeadlines)}`;
            console.error(`❌ ${errorMsg}`);
            results.errors.push(errorMsg);
            continue; // Skip this ad group
          }

          if (descriptions.length < 2) {
            const errorMsg = `Insufficient valid descriptions for "${adGroup.name}": ${descriptions.length}/2 required. Raw descriptions: ${JSON.stringify(rawDescriptions)}`;
            console.error(`❌ ${errorMsg}`);
            results.errors.push(errorMsg);
            continue; // Skip this ad group
          }

          // Validate final URL
          const finalUrl = adGroup.adCopy.finalUrl?.trim() || 'https://example.com';
          if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            const errorMsg = `Invalid final URL for "${adGroup.name}": ${finalUrl}`;
            console.error(`❌ ${errorMsg}`);
            results.errors.push(errorMsg);
            continue; // Skip this ad group
          }

          // Create responsive search ad using SDK
          try {
            // 🔍 ULTRA-VERBOSE PAYLOAD LOGGING: Capture exact content being sent to Google Ads
            const adPayloadData = {
              ad_group: adGroupResourceName,
              status: adStatus,
              ad: {
                type: 'RESPONSIVE_SEARCH_AD',
                final_urls: [finalUrl],
                responsive_search_ad: {
                  headlines: headlines.map((headline: string) => ({
                    text: headline
                  })),
                  descriptions: descriptions.map((description: string) => ({
                    text: description
                  }))
                }
              }
            };

            // 🔍 PHONE CONTAMINATION CHECK: Verify no phone numbers in payload
            const payloadString = JSON.stringify(adPayloadData);
            const contaminatedPhoneRegex = /077\s?684\s?7429|0776847429/i;
            const ukPhoneRegex = /(\+44\s?|0)7\d{2}\s?\d{3}\s?\d{4}|(\+44\s?|0)7\d{9}/g;
            
            console.log('🔍 PRE-SEND PAYLOAD INSPECTION for', adGroup.name, ':');
            console.log('📋 Full payload:', payloadString);
            console.log('📋 Headlines being sent:', headlines);
            console.log('📋 Descriptions being sent:', descriptions);
            console.log('📋 Final URL:', finalUrl);
            
            // Check for contaminated number
            if (contaminatedPhoneRegex.test(payloadString)) {
              console.error('🚨 CRITICAL: Contaminated phone number FOUND in ad payload!');
              console.error('🚨 Payload contains 077 684 7429 - BLOCKING SEND');
              throw new Error('Contaminated phone number detected in ad payload - aborting send');
            }
            
            // Check for any UK phone numbers
            const phoneMatches = payloadString.match(ukPhoneRegex);
            if (phoneMatches && phoneMatches.length > 0) {
              console.error('🚨 CRITICAL: Phone numbers detected in ad payload:', phoneMatches);
              console.error('🚨 Ad text should NEVER contain phone numbers - BLOCKING SEND');
              throw new Error(`Phone numbers detected in ad content: ${phoneMatches.join(', ')}`);
            }
            
            console.log('✅ Payload validation passed - no phone numbers detected');

            const adResult = await customer.adGroupAds.create([adPayloadData as any]);

            results.adsCreated++;
            console.log(`✅ Created ad for ${adGroup.name}:`, adResult.results[0]?.resource_name || 'Success');
          } catch (adError: any) {
            console.error(`❌ Ad creation for ${adGroup.name} failed:`, adError);
            
            // SDK provides structured error objects
            let errorMessage = `Ad creation for "${adGroup.name}" failed`;
            
            if (adError?.message) {
              errorMessage += `: ${adError.message}`;
            } else if (adError?.error) {
              // Handle SDK error structure
              const errorDetails = adError.error;
              if (errorDetails?.message) {
                errorMessage += `: ${errorDetails.message}`;
              }
              // Check for policy violations in SDK error format
              if (errorDetails?.details) {
                const violations = errorDetails.details
                  .filter((d: any) => d['@type']?.includes('GoogleAdsFailure'))
                  .flatMap((d: any) => d.errors || [])
                  .filter((e: any) => e.errorCode?.policyFindingError)
                  .map((e: any) => {
                    const policyDetails = e.details?.policyFindingDetails;
                    if (policyDetails?.policyTopicEntries) {
                      return policyDetails.policyTopicEntries
                        .map((entry: any) => entry.topic || 'Policy violation')
                        .join(', ');
                    }
                    return 'Policy violation';
                  });
                
                if (violations.length > 0) {
                  errorMessage += `: ${violations.join('; ')}`;
                }
              }
            }
            
            results.errors.push(errorMessage);
          }

        } catch (adGroupError) {
          console.error(`❌ Error processing ad group ${adGroup.name}:`, adGroupError);
          results.errors.push(`Ad group "${adGroup.name}" processing failed: ${adGroupError}`);
        }
      }

      // Step 10: Create call extensions
      // 🔧 FIX: Get phone from fresh onboarding data instead of stale campaign data
      const freshOnboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
      const phoneNumber = freshOnboardingData?.phone;

      if (!phoneNumber) {
        throw new Error("Missing phone number from onboarding data");
      }
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
          // Create call asset using SDK
          const callAssetResult = await customer.assets.create([
            {
              type: 'CALL',
              call_asset: {
                phone_number: phoneNumber,
                country_code: 'GB',
                call_conversion_reporting_state: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION'
              }
            }
          ]);

          const assetResourceName = callAssetResult.results[0].resource_name;
          console.log('✅ Call asset created:', assetResourceName);
          console.log('🔍 CALL EXTENSION DEBUG: Phone used in API call:', phoneNumber);

          // Link the asset to the campaign using SDK
          const campaignAssetResult = await customer.campaignAssets.create([
            {
              asset: assetResourceName,
              campaign: campaignResourceName,
              field_type: 'CALL'
            }
          ]);

          results.extensionsCreated++;
          console.log('✅ Call extension linked to campaign successfully:', campaignAssetResult.results[0]?.resource_name || 'Success');
        } catch (extensionError: any) {
          console.error('❌ Error creating call extension:', extensionError);
          const errorMessage = extensionError?.message || JSON.stringify(extensionError);
          results.errors.push(`Call extension error: ${errorMessage}`);
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

        await createAdGroupsWithAdsAndKeywords(campaignData, customer, campaignResourceName);

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
        await createAdExtensions(campaignData, customer, campaignResourceName, ctx);
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
  customer: Customer,
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
      // Create Ad Group using SDK
      console.log('📡 Creating ad group via SDK...');
      try {
        // Use same status logic as main flow (default to PAUSED for safety)
        const adGroupStatus = 'PAUSED'; // Default to paused in helper function
        
        const adGroupResult = await customer.adGroups.create([
          {
            name: adGroup.name || 'Default Ad Group',
            campaign: campaignResourceName,
            status: adGroupStatus,
            type: 'SEARCH_STANDARD',
            cpc_bid_micros: 1000000 // £1.00 default bid
          }
        ]);

        const adGroupResourceName = adGroupResult.results[0]?.resource_name;
        if (!adGroupResourceName) {
          throw new Error(`Ad group "${adGroup.name}" creation succeeded but resource_name is missing`);
        }
        console.log('✅ Ad group created successfully:', {
          name: adGroup.name,
          resourceName: adGroupResourceName
        });

        // Create Keywords for this ad group
        if (adGroup.keywords && adGroup.keywords.length > 0) {
          await createKeywords(adGroup.keywords, customer, adGroupResourceName);
        }

        // Create Responsive Search Ad for this ad group
        if (adGroup.adCopy) {
          try {
            const adResult = await createResponsiveSearchAd(adGroup.adCopy, customer, adGroupResourceName);
            if (adResult?.success) {
              console.log(`✅ Ad created successfully for ${adGroup.name}`);
            }
          } catch (adError) {
            console.error(`❌ Ad creation for "${adGroup.name}" failed:`, {
              error: adError instanceof Error ? adError.message : String(adError),
              adGroupName: adGroup.name
            });
            // Continue processing other ad groups even if one fails
          }
        }
      } catch (error: any) {
        console.error('❌ Ad group creation failed:', {
          error: error?.message || String(error),
          adGroupName: adGroup.name
        });
        continue;
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

// Helper function to create keywords using SDK
async function createKeywords(
  keywords: string[],
  customer: Customer,
  adGroupResourceName: string
) {
  console.log('🔑 Creating keywords for ad group:', {
    keywords: keywords,
    keywordCount: keywords.length,
    adGroupResourceName: adGroupResourceName
  });

  try {
    // Create keywords in batch using SDK
    const keywordCreates = keywords.slice(0, 10).map(keyword => ({ // Limit to 10 keywords
      ad_group: adGroupResourceName,
      status: 'ENABLED',
      keyword: {
        text: keyword,
        match_type: 'BROAD' // Can be EXACT, PHRASE, or BROAD
      },
      cpc_bid_micros: 1500000 // £1.50 keyword bid
    }));

    await Promise.all(
      keywordCreates.map((keywordData: any) => 
        customer.adGroupCriteria.create(keywordData)
      )
    );

    console.log('✅ Keywords created successfully:', {
      keywordCount: keywordCreates.length
    });
  } catch (error: any) {
    console.error('❌ Keywords creation failed:', {
      error: error?.message || String(error)
    });
  }
}

// Helper function to create responsive search ad using SDK
async function createResponsiveSearchAd(
  adCopy: any,
  customer: Customer,
  adGroupResourceName: string
) {
  console.log('📝 Creating Responsive Search Ad for ad group:', {
    adGroupResourceName,
    hasAdCopy: !!adCopy,
    headlines: adCopy?.headlines,
    descriptions: adCopy?.descriptions,
    finalUrl: adCopy?.finalUrl
  });

  // 🔒 SECURITY: Sanitize headlines to remove any phone numbers
  const rawHeadlines = adCopy.headlines?.slice(0, 15) || ['Your Business Name'];
  const sanitizedHeadlines = rawHeadlines
    .map((h: string) => sanitizeAdText(h, 30))
    .filter((h: string | null): h is string => h !== null);
  
  const headlines = sanitizedHeadlines.length >= 3 
    ? sanitizedHeadlines.slice(0, 15)
    : [...sanitizedHeadlines, ...['Quality Service', 'Professional Work', 'Call Today'].slice(0, 3 - sanitizedHeadlines.length)];

  // 🔒 SECURITY: Sanitize descriptions to remove any phone numbers
  const rawDescriptions = adCopy.descriptions?.slice(0, 4) || ['Quality service you can trust'];
  const sanitizedDescriptions = rawDescriptions
    .map((d: string) => sanitizeAdText(d, 90))
    .filter((d: string | null): d is string => d !== null);
  
  const descriptions = sanitizedDescriptions.length >= 2
    ? sanitizedDescriptions.slice(0, 4)
    : [...sanitizedDescriptions, ...['Reliable professional service', 'Contact us for a quote'].slice(0, 2 - sanitizedDescriptions.length)];

  // 🔍 Log sanitization results for debugging
  console.log('🔒 Phone sanitization applied to ad content:', {
    rawHeadlinesCount: rawHeadlines.length,
    sanitizedHeadlinesCount: headlines.length,
    rawDescriptionsCount: rawDescriptions.length,
    sanitizedDescriptionsCount: descriptions.length,
    sampleHeadlines: headlines.slice(0, 3).map((h: string) => ({ text: h, length: h.length })),
    sampleDescriptions: descriptions.slice(0, 2).map((d: string) => ({ text: d, length: d.length }))
  });

  // Validate final URL
  const finalUrl = adCopy.finalUrl || 'https://example.com';
  if (!finalUrl || finalUrl.trim().length === 0) {
    throw new Error('Invalid finalUrl: cannot be empty');
  }
  
  // Validate URL accessibility before creating ad (non-blocking for testing)
  console.log(`🔍 Validating URL: ${finalUrl}`);
  const urlValidation = await validateUrl(finalUrl);
  
  if (!urlValidation.isValid && urlValidation.dnsError) {
    // Log warning but don't block - let Google Ads validate (better error messages)
    if (urlValidation.dnsError === 'PLACEHOLDER_URL') {
      console.warn(`⚠️ Placeholder URL detected: ${finalUrl}`);
      console.warn(`   Google Ads will reject this. Consider using a real URL or call-only ads.`);
    } else if (urlValidation.dnsError === 'HOSTNAME_NOT_FOUND') {
      console.warn(`⚠️ URL may not be accessible: ${finalUrl}`);
      console.warn(`   Domain may not exist. Google Ads will validate and reject if invalid.`);
    } else if (urlValidation.dnsError === 'INVALID_FORMAT') {
      // Still block invalid format - that's a code issue, not a testing issue
      throw new Error(`Invalid URL format: ${finalUrl}`);
    } else {
      console.warn(`⚠️ URL validation issue: ${urlValidation.error}`);
      console.warn(`   Allowing ad creation - Google Ads will validate the URL.`);
    }
  }
  
  if (urlValidation.isValid) {
    console.log(`✅ URL validation passed: ${finalUrl}`);
  } else {
    console.log(`⚠️ URL validation had issues, but allowing ad creation (Google Ads will validate): ${finalUrl}`);
  }

  console.log('📝 Final ad content validation:', {
    headlines: headlines.length,
    descriptions: descriptions.length,
    finalUrl: finalUrl
  });

  // Create responsive search ad using SDK
  try {
    // Default to PAUSED for safety in helper function
    const adStatus = 'PAUSED';
    
    // 🔍 ULTRA-VERBOSE PAYLOAD LOGGING: Capture exact content being sent to Google Ads
    const adPayloadData = {
      ad_group: adGroupResourceName,
      status: adStatus,
      ad: {
        type: 'RESPONSIVE_SEARCH_AD',
        final_urls: [finalUrl],
        responsive_search_ad: {
          headlines: headlines.map((headline: string) => ({
            text: headline.substring(0, 30) // Max 30 chars per headline
          })),
          descriptions: descriptions.map((description: string) => ({
            text: description.substring(0, 90) // Max 90 chars per description
          }))
        }
      }
    };
    
    // 🔍 PHONE CONTAMINATION CHECK: Verify no phone numbers in payload
    const payloadString = JSON.stringify(adPayloadData);
    const contaminatedPhoneRegex = /077\s?684\s?7429|0776847429/i;
    const ukPhoneRegex = /(\+44\s?|0)7\d{2}\s?\d{3}\s?\d{4}|(\+44\s?|0)7\d{9}/g;
    
    console.log('🔍 PRE-SEND PAYLOAD INSPECTION (helper function):');
    console.log('📋 Full payload:', payloadString);
    console.log('📋 Headlines being sent:', headlines.map((h: string) => h.substring(0, 30)));
    console.log('📋 Descriptions being sent:', descriptions.map((d: string) => d.substring(0, 90)));
    console.log('📋 Final URL:', finalUrl);
    
    // Check for contaminated number
    if (contaminatedPhoneRegex.test(payloadString)) {
      console.error('🚨 CRITICAL: Contaminated phone number FOUND in ad payload (helper function)!');
      console.error('🚨 Payload contains 077 684 7429 - BLOCKING SEND');
      throw new Error('Contaminated phone number detected in ad payload - aborting send');
    }
    
    // Check for any UK phone numbers
    const phoneMatches = payloadString.match(ukPhoneRegex);
    if (phoneMatches && phoneMatches.length > 0) {
      console.error('🚨 CRITICAL: Phone numbers detected in ad payload (helper function):', phoneMatches);
      console.error('🚨 Ad text should NEVER contain phone numbers - BLOCKING SEND');
      throw new Error(`Phone numbers detected in ad content: ${phoneMatches.join(', ')}`);
    }
    
    console.log('✅ Payload validation passed - no phone numbers detected (helper function)');
    
    const adResult = await customer.adGroupAds.create([adPayloadData as any]);

    console.log('✅ Responsive Search Ad created successfully:', {
      adGroupResourceName,
      resourceName: adResult.results[0]?.resource_name
    });
    return { success: true, resourceName: adResult.results[0]?.resource_name };
  } catch (adError: any) {
    console.error('❌ Ad creation failed:', {
      error: adError?.message || String(adError),
      adGroupResourceName
    });

    // SDK provides structured error objects
    let errorMessage = 'Ad creation failed';
    
    if (adError?.message) {
      errorMessage += `: ${adError.message}`;
    } else if (adError?.error) {
      const errorDetails = adError.error;
      if (errorDetails?.message) {
        errorMessage += `: ${errorDetails.message}`;
      }
    }
    
    throw new Error(errorMessage);
  }
}


// Helper function to create ad extensions using SDK
async function createAdExtensions(
  campaignData: any,
  customer: Customer,
  campaignResourceName: string,
  ctx: any
) {
  try {
    // Create Call Extension (Phone Number)
    // 🔧 FIX: Get phone from fresh onboarding data instead of stale campaign data
    const freshOnboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
    const phoneNumber = freshOnboardingData?.phone;

    if (phoneNumber) {
      await createCallExtension(phoneNumber, customer, campaignResourceName);
    }

    // Create Sitelink Extensions (if available)
    if (campaignData.sitelinkExtensions && campaignData.sitelinkExtensions.length > 0) {
      await createSitelinkExtensions(campaignData.sitelinkExtensions, customer, campaignResourceName);
    }

  } catch (error) {
    console.error('❌ Error creating ad extensions:', error);
  }
}

// Helper function to create call extension using SDK
async function createCallExtension(
  phoneNumber: string,
  customer: Customer,
  campaignResourceName: string
) {
  console.log('🔍 CALL EXTENSION DEBUG: Phone used in createCallExtension:', phoneNumber);
  
  // 🔍 CRITICAL VALIDATION: Verify phone number is correct before sending to Google Ads
  const contaminatedPhoneRegex = /077\s?684\s?7429|0776847429/i;
  if (contaminatedPhoneRegex.test(phoneNumber)) {
    console.error('🚨 CRITICAL: Contaminated phone number detected in call extension!');
    console.error('🚨 Phone:', phoneNumber);
    console.error('🚨 This should NEVER happen - blocking call extension creation');
    throw new Error(`Contaminated phone number detected in call extension: ${phoneNumber}`);
  }
  
  console.log('✅ Call extension phone validation passed:', phoneNumber);
  
  try {
    // Create call asset first
    const callAssetPayload = {
      type: 'CALL',
      call_asset: {
        phone_number: phoneNumber,
        country_code: 'GB',
        call_conversion_reporting_state: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION'
      }
    };
    
    console.log('🔍 CALL EXTENSION PAYLOAD:', JSON.stringify(callAssetPayload, null, 2));
    
    const callAssetResult = await customer.assets.create([callAssetPayload] as any);

    // Link asset to campaign
    await customer.campaignAssets.create([
      {
        asset: callAssetResult.results[0].resource_name,
        campaign: campaignResourceName,
        field_type: 'CALL'
      }
    ]);

    console.log('✅ Call extension created with phone:', phoneNumber);
  } catch (error: any) {
    console.error('❌ Call extension creation failed:', error?.message || String(error));
  }
}

// Helper function to create sitelink extensions using SDK
async function createSitelinkExtensions(
  sitelinks: any[],
  customer: Customer,
  campaignResourceName: string
) {
  try {
    const sitelinkCreates = sitelinks.slice(0, 6).map(sitelink => ({ // Max 6 sitelinks
      campaign: campaignResourceName,
      extension_type: 'SITELINK',
      extension_setting: {
        extensions: [{
          sitelink_extension: {
            link_text: sitelink.text?.substring(0, 25) || 'Learn More',
            final_urls: [sitelink.url || 'https://example.com']
          }
        }]
      }
    }));

    // Note: SDK may not have campaignExtensionSettings, using campaignAssets for sitelinks
    // Create sitelink assets first, then link to campaign
    const sitelinkAssets = await Promise.all(
      sitelinkCreates.map((sitelinkData: any) =>
        customer.assets.create([{
          type: 'SITELINK',
          sitelink_asset: {
            link_text: sitelinkData.extension_setting.extensions[0].sitelink_extension.link_text,
            description1: sitelinkData.extension_setting.extensions[0].sitelink_extension.final_urls?.[0] || ''
          }
        }])
      )
    );

    // Link sitelink assets to campaign
    await Promise.all(
      sitelinkAssets.map((assetResult, index) =>
        customer.campaignAssets.create([{
          asset: assetResult.results[0].resource_name,
          campaign: campaignResourceName,
          field_type: 'SITELINK'
        }])
      )
    );

    console.log('✅ Sitelink extensions created');
  } catch (error: any) {
    console.error('❌ Sitelink creation failed:', error?.message || String(error));
  }
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
        // Real Google Ads SDK call
        const customer = await getGoogleAdsClient(ctx);
        const customerId = process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, '');

        await customer.campaigns.update([
          {
            resource_name: `customers/${customerId}/campaigns/${args.googleCampaignId}`,
            status: args.status
          }
        ]);

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

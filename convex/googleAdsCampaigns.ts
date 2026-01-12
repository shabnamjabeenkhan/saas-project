"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { GoogleAdsApi, Customer, enums } from "google-ads-api";

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

// Helper function to truncate at word boundary (prevents mid-word truncation)
// 🚨 CRITICAL: Never truncate mid-word - this creates broken text like "Birm" or "Plumb"
function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Build result word by word to ensure we never cut mid-word
  const words = text.split(' ');
  let result = '';
  
  for (const word of words) {
    const candidate = result ? result + ' ' + word : word;
    if (candidate.length <= maxLength) {
      result = candidate;
    } else {
      break;
    }
  }
  
  // If we got at least some content, return it
  if (result.length > 0) {
    return result.trim();
  }
  
  // Edge case: first word alone exceeds maxLength
  // Return empty string to force fallback generation rather than truncating mid-word
  console.warn(`⚠️ Word "${words[0]}" exceeds ${maxLength} chars - returning empty to force fallback`);
  return '';
}

// 🚨 CRITICAL: Shorten descriptions at sentence boundary for complete, readable text
// This ensures descriptions are never cut mid-word or mid-sentence
function shortenDescriptionAtSentenceBoundary(description: string, maxLength: number): string {
  const cleaned = description.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  // Strategy 1: Try to cut at sentence boundary (period, exclamation, question mark)
  const sentenceEnders = ['. ', '! ', '? '];
  let bestCut = -1;
  
  for (const ender of sentenceEnders) {
    let searchStart = 0;
    while (true) {
      const enderPos = cleaned.indexOf(ender, searchStart);
      if (enderPos === -1 || enderPos + 1 > maxLength) break;
      const cutPos = enderPos + 1;
      if (cutPos <= maxLength) {
        bestCut = cutPos;
      }
      searchStart = enderPos + 1;
    }
  }
  
  // Also check for sentence ending at end of string
  for (const punct of ['.', '!', '?']) {
    const lastPunct = cleaned.lastIndexOf(punct, maxLength - 1);
    if (lastPunct > bestCut && lastPunct < maxLength) {
      const afterPunct = cleaned.charAt(lastPunct + 1);
      if (afterPunct === ' ' || afterPunct === '' || lastPunct === cleaned.length - 1) {
        bestCut = lastPunct + 1;
      }
    }
  }
  
  if (bestCut > 20) {
    return cleaned.substring(0, bestCut).trim();
  }
  
  // Strategy 2: Cut at word boundary
  return truncateAtWordBoundary(cleaned, maxLength);
}

// Helper function to sanitize and validate text content
// For headlines: uses word-boundary truncation
// For descriptions: caller should use shortenDescriptionAtSentenceBoundary for better results
function sanitizeAdText(text: string, maxLength: number): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }
  // First remove phone numbers, then trim and validate
  const phoneSanitized = sanitizePhoneNumbersFromText(text);
  // Trim whitespace and remove invalid characters
  let cleaned = phoneSanitized
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  
  // 🚨 CRITICAL: Remove ellipses from descriptions/headlines (all variations)
  cleaned = cleaned.replace(/\.{2,}/g, ''); // Remove 2+ consecutive dots
  cleaned = cleaned.replace(/\s*\.\.\.\s*/g, ' '); // Remove "..." with surrounding spaces
  cleaned = cleaned.replace(/\s*\.\.\s*/g, ' '); // Remove ".." with surrounding spaces
  cleaned = cleaned.replace(/\s+\.\s*$/g, ' '); // Remove trailing single dot with space
  cleaned = cleaned.replace(/\.\s*\./g, '.'); // Remove double periods
  
  // 🚨 CRITICAL: Remove years of experience mentions (user may not have 10 years)
  cleaned = cleaned.replace(/\b(over\s+)?\d+\s+years?\s+(of\s+)?experience\b/gi, '');
  cleaned = cleaned.replace(/\b\d+\+\s+years?\s+(of\s+)?experience\b/gi, '');
  cleaned = cleaned.replace(/\byears?\s+of\s+experience\b/gi, '');
  cleaned = cleaned.replace(/\bwith\s+years?\s+of\s+experience\b/gi, 'with expertise');
  
  // 🚨 CRITICAL: Fix unnatural headline patterns
  cleaned = cleaned.replace(/\bNo\s+Call\s+Out\s+Fee\b/gi, 'No Call Out Fees');
  cleaned = cleaned.replace(/\bPlumber\s+No\s+Call\s+Out\s+Fee\b/gi, 'Plumber With No Call Out Fees');
  cleaned = cleaned.replace(/\bElectrician\s+No\s+Call\s+Out\s+Fee\b/gi, 'Electrician With No Call Out Fees');
  
  // 🚨 CRITICAL: Remove "Pro" from headlines - replace with better alternatives
  cleaned = cleaned.replace(/\bPro\b/gi, (match, offset, string) => {
    const before = string.substring(Math.max(0, offset - 20), offset).toLowerCase();
    if (before.includes('maintenance') || before.includes('service') || before.includes('boiler') || before.includes('heating')) {
      return 'Engineer';
    }
    if (before.includes('help') || before.includes('repair')) {
      return 'Service';
    }
    return ''; // Remove standalone "Pro"
  });
  
  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Truncate at word boundary to prevent mid-word truncation
  const sanitized = truncateAtWordBoundary(cleaned, maxLength).trim();
  
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

      // Step 7: Create Ad Groups with Keywords and Ads
      // NOTE: All ad group, keyword, and ad creation is handled by createAdGroupsWithAdsAndKeywords()
      // This prevents duplicate creation that was happening before
      
      console.log('🎯 About to create ad groups, keywords, and ads...');

      // Critical validation with proper error handling
      if (!campaignData?.adGroups || campaignData.adGroups.length === 0) {
        console.error('🚨 FATAL: Campaign has no ad groups - cannot create ads/keywords!');
        console.error('🚨 FATAL: Campaign structure:', {
          hasData: !!campaignData,
          hasAdGroups: !!campaignData?.adGroups,
          adGroupsLength: campaignData?.adGroups?.length || 0,
          availableKeys: campaignData ? Object.keys(campaignData) : []
        });
        return {
          success: false,
          error: 'Campaign missing ad groups - no ads/keywords can be created',
          googleCampaignId: undefined,
          resourceName: undefined
        };
      }

      console.log('✅ Campaign data validation passed:', {
        adGroupsCount: campaignData.adGroups.length,
        adGroupNames: campaignData.adGroups.map((ag: any) => ag.name)
      });

      // Process ad groups with comprehensive tracking (SINGLE creation point)
      let adGroupResults: AdGroupCreationResults;
      try {
        console.log('🎯 DEBUG: Starting ad groups, keywords, and ads creation...');
        console.log('🎯 DEBUG: Will process', campaignData.adGroups.length, 'ad groups');

        adGroupResults = await createAdGroupsWithAdsAndKeywords(campaignData, customer, campaignResourceName);
        
        // Update results from the ACTUAL creation results (not optimistic)
        results.adGroupsCreated = adGroupResults.adGroupsCreated;
        results.adsCreated = adGroupResults.adsCreated;

        console.log('✅ DEBUG: Ad groups creation process completed');
        console.log('📊 Actual results:', {
          adGroupsCreated: adGroupResults.adGroupsCreated,
          adsCreated: adGroupResults.adsCreated,
          keywordsCreated: adGroupResults.keywordsCreated,
          failedAds: adGroupResults.failedAds.length,
          failedKeywords: adGroupResults.failedKeywords.length
        });
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
        results.extensionsCreated = 1; // Call extension created
      } catch (error) {
        console.error('❌ Ad extensions failed:', error instanceof Error ? error.message : String(error));
        // Continue - extensions are not critical
      }

      // Determine success status based on actual results
      const expectedAdGroups = campaignData.adGroups.length;
      const allAdsCreated = adGroupResults.adsCreated === expectedAdGroups;
      const someAdsCreated = adGroupResults.adsCreated > 0;
      const noAdsCreated = adGroupResults.adsCreated === 0;

      // Log final status
      console.log('📊 FINAL CAMPAIGN CREATION STATUS:', {
        expectedAdGroups,
        actualAdGroupsCreated: adGroupResults.adGroupsCreated,
        actualAdsCreated: adGroupResults.adsCreated,
        actualKeywordsCreated: adGroupResults.keywordsCreated,
        allAdsCreated,
        someAdsCreated,
        noAdsCreated,
        failedAds: adGroupResults.failedAds,
        errors: adGroupResults.errors
      });

      // Return partial success if some ads failed
      if (noAdsCreated) {
        return {
          success: false,
          partialSuccess: false,
          error: `No ads were created. Errors: ${adGroupResults.errors.join('; ')}`,
          googleCampaignId,
          resourceName: campaignResourceName,
          adGroupsCreated: adGroupResults.adGroupsCreated,
          adsCreated: adGroupResults.adsCreated,
          adsExpected: expectedAdGroups,
          keywordsCreated: adGroupResults.keywordsCreated,
          extensionsCreated: results.extensionsCreated,
          failedAdGroups: adGroupResults.failedAdGroups,
          failedAds: adGroupResults.failedAds,
          failedKeywords: adGroupResults.failedKeywords,
          errors: adGroupResults.errors
        };
      }

      if (!allAdsCreated) {
        return {
          success: false,
          partialSuccess: true,
          error: `Only ${adGroupResults.adsCreated}/${expectedAdGroups} ads were created. Some ad groups failed: ${adGroupResults.failedAds.join(', ')}`,
          googleCampaignId,
          resourceName: campaignResourceName,
          adGroupsCreated: adGroupResults.adGroupsCreated,
          adsCreated: adGroupResults.adsCreated,
          adsExpected: expectedAdGroups,
          keywordsCreated: adGroupResults.keywordsCreated,
          extensionsCreated: results.extensionsCreated,
          failedAdGroups: adGroupResults.failedAdGroups,
          failedAds: adGroupResults.failedAds,
          failedKeywords: adGroupResults.failedKeywords,
          errors: adGroupResults.errors
        };
      }

      return {
        success: true,
        partialSuccess: false,
        googleCampaignId,
        resourceName: campaignResourceName,
        adGroupsCreated: adGroupResults.adGroupsCreated,
        adsCreated: adGroupResults.adsCreated,
        adsExpected: expectedAdGroups,
        keywordsCreated: adGroupResults.keywordsCreated,
        extensionsCreated: results.extensionsCreated,
        failedAdGroups: [],
        failedAds: [],
        failedKeywords: adGroupResults.failedKeywords,
        errors: adGroupResults.errors.length > 0 ? adGroupResults.errors : undefined,
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

// Result type for ad group creation
interface AdGroupCreationResults {
  adGroupsCreated: number;
  adsCreated: number;
  keywordsCreated: number;
  failedAdGroups: string[];
  failedAds: string[];
  failedKeywords: string[];
  errors: string[];
}

// Helper function to create ad groups with keywords and ads
async function createAdGroupsWithAdsAndKeywords(
  campaignData: any,
  customer: Customer,
  campaignResourceName: string
): Promise<AdGroupCreationResults> {
  console.log('🚀🚀 ENTERING createAdGroupsWithAdsAndKeywords function');
  console.log('🚀🚀 Function called at:', new Date().toISOString());
  
  // 🔧 FIX: Reset the asset cache at the start of each campaign push
  // This prevents DUPLICATE_ASSET errors when the same headline appears in multiple ad groups
  resetAssetCache();
  console.log('🔄 Asset cache reset for new campaign push');

  // Initialize tracking variables
  const results: AdGroupCreationResults = {
    adGroupsCreated: 0,
    adsCreated: 0,
    keywordsCreated: 0,
    failedAdGroups: [],
    failedAds: [],
    failedKeywords: [],
    errors: []
  };

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
    return results;
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
      // First, check if an ad group with this name already exists in this campaign
      console.log('🔍 Checking if ad group already exists...');
      let adGroupResourceName: string | null = null;
      
      try {
        const existingAdGroups = await customer.query(`
          SELECT ad_group.resource_name, ad_group.name 
          FROM ad_group 
          WHERE ad_group.campaign = '${campaignResourceName}'
          AND ad_group.name = '${adGroup.name}'
          AND ad_group.status != 'REMOVED'
        `);
        
        if (existingAdGroups && existingAdGroups.length > 0) {
          adGroupResourceName = existingAdGroups[0].ad_group?.resource_name ?? null;
          console.log('✅ Found existing ad group:', {
            name: adGroup.name,
            resourceName: adGroupResourceName
          });
        }
      } catch (queryError) {
        console.log('⚠️ Could not query existing ad groups, will try to create new one');
      }
      
      // If ad group doesn't exist, create it
      if (!adGroupResourceName) {
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

          adGroupResourceName = adGroupResult.results[0]?.resource_name || null;
          if (!adGroupResourceName) {
            throw new Error(`Ad group "${adGroup.name}" creation succeeded but resource_name is missing`);
          }
          console.log('✅ Ad group created successfully:', {
            name: adGroup.name,
            resourceName: adGroupResourceName
          });
        } catch (createError: any) {
          // If duplicate name error, try to find the existing one
          if (createError?.errors?.[0]?.error_code?.ad_group_error === 'DUPLICATE_ADGROUP_NAME' ||
              (typeof createError === 'string' && createError.includes('DUPLICATE_ADGROUP_NAME')) ||
              (createError?.message && createError.message.includes('DUPLICATE_ADGROUP_NAME'))) {
            console.log('⚠️ Ad group already exists (duplicate name), attempting to find it...');
            
            try {
              const existingAdGroups = await customer.query(`
                SELECT ad_group.resource_name, ad_group.name 
                FROM ad_group 
                WHERE ad_group.campaign = '${campaignResourceName}'
                AND ad_group.name = '${adGroup.name}'
                AND ad_group.status != 'REMOVED'
              `);
              
              if (existingAdGroups && existingAdGroups.length > 0) {
                adGroupResourceName = existingAdGroups[0].ad_group?.resource_name ?? null;
                console.log('✅ Found existing ad group after duplicate error:', {
                  name: adGroup.name,
                  resourceName: adGroupResourceName
                });
              }
            } catch (findError) {
              console.error('❌ Could not find existing ad group after duplicate error:', findError);
              throw createError; // Re-throw original error
            }
          } else {
            throw createError;
          }
        }
      }
      
      if (!adGroupResourceName) {
        throw new Error(`Could not create or find ad group "${adGroup.name}"`);
      }

      // Track that ad group was created successfully
      results.adGroupsCreated++;

      // Create Keywords for this ad group
      if (adGroup.keywords && adGroup.keywords.length > 0) {
        console.log(`🔑 Creating ${adGroup.keywords.length} keywords for "${adGroup.name}"...`);
        const keywordResult = await createKeywords(adGroup.keywords, customer, adGroupResourceName);
        if (keywordResult.success) {
          console.log(`✅ Keywords created for "${adGroup.name}": ${keywordResult.createdCount}/${adGroup.keywords.length}`);
          results.keywordsCreated += keywordResult.createdCount;
        } else {
          console.error(`❌ Keywords creation failed for "${adGroup.name}":`, keywordResult.errors);
          results.failedKeywords.push(adGroup.name);
          results.errors.push(`Keywords failed for "${adGroup.name}": ${keywordResult.errors.join(', ')}`);
        }
      } else {
        console.warn(`⚠️ No keywords found for ad group "${adGroup.name}" - ad group will have no keywords!`);
        results.failedKeywords.push(adGroup.name);
        results.errors.push(`No keywords provided for "${adGroup.name}"`);
      }

      // Create Responsive Search Ad for this ad group
      if (adGroup.adCopy) {
        try {
          console.log(`📝 Attempting to create ad for "${adGroup.name}"...`);
          const adResult = await createResponsiveSearchAd(adGroup.adCopy, customer, adGroupResourceName);
          if (adResult?.success) {
            console.log(`✅ Ad created successfully for ${adGroup.name}`);
            results.adsCreated++;
          } else {
            console.error(`❌ Ad creation for "${adGroup.name}" returned unsuccessful result:`, JSON.stringify(adResult, null, 2));
            results.failedAds.push(adGroup.name);
            results.errors.push(`Ad creation returned unsuccessful for "${adGroup.name}"`);
          }
        } catch (adError: any) {
          // Better error logging for SDK errors - extract Google Ads API error details
          let errorMessage = 'Unknown error';
          let errorDetails: any = {};
          let googleAdsErrorCode = '';
          
          if (adError instanceof Error) {
            errorMessage = adError.message;
            errorDetails = { message: adError.message, stack: adError.stack };
          } else if (adError?.error) {
            // SDK error structure - try to extract Google Ads API error code
            errorDetails = adError.error;
            errorMessage = adError.error?.message || JSON.stringify(adError.error);
            
            // Try to extract specific Google Ads error codes
            try {
              const errorJson = typeof adError.error === 'string' ? JSON.parse(adError.error) : adError.error;
              const details = errorJson?.details || [];
              for (const detail of details) {
                if (detail['@type']?.includes('GoogleAdsFailure')) {
                  const errors = detail.errors || [];
                  for (const err of errors) {
                    if (err.errorCode) {
                      googleAdsErrorCode = JSON.stringify(err.errorCode);
                    }
                  }
                }
              }
            } catch (parseErr) {
              // Ignore parse errors
            }
          } else if (typeof adError === 'object') {
            errorMessage = JSON.stringify(adError, null, 2);
            errorDetails = adError;
          } else {
            errorMessage = String(adError);
          }
          
          console.error(`❌ Ad creation for "${adGroup.name}" failed:`, {
            errorMessage,
            googleAdsErrorCode: googleAdsErrorCode || 'Not available',
            errorDetails: JSON.stringify(errorDetails, null, 2),
            adGroupName: adGroup.name,
            adCopy: {
              headlinesCount: adGroup.adCopy?.headlines?.length || 0,
              descriptionsCount: adGroup.adCopy?.descriptions?.length || 0,
              finalUrl: adGroup.adCopy?.finalUrl || 'MISSING'
            }
          });
          
          // Track the failure
          results.failedAds.push(adGroup.name);
          results.errors.push(`Ad creation failed for "${adGroup.name}": ${errorMessage}${googleAdsErrorCode ? ` (Google Ads Error: ${googleAdsErrorCode})` : ''}`);
          // Continue processing other ad groups even if one fails
        }
      } else {
        console.warn(`⚠️ No adCopy found for ad group "${adGroup.name}" - ad group will have no ads!`);
        results.failedAds.push(adGroup.name);
        results.errors.push(`No adCopy provided for "${adGroup.name}"`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error creating ad group ${adGroup.name}:`, {
        error: errorMsg,
        stack: error instanceof Error ? error.stack : 'No stack trace',
        adGroupName: adGroup.name,
        adGroupData: JSON.stringify(adGroup, null, 2)
      });
      results.failedAdGroups.push(adGroup.name);
      results.errors.push(`Ad group creation failed for "${adGroup.name}": ${errorMsg}`);
    }
  }

  // Log final summary
  console.log('📊 Ad Groups Creation Summary:', {
    totalAdGroups: campaignData.adGroups.length,
    adGroupsCreated: results.adGroupsCreated,
    adsCreated: results.adsCreated,
    keywordsCreated: results.keywordsCreated,
    failedAdGroups: results.failedAdGroups,
    failedAds: results.failedAds,
    failedKeywords: results.failedKeywords,
    totalErrors: results.errors.length
  });

  return results;
}

// Helper function to create keywords using SDK
async function createKeywords(
  keywords: string[],
  customer: Customer,
  adGroupResourceName: string
): Promise<{ success: boolean; createdCount: number; errors: string[] }> {
  console.log('🔑 Creating keywords for ad group:', {
    keywords: keywords,
    keywordCount: keywords.length,
    adGroupResourceName: adGroupResourceName
  });

  const errors: string[] = [];
  let createdCount = 0;

  // Filter and sanitize keywords
  const sanitizedKeywords = keywords
    .slice(0, 10) // Limit to 10 keywords per ad group
    .map(kw => kw.trim())
    .filter(kw => kw.length > 0 && kw.length <= 80); // Google Ads keyword max length

  if (sanitizedKeywords.length === 0) {
    console.warn('⚠️ No valid keywords to create after sanitization');
    return { success: false, createdCount: 0, errors: ['No valid keywords after sanitization'] };
  }

  console.log('🔑 Sanitized keywords:', sanitizedKeywords);

  // Create keywords one by one for better error handling
  for (const keywordText of sanitizedKeywords) {
    try {
      const keywordData = {
        ad_group: adGroupResourceName,
        status: enums.AdGroupCriterionStatus.ENABLED,
        keyword: {
          text: keywordText,
          match_type: enums.KeywordMatchType.BROAD
        },
        cpc_bid_micros: 1500000 // £1.50 keyword bid
      };

      console.log(`🔑 Creating keyword: "${keywordText}"`);
      // SDK expects an array of keyword objects
      await customer.adGroupCriteria.create([keywordData]);
      createdCount++;
      console.log(`✅ Keyword created: "${keywordText}"`);
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error(`❌ Failed to create keyword "${keywordText}":`, errorMsg);
      errors.push(`${keywordText}: ${errorMsg}`);
      // Continue with other keywords even if one fails
    }
  }

  console.log('🔑 Keywords creation summary:', {
    requested: keywords.length,
    sanitized: sanitizedKeywords.length,
    created: createdCount,
    failed: errors.length
  });

  return {
    success: createdCount > 0,
    createdCount,
    errors
  };
}

// Helper function to detect repeated phrases within a single description
// Returns true if the same phrase (3+ words) appears multiple times
function detectInternalRepetition(text: string): boolean {
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 10);
  if (sentences.length < 2) return false;
  
  const phrases = new Set<string>();
  
  for (const sentence of sentences) {
    const words = sentence.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2);
    
    // Check for exact sentence repetition
    const normalizedSentence = words.join(' ');
    if (phrases.has(normalizedSentence)) {
      console.warn(`⚠️ Found repeated sentence in description: "${sentence}"`);
      return true;
    }
    phrases.add(normalizedSentence);
    
    // Extract key phrases (2+ consecutive words for shorter phrases, 3+ for longer)
    // This catches both short and long repeated phrases
    for (let phraseLength = 2; phraseLength <= Math.min(4, words.length); phraseLength++) {
      for (let i = 0; i <= words.length - phraseLength; i++) {
        const phrase = words.slice(i, i + phraseLength).join(' ');
        if (phrases.has(phrase)) {
          console.warn(`⚠️ Found repeated phrase in description: "${phrase}"`);
          return true; // Found repetition
        }
        phrases.add(phrase);
      }
    }
  }
  return false;
}

// Helper function to remove repeated phrases from a description
function removeRepeatedPhrases(text: string): string {
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  const seen = new Set<string>();
  const seenPhrases = new Set<string>();
  const unique: string[] = [];
  
  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().trim();
    const words = normalized.split(/\s+/).filter(w => w.length > 2);
    
    // Check for exact sentence duplicate
    if (seen.has(normalized)) {
      console.warn(`⚠️ Removing duplicate sentence: "${sentence}"`);
      continue;
    }
    
    // Check for similar sentences (lower threshold to catch more variations)
    let isDuplicate = false;
    for (const existing of seen) {
      const existingWords = existing.split(/\s+/).filter(w => w.length > 2);
      const commonWords = words.filter(w => existingWords.includes(w));
      const similarity = commonWords.length / Math.max(words.length, existingWords.length);
      // Lower threshold to catch more variations
      if (similarity > 0.6) {
        isDuplicate = true;
        break;
      }
    }
    
    // Check for repeated phrases within this sentence
    let hasRepeatedPhrase = false;
    for (let phraseLength = 2; phraseLength <= Math.min(4, words.length); phraseLength++) {
      for (let i = 0; i <= words.length - phraseLength; i++) {
        const phrase = words.slice(i, i + phraseLength).join(' ');
        if (seenPhrases.has(phrase)) {
          hasRepeatedPhrase = true;
          break;
        }
        seenPhrases.add(phrase);
      }
      if (hasRepeatedPhrase) break;
    }
    
    if (!isDuplicate && !hasRepeatedPhrase) {
      seen.add(normalized);
      unique.push(sentence.trim());
      // Mark phrases as seen
      for (let phraseLength = 2; phraseLength <= Math.min(4, words.length); phraseLength++) {
        for (let i = 0; i <= words.length - phraseLength; i++) {
          seenPhrases.add(words.slice(i, i + phraseLength).join(' '));
        }
      }
    } else {
      console.warn(`⚠️ Removing duplicate or repetitive sentence: "${sentence}"`);
    }
  }
  
  return unique.join('. ').trim() + (text.endsWith('.') ? '.' : '');
}

// Helper function to check if two assets are semantically similar
// Enhanced to catch word-swap variations (e.g., "Heating Repair Birmingham" vs "Heating Fix Birmingham")
function areAssetsSimilar(asset1: string, asset2: string, threshold: number = 0.6): boolean {
  const words1 = asset1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = asset2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  // Check for exact word match (most strict)
  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  
  // Lower threshold to catch word-swap variations (e.g., Repair vs Fix)
  if (similarity >= threshold) return true;
  
  // Additional check: if they share the same core structure (same position words match)
  // This catches "Heating Repair Birmingham" vs "Heating Fix Birmingham"
  if (words1.length === words2.length && words1.length >= 2) {
    let matchingPositions = 0;
    for (let i = 0; i < Math.min(words1.length, words2.length); i++) {
      if (words1[i] === words2[i]) matchingPositions++;
    }
    // If most positions match, they're likely word-swap variations
    if (matchingPositions >= words1.length - 1) return true;
  }
  
  // Check for semantic synonyms (repair/fix, service/help, etc.)
  const synonyms: Record<string, string[]> = {
    'repair': ['fix', 'service', 'help'],
    'fix': ['repair', 'service', 'help'],
    'service': ['repair', 'fix', 'help'],
    'help': ['repair', 'fix', 'service'],
  };
  
  // If they differ by only one word and that word is a synonym, consider them similar
  if (words1.length === words2.length && words1.length >= 2) {
    const differences = words1.filter((w, i) => w !== words2[i]);
    if (differences.length === 1) {
      const [diff1, diff2] = [differences[0], words2[words1.indexOf(differences[0])]];
      if (synonyms[diff1]?.includes(diff2) || synonyms[diff2]?.includes(diff1)) {
        return true;
      }
    }
  }
  
  return false;
}

// Helper function to deduplicate headlines/descriptions to avoid DUPLICATE_ASSET errors
// Enhanced to catch similar assets, not just exact duplicates
function deduplicateAssets(assets: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const asset of assets) {
    // Normalize for comparison (lowercase, trim)
    const normalized = asset.toLowerCase().trim();
    
    // Check for exact duplicate
    if (seen.has(normalized)) {
      console.warn(`⚠️ Filtering out exact duplicate: "${asset}"`);
      continue;
    }
    
    // Check for similar assets (same key words, different order, word-swap variations)
    let isSimilar = false;
    for (const existing of seen) {
      if (areAssetsSimilar(normalized, existing, 0.6)) {
        console.warn(`⚠️ Filtering out similar asset: "${asset}" (similar to existing)`);
        isSimilar = true;
        break;
      }
    }
    
    if (!isSimilar) {
      seen.add(normalized);
      unique.push(asset);
    }
  }
  
  return unique;
}

// Track used headlines across all ad groups to avoid DUPLICATE_ASSET errors
// This is a module-level cache that persists during a single campaign push
const usedHeadlinesInCampaign = new Set<string>();
const usedDescriptionsInCampaign = new Set<string>();

// Reset the cache at the start of a new campaign push
function resetAssetCache() {
  usedHeadlinesInCampaign.clear();
  usedDescriptionsInCampaign.clear();
}

// Filter out headlines that have already been used in this campaign
function filterAlreadyUsedAssets(assets: string[], usedSet: Set<string>): string[] {
  const available: string[] = [];
  
  for (const asset of assets) {
    const normalized = asset.toLowerCase().trim();
    if (!usedSet.has(normalized)) {
      available.push(asset);
    }
  }
  
  return available;
}

// Mark assets as used after successful creation
function markAssetsAsUsed(assets: string[], usedSet: Set<string>) {
  for (const asset of assets) {
    usedSet.add(asset.toLowerCase().trim());
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
  // Using 30 char limit - Google Ads allows up to 30 characters for headlines
  // 🚨 CRITICAL: Filter out headlines containing dashes - Google joins headlines with " - "
  // so headlines like "Plumber - Birmingham" become unreadable when combined
  const rawHeadlines = adCopy.headlines?.slice(0, 15) || ['Your Business Name'];
  const sanitizedHeadlines = rawHeadlines
    .map((h: string) => sanitizeAdText(h, 30))
    .filter((h: string | null): h is string => {
      if (h === null) return false;
      // 🚨 Reject headlines containing dashes - they break when Google joins headlines
      if (h.includes('-')) {
        console.warn(`⚠️ Filtering out headline with dash: "${h}" - Google joins headlines with dashes`);
        return false;
      }
      return true;
    });
  
  // 🔧 FIX: Deduplicate headlines within this ad group
  const uniqueHeadlines = deduplicateAssets(sanitizedHeadlines);
  
  // 🔧 FIX: Filter out headlines already used in other ad groups of this campaign
  // This prevents DUPLICATE_ASSET errors from Google Ads
  const availableHeadlines = filterAlreadyUsedAssets(uniqueHeadlines, usedHeadlinesInCampaign);
  
  console.log('🔍 Headlines deduplication:', {
    rawCount: sanitizedHeadlines.length,
    uniqueCount: uniqueHeadlines.length,
    availableCount: availableHeadlines.length,
    alreadyUsedInCampaign: uniqueHeadlines.length - availableHeadlines.length
  });
  
  // If too many headlines were filtered out, we need to generate fallbacks
  let headlines: string[];
  if (availableHeadlines.length >= 3) {
    headlines = availableHeadlines.slice(0, 15);
  } else {
    // Not enough unique headlines - add keyword-rich fallbacks (NO generic phrases)
    // 🚨 CRITICAL: Fallbacks must contain service keywords for Ad Strength
    // Helper to truncate at word boundary (prevents mid-word truncation like "Boiler Repai")
    const truncateAtWord = (text: string, maxLen: number): string => {
      if (text.length <= maxLen) return text;
      // Build word by word to prevent mid-word truncation
      const words = text.split(' ');
      let result = '';
      for (const word of words) {
        const candidate = result ? result + ' ' + word : word;
        if (candidate.length <= maxLen) {
          result = candidate;
        } else {
          break;
        }
      }
      return result.trim() || ''; // Return empty if first word too long
    };
    
    // Extract service keyword from adCopy or use generic trade term
    const serviceHint = adCopy.headlines?.[0]?.toLowerCase() || '';
    let serviceKeyword = 'Service';
    if (serviceHint.includes('plumb')) serviceKeyword = 'Plumber';
    else if (serviceHint.includes('electric')) serviceKeyword = 'Electrician';
    else if (serviceHint.includes('boiler')) serviceKeyword = 'Boiler Repair';
    else if (serviceHint.includes('drain')) serviceKeyword = 'Drain Service';
    else if (serviceHint.includes('heating')) serviceKeyword = 'Heating Engineer';
    else if (serviceHint.includes('gas')) serviceKeyword = 'Gas Engineer';
    
    // Keyword-rich fallbacks that match search intent
    const fallbackHeadlines = [
      truncateAtWord(`${serviceKeyword} Near Me`, 30),
      truncateAtWord(`24/7 ${serviceKeyword}`, 30),
      truncateAtWord(`Emergency ${serviceKeyword}`, 30),
      truncateAtWord(`Local ${serviceKeyword}`, 30),
      truncateAtWord(`Same Day ${serviceKeyword}`, 30),
      'Free Quotes',
      'No Call Out Fees',
      'Call Now',
      'Book Today'
    ].filter(h => h.length > 0 && h.length <= 30 && !usedHeadlinesInCampaign.has(h.toLowerCase().trim()));
    
    headlines = [...availableHeadlines, ...fallbackHeadlines].slice(0, 15);
    
    // If still not enough, use keyword-rich fallbacks with timestamp
    if (headlines.length < 3) {
      const timestamp = Date.now().toString().slice(-4);
      const keywordFallbacks = [
        `${serviceKeyword} ${timestamp}`,
        `Fast ${serviceKeyword}`,
        `Get Help Today`
      ];
      headlines = [...headlines, ...keywordFallbacks].slice(0, 15);
    }
    
    console.warn('⚠️ Had to add fallback headlines due to duplicates:', {
      originalCount: availableHeadlines.length,
      finalCount: headlines.length
    });
  }

  // 🔒 SECURITY: Sanitize descriptions to remove any phone numbers
  // Using 80 char limit (not 90) to prevent truncation - AI should generate within this limit
  // 🚨 CRITICAL: Use sentence-boundary shortening for descriptions to ensure complete sentences
  const rawDescriptions = adCopy.descriptions?.slice(0, 4) || ['Quality service you can trust'];
  const sanitizedDescriptions = rawDescriptions
    .map((d: string) => {
      if (!d || typeof d !== 'string') return null;
      // Remove phone numbers first
      const phoneSanitized = sanitizePhoneNumbersFromText(d);
      // Clean and shorten at sentence boundary for complete, readable text
      let cleaned = phoneSanitized.trim().replace(/[\x00-\x1F\x7F]/g, '');
      
      // 🚨 CRITICAL: Remove ellipses from descriptions (all variations)
      cleaned = cleaned.replace(/\.{2,}/g, ''); // Remove 2+ consecutive dots
      cleaned = cleaned.replace(/\s*\.\.\.\s*/g, ' '); // Remove "..." with surrounding spaces
      cleaned = cleaned.replace(/\s*\.\.\s*/g, ' '); // Remove ".." with surrounding spaces
      cleaned = cleaned.replace(/\s+\.\s*$/g, ' '); // Remove trailing single dot with space
      cleaned = cleaned.replace(/\.\s*\./g, '.'); // Remove double periods
      
      // 🚨 CRITICAL: Remove years of experience mentions (user may not have 10 years)
      cleaned = cleaned.replace(/\b(over\s+)?\d+\s+years?\s+(of\s+)?experience\b/gi, '');
      cleaned = cleaned.replace(/\b\d+\+\s+years?\s+(of\s+)?experience\b/gi, '');
      cleaned = cleaned.replace(/\byears?\s+of\s+experience\b/gi, '');
      cleaned = cleaned.replace(/\bwith\s+years?\s+of\s+experience\b/gi, 'with expertise');
      
      cleaned = cleaned.replace(/\s+/g, ' ').trim(); // Clean up extra spaces
      
      const shortened = shortenDescriptionAtSentenceBoundary(cleaned, 80);
      
      // 🚨 CRITICAL: Check for internal repetition within the description
      if (detectInternalRepetition(shortened)) {
        console.warn(`⚠️ Description has internal repetition, cleaning: "${shortened}"`);
        return removeRepeatedPhrases(shortened);
      }
      
      return shortened;
    })
    .filter((d: string | null): d is string => d !== null && d.length > 0);
  
  // 🔧 FIX: Deduplicate descriptions within this ad group
  const uniqueDescriptions = deduplicateAssets(sanitizedDescriptions);
  
  // 🔧 FIX: Filter out descriptions already used in other ad groups of this campaign
  const availableDescriptions = filterAlreadyUsedAssets(uniqueDescriptions, usedDescriptionsInCampaign);
  
  console.log('🔍 Descriptions deduplication:', {
    rawCount: sanitizedDescriptions.length,
    uniqueCount: uniqueDescriptions.length,
    availableCount: availableDescriptions.length,
    alreadyUsedInCampaign: uniqueDescriptions.length - availableDescriptions.length
  });
  
  // If too many descriptions were filtered out, generate fallbacks
  let descriptions: string[];
  if (availableDescriptions.length >= 2) {
    descriptions = availableDescriptions.slice(0, 4);
  } else {
    const timestamp = Date.now().toString().slice(-4);
    const fallbackDescriptions = [
      `Reliable professional service. Call now for assistance ${timestamp}.`,
      `Contact us today for a free quote. Quality guaranteed ${timestamp}.`
    ];
    descriptions = [...availableDescriptions, ...fallbackDescriptions].slice(0, 4);
    
    console.warn('⚠️ Had to add fallback descriptions due to duplicates:', {
      originalCount: availableDescriptions.length,
      finalCount: descriptions.length
    });
  }
  
  // 🚨 FINAL SAFETY CHECK: Post-process descriptions to catch any remaining repetition
  // This handles cases where descriptions might be concatenated or contain repeated phrases
  descriptions = descriptions.map((desc: string) => {
    // Check if description looks like multiple descriptions concatenated
    if (desc.includes('. ') && desc.split(/\.\s+/).length > 2) {
      const sentences = desc.split(/\.\s+/).filter(s => s.trim().length > 0);
      // Check if any sentence repeats
      const seen = new Set<string>();
      const unique: string[] = [];
      for (const sentence of sentences) {
        const normalized = sentence.toLowerCase().trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          unique.push(sentence.trim());
        } else {
          console.warn(`⚠️ Removing repeated sentence from description: "${sentence}"`);
        }
      }
      if (unique.length < sentences.length) {
        return unique.join('. ').trim() + (desc.endsWith('.') ? '.' : '');
      }
    }
    
    // Final check for internal repetition
    if (detectInternalRepetition(desc)) {
      console.warn(`⚠️ Final check: Description still has repetition, cleaning: "${desc}"`);
      return removeRepeatedPhrases(desc);
    }
    
    return desc;
  }).filter((d: string) => d && d.length > 0);

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

  // 🔍 CRITICAL: Log ALL headlines with their lengths to debug truncation
  console.log('📝 Final ad content validation:', {
    headlines: headlines.length,
    descriptions: descriptions.length,
    finalUrl: finalUrl,
    headlinesWithLengths: headlines.map((h: string, i: number) => ({
      index: i,
      text: h,
      length: h.length,
      isOverLimit: h.length > 30
    })),
    descriptionsWithLengths: descriptions.map((d: string, i: number) => ({
      index: i,
      text: d,
      length: d.length,
      isOverLimit: d.length > 90
    }))
  });
  
  // 🚨 CRITICAL: Check if any headlines exceed 30 chars BEFORE sending to Google Ads
  // Note: We target 25 chars in AI prompt, but Google allows up to 30, so we check against 30 here
  const overLimitHeadlines = headlines.filter((h: string) => h.length > 30);
  if (overLimitHeadlines.length > 0) {
    console.error('🚨 CRITICAL: Headlines exceed 30 char limit!', overLimitHeadlines);
    throw new Error(`Headlines exceed 30 character limit: ${overLimitHeadlines.map((h: string) => `"${h}" (${h.length} chars)`).join(', ')}`);
  }
  
  // Note: We target 80 chars in AI prompt, but Google allows up to 90, so we check against 90 here
  const overLimitDescriptions = descriptions.filter((d: string) => d.length > 90);
  if (overLimitDescriptions.length > 0) {
    console.error('🚨 CRITICAL: Descriptions exceed 90 char limit!', overLimitDescriptions);
    throw new Error(`Descriptions exceed 90 character limit: ${overLimitDescriptions.map((d: string) => `"${d}" (${d.length} chars)`).join(', ')}`);
  }

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
              text: headline // Already sanitized to ≤30 chars with word-boundary truncation
            })),
            descriptions: descriptions.map((description: string) => ({
              text: description // Already sanitized to ≤90 chars with word-boundary truncation
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
    console.log('📋 Headlines being sent:', headlines.map((h: string) => ({ text: h, length: h.length })));
    console.log('📋 Descriptions being sent:', descriptions.map((d: string) => ({ text: d, length: d.length })));
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
    
    // 🔧 FIX: Mark these headlines and descriptions as used so future ad groups don't reuse them
    markAssetsAsUsed(headlines, usedHeadlinesInCampaign);
    markAssetsAsUsed(descriptions, usedDescriptionsInCampaign);
    console.log('📝 Marked assets as used:', {
      headlinesMarked: headlines.length,
      descriptionsMarked: descriptions.length,
      totalHeadlinesUsed: usedHeadlinesInCampaign.size,
      totalDescriptionsUsed: usedDescriptionsInCampaign.size
    });
    
    return { success: true, resourceName: adResult.results[0]?.resource_name };
  } catch (adError: any) {
    // Extract detailed error information from Google Ads API
    let errorMessage = 'Ad creation failed';
    let googleAdsErrorDetails = '';
    let policyViolationInfo = '';
    
    // Log the raw error object structure for debugging
    console.error('🔍 RAW ERROR INSPECTION:', {
      errorType: typeof adError,
      errorConstructor: adError?.constructor?.name,
      hasMessage: !!adError?.message,
      hasError: !!adError?.error,
      hasErrors: !!adError?.errors,
      keys: adError ? Object.keys(adError) : [],
      fullError: JSON.stringify(adError, Object.getOwnPropertyNames(adError), 2).substring(0, 2000)
    });
    
    try {
      // Google Ads SDK errors often have an 'errors' array
      if (adError?.errors && Array.isArray(adError.errors)) {
        const errorDetails = adError.errors.map((e: any) => {
          const errorCode = e.error_code ? JSON.stringify(e.error_code) : 'unknown';
          const message = e.message || 'No message';
          return `${errorCode}: ${message}`;
        }).join('; ');
        errorMessage = errorDetails || errorMessage;
        googleAdsErrorDetails = JSON.stringify(adError.errors, null, 2);
      }
      // Try to parse the error for Google Ads API specific details
      else if (adError?.message) {
        // Check if the error message contains JSON (Google Ads API errors often do)
        const jsonMatch = adError.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedError = parseGoogleAdsError(jsonMatch[0]);
          errorMessage = parsedError.message;
          if (parsedError.isPolicyViolation && parsedError.policyDetails) {
            policyViolationInfo = parsedError.policyDetails.map(p => `${p.topic}: ${p.reason}`).join('; ');
          }
        } else {
          errorMessage = adError.message;
        }
      } else if (adError?.error) {
        const errorDetails = adError.error;
        if (typeof errorDetails === 'string') {
          const parsedError = parseGoogleAdsError(errorDetails);
          errorMessage = parsedError.message;
          if (parsedError.isPolicyViolation && parsedError.policyDetails) {
            policyViolationInfo = parsedError.policyDetails.map(p => `${p.topic}: ${p.reason}`).join('; ');
          }
        } else if (errorDetails?.message) {
          errorMessage = errorDetails.message;
        }
        googleAdsErrorDetails = JSON.stringify(errorDetails, null, 2);
      }
    } catch (parseErr) {
      // Ignore parse errors, use original error
      errorMessage = adError?.message || String(adError);
      console.error('⚠️ Error parsing failed:', parseErr);
    }
    
    console.error('❌ Ad creation failed with detailed error:', {
      errorMessage,
      policyViolationInfo: policyViolationInfo || 'None',
      googleAdsErrorDetails: googleAdsErrorDetails || 'Not available',
      adGroupResourceName,
      rawError: String(adError).substring(0, 500)
    });
    
    // Include policy violation info in the error message if present
    const fullErrorMessage = policyViolationInfo 
      ? `Ad creation failed: ${errorMessage}. Policy violations: ${policyViolationInfo}`
      : `Ad creation failed: ${errorMessage}`;
    
    throw new Error(fullErrorMessage);
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
    const assetResourceName = callAssetResult.results[0]?.resource_name;
    
    if (!assetResourceName) {
      throw new Error('Call asset created but resource_name is missing');
    }
    
    console.log('✅ Call asset created:', assetResourceName);

    // Link asset to campaign
    const campaignAssetResult = await customer.campaignAssets.create([
      {
        asset: assetResourceName,
        campaign: campaignResourceName,
        field_type: 'CALL'
      }
    ] as any);
    
    const linkedResourceName = campaignAssetResult.results[0]?.resource_name;
    console.log('✅ Call extension linked to campaign:', linkedResourceName);
    console.log('✅ Call extension created with phone:', phoneNumber);
    console.log('🔍 VERIFICATION: Call extension resource:', linkedResourceName);
  } catch (error: any) {
    console.error('❌ Call extension creation failed:', error?.message || String(error));
    throw error; // Re-throw to ensure error is caught upstream
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

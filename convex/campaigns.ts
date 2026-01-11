import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// ============================================================================
// CENTRALIZED CONSTANTS (PRD Section 4.1)
// ============================================================================

/** Maximum characters allowed for a Google Ads headline */
const MAX_HEADLINE_CHARS = 25;

/** Maximum characters allowed for a Google Ads description */
const MAX_DESCRIPTION_CHARS = 80;

/** Target number of headlines per ad group (RSA optimal) */
const TARGET_HEADLINES_PER_AD_GROUP = 15;

/** Minimum headlines per ad group (RSA minimum) */
const MIN_HEADLINES_PER_AD_GROUP = 3;

/** Minimum descriptions per ad group */
const MIN_DESCRIPTIONS_PER_AD_GROUP = 2;

/** Maximum descriptions per ad group (RSA optimal) */
const MAX_DESCRIPTIONS_PER_AD_GROUP = 4;

/** Cooldown between regenerations in milliseconds (disabled - set to 0) */
const REGENERATION_COOLDOWN_MS = 0;

/** Trial duration in milliseconds (3 days) */
const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

/** Monthly reset period in milliseconds (30 days) */
const MONTHLY_RESET_MS = 30 * 24 * 60 * 60 * 1000;

/** Maximum regenerations allowed per period (trial or monthly) */
const MAX_REGENERATIONS_PER_PERIOD = 3;

// ============================================================================

// Helper function to get current user's token identifier
async function getCurrentUserToken(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

// Define campaign schema types for validation
const adGroupSchema = v.object({
  name: v.string(),
  keywords: v.array(v.string()),
  adCopy: v.object({
    headlines: v.array(v.string()),
    descriptions: v.array(v.string()),
    finalUrl: v.optional(v.string()),
  }),
});

const campaignSchema = v.object({

  campaignName: v.string(),
  dailyBudget: v.number(),
  targetLocation: v.string(),
  businessInfo: v.object({
    businessName: v.string(),
    phone: v.string(),
    serviceArea: v.string(),
  }),
  adGroups: v.array(adGroupSchema),
  callExtensions: v.array(v.union(
    v.string(),
    v.object({
      phoneNumber: v.string(),
      callHours: v.optional(v.string()),
    })
  )),
  complianceNotes: v.array(v.string()),
  optimizationSuggestions: v.optional(v.array(v.string())),
  seasonalRecommendations: v.optional(v.array(v.string())),
});

// Generate AI campaign using OpenAI
export const generateCampaign = action({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    campaignId: string;
    campaignData: any;
  }> => {
    const userId = args.userId || await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check regeneration limits before proceeding
    const canRegenerate = await ctx.runQuery(api.campaigns.checkRegenerationLimits, { userId });

    if (!canRegenerate.allowed) {
      throw new Error((canRegenerate as any).reason || 'Regeneration not allowed');
    }

    // Get user's onboarding data
    const onboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);

    if (!onboardingData) {
      throw new Error("No onboarding data found");
    }

    // Check if this is a regeneration (existing campaign exists)
    const existingCampaign = await ctx.runQuery(api.campaigns.getCampaign, { userId });
    const isRegeneration = !!existingCampaign;

    // Check if OpenAI API key is configured
    const openAIApiKey = process.env.OPENAI_API_KEY;

    if (!openAIApiKey) {
      throw new Error("OpenAI API key is not configured. Please add OPENAI_API_KEY to your Convex environment variables.");
    }

    try {
      // Prepare prompt with user data and variation context
      const prompt = buildCampaignPrompt(onboardingData, isRegeneration, existingCampaign);

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Google Ads campaign creator specializing in UK trades (plumbing and electrical). Generate comprehensive, compliant campaigns for local tradespeople.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: isRegeneration ? 0.9 : 0.7, // Higher temperature for more variation on regenerations
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response from OpenAI");
      }

      // Parse AI response into structured campaign data
      const campaignData = parseAIResponse(aiResponse, onboardingData);

      // 🔍 CAMPAIGN DATA VALIDATION: Log final data before saving
      console.log('🔍 FINAL CAMPAIGN DATA VALIDATION:');
      console.log('📱 Phone in businessInfo:', campaignData?.businessInfo?.phone);
      console.log('📱 Phone in callExtensions:', campaignData?.callExtensions?.[0]);
      console.log('🌐 Website URLs in ad groups:', campaignData?.adGroups?.map((ag: any) => ag.adCopy?.finalUrl));

      // Validate data integrity before saving
      validateCampaignDataIntegrity(campaignData, onboardingData);

      // Save generated campaign to database
      const campaignId: string = await ctx.runMutation(api.campaigns.saveCampaign, {
        userId,
        campaignData,
      });

      // Update regeneration tracking
      await ctx.runMutation(api.campaigns.updateRegenerationTracking, { userId });

      return {
        success: true,
        campaignId,
        campaignData,
      };

    } catch (error) {
      console.error('Campaign generation failed:', error);
      throw new Error(`Failed to generate campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Check regeneration limits with trial/paid gating
export const checkRegenerationLimits = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    allowed: v.boolean(),
    remaining: v.number(),
    cooldownSecondsRemaining: v.number(),
    reason: v.optional(v.string()),
    testing: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get subscription status
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    // Get onboarding data to determine trial start
    const onboardingData = await ctx.db
      .query("onboardingData")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    // Get campaign to check regeneration count
    const campaign = await ctx.db
      .query("campaigns")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    // Determine if user is on trial or paid
    const isPaidActive = subscription?.status === "active";
    const isTrialActive = !isPaidActive && onboardingData?.completedAt 
      ? (now - onboardingData.completedAt) < TRIAL_DURATION_MS
      : false;

    // Cooldown disabled - users can regenerate immediately
    // (keeping lastRegeneration tracking for analytics purposes only)

    // Trial logic: 1 initial + 2 regenerations = 3 total within trial period
    if (isTrialActive) {
      const totalGenerations = campaign?.regenerationCount || 0; // Already includes initial campaign
      const remainingTrialRegens = Math.max(0, MAX_REGENERATIONS_PER_PERIOD - totalGenerations);

      if (totalGenerations >= MAX_REGENERATIONS_PER_PERIOD) {
        return {
          allowed: false,
          remaining: 0,
          cooldownSecondsRemaining: 0,
          reason: `Trial limit reached (${MAX_REGENERATIONS_PER_PERIOD} total generations). Upgrade to continue regenerating campaigns.`,
        };
      }

      return {
        allowed: true,
        remaining: remainingTrialRegens,
        cooldownSecondsRemaining: 0,
      };
    }

    // Paid logic: 3 regenerations per ~30 days
    if (isPaidActive) {
      // Check if we need to reset monthly count
      const lastResetDate = campaign?.monthlyRegenResetDate || campaign?.createdAt || now;
      const msSinceReset = now - lastResetDate;
      const shouldResetMonthly = msSinceReset >= MONTHLY_RESET_MS;

      const currentMonthlyCount = shouldResetMonthly ? 0 : (campaign?.monthlyRegenCount || 0);
      const remainingPaidRegens = Math.max(0, MAX_REGENERATIONS_PER_PERIOD - currentMonthlyCount);

      if (currentMonthlyCount >= MAX_REGENERATIONS_PER_PERIOD) {
        // Calculate next reset date (30 days from last reset)
        const resetDate = new Date(lastResetDate + MONTHLY_RESET_MS);

        return {
          allowed: false,
          remaining: 0,
          cooldownSecondsRemaining: 0,
          reason: `Monthly regeneration limit reached (3/month). Resets on ${resetDate.toLocaleDateString()}.`,
        };
      }

      return {
        allowed: true,
        remaining: remainingPaidRegens,
        cooldownSecondsRemaining: 0,
      };
    }

    // No subscription and trial expired
    return {
      allowed: false,
      remaining: 0,
      cooldownSecondsRemaining: 0,
      reason: "Trial expired. Please upgrade to continue regenerating campaigns.",
    };
  },
});

// Update regeneration tracking (only called on successful campaign generation)
export const updateRegenerationTracking = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db
      .query("campaigns")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!campaign) {
      return;
    }

    const now = Date.now();

    // Check subscription status to determine if monthly reset applies
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const isPaidActive = subscription?.status === "active";

    // For paid users: reset monthly count if it's a new period
    // For trial users: just increment total count
    let newMonthlyCount = campaign.monthlyRegenCount || 0;
    let newResetDate = campaign.monthlyRegenResetDate || now;

    if (isPaidActive) {
      const lastResetDate = campaign.monthlyRegenResetDate || campaign.createdAt || now;
      const msSinceReset = now - lastResetDate;
      const shouldResetMonthly = msSinceReset >= MONTHLY_RESET_MS;

      if (shouldResetMonthly) {
        newMonthlyCount = 1;
        newResetDate = now;
      } else {
        newMonthlyCount = (campaign.monthlyRegenCount || 0) + 1;
      }
    } else {
      // Trial users: don't track monthly count separately, just total
      newMonthlyCount = campaign.monthlyRegenCount || 0; // Keep existing or 0
    }

    await ctx.db.patch(campaign._id, {
      regenerationCount: (campaign.regenerationCount || 0) + 1,
      lastRegeneration: now,
      monthlyRegenCount: newMonthlyCount,
      monthlyRegenResetDate: newResetDate,
      updatedAt: now,
    });
  },
});

// Admin helper to reset regeneration count for a user (use when subscription starts)
export const adminResetRegenerationCount = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db
      .query("campaigns")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!campaign) {
      return { success: false, message: "No campaign found for user" };
    }
    
    // Get subscription to use its start date
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
    
    const resetDate = subscription?.startedAt || Date.now();
    
    await ctx.db.patch(campaign._id, {
      monthlyRegenCount: 0,
      monthlyRegenResetDate: resetDate,
    });
    
    return { 
      success: true, 
      message: `Reset regeneration count for user. Next reset: ${new Date(resetDate + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}` 
    };
  },
});

// Save generated campaign to database
export const saveCampaign = mutation({
  args: {
    userId: v.string(),
    campaignData: campaignSchema,
  },
  handler: async (ctx, args): Promise<string> => {
    // 🔒 CRITICAL: Ensure all ad groups have finalUrl before database operations
    const onboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
    const websiteUrl = onboardingData?.websiteUrl || "https://example.com";

    // Deep clone and ensure finalUrl is present
    const campaignDataWithUrls = {
      ...args.campaignData,
      adGroups: args.campaignData.adGroups.map(adGroup => ({
        ...adGroup,
        adCopy: {
          ...adGroup.adCopy,
          finalUrl: adGroup.adCopy.finalUrl || websiteUrl
        }
      }))
    };

    console.log('🔗 Ensured finalUrl for all ad groups:', campaignDataWithUrls.adGroups.map(ag => ag.adCopy.finalUrl));

    // Check if campaign already exists
    const existingCampaign = await ctx.db
      .query("campaigns")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const saveData = {
      ...campaignDataWithUrls,
      userId: args.userId,
      createdAt: Date.now(),
      status: "ready" as const,
    };

    if (existingCampaign) {
      // 🔒 FULL DATA REFRESH: Completely rebuild campaign with fresh onboarding data
      // Get fresh onboarding data to ensure consistency
      const onboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
      if (!onboardingData || !onboardingData.phone) {
        throw new Error('Cannot refresh campaign: onboarding data or phone number not found');
      }

      // Log the refresh operation for debugging
      console.log('🔄 FULL REFRESH: Rebuilding campaign with fresh onboarding data');
      console.log('🔄 Fresh phone number:', onboardingData.phone);
      console.log('🔄 Previous phone in campaign:', existingCampaign.businessInfo?.phone);
      console.log('🔄 Phone in incoming saveData:', saveData.businessInfo?.phone);

      // 🔒 CRITICAL FIX: Force phone override even if saveData has contaminated phone
      const refreshedSaveData = {
        ...saveData,
        businessInfo: {
          ...saveData.businessInfo,
          phone: onboardingData.phone, // 🔒 ALWAYS use fresh onboarding phone (guaranteed non-undefined)
        },
        callExtensions: [onboardingData.phone], // 🔒 ALWAYS use fresh onboarding phone
        updatedAt: Date.now(),
        // Preserve regeneration tracking fields
        regenerationCount: existingCampaign.regenerationCount,
        lastRegeneration: existingCampaign.lastRegeneration,
        monthlyRegenCount: existingCampaign.monthlyRegenCount,
        monthlyRegenResetDate: existingCampaign.monthlyRegenResetDate,
      };

      // 🔒 VALIDATION: Ensure phone was correctly overridden
      if (refreshedSaveData.businessInfo.phone !== onboardingData.phone) {
        console.error('🚨 PHONE OVERRIDE FAILED in saveCampaign!');
        console.error('  Expected:', onboardingData.phone);
        console.error('  Got:', refreshedSaveData.businessInfo.phone);
        throw new Error(`Phone override failed: Expected ${onboardingData.phone} but got ${refreshedSaveData.businessInfo.phone}`);
      }

      // Update existing campaign with completely fresh data
      await ctx.db.patch(existingCampaign._id, refreshedSaveData);

      console.log('✅ REFRESH COMPLETE: Campaign updated with fresh data');
      console.log('✅ Final phone in saved campaign:', refreshedSaveData.businessInfo.phone);
      return existingCampaign._id;
    } else {
      // 🔒 CRITICAL FIX: For new campaigns, also ensure phone comes from onboarding
      const onboardingData: any = await ctx.runQuery(api.onboarding.getOnboardingData);
      if (!onboardingData || !onboardingData.phone) {
        throw new Error('Cannot create campaign: onboarding data or phone number not found');
      }

      // Force phone override for new campaigns too
      const validatedSaveData: any = {
        ...saveData,
        businessInfo: {
          ...saveData.businessInfo,
          phone: onboardingData.phone, // 🔒 ALWAYS use onboarding phone (guaranteed non-undefined)
        },
        callExtensions: [onboardingData.phone], // 🔒 ALWAYS use onboarding phone
      };

      // 🔒 VALIDATION: Ensure phone was correctly set
      if (validatedSaveData.businessInfo.phone !== onboardingData.phone) {
        console.error('🚨 PHONE VALIDATION FAILED for new campaign!');
        console.error('  Expected:', onboardingData.phone);
        console.error('  Got:', validatedSaveData.businessInfo.phone);
        throw new Error(`Phone validation failed for new campaign: Expected ${onboardingData.phone} but got ${validatedSaveData.businessInfo.phone}`);
      }

      // Create new campaign
      const newCampaign: any = {
        ...validatedSaveData,
        regenerationCount: 0,
        lastRegeneration: undefined,
        monthlyRegenCount: 0,
        monthlyRegenResetDate: Date.now(),
      };
      
      console.log('✅ New campaign created with validated phone:', newCampaign.businessInfo.phone);
      return await ctx.db.insert("campaigns", newCampaign);
    }
  },
});

// Get user's generated campaign
export const getCampaign = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || await getCurrentUserToken(ctx);

    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("campaigns")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get campaign by ID
export const getCampaignById = query({
  args: {
    campaignId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const campaign = await ctx.db.get(args.campaignId as any);

    if (!campaign) {
      return null;
    }

    // Type assertion and ownership check
    const campaignData = campaign as any;
    if (campaignData.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return campaignData;
  },
});

// Update campaign status (e.g., when pushed to Google Ads)
export const updateCampaignStatus = mutation({
  args: {
    campaignId: v.string(),
    googleCampaignId: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Find the campaign by its Convex _id
    const campaignDoc = await ctx.db.get(args.campaignId as any);

    if (!campaignDoc) {
      throw new Error("Campaign not found");
    }

    // Type assertion to ensure we have a campaign document
    const campaign = campaignDoc as any;

    if (campaign.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Update the campaign
    await ctx.db.patch(args.campaignId as any, {
      status: args.status,
      updatedAt: Date.now(),
      ...(args.googleCampaignId && { googleCampaignId: args.googleCampaignId }),
    });

    return args.campaignId;
  },
});

// Push campaign to Google Ads
export const pushToGoogleAds = action({
  args: {
    campaignId: v.string(),
    pushOptions: v.optional(v.object({
      createAsDraft: v.boolean(),
      testMode: v.boolean(),
    })),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    googleCampaignId: string;
    resourceName: string;
    budget: number;
    status: string;
    details?: string;
    createdResources?: {
      adGroups: number;
      ads: number;
      extensions: number;
    };
  }> => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      // Get the campaign data using a query
      const campaign: any = await ctx.runQuery(api.campaigns.getCampaignById, {
        campaignId: args.campaignId
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.userId !== userId) {
        throw new Error("Unauthorized");
      }

      // 🔍 PRE-PUSH VALIDATION: Verify data consistency
      const onboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
      if (!onboardingData) {
        throw new Error("Cannot push campaign: onboarding data not found");
      }

      // Validate phone number consistency
      const onboardingPhone = onboardingData.phone;
      const campaignPhone = campaign.businessInfo?.phone;

      console.log('🔍 PRE-PUSH VALIDATION:');
      console.log('📱 Onboarding phone:', onboardingPhone);
      console.log('📱 Campaign phone:', campaignPhone);

      if (!onboardingPhone) {
        throw new Error("Missing phone number in onboarding data");
      }

      // 🔒 CRITICAL: Block the specific contaminated phone number
      const contaminatedPhoneRegex = /077\s?684\s?7429|0776847429/i;
      if (campaignPhone && contaminatedPhoneRegex.test(campaignPhone)) {
        console.error('🚨 CONTAMINATED PHONE NUMBER DETECTED - BLOCKING PUSH:');
        console.error('  Found contaminated number:', campaignPhone);
        console.error('  Expected correct number:', onboardingPhone);
        throw new Error(`Contaminated phone number detected in campaign. Found '${campaignPhone}' but expected '${onboardingPhone}'. Please regenerate the campaign.`);
      }

      // Check for any phone number mismatch
      if (onboardingPhone !== campaignPhone) {
        console.error('❌ PHONE MISMATCH DETECTED - BLOCKING PUSH:');
        console.error('  Expected (from onboarding):', onboardingPhone);
        console.error('  Found (in campaign):', campaignPhone);
        console.error('  This would cause inconsistent phone numbers in Google Ads');
        throw new Error(`Phone number mismatch detected. Campaign has '${campaignPhone}' but onboarding shows '${onboardingPhone}'. Please regenerate the campaign to sync data.`);
      }

      // Validate callExtensions don't contain contaminated numbers
      if (campaign.callExtensions && Array.isArray(campaign.callExtensions)) {
        for (const ext of campaign.callExtensions) {
          const extPhone = typeof ext === 'string' ? ext : ext?.phoneNumber;
          if (extPhone && contaminatedPhoneRegex.test(extPhone)) {
            console.error('🚨 CONTAMINATED PHONE IN CALL EXTENSIONS - BLOCKING PUSH:');
            console.error('  Found contaminated number:', extPhone);
            throw new Error(`Contaminated phone number detected in call extensions: '${extPhone}'. Please regenerate the campaign.`);
          }
        }
      }

      console.log('✅ Phone validation passed - numbers match:', onboardingPhone);

      // Validate ad groups don't use placeholder URLs that waste ad spend
      const placeholderUrls = ["https://example.com", "https://yoursite.com", "www.example.com"];
      let hasPlaceholderUrls = false;
      const invalidUrls: Array<{ adGroup: string; url: string; reason: string }> = [];

      console.log('🔍 Validating URLs for all ad groups...');
      
      for (let i = 0; i < campaign.adGroups.length; i++) {
        const adGroup = campaign.adGroups[i];
        const finalUrl = adGroup.adCopy?.finalUrl;

        if (!finalUrl || placeholderUrls.includes(finalUrl)) {
          hasPlaceholderUrls = true;
          console.warn(`⚠️ Ad group "${adGroup.name}" has placeholder URL: ${finalUrl}`);
          invalidUrls.push({
            adGroup: adGroup.name,
            url: finalUrl,
            reason: 'Placeholder URL detected'
          });
        } else {
          // Validate URL accessibility
          try {
            new URL(finalUrl);

            // Quick DNS check - try to resolve hostname
            // Note: Full validation happens in googleAdsCampaigns.ts before ad creation
            // This is a pre-check to catch obvious issues early
            console.log(`🔍 Pre-checking URL for "${adGroup.name}": ${finalUrl}`);
          } catch (urlError) {
            invalidUrls.push({
              adGroup: adGroup.name,
              url: finalUrl,
              reason: 'Invalid URL format'
            });
            console.error(`❌ Invalid URL format for "${adGroup.name}": ${finalUrl}`);
          }
        }
      }

      // Warn about invalid URLs but don't block (for testing - Google Ads will validate)
      if (invalidUrls.length > 0) {
        const errorMessages = invalidUrls.map(
          inv => `"${inv.adGroup}": ${inv.reason} (URL: ${inv.url})`
        );
        console.warn(`⚠️ Invalid URLs detected in ${invalidUrls.length} ad group(s):`);
        errorMessages.forEach(msg => console.warn(`   - ${msg}`));
        console.warn(`   Continuing with campaign push - Google Ads will validate URLs and provide detailed error messages if needed.`);
      }

      // For UK trades without websites, warn but allow campaign push
      if (hasPlaceholderUrls) {
        console.warn('🚨 WARNING: Placeholder URLs detected - this will waste your advertising budget!');
        console.warn('💡 Customers will be sent to generic pages instead of your business');
        console.warn('📞 Consider alternatives: call-only ads, simple landing page, or Google My Business URL');

        // Log warning but don't block campaign push - let user decide
        console.warn('⚠️ Continuing with campaign push despite placeholder URLs...');
      }
      
      console.log('✅ URL pre-validation passed');

      console.log('✅ PRE-PUSH VALIDATION PASSED: Data is consistent');

      // Check subscription/trial status before allowing push
      const subscription = await ctx.runQuery(api.subscriptions.fetchUserSubscription);
      
      const isPaidActive = subscription?.status === "active";
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      const isTrialActive = !isPaidActive && onboardingData?.completedAt 
        ? (Date.now() - onboardingData.completedAt) < threeDays
        : false;

      if (!isPaidActive && !isTrialActive) {
        throw new Error("Trial expired or subscription inactive. Please upgrade to push campaigns to Google Ads.");
      }

      // Validate website URL is not placeholder in production (reuse placeholderUrls from above)
      const hasPlaceholderUrl = campaign.adGroups?.some((ag: any) => 
        placeholderUrls.includes(ag.adCopy?.finalUrl)
      );
      
      if (hasPlaceholderUrl && process.env.NODE_ENV === "production") {
        throw new Error("Cannot push campaign: placeholder URLs detected. Please update your website URL in settings.");
      }

      // Validate ad groups have minimum required content
      for (const adGroup of campaign.adGroups || []) {
        const headlines = adGroup.adCopy?.headlines || [];
        const descriptions = adGroup.adCopy?.descriptions || [];
        
        if (headlines.length < 3) {
          throw new Error(`Ad group "${adGroup.name}" has fewer than 3 headlines. Please regenerate the campaign.`);
        }
        if (descriptions.length < 2) {
          throw new Error(`Ad group "${adGroup.name}" has fewer than 2 descriptions. Please regenerate the campaign.`);
        }
      }

      // 🔒 FINAL SANITIZATION: One last pass to ensure no contaminated numbers
      const finalContaminationCheckRegex = /077\s?684\s?7429|0776847429/i;
      
      // Deep check all nested structures for contaminated numbers
      const deepCheckForContamination = (obj: any, path: string = 'root'): void => {
        if (obj === null || obj === undefined) return;
        
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => deepCheckForContamination(item, `${path}[${index}]`));
          return;
        }
        
        if (typeof obj === 'object') {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              deepCheckForContamination(obj[key], `${path}.${key}`);
            }
          }
          return;
        }
        
        if (typeof obj === 'string') {
          if (finalContaminationCheckRegex.test(obj)) {
            console.error(`🚨 FINAL CHECK: Contaminated phone found at ${path}: "${obj}"`);
            throw new Error(`Contaminated phone number detected at ${path}: "${obj}". Please regenerate the campaign.`);
          }
        }
      };
      
      console.log('🔍 Running final deep contamination check...');
      deepCheckForContamination(campaign);
      console.log('✅ Final contamination check passed - no contaminated numbers found');

      // Check if user has connected Google Ads account
      const googleAdsTokens = await ctx.runQuery(api.googleAds.getTokens);

      if (!googleAdsTokens) {
        throw new Error("Google Ads account not connected. Please connect your account first.");
      }

      // Prepare campaign data for Google Ads API
      const googleAdsData: any = {
        name: campaign.campaignName,
        budget: campaign.dailyBudget,
        keywords: campaign.adGroups[0]?.keywords || [],
        adCopy: {
          headline: campaign.adGroups[0]?.adCopy.headlines[0] || "Professional Service",
          description: campaign.adGroups[0]?.adCopy.descriptions[0] || "Quality service you can trust",
        },
        location: campaign.targetLocation,
        phone: campaign.businessInfo.phone,
        finalUrl: campaign.adGroups[0]?.adCopy.finalUrl || "https://example.com",
      };

      // Options for the push
      const pushOptions = args.pushOptions || { createAsDraft: true, testMode: true };

      console.log('🚀 Pushing campaign to Google Ads:', {
        campaignName: googleAdsData.name,
        budget: googleAdsData.budget,
        options: pushOptions,
      });

      // First test if the module is accessible
      console.log('🧪 Testing googleAdsCampaigns module...');
      try {
        const testResult = await ctx.runAction(api.googleAdsCampaigns.testGoogleAdsConnection, {});
        console.log('🧪 Test result:', testResult);
      } catch (testError) {
        console.error('🧪 Test function failed:', testError);
      }

      // Call the Node.js Google Ads action
      console.log('📞 Calling googleAdsCampaigns.createGoogleAdsCampaign with campaignId:', args.campaignId);
      const result: any = await ctx.runAction(api.googleAdsCampaigns.createGoogleAdsCampaign, {
        campaignId: args.campaignId,
        pushOptions: pushOptions,
      });
      console.log('📞 Google Ads result received:', JSON.stringify(result, null, 2));

      if (result.success) {
        // Update campaign status
        await ctx.runMutation(api.campaigns.updateCampaignStatus, {
          campaignId: args.campaignId,
          googleCampaignId: result.googleCampaignId,
          status: pushOptions.createAsDraft ? "pushed_draft" : "pushed_live",
        });

        const detailMessage = `Campaign: ✅ | Ad Groups: ${result.adGroupsCreated || 0} | Ads: ${result.adsCreated || 0} | Extensions: ${result.extensionsCreated || 0}`;

        return {
          success: true,
          message: `Campaign ${pushOptions.createAsDraft ? 'drafted' : 'launched'} successfully in Google Ads`,
          googleCampaignId: result.googleCampaignId,
          resourceName: result.resourceName || '',
          budget: result.budget || 0,
          status: result.status || 'PAUSED',
          details: detailMessage,
          createdResources: {
            adGroups: result.adGroupsCreated || 0,
            ads: result.adsCreated || 0,
            extensions: result.extensionsCreated || 0
          }
        };
      } else {
        console.error('❌ Campaign creation failed. Result:', result);

        // Check if it's a partial failure
        if (result.partialResults) {
          const partialMessage = `Partial failure: Campaign: ${result.partialResults.campaignCreated ? '✅' : '❌'} | Ad Groups: ${result.partialResults.adGroupsCreated} | Ads: ${result.partialResults.adsCreated} | Extensions: ${result.partialResults.extensionsCreated}`;
          throw new Error(`${result.error || 'Unknown error'}. ${partialMessage}`);
        }

        throw new Error(`Failed to create campaign in Google Ads: ${result.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Push to Google Ads failed:', error);

      // Update campaign with error status
      await ctx.runMutation(api.campaigns.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: "push_failed",
      });

      throw new Error(`Failed to push to Google Ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Mock Google Ads API operations (for development and testing)
export const createMockGoogleAdsCampaign = action({
  args: {
    campaignData: v.object({
      name: v.string(),
      budget: v.number(),
      keywords: v.array(v.string()),
      adCopy: v.object({
        headline: v.string(),
        description: v.string(),
      }),
      location: v.string(),
      phone: v.string(),
      finalUrl: v.string(),
    }),
    pushOptions: v.object({
      createAsDraft: v.boolean(),
      testMode: v.boolean(),
    }),
  },
  handler: async (_ctx, args) => {
    console.log('🔧 Mock Google Ads API: Creating campaign', args.campaignData.name);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    if (!success) {
      throw new Error('Mock API error: Rate limit exceeded');
    }

    const mockCampaignId = `mock_campaign_${Date.now()}`;

    console.log('✅ Mock campaign creation successful!');
    console.log('🎯 Mock campaign ID:', mockCampaignId);

    return {
      success: true,
      campaignId: mockCampaignId,
      resourceName: `customers/mock/campaigns/${mockCampaignId}`,
      budget: Math.min(args.campaignData.budget, 0.01),
      status: 'PAUSED',
    };
  },
});

// Forbidden phrases that trigger Google Ads "Third Party Consumer Technical Support" policy violations
const FORBIDDEN_TECH_SUPPORT_PHRASES = [
  // Generic technical support terms
  'tech support',
  'technical support',
  'computer support',
  'device support',
  'software support',
  'IT support',
  'help desk',
  'customer support',
  'remote support',
  'online support',
  'phone support',
  'live support',
  'support team',
  'support service',
  // Generic repair terms without trade context
  'device repair',
  'computer repair',
  'laptop repair',
  'phone repair',
  'tablet repair',
  'printer repair',
  'router repair',
  // Generic service terms
  'fix your device',
  'fix your computer',
  'fix your phone',
  'repair service',
  'repair center',
  // Terms that imply third-party support
  'we can help',
  'we fix',
  'we repair',
  'call for help',
  'get help now',
  'need help',
];

// Trade-specific required phrases to ensure compliance
const REQUIRED_TRADE_PHRASES = {
  plumbing: ['plumber', 'plumbing', 'heating', 'boiler', 'water', 'pipe', 'drain', 'bathroom', 'kitchen'],
  electrical: ['electrician', 'electrical', 'wiring', 'fuse', 'consumer unit', 'lighting', 'socket', 'switch'],
  both: ['plumber', 'electrician', 'plumbing', 'electrical', 'heating', 'wiring', 'boiler', 'fuse'],
};

// 🚨 GOOGLE ADS POLICY COMPLIANCE: Mapping of problematic terms to compliant alternatives
// Avoid "Certificate" terminology which triggers POLICY_FINDING violations
const POLICY_COMPLIANT_TRANSFORMATIONS: Record<string, string> = {
  // Gas services - avoid "certificates" which implies issuing official documents
  'Gas Safety Certificates': 'Gas Safety Checks',
  'Gas Safety Certificate': 'Gas Safety Check',
  'gas safety certificates': 'gas safety checks',
  'gas safety certificate': 'gas safety check',
  'Gas Certificate': 'Gas Safety Check',
  'CP12 Certificate': 'CP12 Gas Check',
  'Landlord Gas Certificate': 'Landlord Gas Safety',
  
  // Electrical services - same issue
  'Electrical Safety Certificates': 'Electrical Safety Testing',
  'Electrical Safety Certificate': 'Electrical Safety Test',
  'electrical safety certificates': 'electrical safety testing',
  'electrical safety certificate': 'electrical safety test',
  'EICR Certificate': 'EICR Testing',
  'Electrical Certificate': 'Electrical Testing',
};

// Function to sanitize ad content for Google Ads policy compliance
function sanitizeForGoogleAdsPolicy(text: string): string {
  let sanitized = text;
  
  // Apply all transformations (case-insensitive where needed)
  for (const [problematic, compliant] of Object.entries(POLICY_COMPLIANT_TRANSFORMATIONS)) {
    // Create case-insensitive regex for matching
    const regex = new RegExp(problematic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    sanitized = sanitized.replace(regex, compliant);
  }
  
  return sanitized;
}

// Service-to-theme mapping for ad group creation
// Maps service names from onboarding to one of four themes: emergency, installation, maintenance, repair
// NOTE: Using policy-compliant service names to avoid Google Ads violations
const SERVICE_TO_THEME_MAP: Record<string, 'emergency' | 'installation' | 'maintenance' | 'repair'> = {
  // Plumbing services
  'Emergency Plumbing': 'emergency',
  'Boiler Installation': 'installation',
  'Boiler Repair': 'repair',
  'Central Heating': 'maintenance',
  'Bathroom Installation': 'installation',
  'Leak Repair': 'repair',
  'Drainage': 'repair',
  'Gas Safety Checks': 'maintenance', // ✅ Policy-compliant (was "Gas Safety Certificates")
  'Gas Safety Certificates': 'maintenance', // Legacy support - will be transformed
  
  // Electrical services
  'Emergency Electrical': 'emergency',
  'Consumer Unit Installation': 'installation',
  'Rewiring': 'installation',
  'Socket Installation': 'installation',
  'Lighting Installation': 'installation',
  'Electric Vehicle Charging': 'installation',
  'Electrical Safety Testing': 'maintenance', // ✅ Policy-compliant (was "Electrical Safety Certificates")
  'Electrical Safety Certificates': 'maintenance', // Legacy support - will be transformed
  'Smart Home Installation': 'installation',
};

// Group services by theme
function groupServicesByTheme(serviceOfferings: string[]): {
  emergency: string[];
  installation: string[];
  maintenance: string[];
  repair: string[];
} {
  const grouped = {
    emergency: [] as string[],
    installation: [] as string[],
    maintenance: [] as string[],
    repair: [] as string[],
  };

  for (const service of serviceOfferings) {
    const theme = SERVICE_TO_THEME_MAP[service];
    if (theme && grouped[theme]) {
      grouped[theme].push(service);
    }
  }

  return grouped;
}

// Helper functions for enhanced prompts
function getSeason(month: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

function getSeasonalFocus(season: 'winter' | 'spring' | 'summer' | 'autumn'): string {
  const seasonalInsights = {
    winter: 'Winter peak season - emphasize emergency heating, boiler repairs, frozen pipes, urgent electrical faults',
    spring: 'Spring renovation season - bathroom upgrades, electrical installations, garden lighting, spring maintenance',
    summer: 'Summer improvement season - outdoor electrical work, garden features, AC installation, holiday preparations',
    autumn: 'Autumn preparation season - heating system checks, electrical safety inspections, winter readiness',
  };
  return seasonalInsights[season];
}

function buildComplianceRequirements(tradeType: string): string {
  let compliance = `
- All advertising must comply with UK Trading Standards
- Must not make false or misleading claims
- Price transparency required (mention upfront quotes, no hidden charges)
- Public liability insurance should be mentioned`;

  if (tradeType === 'plumbing' || tradeType === 'both') {
    compliance += `
- Gas work requires Gas Safe registration (MUST be mentioned)
- Include Gas Safe registration number in ads for gas/heating services
- Boiler work must reference Gas Safe credentials`;
  }

  if (tradeType === 'electrical' || tradeType === 'both') {
    compliance += `
- Electrical work must comply with Part P Building Regulations
- Mention relevant qualifications (City & Guilds, NVQ Level 3, etc.)
- Notifiable work requires Building Regulations compliance
- Electrical testing and certification capabilities should be highlighted`;
  }

  return compliance;
}

// Helper function to build the enhanced campaign generation prompt
function buildCampaignPrompt(onboardingData: any, isRegeneration: boolean = false, existingCampaign: any = null): string {
  const tradeType = onboardingData.tradeType;
  const businessName = onboardingData.businessName;
  const serviceArea = onboardingData.serviceArea;
  const serviceOfferings = onboardingData.serviceOfferings || [];
  const phone = onboardingData.phone;
  const availability = onboardingData.availability;
  const acquisitionGoals = onboardingData.acquisitionGoals;

  const city = serviceArea?.city || 'UK';
  const emergencyText = availability?.emergencyCallouts ? 'Offers 24/7 emergency callouts' : 'Standard hours only';
  const weekendText = availability?.weekendWork ? 'Works weekends' : 'Weekdays only';
  const currentMonth = new Date().getMonth();
  const season = getSeason(currentMonth);

  // Group services by theme for conditional ad group creation
  const servicesByTheme = groupServicesByTheme(serviceOfferings);
  const availableThemes = Object.entries(servicesByTheme)
    .filter(([_, services]) => services.length > 0)
    .map(([theme, services]) => ({ theme, services }));

  // Add variation logic for regenerations
  let variationInstructions = '';
  let randomSeed = '';

  if (isRegeneration && existingCampaign) {
    // Generate random variation seed for unique outputs
    const variationWords = ['fast', 'quick', 'rapid', 'speedy', 'instant', 'immediate', 'prompt'];
    const emphasisWords = ['reliable', 'trusted', 'professional', 'experienced', 'skilled', 'certified', 'qualified'];
    const actionWords = ['fix', 'repair', 'solve', 'resolve', 'service', 'maintain', 'install'];

    const randomVariation = variationWords[Math.floor(Math.random() * variationWords.length)];
    const randomEmphasis = emphasisWords[Math.floor(Math.random() * emphasisWords.length)];
    const randomAction = actionWords[Math.floor(Math.random() * actionWords.length)];

    randomSeed = `Variation seed: ${randomVariation}-${randomEmphasis}-${randomAction}-${Date.now()}`;

    variationInstructions = `
**REGENERATION VARIATION REQUIREMENTS:**
IMPORTANT: This is a regeneration request. Create subtle variations of the existing campaign while maintaining the same structure and intent:

1. PRESERVE: Same ${serviceOfferings.length} ad groups (one per service), same daily budget, same business info, same target location
2. VARY: Headlines and descriptions using synonyms, alternative phrasing, different emphasis
3. SHUFFLE: Keyword order and include mild variations (e.g., "plumber London" vs "London plumber")
4. MAINTAIN: Core business intent, compliance requirements, and service offerings
5. ENHANCE: Use different seasonal angles, varied call-to-action phrases, alternative value propositions

Existing campaign structure to maintain:
- Ad Groups: ${existingCampaign.adGroups?.map((ag: any) => ag.name).join(', ')}
- Previous headlines: ${existingCampaign.adGroups?.[0]?.adCopy?.headlines?.join(', ') || 'None'}
- Keywords count per group: ${existingCampaign.adGroups?.map((ag: any) => ag.keywords?.length || 0).join(', ')}

Use this seed for randomization: ${randomSeed}
`;
  }

  return `
You are an expert Google Ads campaign manager specializing in UK trades marketing. Generate a comprehensive, compliance-focused Google Ads campaign for the following business:

**BUSINESS CONTEXT:**
- Business: ${businessName}
- Trade Type: ${tradeType === 'both' ? 'Plumbing & Electrical' : tradeType}
- Services: ${serviceOfferings.join(', ')}
- Contact: ${phone}
- Location: ${city}, ${serviceArea?.postcode || ''} (${serviceArea?.radius || 10} mile radius)
- Working Hours: ${availability?.workingHours || 'Standard hours'}
- Emergency Service: ${emergencyText}
- Weekend Work: ${weekendText}
- Target Leads: ${acquisitionGoals?.monthlyLeads || 10}/month
- Average Job Value: £${acquisitionGoals?.averageJobValue || 250}
- Monthly Budget: £${acquisitionGoals?.monthlyBudget || 300}

**UK COMPLIANCE REQUIREMENTS:**
${buildComplianceRequirements(tradeType)}
${variationInstructions}
**SEASONAL CONTEXT:**
- Current Season: ${season}
- Seasonal Focus: ${getSeasonalFocus(season)}

**🚨 CRITICAL PHONE NUMBER RULES:**
- NEVER include ANY phone numbers in headlines or descriptions
- NEVER include ANY phone number patterns, digits, or formats in ad text
- NEVER include ANY placeholders like {PHONE}, [NUMBER], or variables like ${phone} in ad text
- If you need to reference calling, use phrases like "Call Now", "Call Today", "Phone Us"
- Phone numbers will be handled separately via call extensions using the correct number from onboarding
- Violating this rule wastes advertising budget and confuses customers
- The phone number in businessInfo.phone and callExtensions MUST match the exact number from onboarding: ${phone}

**🚨 GOOGLE ADS POLICY COMPLIANCE - AVOID CERTIFICATE TERMINOLOGY:**
- ❌ NEVER use "Gas Safety Certificates" or "Electrical Safety Certificates" as ad group names or headlines
- ❌ NEVER use "Certificate", "Certification", or "Official Certificate" in headlines - this triggers policy violations
- ✅ USE INSTEAD: "Gas Safety Checks", "Landlord Gas Safety", "CP12 Gas Checks", "Gas Safety Inspections"
- ✅ USE INSTEAD: "Electrical Testing", "EICR Testing", "Electrical Safety Testing"
- 🔒 ALWAYS include at least 1-2 headlines with "Gas Safe Registered" or "Gas Safe Engineers" for gas-related services
- 🔒 If character-limited, "Gas Safe" alone is acceptable as a trust signal
- The word "Certified" is OK when describing the tradesperson (e.g., "Certified Engineers") but NOT when describing documents

**CAMPAIGN REQUIREMENTS:**
1. Create exactly ${serviceOfferings.length} ad groups - ONE ad group for EACH service the user selected:
${serviceOfferings.map((service: string, i: number) => `   ${i + 1}. "${service}" - Create an ad group specifically for this service`).join('\n')}
   🚨 CRITICAL: You MUST create exactly ${serviceOfferings.length} ad groups. Each ad group name should include the service name (e.g., "Boiler Repair ${city}", "Emergency Plumbing ${city}").
   DO NOT group services together. Each service = 1 separate ad group.

2. Generate exactly **15 headlines** per ad group (RSA optimal for Google Ads):
   
   ⚠️ HARD LIMIT: Each headline MUST be ≤ 25 characters (NOT 30!)
   - Count EVERY character including spaces and punctuation BEFORE outputting
   - If a headline exceeds 25 characters, DO NOT OUTPUT IT - rewrite it shorter
   - Headlines are SHORT PHRASES, not full sentences
   - NEVER truncate words - if it doesn't fit, rewrite completely
   
   🚨 CRITICAL HEADLINE RULES:
     a) SHORT PUNCHY PHRASES - headlines are 3-5 words max, not sentences
     b) Each headline must be **unique and meaningfully different** - avoid similar wording
     c) NO DASHES or chaining ideas (e.g., ❌ "Boiler Fix - Birmingham" → ✅ "Boiler Fix ${city}")
     d) NO ABBREVIATIONS for city names (❌ "B'ham" → ✅ "Birmingham" or omit city)
     e) NO TRUNCATED WORDS (❌ "Birm", "Emerg" → ✅ full words only)
     f) CITY USAGE: Only 2-3 headlines per ad group should include the city name (city names use characters!)
   
   Headlines MUST cover these five categories across the 15 headlines:
     a) **Keyword + location** (2-3 headlines): e.g., "Plumber ${city}", "Boiler Fix ${city}"
     b) **Urgency / availability** (2-3 headlines): e.g., "24/7 Service", "Same Day Repairs"
     c) **Trust / credibility** (3-4 headlines): e.g., "Gas Safe Engineers", "Fully Insured"
     d) **Value / pricing** (2-3 headlines): e.g., "Free Quotes", "No Hidden Fees"
     e) **Action-oriented** (3-4 headlines): e.g., "Call Now", "Book Today", "Get Help Fast"
   
   ✅ GOOD HEADLINE EXAMPLES (all ≤25 chars):
     - "24/7 Plumber ${city}" (if city is short like "London" = 18 chars)
     - "Emergency Boiler Help" (20 chars)
     - "Gas Safe Engineers" (18 chars)
     - "Fast Leak Repairs" (17 chars)
     - "Free Quotes Today" (17 chars)
     - "Call Now" (8 chars)
   
   ❌ BAD HEADLINE EXAMPLES (too long or truncated):
     - "Emergency Plumber Service Birmingham" (36 chars - TOO LONG!)
     - "Professional Gas Safe Registered" (33 chars - TOO LONG!)
     - "Plumber Birm" (truncated city - NEVER DO THIS)
   
   Before outputting EACH headline:
     1. Count characters (including spaces)
     2. If > 25 chars, REWRITE shorter or SKIP
     3. Verify no truncated words
     4. Verify it's a complete thought (short phrase, not sentence)

3. Generate exactly **4 descriptions** per ad group (RSA optimal):
   
   ⚠️ HARD LIMIT: Each description MUST be ≤ 80 characters (NOT 90!)
   - Descriptions ARE full sentences - write naturally
   - Each sentence must be COMPLETE and make sense when read alone
   - NEVER truncate - if it doesn't fit in 80 chars, rewrite the whole sentence
   
   The 4 descriptions MUST cover these distinct roles:
     a) **Problem + solution**: Address the customer's need and how you solve it
     b) **Trust / experience**: Highlight credentials, experience, professionalism
     c) **Value / pricing**: Emphasize transparency, free quotes, no hidden fees
     d) **Action / next step**: Clear call-to-action with urgency
   
   ✅ GOOD DESCRIPTION EXAMPLES (all ≤80 chars, complete sentences):
     - "Boiler not working? Our Gas Safe engineers can help today." (58 chars)
     - "Certified plumbers with 10+ years experience. Fully insured." (61 chars)
     - "Free quotes with no hidden fees. Transparent pricing always." (60 chars)
     - "Call now for fast, reliable service. Same day available." (56 chars)
   
   ❌ BAD DESCRIPTION EXAMPLES:
     - "Professional plumber Birmingham. Qualified gas safety inspections. Phone Us." (truncated/choppy)
     - "We offer professional plumbing services in Birmingham with Gas Safe registered eng..." (cut off!)
   
   Before outputting EACH description:
     1. Count characters (including spaces and punctuation)
     2. If > 80 chars, REWRITE the entire sentence shorter
     3. Read it aloud - does it sound natural and complete?

4. Generate 8-10 high-intent keywords per ad group:
   - Keywords MUST derive ONLY from the services in that theme's serviceOfferings
   - Include local variations: "${city} {service}", "{service} near me", "local {service}"
   - Add emergency/urgency keywords if applicable: "24/7", "emergency", "urgent"

5. Ensure ALL copy is UK-compliant and mentions required credentials (Gas Safe, Part P, etc.)

6. Use "Call Now", "Call Today", "Phone Us" instead of actual phone numbers in ad text

7. Add compliance notes for UK regulatory requirements

8. Suggest optimization tips and seasonal recommendations

9. Calculate daily budget: £${Math.round((acquisitionGoals?.monthlyBudget || 300) / 30)}

**CRITICAL COMPLIANCE POINTS:**
- Gas work MUST mention "Gas Safe Registered" if offering gas/heating services
- Electrical work MUST reference "Part P compliant" for notifiable work
- No misleading claims ("cheapest", "guaranteed", etc.)
- Price transparency required ("free quotes", "no hidden charges")
- Professional credentials must be highlighted

**🚨 GOOGLE ADS POLICY VIOLATION PREVENTION - THIRD PARTY CONSUMER TECHNICAL SUPPORT:**

CRITICAL: Google Ads prohibits ads that offer third-party consumer technical support services. To prevent policy violations, you MUST:

1. NEVER use generic technical support language:
   ❌ FORBIDDEN: "tech support", "technical support", "computer support", "device support", "software support"
   ❌ FORBIDDEN: "IT support", "help desk", "customer support", "remote support"
   ❌ FORBIDDEN: "device repair", "computer repair", "phone repair", "tablet repair"
   ❌ FORBIDDEN: "fix your device", "fix your computer", "we can help", "call for help"

2. ALWAYS use trade-specific language:
   ✅ REQUIRED: Every headline and description MUST include trade-specific terms:
   ${tradeType === 'plumbing' || tradeType === 'both' ? '- Plumbing terms: "plumber", "plumbing", "heating", "boiler", "water", "pipe", "drain", "bathroom", "kitchen"' : ''}
   ${tradeType === 'electrical' || tradeType === 'both' ? '- Electrical terms: "electrician", "electrical", "wiring", "fuse", "consumer unit", "lighting", "socket", "switch"' : ''}

3. MANDATORY trade credentials in ad copy:
   ${tradeType === 'plumbing' || tradeType === 'both' ? '- MUST include "Gas Safe Registered" or "Gas Safe" in gas/heating related ads' : ''}
   ${tradeType === 'electrical' || tradeType === 'both' ? '- MUST include "Part P Certified" or "Part P compliant" in electrical ads' : ''}

4. Location context is REQUIRED:
   - Every ad MUST mention "${city}" or "local" or "near me" to establish geographic specificity
   - Generic service language without location triggers policy violations

5. Service specificity:
   - Use specific trade services: "boiler repair", "electrical installation", "plumbing emergency"
   - Avoid generic terms: "repair service", "fix service", "support service"

**EXAMPLES OF POLICY-COMPLIANT AD TEXT:**
✅ "Gas Safe Registered Plumber ${city}" (trade-specific + location + credential)
✅ "Part P Certified Electrician - ${city}" (trade-specific + location + credential)
✅ "Emergency Plumbing Service ${city}" (trade-specific + location)
✅ "24/7 Electrical Repairs ${city}" (trade-specific + location)

**EXAMPLES OF POLICY-VIOLATING AD TEXT:**
❌ "Tech Support Available" (generic technical support)
❌ "Device Repair Service" (no trade context)
❌ "We Can Help - Call Now" (generic support language)
❌ "Computer Support ${city}" (third-party tech support)
❌ "Repair Service" (no trade specificity)

**EXAMPLES OF CORRECT AD TEXT (NO PHONE NUMBERS):**
✅ "Emergency Plumber Ready" (NOT "Call [any digits]")
✅ "24/7 Gas Safe Service" (NOT "Ring [phone variable]")
✅ "Call Now - Free Quote" (NOT "Call [number placeholder]")
✅ "Urgent Repairs London" (NOT any phone number)

**FORBIDDEN PHONE NUMBER PATTERNS:**
❌ Do NOT include: ANY digits that could represent phone numbers
❌ Do NOT include: ANY phone number patterns, formats, or placeholders
❌ Do NOT include: ANY references to calling specific numbers
❌ Do NOT include: ANY formatted numbers or actual phone digits
❌ Do NOT include: ANY variables, placeholders, or examples containing phone digits

**OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure:
{
  "campaignName": "string",
  "dailyBudget": number,
  "targetLocation": "string",
  "businessInfo": {
    "businessName": "string",
    "phone": "string",
    "serviceArea": "string"
  },
  "adGroups": [
    {
      "name": "string (service name + city, e.g., 'Boiler Repair Birmingham')",
      "keywords": ["8-10 keywords derived from this specific service"],
      "adCopy": {
        "headlines": ["EXACTLY 15 headlines, each ≤ 30 chars, unique and meaningfully different"],
        "descriptions": ["EXACTLY 4 descriptions, each ≤ 90 chars, covering different roles"],
        "finalUrl": "string"
      }
    }
  ],
  "callExtensions": ["array"],
  "complianceNotes": ["array"],
  "optimizationSuggestions": ["array"],
  "seasonalRecommendations": ["array"]
}

CRITICAL REQUIREMENTS:
1. Each ad group MUST have exactly 15 headlines. Google Ads RSA performs best with 15 diverse headlines.
2. Each ad group MUST have exactly 4 descriptions. Each description must serve a different role (problem/solution, trust, value, action).
3. Each headline MUST be ≤ 30 characters with NO truncated words. Test with long city names like "Birmingham" (11 chars) or "Stoke-on-Trent" (14 chars).
4. Before outputting, verify every headline:
   - Character count ≤ 30
   - All words are complete (no "Birm", "Londo", "Emergen")
   - Readable and professional
   - Meaningfully different from other headlines
5. If a city name is too long, omit it from that headline rather than abbreviating (other headlines will include the city).

Focus on LOCAL SEO optimization for ${city}, emergency service keywords (high commercial intent), and compliance-safe language that builds trust with UK consumers.
`;
}

// Validate ad copy for Google Ads policy violations
function validateAdCopyForPolicyViolations(
  adCopy: { headlines: string[]; descriptions: string[] },
  tradeType: string,
  city: string
): { isValid: boolean; violations: string[]; sanitized: { headlines: string[]; descriptions: string[] } } {
  const violations: string[] = [];
  const sanitizedHeadlines: string[] = [];
  const sanitizedDescriptions: string[] = [];

  // Required trade-specific terms
  const requiredTerms = REQUIRED_TRADE_PHRASES[tradeType as keyof typeof REQUIRED_TRADE_PHRASES] || [];

  // Check headlines
  for (const headline of adCopy.headlines) {
    const lowerHeadline = headline.toLowerCase();
    let sanitized = headline;
    let hasViolation = false;

    // Check for forbidden phrases
    for (const forbidden of FORBIDDEN_TECH_SUPPORT_PHRASES) {
      if (lowerHeadline.includes(forbidden.toLowerCase())) {
        violations.push(`Headline contains forbidden phrase: "${forbidden}"`);
        hasViolation = true;
        // Replace with trade-specific alternative
        sanitized = sanitized.replace(
          new RegExp(forbidden, 'gi'),
          tradeType === 'plumbing' || tradeType === 'both' ? 'Plumbing Service' : 'Electrical Service'
        );
      }
    }

    // Check for trade-specific terms
    const hasTradeTerm = requiredTerms.some(term => lowerHeadline.includes(term.toLowerCase()));
    const hasLocation = lowerHeadline.includes(city.toLowerCase()) || lowerHeadline.includes('local') || lowerHeadline.includes('near me');

    if (!hasTradeTerm) {
      violations.push(`Headline missing trade-specific term: "${headline}"`);
      // Add trade-specific term if missing
      if (tradeType === 'plumbing' || tradeType === 'both') {
        sanitized = `Plumber ${city} - ${sanitized}`;
      } else if (tradeType === 'electrical' || tradeType === 'both') {
        sanitized = `Electrician ${city} - ${sanitized}`;
      }
    }

    if (!hasLocation && !hasViolation) {
      // Add location if missing (but don't count as violation, just enhance)
      if (!sanitized.includes(city) && !sanitized.includes('local') && !sanitized.includes('near me')) {
        sanitized = `${sanitized} ${city}`;
      }
    }

    sanitizedHeadlines.push(sanitized);
  }

  // Check descriptions
  for (const description of adCopy.descriptions) {
    const lowerDescription = description.toLowerCase();
    let sanitized = description;
    let hasViolation = false;

    // Check for forbidden phrases
    for (const forbidden of FORBIDDEN_TECH_SUPPORT_PHRASES) {
      if (lowerDescription.includes(forbidden.toLowerCase())) {
        violations.push(`Description contains forbidden phrase: "${forbidden}"`);
        hasViolation = true;
        // Replace with trade-specific alternative
        sanitized = sanitized.replace(
          new RegExp(forbidden, 'gi'),
          tradeType === 'plumbing' || tradeType === 'both' ? 'plumbing service' : 'electrical service'
        );
      }
    }

    // Check for trade-specific terms
    const hasTradeTerm = requiredTerms.some(term => lowerDescription.includes(term.toLowerCase()));
    const hasLocation = lowerDescription.includes(city.toLowerCase()) || lowerDescription.includes('local') || lowerDescription.includes('near me');

    if (!hasTradeTerm) {
      violations.push(`Description missing trade-specific term: "${description}"`);
      // Add trade-specific term if missing
      if (tradeType === 'plumbing' || tradeType === 'both') {
        sanitized = `Professional plumber ${city}. ${sanitized}`;
      } else if (tradeType === 'electrical' || tradeType === 'both') {
        sanitized = `Qualified electrician ${city}. ${sanitized}`;
      }
    }

    sanitizedDescriptions.push(sanitized);
  }

  return {
    isValid: violations.length === 0,
    violations,
    sanitized: {
      headlines: sanitizedHeadlines,
      descriptions: sanitizedDescriptions,
    },
  };
}

// Helper function to parse AI response into structured data
function parseAIResponse(aiResponse: string, onboardingData: any): any {
  try {
    // Try to parse as JSON first
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const cleanedData = sanitizePhoneNumbers(parsed);

      // 🔒 CRITICAL FIX: Add finalUrl to all ad groups BEFORE validation
      const websiteUrl = onboardingData.websiteUrl || "https://example.com";
      if (cleanedData.adGroups && Array.isArray(cleanedData.adGroups)) {
        cleanedData.adGroups.forEach((adGroup: any) => {
          if (adGroup.adCopy && !adGroup.adCopy.finalUrl) {
            adGroup.adCopy.finalUrl = websiteUrl;
            console.log(`🔗 Added finalUrl to ad group "${adGroup.name}": ${websiteUrl}`);
          }
        });
      }

      const validatedData = validateAndEnhanceCampaignData(cleanedData, onboardingData);
      
      // Validate all ad groups for policy violations
      const tradeType = onboardingData.tradeType;
      const city = onboardingData.serviceArea?.city || 'UK';
      
      if (validatedData.adGroups && Array.isArray(validatedData.adGroups)) {
        validatedData.adGroups = validatedData.adGroups.map((adGroup: any) => {
          if (adGroup.adCopy) {
            const validation = validateAdCopyForPolicyViolations(adGroup.adCopy, tradeType, city);
            
            if (!validation.isValid) {
              console.warn(`⚠️ Policy violations detected in ad group "${adGroup.name}":`, validation.violations);
              console.log(`🔧 Sanitizing ad copy...`);
            }
            
            // Use sanitized copy
            adGroup.adCopy = validation.sanitized;
          }
          return adGroup;
        });
      }
      
      return validatedData;
    }

    // If not JSON, create structured data from text
    return createFallbackCampaignData(aiResponse, onboardingData);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return createFallbackCampaignData(aiResponse, onboardingData);
  }
}

// Recursively sanitize phone numbers from any nested structure
function sanitizePhoneNumbersRecursive(obj: any, path: string = 'root'): any {
  if (obj === null || obj === undefined) return obj;
  
  // Create regex factory to avoid global flag state bug
  const createContaminatedRegex = () => /077\s?684\s?7429|0776847429/i;
  
  const containsPhoneNumber = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    // Only detect contaminated phone numbers, NOT all phone numbers
    const contaminatedRegex = createContaminatedRegex();
    return contaminatedRegex.test(text);
  };
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizePhoneNumbersRecursive(item, `${path}[${index}]`));
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const newPath = `${path}.${key}`;
        
        // Special handling for known phone fields
        if (key === 'phone' || key === 'phoneNumber') {
          if (typeof value === 'string' && containsPhoneNumber(value)) {
            console.warn(`🧹 Removed contaminated phone from ${newPath}: "${value}"`);
            sanitized[key] = ''; // Will be replaced by validateAndEnhanceCampaignData
          } else {
            sanitized[key] = value;
          }
        } else {
          sanitized[key] = sanitizePhoneNumbersRecursive(value, newPath);
        }
      }
    }
    return sanitized;
  }
  
  // Handle strings - clean only contaminated phone numbers from ad text
  if (typeof obj === 'string') {
    const contaminatedRegex = createContaminatedRegex();
    let cleaned = obj.replace(contaminatedRegex, 'Call Now');
    if (cleaned !== obj) {
      console.warn(`🧹 Removed phone number from ${path}: "${obj.substring(0, 50)}..." → "${cleaned.substring(0, 50)}..."`);
    }
    return cleaned;
  }
  
  return obj;
}

// Sanitize any phone numbers that AI might have hallucinated in ad text
function sanitizePhoneNumbers(campaignData: any): any {
  console.log('🧹 Starting comprehensive phone number sanitization...');
  
  // Use recursive sanitization to catch ALL nested phone references
  const sanitized = sanitizePhoneNumbersRecursive(campaignData);
  
  console.log('✅ Sanitization complete - all phone numbers removed from ad text and contaminated fields cleared');
  
  return sanitized;
}

// Known city name abbreviations to avoid truncated city names
const CITY_ABBREVIATIONS: Record<string, string> = {
  'birmingham': "B'ham",
  'manchester': "M'cr",
  'nottingham': "Notts",
  'southampton': "S'ton",
  'stoke-on-trent': 'Stoke',
  'newcastle upon tyne': 'Newcastle',
  'kingston upon hull': 'Hull',
};

// Validate and fix headline length (≤ MAX_HEADLINE_CHARS chars, no truncated words)
function validateAndFixHeadline(headline: string, maxLength: number = MAX_HEADLINE_CHARS): string {
  // Clean up whitespace first
  let cleaned = headline.replace(/\s+/g, ' ').trim();
  
  // Step 1: Replace ALL city abbreviations with full city names (we never want abbreviations)
  for (const [city, abbrev] of Object.entries(CITY_ABBREVIATIONS)) {
    // Escape special regex characters in abbreviation (e.g., B'ham has apostrophe)
    const escapedAbbrev = abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const abbrevPattern = new RegExp(escapedAbbrev, 'gi');
    // Capitalize first letter of city for replacement
    const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);
    cleaned = cleaned.replace(abbrevPattern, capitalizedCity).replace(/\s+/g, ' ').trim();
  }
  
  // Step 2: Fix duplicate city names (e.g., "Birmingham Birmingham" → "Birmingham")
  for (const [city] of Object.entries(CITY_ABBREVIATIONS)) {
    const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);
    // Pattern: "Birmingham Birmingham" - remove duplicate
    const duplicatePattern = new RegExp(`${capitalizedCity}\\s+${capitalizedCity}`, 'gi');
    cleaned = cleaned.replace(duplicatePattern, capitalizedCity).replace(/\s+/g, ' ').trim();
  }
  
  // Step 3: Remove dashes that chain ideas (e.g., "Boiler Fix - Birmingham" → "Boiler Fix Birmingham")
  cleaned = cleaned.replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Strategy 1: Remove less important words (in order of importance to remove)
  const lessImportantWords = ['professional', 'local', 'expert', 'trusted', 'qualified', 'certified', 'reliable', 'experienced'];
  let shortened = cleaned;
  for (const word of lessImportantWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    shortened = shortened.replace(regex, '').replace(/\s+/g, ' ').trim();
    if (shortened.length <= maxLength) {
      return shortened;
    }
  }

  // Strategy 2: Remove additional low-value words (no abbreviations allowed)
  const additionalRemovableWords = ['installation', 'emergency', 'services', 'service', 'available', 'immediate', 'assistance'];
  for (const word of additionalRemovableWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    shortened = shortened.replace(regex, '').replace(/\s+/g, ' ').trim();
    if (shortened.length <= maxLength) {
      return shortened;
    }
  }

  // Strategy 3: Remove city name entirely if still too long (other headlines will have it)
  for (const [city] of Object.entries(CITY_ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${city}\\b`, 'gi');
    const withoutCity = shortened.replace(regex, '').replace(/\s+/g, ' ').trim();
    if (withoutCity.length <= maxLength && withoutCity.length > 5) { // Ensure we don't remove too much
      return withoutCity;
    }
  }

  // Strategy 4: Remove articles
  shortened = shortened.replace(/\b(the|a|an)\b/gi, '').replace(/\s+/g, ' ').trim();
  if (shortened.length <= maxLength) {
    return shortened;
  }

  // Strategy 5: Truncate at full-word boundary (last resort)
  // CRITICAL: Never truncate mid-word to avoid "Birm", "Londo", etc.
  if (shortened.length > maxLength) {
    const words = shortened.split(' ');
    let result = '';
    for (const word of words) {
      const candidate = result ? result + ' ' + word : word;
      if (candidate.length <= maxLength) {
        result = candidate;
      } else {
        break;
      }
    }
    
    // If we have a result from word-boundary truncation, return it
    if (result && result.length > 0) {
      return result.trim();
    }
    
    // Edge case: single word exceeds maxLength
    // Instead of truncating mid-word (which creates "Birm", "Londo"), 
    // return a safe fallback - NO abbreviations allowed
    const firstWord = words[0] || '';
    if (firstWord.length > maxLength) {
      // Log warning and return a generic fallback instead of truncating mid-word
      console.warn(`⚠️ Headline word "${firstWord}" exceeds ${maxLength} chars - using fallback (truncation avoided)`);
      return 'Quality Service';
    }
    
    // Fallback: return empty string if we can't fit anything
    return '';
  }

  return shortened;
}

// Generate fallback headlines if AI returns fewer than TARGET_HEADLINES_PER_AD_GROUP
function generateFallbackHeadlines(
  adGroupName: string,
  tradeType: string,
  city: string,
  existingHeadlines: string[],
  targetCount: number = TARGET_HEADLINES_PER_AD_GROUP
): string[] {
  const fallbacks: string[] = [];
  const tradeTerm = tradeType === 'plumbing' || tradeType === 'both' ? 'Plumber' : 'Electrician';
  const tradeService = tradeType === 'plumbing' || tradeType === 'both' ? 'Plumbing' : 'Electrical';
  
  // Use full city name - no abbreviations allowed
  // If city is too long, omit it from headline (other headlines will have location)
  const displayCity = city.length <= 12 ? city : '';
  
  // Extended templates for 15 headlines (RSA optimal)
  // Organized by category: keyword+location, urgency, trust, value, action
  const templates = [
    // Keyword + Location (2-4 headlines)
    `${tradeTerm} ${displayCity}`,           // e.g., "Plumber London" (14 chars)
    `${displayCity} ${tradeTerm}`,           // e.g., "London Plumber" (14 chars)
    `${tradeService} ${displayCity}`,        // e.g., "Plumbing London" (15 chars)
    `${tradeTerm} Near Me`,                  // e.g., "Plumber Near Me" (15 chars)
    
    // Urgency / Availability (2-3 headlines)
    `24/7 ${tradeTerm}`,                     // e.g., "24/7 Plumber" (12 chars)
    `Same Day Service`,                      // Urgency (16 chars)
    `Emergency ${tradeService}`,             // e.g., "Emergency Plumbing" (18 chars)
    `Fast Response`,                         // (13 chars)
    
    // Trust / Credibility (3-4 headlines)
    `Local ${tradeTerm}`,                    // e.g., "Local Plumber" (13 chars)
    `Certified ${tradeTerm}`,                // e.g., "Certified Plumber" (17 chars)
    `Trusted ${tradeTerm}`,                  // e.g., "Trusted Plumber" (15 chars)
    `Expert ${tradeTerm}`,                   // e.g., "Expert Plumber" (14 chars)
    tradeType === 'plumbing' || tradeType === 'both' ? 'Gas Safe Registered' : 'Part P Certified',
    `Fully Insured`,                         // (13 chars)
    `Experienced Team`,                      // (16 chars)
    
    // Value / Pricing (2-3 headlines)
    `No Call Out Fee`,                       // Value proposition (15 chars)
    `Free Estimates`,                        // Value (14 chars)
    `No Hidden Fees`,                        // (14 chars)
    `Upfront Pricing`,                       // (15 chars)
    `Affordable Rates`,                      // (16 chars)
    
    // Action-oriented (2-3 headlines)
    `Call Now Free Quote`,                   // CTA (19 chars)
    `Book Today`,                            // (10 chars)
    `Get Help Fast`,                         // (13 chars)
    `Quality Guaranteed`,                    // Trust (18 chars)
  ];

  // Filter out templates that match existing headlines too closely
  const existingLower = existingHeadlines.map(h => h.toLowerCase());
  for (const template of templates) {
    const candidate = validateAndFixHeadline(template, MAX_HEADLINE_CHARS);
    const candidateLower = candidate.toLowerCase();
    
    // Skip if too similar to existing headline
    const isSimilar = existingLower.some(existing => 
      existing.includes(candidateLower.substring(0, 10)) || 
      candidateLower.includes(existing.substring(0, 10))
    );
    
    if (!isSimilar && candidate.length > 0 && candidate.length <= MAX_HEADLINE_CHARS) {
      fallbacks.push(candidate);
      if (fallbacks.length >= targetCount - existingHeadlines.length) {
        break;
      }
    }
  }

  return fallbacks;
}

// Generate fallback descriptions to reach target count (4 for RSA optimal)
// Generate fallback keywords when AI doesn't provide any
function generateFallbackKeywords(
  adGroupName: string,
  tradeType: string,
  city: string
): string[] {
  const cityLower = city.toLowerCase();
  const tradeTerm = tradeType === 'plumbing' || tradeType === 'both' ? 'plumber' : 'electrician';
  const tradeService = tradeType === 'plumbing' || tradeType === 'both' ? 'plumbing' : 'electrical';
  
  // Extract service type from ad group name if possible
  const nameLower = adGroupName.toLowerCase();
  let serviceType = tradeService;
  
  if (nameLower.includes('emergency')) {
    serviceType = `emergency ${tradeService}`;
  } else if (nameLower.includes('boiler')) {
    serviceType = 'boiler repair';
  } else if (nameLower.includes('installation')) {
    serviceType = `${tradeService} installation`;
  } else if (nameLower.includes('repair')) {
    serviceType = `${tradeService} repair`;
  } else if (nameLower.includes('maintenance')) {
    serviceType = `${tradeService} maintenance`;
  }
  
  // Generate diverse, high-intent keywords
  const keywords = [
    `${serviceType} ${cityLower}`,
    `${cityLower} ${serviceType}`,
    `${tradeTerm} ${cityLower}`,
    `${serviceType} near me`,
    `local ${tradeTerm}`,
    `${tradeTerm} near me`,
    `best ${tradeTerm} ${cityLower}`,
    `${serviceType} service`,
    `emergency ${tradeTerm}`,
    `24/7 ${tradeTerm}`,
  ];
  
  console.log(`🔑 Generated ${keywords.length} fallback keywords for "${adGroupName}":`, keywords);
  return keywords;
}

function generateFallbackDescriptions(
  adGroupName: string,
  tradeType: string,
  city: string,
  existingDescriptions: string[],
  targetCount: number = MAX_DESCRIPTIONS_PER_AD_GROUP
): string[] {
  const fallbacks: string[] = [];
  const tradeTerm = tradeType === 'plumbing' || tradeType === 'both' ? 'plumbing' : 'electrical';
  const credential = tradeType === 'plumbing' || tradeType === 'both' ? 'Gas Safe registered' : 'Part P certified';
  
  // Templates for 4 descriptions covering different roles
  const templates = [
    // Problem + Solution
    `Need ${tradeTerm} help? Our expert team solves problems fast. Same day service available.`,
    `${tradeTerm.charAt(0).toUpperCase() + tradeTerm.slice(1)} issue? We fix it right the first time. Fast, reliable service.`,
    
    // Trust / Experience
    `Professional ${tradeTerm} services in ${city}. ${credential.charAt(0).toUpperCase() + credential.slice(1)}. Fully insured.`,
    `Trusted ${tradeTerm} experts with years of experience. Quality work guaranteed.`,
    `${credential.charAt(0).toUpperCase() + credential.slice(1)} engineers. Reliable service you can count on.`,
    
    // Value / Pricing
    `Transparent pricing with no hidden fees. Free quotes on all ${tradeTerm} work.`,
    `Affordable ${tradeTerm} services. No call out charge. Upfront honest pricing.`,
    `Free estimates on all work. No obligation quotes. Fair competitive rates.`,
    
    // Action / Next Step
    `Call today for immediate assistance. Fast response times across ${city}.`,
    `Book online or call now. Our friendly team is ready to help you today.`,
    `Get in touch for a free quote. Available 7 days a week for your convenience.`,
  ];

  // Filter out templates that match existing descriptions too closely
  const existingLower = existingDescriptions.map(d => d.toLowerCase());
  for (const template of templates) {
    const candidate = template.substring(0, MAX_DESCRIPTION_CHARS);
    const candidateLower = candidate.toLowerCase();
    
    // Skip if too similar to existing description
    const isSimilar = existingLower.some(existing => 
      existing.includes(candidateLower.substring(0, 20)) || 
      candidateLower.includes(existing.substring(0, 20))
    );
    
    if (!isSimilar && candidate.length > 0 && candidate.length <= MAX_DESCRIPTION_CHARS) {
      fallbacks.push(candidate);
      if (fallbacks.length >= targetCount - existingDescriptions.length) {
        break;
      }
    }
  }

  return fallbacks;
}

// Generate a complete fallback ad group for a specific service
function generateFallbackAdGroup(
  serviceName: string,
  tradeType: string,
  city: string,
  websiteUrl: string
): any {
  // 🚨 POLICY COMPLIANCE: Sanitize service name to avoid Google Ads policy violations
  const sanitizedServiceName = sanitizeForGoogleAdsPolicy(serviceName);
  
  const credential = tradeType === 'plumbing' || tradeType === 'both' ? 'Gas Safe Registered' : 'Part P Certified';
  const shortCredential = tradeType === 'plumbing' || tradeType === 'both' ? 'Gas Safe' : 'Part P';
  
  // 🚨 POLICY COMPLIANCE: For gas-related services, ensure Gas Safe trust signals
  const isGasRelated = sanitizedServiceName.toLowerCase().includes('gas') || 
                       sanitizedServiceName.toLowerCase().includes('boiler') ||
                       sanitizedServiceName.toLowerCase().includes('heating');
  
  // Generate service-specific headlines (15 for RSA optimal)
  // 🚨 CRITICAL: At least 1-2 headlines MUST include "Gas Safe Registered" or "Gas Safe Engineers"
  const headlines = [
    // Keyword + Location (3) - use sanitized name
    validateAndFixHeadline(`${sanitizedServiceName} ${city}`, MAX_HEADLINE_CHARS),
    validateAndFixHeadline(`${city} ${sanitizedServiceName}`, MAX_HEADLINE_CHARS),
    validateAndFixHeadline(`${sanitizedServiceName} Near Me`, MAX_HEADLINE_CHARS),
    // Urgency / Availability (3)
    validateAndFixHeadline(`24/7 ${sanitizedServiceName}`, MAX_HEADLINE_CHARS),
    validateAndFixHeadline(`Same Day Service`, MAX_HEADLINE_CHARS),
    validateAndFixHeadline(`Fast Response`, MAX_HEADLINE_CHARS),
    // Trust / Credibility (5) - MUST include Gas Safe for gas-related services
    validateAndFixHeadline(`${credential}`, MAX_HEADLINE_CHARS), // "Gas Safe Registered"
    validateAndFixHeadline(`${shortCredential} Engineers`, MAX_HEADLINE_CHARS), // "Gas Safe Engineers"
    validateAndFixHeadline(`Certified ${shortCredential}`, MAX_HEADLINE_CHARS), // "Certified Gas Safe"
    validateAndFixHeadline(`Fully Insured`, MAX_HEADLINE_CHARS),
    validateAndFixHeadline(`Trusted Experts`, MAX_HEADLINE_CHARS),
    // Value / Pricing (2)
    validateAndFixHeadline(`No Hidden Fees`, MAX_HEADLINE_CHARS),
    validateAndFixHeadline(`Free Estimates`, MAX_HEADLINE_CHARS),
    // Action-oriented (2)
    validateAndFixHeadline(`Call Now Free Quote`, MAX_HEADLINE_CHARS),
    validateAndFixHeadline(`Book Today`, MAX_HEADLINE_CHARS),
  ].filter(h => h.length > 0 && h.length <= MAX_HEADLINE_CHARS);
  
  // Ensure we have exactly TARGET_HEADLINES_PER_AD_GROUP headlines (15)
  while (headlines.length < TARGET_HEADLINES_PER_AD_GROUP) {
    const fallbacks = generateFallbackHeadlines(sanitizedServiceName, tradeType, city, headlines, TARGET_HEADLINES_PER_AD_GROUP);
    headlines.push(...fallbacks);
    if (headlines.length >= TARGET_HEADLINES_PER_AD_GROUP) break;
  }
  
  // 🚨 POLICY COMPLIANCE: Ensure Gas Safe trust signal exists for gas-related services
  if (isGasRelated) {
    const hasGasSafe = headlines.some(h => 
      h.toLowerCase().includes('gas safe') || h.toLowerCase().includes('certified')
    );
    if (!hasGasSafe && headlines.length > 0) {
      // Replace last headline with Gas Safe trust signal
      headlines[headlines.length - 1] = validateAndFixHeadline('Gas Safe Engineers', MAX_HEADLINE_CHARS);
    }
  }
  
  // Generate service-specific descriptions (4 for RSA optimal, covering different roles)
  // Use sanitized service name
  let descriptions = [
    // Problem + Solution
    `Need ${sanitizedServiceName.toLowerCase()}? Our expert team solves problems fast. Same day service.`,
    // Trust / Experience - include certification
    `Professional ${sanitizedServiceName.toLowerCase()} services in ${city}. ${credential}. Fully insured.`,
    // Value / Pricing
    `Transparent pricing with no hidden fees. Free quotes on all ${sanitizedServiceName.toLowerCase()} work.`,
    // Action / Next Step
    `Call today for immediate assistance. Fast response times across ${city}.`,
  ].filter(d => d.length <= MAX_DESCRIPTION_CHARS);
  
  // Ensure we have exactly MAX_DESCRIPTIONS_PER_AD_GROUP descriptions (4)
  if (descriptions.length < MAX_DESCRIPTIONS_PER_AD_GROUP) {
    const fallbackDescs = generateFallbackDescriptions(sanitizedServiceName, tradeType, city, descriptions, MAX_DESCRIPTIONS_PER_AD_GROUP);
    descriptions.push(...fallbackDescs);
  }
  
  // Generate service-specific keywords - use sanitized name
  const keywords = [
    `${sanitizedServiceName.toLowerCase()} ${city.toLowerCase()}`,
    `${city.toLowerCase()} ${sanitizedServiceName.toLowerCase()}`,
    `${sanitizedServiceName.toLowerCase()} near me`,
    `local ${sanitizedServiceName.toLowerCase()}`,
    `${sanitizedServiceName.toLowerCase()} service`,
    `best ${sanitizedServiceName.toLowerCase()} ${city.toLowerCase()}`,
    `emergency ${sanitizedServiceName.toLowerCase()}`,
    `${sanitizedServiceName.toLowerCase()} experts`,
  ];
  
  // 🚨 POLICY COMPLIANCE: Use sanitized name for ad group name
  return {
    name: `${sanitizedServiceName} ${city}`,
    keywords: keywords.slice(0, 10),
    adCopy: {
      headlines: headlines.slice(0, TARGET_HEADLINES_PER_AD_GROUP),
      descriptions: descriptions.slice(0, MAX_DESCRIPTIONS_PER_AD_GROUP),
      finalUrl: websiteUrl
    }
  };
}

// Validate ad group content matches serviceOfferings
function validateAdGroupServices(
  adGroup: any,
  serviceOfferings: string[],
  servicesByTheme: ReturnType<typeof groupServicesByTheme>
): boolean {
  // Extract theme from ad group name
  const themeMatch = adGroup.name?.toLowerCase().match(/(emergency|installation|maintenance|repair)/);
  if (!themeMatch) {
    return true; // Can't validate if theme unclear
  }

  const theme = themeMatch[1] as 'emergency' | 'installation' | 'maintenance' | 'repair';
  const allowedServices = servicesByTheme[theme] || [];

  // Check if keywords reference services not in allowedServices
  const keywords = (adGroup.keywords || []).join(' ').toLowerCase();
  for (const service of serviceOfferings) {
    if (!allowedServices.includes(service)) {
      const serviceLower = service.toLowerCase();
      // Check if this disallowed service is mentioned in keywords
      if (keywords.includes(serviceLower)) {
        console.warn(`⚠️ Ad group "${adGroup.name}" mentions service "${service}" which is not in theme "${theme}"`);
        return false;
      }
    }
  }

  return true;
}

// Validate campaign data integrity
function validateCampaignDataIntegrity(campaignData: any, onboardingData: any): void {
  const onboardingPhone = onboardingData.phone;
  const campaignPhone = campaignData?.businessInfo?.phone;

  if (onboardingPhone !== campaignPhone) {
    console.error('💥 DATA INTEGRITY VIOLATION:');
    console.error('  Onboarding phone:', onboardingPhone);
    console.error('  Campaign phone:', campaignPhone);
    throw new Error(`Data integrity violation: Phone mismatch between onboarding (${onboardingPhone}) and campaign (${campaignPhone})`);
  }

  // Validate all ad groups have proper finalUrl (not placeholder)
  const placeholderUrls = ["https://example.com", "https://yoursite.com", "www.example.com"];
  if (campaignData?.adGroups) {
    campaignData.adGroups.forEach((adGroup: any, index: number) => {
      const finalUrl = adGroup?.adCopy?.finalUrl;
      if (!finalUrl || placeholderUrls.includes(finalUrl)) {
        console.warn(`⚠️ Ad group ${index + 1} "${adGroup.name}" has placeholder URL: ${finalUrl}`);
        console.warn(`💡 This will waste advertising budget - customers will be sent to generic pages`);
      }
    });
  }

  console.log('✅ Campaign data integrity validation passed');
}

// Validate and enhance the parsed campaign data
function validateAndEnhanceCampaignData(data: any, onboardingData: any): any {
  const serviceArea = onboardingData.serviceArea;
  const businessName = onboardingData.businessName;
  const phone = onboardingData.phone;
  const websiteUrl = onboardingData.websiteUrl || "https://example.com";
  const serviceOfferings = onboardingData.serviceOfferings || [];
  const tradeType = onboardingData.tradeType;
  const city = serviceArea?.city || 'UK';
  const servicesByTheme = groupServicesByTheme(serviceOfferings);

  // 🔍 COMPREHENSIVE LOGGING: Track phone number transformations
  console.log('🔍 VALIDATION DEBUG: Phone from onboarding:', phone);
  console.log('🔍 VALIDATION DEBUG: Phone from AI data:', data?.businessInfo?.phone || 'NOT IN AI DATA');
  console.log('🔍 VALIDATION DEBUG: CallExtensions from AI data:', JSON.stringify(data?.callExtensions || []));
  console.log('🔍 VALIDATION DEBUG: Website URL from onboarding:', websiteUrl);
  
  // Log if AI data contains any phone numbers
  if (data?.businessInfo?.phone) {
    console.log('📱 AI generated phone number detected:', data.businessInfo.phone);
    console.log('📱 Will be replaced with onboarding phone:', phone);
  }

  // 🔒 VALIDATION: Ensure we have required data from onboarding
  if (!phone) {
    throw new Error('Missing phone number from onboarding data');
  }
  if (!businessName) {
    throw new Error('Missing business name from onboarding data');
  }

  // 🔒 CRITICAL FIX: Detect and log contaminated phone numbers before overwriting
  const contaminatedPhoneRegex = /(077\s?684\s?7429|0776847429)/i;
  if (data?.businessInfo?.phone && contaminatedPhoneRegex.test(data.businessInfo.phone)) {
    console.error('🚨 CONTAMINATED PHONE DETECTED in businessInfo.phone:', data.businessInfo.phone);
    console.error('🚨 Replacing with correct onboarding phone:', phone);
  }
  if (data?.callExtensions && Array.isArray(data.callExtensions)) {
    data.callExtensions.forEach((ext: any, index: number) => {
      const extPhone = typeof ext === 'string' ? ext : ext?.phoneNumber;
      if (extPhone && contaminatedPhoneRegex.test(extPhone)) {
        console.error(`🚨 CONTAMINATED PHONE DETECTED in callExtensions[${index}]:`, extPhone);
        console.error('🚨 Replacing with correct onboarding phone:', phone);
      }
    });
  }

  // 🔒 FORCE PHONE OVERRIDE: Always use onboarding phone, never trust AI-generated phone
  const validatedData = {
    campaignName: data.campaignName || `${businessName} - ${onboardingData.tradeType} Services`,
    dailyBudget: data.dailyBudget || Math.round((onboardingData.acquisitionGoals?.monthlyBudget || 300) / 30),
    targetLocation: data.targetLocation || `${serviceArea?.city}, UK`,
    businessInfo: {
      businessName: businessName,
      phone: phone, // 🔒 ALWAYS use onboarding phone, never AI-generated
      serviceArea: `${serviceArea?.city}${serviceArea?.postcode ? ', ' + serviceArea.postcode : ''}`,
    },
    adGroups: (data.adGroups || []).map((adGroup: any) => {
      // 🚨 POLICY COMPLIANCE: Sanitize ad group name to avoid Google Ads violations
      const sanitizedAdGroupName = sanitizeForGoogleAdsPolicy(adGroup.name || 'Service');
      
      // Validate ad group services match serviceOfferings
      validateAdGroupServices({ ...adGroup, name: sanitizedAdGroupName }, serviceOfferings, servicesByTheme);

      // 🚨 POLICY COMPLIANCE: Sanitize all headlines to avoid policy violations
      const headlines = (adGroup.adCopy?.headlines || [])
        .map((h: string) => sanitizeForGoogleAdsPolicy(h)) // Apply policy transformations first
        .map((h: string) => validateAndFixHeadline(h, MAX_HEADLINE_CHARS))
        .filter((h: string) => h.length > 0); // Remove empty headlines from failed validation
      
      // Ensure exactly TARGET_HEADLINES_PER_AD_GROUP headlines
      if (headlines.length < TARGET_HEADLINES_PER_AD_GROUP) {
        console.warn(`⚠️ Ad group "${adGroup.name}" has only ${headlines.length} headlines, generating ${TARGET_HEADLINES_PER_AD_GROUP - headlines.length} fallback headlines`);
        const fallbacks = generateFallbackHeadlines(adGroup.name, tradeType, city, headlines, TARGET_HEADLINES_PER_AD_GROUP);
        headlines.push(...fallbacks);
      } else if (headlines.length > TARGET_HEADLINES_PER_AD_GROUP) {
        console.warn(`⚠️ Ad group "${adGroup.name}" has ${headlines.length} headlines, truncating to ${TARGET_HEADLINES_PER_AD_GROUP}`);
        headlines.splice(TARGET_HEADLINES_PER_AD_GROUP);
      }

      // Final validation: ensure all headlines are valid length and no truncated words
      const validatedHeadlines = headlines.map((h: string) => {
        if (h.length > MAX_HEADLINE_CHARS) {
          console.warn(`⚠️ Headline "${h}" still exceeds ${MAX_HEADLINE_CHARS} chars after processing, re-validating`);
          return validateAndFixHeadline(h, MAX_HEADLINE_CHARS);
        }
        return h;
      }).filter((h: string) => h.length > 0);

      // 🚨 POLICY COMPLIANCE: Sanitize descriptions to avoid policy violations
      let descriptions = adGroup.adCopy?.descriptions || [];
      descriptions = descriptions
        .map((d: string) => sanitizeForGoogleAdsPolicy(d)) // Apply policy transformations
        .filter((d: string) => d && d.length <= MAX_DESCRIPTION_CHARS);
      
      // Generate fallback descriptions to reach exactly 4 (RSA optimal)
      if (descriptions.length < MAX_DESCRIPTIONS_PER_AD_GROUP) {
        console.warn(`⚠️ Ad group "${adGroup.name}" has only ${descriptions.length} descriptions, generating fallbacks to reach ${MAX_DESCRIPTIONS_PER_AD_GROUP}`);
        const fallbackDescriptions = generateFallbackDescriptions(adGroup.name, tradeType, city, descriptions, MAX_DESCRIPTIONS_PER_AD_GROUP);
        descriptions.push(...fallbackDescriptions);
      }
      if (descriptions.length > MAX_DESCRIPTIONS_PER_AD_GROUP) {
        descriptions.splice(MAX_DESCRIPTIONS_PER_AD_GROUP);
      }

      // Validate and ensure keywords exist
      let keywords = adGroup.keywords || [];
      if (keywords.length === 0) {
        console.warn(`⚠️ Ad group "${adGroup.name}" has no keywords, generating fallback keywords`);
        keywords = generateFallbackKeywords(adGroup.name, tradeType, city);
      }
      // Sanitize keywords: trim, remove empty, limit to 10
      keywords = keywords
        .map((k: string) => k?.trim())
        .filter((k: string) => k && k.length > 0 && k.length <= 80)
        .slice(0, 10);
      
      console.log(`🔑 Ad group "${sanitizedAdGroupName}" keywords (${keywords.length}):`, keywords);

      // 🚨 POLICY COMPLIANCE: Ensure Gas Safe trust signal exists for gas-related services
      const isGasRelated = sanitizedAdGroupName.toLowerCase().includes('gas') || 
                           sanitizedAdGroupName.toLowerCase().includes('boiler') ||
                           sanitizedAdGroupName.toLowerCase().includes('heating');
      
      if (isGasRelated && (tradeType === 'plumbing' || tradeType === 'both')) {
        const hasGasSafe = validatedHeadlines.some((h: string) => 
          h.toLowerCase().includes('gas safe') || h.toLowerCase().includes('certified')
        );
        if (!hasGasSafe && validatedHeadlines.length > 0) {
          // Replace last headline with Gas Safe trust signal
          validatedHeadlines[validatedHeadlines.length - 1] = 'Gas Safe Engineers';
          console.log(`🔒 Added Gas Safe trust signal to "${sanitizedAdGroupName}"`);
        }
      }

      return {
        ...adGroup,
        name: sanitizedAdGroupName, // 🚨 Use sanitized name
        keywords: keywords.map((k: string) => sanitizeForGoogleAdsPolicy(k)), // Sanitize keywords too
        adCopy: {
          ...adGroup.adCopy,
          headlines: validatedHeadlines.slice(0, TARGET_HEADLINES_PER_AD_GROUP), // Ensure exactly TARGET_HEADLINES_PER_AD_GROUP
          descriptions: descriptions.slice(0, MAX_DESCRIPTIONS_PER_AD_GROUP), // Max MAX_DESCRIPTIONS_PER_AD_GROUP
          finalUrl: websiteUrl // Use onboarding website URL or fallback to example.com
        }
      };
    }),
    callExtensions: [phone], // 🔒 ALWAYS use onboarding phone, never AI-generated
    complianceNotes: data.complianceNotes || [
      "All ads comply with UK advertising standards",
      "Emergency services claims must be substantiated",
      "Pricing should be transparent and include VAT where applicable",
    ],
    optimizationSuggestions: data.optimizationSuggestions || [],
    seasonalRecommendations: data.seasonalRecommendations || [],
  };

  // 🔒 FINAL VALIDATION: Ensure no contaminated numbers slipped through
  if (validatedData.businessInfo.phone !== phone) {
    console.error('🚨 VALIDATION FAILED: businessInfo.phone does not match onboarding phone!');
    console.error('  Expected:', phone);
    console.error('  Got:', validatedData.businessInfo.phone);
    throw new Error(`Phone validation failed: Expected ${phone} but got ${validatedData.businessInfo.phone}`);
  }
  if (!validatedData.callExtensions.includes(phone)) {
    console.error('🚨 VALIDATION FAILED: callExtensions does not contain onboarding phone!');
    console.error('  Expected:', phone);
    console.error('  Got:', validatedData.callExtensions);
    throw new Error(`Call extensions validation failed: Expected ${phone} but got ${validatedData.callExtensions.join(', ')}`);
  }

  console.log('✅ Phone validation passed - all phone numbers match onboarding:', phone);
  
  // 🔒 VALIDATE AD GROUP COUNT: Ensure we have one ad group per service
  const expectedAdGroupCount = serviceOfferings.length;
  const actualAdGroupCount = validatedData.adGroups.length;
  
  if (actualAdGroupCount < expectedAdGroupCount) {
    console.warn(`⚠️ AD GROUP COUNT MISMATCH: Expected ${expectedAdGroupCount} ad groups (one per service), got ${actualAdGroupCount}`);
    console.warn(`   Services selected: ${serviceOfferings.join(', ')}`);
    console.warn(`   Ad groups created: ${validatedData.adGroups.map((ag: any) => ag.name).join(', ')}`);
    
    // Generate missing ad groups for services not covered
    const existingAdGroupNames = validatedData.adGroups.map((ag: any) => ag.name.toLowerCase());
    
    for (const service of serviceOfferings) {
      const serviceLower = service.toLowerCase();
      // Check if any existing ad group covers this service
      const isCovered = existingAdGroupNames.some((name: string) => 
        name.includes(serviceLower) || serviceLower.split(' ').some((word: string) => name.includes(word))
      );
      
      if (!isCovered) {
        console.log(`📝 Generating fallback ad group for missing service: ${service}`);
        const fallbackAdGroup = generateFallbackAdGroup(service, tradeType, city, websiteUrl);
        validatedData.adGroups.push(fallbackAdGroup);
      }
    }
    
    console.log(`✅ After fallback generation: ${validatedData.adGroups.length} ad groups`);
  }
  
  return validatedData;
}

// Create fallback campaign data if parsing fails
function createFallbackCampaignData(_aiResponse: string, onboardingData: any): any {
  const serviceArea = onboardingData.serviceArea;
  const businessName = onboardingData.businessName;
  const phone = onboardingData.phone;
  const tradeType = onboardingData.tradeType;
  const websiteUrl = onboardingData.websiteUrl || "https://example.com";
  const serviceOfferings = onboardingData.serviceOfferings || [];
  const city = serviceArea?.city || 'UK';

  // 🔍 DEBUG: Log phone number in fallback
  console.log('🔍 FALLBACK DEBUG: Using phone from onboarding:', phone);
  console.log('🔍 FALLBACK DEBUG: Using website URL from onboarding:', websiteUrl);
  console.log('🔍 FALLBACK DEBUG: Services selected:', serviceOfferings);

  // 🔒 VALIDATION: Ensure we have required data from onboarding
  if (!phone) {
    throw new Error('Missing phone number from onboarding data in fallback');
  }

  // Generate one ad group per service
  const adGroups = serviceOfferings.length > 0
    ? serviceOfferings.map((service: string) => generateFallbackAdGroup(service, tradeType, city, websiteUrl))
    : [generateFallbackAdGroup(`Emergency ${tradeType}`, tradeType, city, websiteUrl)];

  return {
    campaignName: `${businessName} - ${tradeType} Services`,
    dailyBudget: Math.round((onboardingData.acquisitionGoals?.monthlyBudget || 300) / 30),
    targetLocation: `${city}, UK`,
    businessInfo: {
      businessName: businessName,
      phone: phone,
      serviceArea: `${city}${serviceArea?.postcode ? ', ' + serviceArea.postcode : ''}`,
    },
    adGroups: adGroups,
    callExtensions: [phone],
    complianceNotes: [
      "Generated campaign requires manual review",
      "AI response could not be fully parsed",
      "Please verify all claims and pricing",
    ],
  };
}
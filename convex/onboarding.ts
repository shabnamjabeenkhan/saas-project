import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Helper function to get current user's token identifier
async function getCurrentUserToken(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

// Helper function to check if relevant onboarding fields changed
// Relevant fields that affect campaign generation:
// tradeType, businessName, phone, serviceArea, serviceOfferings, availability, acquisitionGoals, websiteUrl
function hasRelevantOnboardingChanges(oldData: any, newData: any): boolean {
  // Compare tradeType
  if (oldData?.tradeType !== newData?.tradeType) return true;
  
  // Compare businessName
  if (oldData?.businessName !== newData?.businessName) return true;
  
  // Compare phone
  if (oldData?.phone !== newData?.phone) return true;
  
  // Compare websiteUrl
  if (oldData?.websiteUrl !== newData?.websiteUrl) return true;
  
  // Compare serviceArea
  if (oldData?.serviceArea?.city !== newData?.serviceArea?.city) return true;
  if (oldData?.serviceArea?.postcode !== newData?.serviceArea?.postcode) return true;
  if (oldData?.serviceArea?.radius !== newData?.serviceArea?.radius) return true;
  
  // Compare serviceOfferings (array comparison)
  const oldServices = JSON.stringify((oldData?.serviceOfferings || []).sort());
  const newServices = JSON.stringify((newData?.serviceOfferings || []).sort());
  if (oldServices !== newServices) return true;
  
  // Compare availability
  if (oldData?.availability?.workingHours !== newData?.availability?.workingHours) return true;
  if (oldData?.availability?.emergencyCallouts !== newData?.availability?.emergencyCallouts) return true;
  if (oldData?.availability?.weekendWork !== newData?.availability?.weekendWork) return true;
  
  // Compare acquisitionGoals
  if (oldData?.acquisitionGoals?.monthlyLeads !== newData?.acquisitionGoals?.monthlyLeads) return true;
  if (oldData?.acquisitionGoals?.averageJobValue !== newData?.acquisitionGoals?.averageJobValue) return true;
  if (oldData?.acquisitionGoals?.monthlyBudget !== newData?.acquisitionGoals?.monthlyBudget) return true;
  
  return false;
}

// Save or update onboarding data for a user
export const saveOnboardingData = mutation({
  args: {
    tradeType: v.optional(v.string()),
    businessName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    serviceArea: v.optional(v.object({
      city: v.string(),
      postcode: v.optional(v.string()),
      radius: v.number(),
    })),
    serviceOfferings: v.optional(v.array(v.string())),
    availability: v.optional(v.object({
      workingHours: v.string(),
      emergencyCallouts: v.boolean(),
      weekendWork: v.boolean(),
    })),
    acquisitionGoals: v.optional(v.object({
      monthlyLeads: v.number(),
      averageJobValue: v.number(),
      monthlyBudget: v.number(),
    })),
    complianceData: v.optional(v.object({
      businessRegistration: v.boolean(),
      requiredCertifications: v.boolean(),
      publicLiabilityInsurance: v.boolean(),
      businessEmail: v.string(),
      businessNumber: v.string(),
      termsAccepted: v.boolean(),
      complianceUnderstood: v.boolean(),
      certificationWarning: v.boolean(),
    })),
    isComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if onboarding data already exists
    const existingData = await ctx.db
      .query("onboardingData")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    const updateData = {
      ...args,
      userId,
      ...(args.isComplete && { completedAt: Date.now() }),
    };

    if (existingData) {
      // Update existing data
      await ctx.db.patch(existingData._id, updateData);
      return existingData._id;
    } else {
      // Create new data
      return await ctx.db.insert("onboardingData", updateData);
    }
  },
});

// Get onboarding data for the current user
export const getOnboardingData = query({
  handler: async (ctx) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("onboardingData")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();
  },
});

// Mark onboarding as complete
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const existingData = await ctx.db
      .query("onboardingData")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    if (!existingData) {
      throw new Error("No onboarding data found");
    }

    await ctx.db.patch(existingData._id, {
      isComplete: true,
      completedAt: Date.now(),
    });

    return existingData._id;
  },
});

// Check if user has completed onboarding
export const hasCompletedOnboarding = query({
  handler: async (ctx) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      return { isComplete: false, loading: false };
    }

    const data = await ctx.db
      .query("onboardingData")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    return {
      isComplete: data?.isComplete ?? false,
      loading: false,
      hasData: !!data
    };
  },
});

// Allow user to restart/edit their onboarding
export const restartOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const existingData = await ctx.db
      .query("onboardingData")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    if (!existingData) {
      throw new Error("No onboarding data found");
    }

    // Reset completion status but keep existing data for editing
    await ctx.db.patch(existingData._id, {
      isComplete: false,
      completedAt: undefined,
    });

    return existingData._id;
  },
});

// Admin function to completely reset user's onboarding (removes all data)
export const resetOnboardingCompletely = mutation({
  args: {
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const adminUserId = await getCurrentUserToken(ctx);

    if (!adminUserId) {
      throw new Error("User not authenticated");
    }

    // Note: In a real app, you'd check if the current user is an admin
    // For now, this is a utility function that could be restricted to admin users

    const existingData = await ctx.db
      .query("onboardingData")
      .withIndex("userId", (q) => q.eq("userId", args.targetUserId))
      .first();

    if (!existingData) {
      throw new Error("No onboarding data found for user");
    }

    // Completely delete the onboarding record
    await ctx.db.delete(existingData._id);

    return { success: true, message: "Onboarding data completely reset" };
  },
});

// Update onboarding data and regenerate campaign if relevant fields changed
// This action wraps saveOnboardingData + generateCampaign with change detection
export const updateOnboardingAndRegenerate = action({
  args: {
    tradeType: v.optional(v.string()),
    businessName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    serviceArea: v.optional(v.object({
      city: v.string(),
      postcode: v.optional(v.string()),
      radius: v.number(),
    })),
    serviceOfferings: v.optional(v.array(v.string())),
    availability: v.optional(v.object({
      workingHours: v.string(),
      emergencyCallouts: v.boolean(),
      weekendWork: v.boolean(),
    })),
    acquisitionGoals: v.optional(v.object({
      monthlyLeads: v.number(),
      averageJobValue: v.number(),
      monthlyBudget: v.number(),
    })),
    complianceData: v.optional(v.object({
      businessRegistration: v.boolean(),
      requiredCertifications: v.boolean(),
      publicLiabilityInsurance: v.boolean(),
      businessEmail: v.string(),
      businessNumber: v.string(),
      termsAccepted: v.boolean(),
      complianceUnderstood: v.boolean(),
      certificationWarning: v.boolean(),
    })),
    isComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    dataId: string;
    regenerationTriggered: boolean;
    regenerationError?: string;
  }> => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get existing data before updating
    const existingData = await ctx.runQuery(api.onboarding.getOnboardingData);

    // Save updated onboarding data
    const dataId: string = await ctx.runMutation(api.onboarding.saveOnboardingData, args);

    // Check if relevant fields changed and user has completed onboarding
    if (existingData && existingData.isComplete) {
      // Merge old and new data for comparison
      const mergedOldData = { ...existingData };
      const mergedNewData = { ...existingData, ...args };
      
      if (hasRelevantOnboardingChanges(mergedOldData, mergedNewData)) {
        try {
          // Trigger campaign regeneration (respects limits automatically via checkRegenerationLimits)
          await ctx.runAction(api.campaigns.generateCampaign, { userId });
          return {
            success: true,
            dataId,
            regenerationTriggered: true,
          };
        } catch (error) {
          // If regeneration fails (e.g., limit reached, cooldown), still return success for data save
          console.warn('Campaign regeneration failed:', error);
          return {
            success: true,
            dataId,
            regenerationTriggered: false,
            regenerationError: error instanceof Error ? error.message : String(error),
          };
        }
      }
    }

    return {
      success: true,
      dataId,
      regenerationTriggered: false,
    };
  },
});
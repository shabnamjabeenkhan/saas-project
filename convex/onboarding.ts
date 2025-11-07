import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper function to get current user's token identifier
async function getCurrentUserToken(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

// Save or update onboarding data for a user
export const saveOnboardingData = mutation({
  args: {
    tradeType: v.optional(v.string()),
    businessName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
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
      return false;
    }

    const data = await ctx.db
      .query("onboardingData")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    return data?.isComplete ?? false;
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
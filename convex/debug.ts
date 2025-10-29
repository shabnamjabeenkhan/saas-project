import { query } from "./_generated/server";

// Debug function to see all onboarding data
export const getAllOnboardingData = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("onboardingData")
      .collect();
  },
});

// Debug function to see all users
export const getAllUsers = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .collect();
  },
});

// Get current user info
export const getCurrentUserInfo = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return {
      subject: identity?.subject,
      email: identity?.email,
      name: identity?.name,
      tokenIdentifier: identity?.tokenIdentifier
    };
  },
});
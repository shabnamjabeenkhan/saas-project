import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

// Helper function to get current user's token identifier
async function getCurrentUserToken(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

// Save Google Ads OAuth tokens for a user
export const saveTokens = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scope: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if tokens already exist for this user
    const existingTokens = await ctx.db
      .query("googleAdsTokens")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    const tokenData = {
      userId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      scope: args.scope,
      createdAt: Date.now(),
      isActive: true,
    };

    if (existingTokens) {
      // Update existing tokens
      await ctx.db.patch(existingTokens._id, tokenData);
      return existingTokens._id;
    } else {
      // Create new token record
      return await ctx.db.insert("googleAdsTokens", tokenData);
    }
  },
});

// Get Google Ads tokens for the current user
export const getTokens = query({
  handler: async (ctx) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      return null;
    }

    const tokens = await ctx.db
      .query("googleAdsTokens")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    if (!tokens || !tokens.isActive) {
      return null;
    }

    // Check if token is expired
    if (tokens.expiresAt < Date.now()) {
      return { ...tokens, isExpired: true };
    }

    return tokens;
  },
});

// Check if user has connected Google Ads
export const isConnected = query({
  handler: async (ctx) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      return false;
    }

    const tokens = await ctx.db
      .query("googleAdsTokens")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    return !!(tokens && tokens.isActive && tokens.expiresAt > Date.now());
  },
});

// Disconnect Google Ads (deactivate tokens)
export const disconnect = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const existingTokens = await ctx.db
      .query("googleAdsTokens")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    if (existingTokens) {
      await ctx.db.patch(existingTokens._id, {
        isActive: false,
        disconnectedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Exchange OAuth code for tokens (production mode)
export const exchangeCodeForTokens = action({
  args: {
    code: v.string(),
    redirectUri: v.string(),
  },
  handler: async (ctx, args) => {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const tokenEndpoint = 'https://oauth2.googleapis.com/token';

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: args.code,
      grant_type: 'authorization_code',
      redirect_uri: args.redirectUri,
    });

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error_description || errorData.error || `HTTP ${response.status}`;
        console.error('Token exchange error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          error_description: errorData.error_description,
        });
        throw new Error(`Token exchange failed: ${errorMsg}`);
      }

      const tokenData = await response.json();

      if (tokenData.error) {
        console.error('Token exchange error in response:', {
          error: tokenData.error,
          error_description: tokenData.error_description,
        });
        throw new Error(tokenData.error_description || tokenData.error);
      }

      // Note: We can't call mutations from actions easily with user context
      // Instead, we'll return the tokens and let the frontend save them
      // This is actually better for error handling and user feedback

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error('Failed to exchange code for tokens');
    }
  },
});
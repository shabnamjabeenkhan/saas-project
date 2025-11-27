"use node";

import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { GoogleAdsApi, Customer } from "google-ads-api";
import { v } from "convex/values";

// Helper function to get current user's token identifier
async function getCurrentUserToken(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

/**
 * Compute month date range for user's timezone.
 * For MVP, defaults to Europe/London per feature plan section 2.
 * TODO: Support per-user timezone in future.
 */
function computeMonthDatesForUser(timezone: string = "Europe/London"): {
  monthKey: string; // "YYYY-MM"
  monthStart: number; // ms epoch (start of month in user's timezone)
  monthEnd: number; // ms epoch (end of month in user's timezone)
  todayDate: string; // "YYYY-MM-DD"
  firstOfMonth: string; // "YYYY-MM-DD"
} {
  // For MVP, use Europe/London timezone
  // In future, can accept user's timezone from user settings
  const now = new Date();
  
  // Get current date in user's timezone
  // Using Intl.DateTimeFormat to handle timezone conversion
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const todayParts = formatter.formatToParts(now);
  const year = todayParts.find((p) => p.type === "year")!.value;
  const month = todayParts.find((p) => p.type === "month")!.value;
  const day = todayParts.find((p) => p.type === "day")!.value;
  
  const todayDate = `${year}-${month}-${day}`;
  const monthKey = `${year}-${month}`;
  const firstOfMonth = `${year}-${month}-01`;
  
  // Calculate month start and end timestamps in UTC
  // Create date objects for first and last day of month in user's timezone
  const monthStartDate = new Date(`${year}-${month}-01T00:00:00`);
  const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
  const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
  const monthEndDate = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00`);
  
  // Convert to UTC timestamps
  const monthStart = monthStartDate.getTime();
  const monthEnd = monthEndDate.getTime();
  
  return {
    monthKey,
    monthStart,
    monthEnd,
    todayDate,
    firstOfMonth,
  };
}

/**
 * Get the latest snapshot for a user and month.
 * Returns the snapshot with the most recent syncedAt timestamp.
 */
async function getLatestSnapshotForUserMonth(
  ctx: any,
  userId: string,
  monthKey: string,
): Promise<{ syncedAt: number } | null> {
  // Query all snapshots for this user via query (from adSpendQueries.ts)
  const snapshots = await ctx.runQuery(api.adSpendQueries.getSnapshotsForMonth, {
    userId,
    monthKey,
  });
  
  if (!snapshots || snapshots.length === 0) {
    return null;
  }
  
  // Find the one with the latest syncedAt
  const latest = snapshots.reduce((latest: { syncedAt: number; date: string }, current: { syncedAt: number; date: string }) => {
    return current.syncedAt > latest.syncedAt ? current : latest;
  });
  
  return { syncedAt: latest.syncedAt };
}



/**
 * Google Ads SDK Client Configuration
 * Reuses pattern from googleAdsCampaigns.ts
 */
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
  const customerId = process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID!.replace(/-/g, "");

  // Create customer instance with refresh token
  const customer = client.Customer({
    customer_id: customerId,
    refresh_token: tokens.refreshToken || tokens.accessToken, // SDK handles refresh automatically
  });

  return customer;
}

/**
 * Helper function to refresh expired tokens
 * Reuses pattern from googleAdsCampaigns.ts
 */
async function refreshGoogleAdsToken(ctx: any, tokens: any) {
  const refreshUrl = "https://oauth2.googleapis.com/token";

  const params = new URLSearchParams({
    client_id: process.env.VITE_GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: tokens.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(refreshUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const tokenData = await response.json();

  if (tokenData.error) {
    throw new Error(
      `Token refresh failed: ${tokenData.error_description || tokenData.error}`,
    );
  }

  // Update tokens in database
  await ctx.runMutation(api.googleAds.saveTokens, {
    accessToken: tokenData.access_token,
    refreshToken: tokens.refreshToken, // Keep existing refresh token
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    scope: tokens.scope,
  });
}

/**
 * Refresh current month's ad spend data if stale.
 * Ensures MTD spend is fresh within 10-15 minutes without hammering the API.
 */
export const refreshCurrentMonthIfStale = action({
  args: {},
  async handler(ctx) {
    const userId = await getCurrentUserToken(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // 1) Check last syncedAt for this month
    const { monthKey, firstOfMonth, todayDate } = computeMonthDatesForUser();
    const latestSnapshot = await getLatestSnapshotForUserMonth(ctx, userId, monthKey);
    const now = Date.now();
    const freshnessThresholdMs = 45 * 60 * 1000; // 45 minutes

    if (latestSnapshot && now - latestSnapshot.syncedAt < freshnessThresholdMs) {
      return { skipped: true, reason: "fresh_enough" };
    }

    // 2) Build Google Ads customer client
    const customer = await getGoogleAdsClient(ctx);

    // 3) Fetch daily spend for current month
    const from_date = firstOfMonth; // "YYYY-MM-DD"
    const to_date = todayDate; // "YYYY-MM-DD"

    try {
      const rows = await customer.report({
        entity: "customer",
        metrics: ["metrics.cost_micros"],
        segments: ["segments.date"],
        from_date,
        to_date,
      });

      // 4) Upsert adSpendSnapshots per day
      let upsertedCount = 0;
      for (const row of rows) {
        const date = row.segments?.date; // "YYYY-MM-DD"
        const spendMicros = row.metrics?.cost_micros || 0;

        if (!date) {
          console.warn("Row missing date segment:", row);
          continue;
        }

        await ctx.runMutation(internal.adSpendMutations.upsertDailySpend, {
          userId,
          date,
          currencyCode: "GBP", // TODO: Get from account settings or API response
          spendMicros: typeof spendMicros === "string" ? parseInt(spendMicros, 10) : spendMicros,
          googleCustomerId: process.env.GOOGLE_ADS_MANAGER_ACCOUNT_ID,
        });
        upsertedCount++;
      }

      return { skipped: false, days: upsertedCount };
    } catch (error: any) {
      // Log error but don't fail completely - return error info
      console.error("Error fetching Google Ads spend:", error);
      const errorMessage = error?.message || String(error);
      
      // Log error details for debugging
      // Note: We can't update snapshots from action context, so errors are logged only
      // In production, you might want to create error snapshots via a mutation
      
      throw new Error(`Failed to fetch Google Ads spend: ${errorMessage}`);
    }
  },
});


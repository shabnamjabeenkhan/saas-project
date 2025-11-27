import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Upsert daily spend snapshot.
 * Creates a new snapshot or updates existing one for the same userId + date.
 */
export const upsertDailySpend = internalMutation({
  args: {
    userId: v.string(),
    date: v.string(), // "YYYY-MM-DD"
    currencyCode: v.string(),
    spendMicros: v.number(),
    googleCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if snapshot already exists for this userId + date
    const existing = await ctx.db
      .query("adSpendSnapshots")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date),
      )
      .first();
    
    const snapshotData = {
      userId: args.userId,
      date: args.date,
      currencyCode: args.currencyCode,
      spendMicros: args.spendMicros,
      syncedAt: Date.now(),
      source: "google_ads",
      googleCustomerId: args.googleCustomerId,
      rawError: undefined,
    };
    
    if (existing) {
      // Update existing snapshot
      await ctx.db.patch(existing._id, snapshotData);
      return existing._id;
    } else {
      // Create new snapshot
      return await ctx.db.insert("adSpendSnapshots", snapshotData);
    }
  },
});


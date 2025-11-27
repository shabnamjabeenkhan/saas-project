import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query helper: Get snapshots for a user and month.
 * Returns snapshots with syncedAt timestamps for freshness check.
 * Can be called from actions via ctx.runQuery.
 */
export const getSnapshotsForMonth = query({
  args: {
    userId: v.string(),
    monthKey: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    // Query all snapshots for this user
    const allSnapshots = await ctx.db
      .query("adSpendSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    // Filter to snapshots in the specified month
    const monthSnapshots = allSnapshots.filter((snapshot) =>
      snapshot.date.startsWith(args.monthKey),
    );
    
    return monthSnapshots.map((s) => ({
      syncedAt: s.syncedAt,
      date: s.date,
    }));
  },
});


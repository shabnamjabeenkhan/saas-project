import { query } from "./_generated/server";
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
 * 
 * Note: This is duplicated from adSpend.ts. In future, could extract to shared utility.
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
 * Get dashboard metrics for the current user.
 * Aggregates qualified calls, ad spend, and calculates CPL and ROI.
 */
export const getDashboardMetrics = query({
  args: {},
  returns: v.object({
    timeRange: v.object({
      monthKey: v.string(),
      start: v.number(),
      end: v.number(),
    }),
    qualifiedCalls: v.number(),
    adSpend: v.object({
      amount: v.number(),
      currencyCode: v.string(),
    }),
    costPerLead: v.union(v.number(), v.null()),
    estimatedRoi: v.number(),
    lastUpdatedAt: v.number(),
    hasRealData: v.boolean(),
  }),
  handler: async (ctx) => {
    const userId = await getCurrentUserToken(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Compute month date range
    const { monthKey, monthStart, monthEnd, todayDate } =
      computeMonthDatesForUser();

    // Qualified calls MTD
    const calls = await ctx.db
      .query("qualifiedCalls")
      .withIndex("by_user_and_start", (q) =>
        q.eq("userId", userId).gte("startedAt", monthStart).lt("startedAt", monthEnd),
      )
      .collect();

    const qualifiedCalls = calls.filter(
      (c) => c.qualificationStatus === "qualified",
    ).length;

    // Ad spend MTD
    const spendSnapshots = await ctx.db
      .query("adSpendSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const mtdSpendMicros = spendSnapshots
      .filter(
        (s) => s.date >= monthKey + "-01" && s.date <= todayDate,
      )
      .reduce((sum, s) => sum + s.spendMicros, 0);

    // Average revenue per job from onboarding
    const onboarding = await ctx.db
      .query("onboardingData")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    const averageRevenuePerJob =
      onboarding?.acquisitionGoals?.averageJobValue ?? 0;

    // Calculations (convert micros -> currency in JS)
    const spend = mtdSpendMicros / 1_000_000; // micros → major units
    const cpl = qualifiedCalls > 0 ? spend / qualifiedCalls : null;
    const estimatedRevenue = qualifiedCalls * averageRevenuePerJob;
    const estimatedRoi = estimatedRevenue - spend;

    const now = Date.now();

    return {
      timeRange: {
        monthKey,
        start: monthStart,
        end: monthEnd,
      },
      qualifiedCalls,
      adSpend: {
        amount: spend,
        currencyCode: "GBP", // TODO: Get from account settings or API response
      },
      costPerLead: cpl, // null => "N/A"
      estimatedRoi: estimatedRoi,
      lastUpdatedAt: now,
      hasRealData: qualifiedCalls > 0 || spend > 0,
    };
  },
});


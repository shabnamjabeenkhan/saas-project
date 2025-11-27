import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Internal mutation to record call events from call tracking providers.
 * Enforces idempotency and applies qualification rules (answered & duration >= 30s).
 */
export const recordCallEvent = internalMutation({
  args: {
    userId: v.string(),
    provider: v.string(), // "twilio", "callrail", etc.
    externalCallId: v.string(), // provider's unique ID (for idempotency)
    fromNumber: v.optional(v.string()),
    toNumber: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    startedAt: v.number(), // ms epoch UTC
    durationSeconds: v.number(),
    answered: v.boolean(),
  },
  async handler(ctx, args) {
    // Check for existing call with same provider + externalCallId (idempotency)
    const existing = await ctx.db
      .query("qualifiedCalls")
      .withIndex("by_external_id", (q) =>
        q.eq("provider", args.provider).eq("externalCallId", args.externalCallId),
      )
      .first();

    if (existing) {
      // Already processed this call event, return existing ID
      return existing._id;
    }

    // Apply qualification rules: answered AND duration >= 30 seconds
    const qualified = args.answered && args.durationSeconds >= 30;

    const qualificationStatus = qualified ? "qualified" : "unqualified";

    // Determine qualification reason
    const qualificationReason = !args.answered
      ? "not_answered"
      : args.durationSeconds < 30
      ? "short_duration"
      : "rules_satisfied";

    // Insert call record into qualifiedCalls table
    return await ctx.db.insert("qualifiedCalls", {
      ...args,
      qualificationStatus,
      qualificationReason,
      createdAt: Date.now(),
    });
  },
});


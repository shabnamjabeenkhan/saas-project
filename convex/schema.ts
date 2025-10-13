import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
  subscriptions: defineTable({
    userId: v.optional(v.string()),
    polarId: v.optional(v.string()),
    polarPriceId: v.optional(v.string()),
    currency: v.optional(v.string()),
    interval: v.optional(v.string()),
    status: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    amount: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    customerCancellationReason: v.optional(v.string()),
    customerCancellationComment: v.optional(v.string()),
    metadata: v.optional(v.any()),
    customFieldData: v.optional(v.any()),
    customerId: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("polarId", ["polarId"]),
  webhookEvents: defineTable({
    id: v.optional(v.string()),
    type: v.string(),
    polarEventId: v.string(),
    createdAt: v.string(),
    modifiedAt: v.string(),
    data: v.any(),
    processed: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    webhookId: v.optional(v.string()),
    processingStatus: v.optional(v.string()),
    processedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("type", ["type"])
    .index("polarEventId", ["polarEventId"])
    .index("by_webhook_id", ["webhookId"]),
  onboardingData: defineTable({
    userId: v.string(),
    tradeType: v.optional(v.string()), // "plumbing" | "electrical" | "both"
    businessName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    serviceArea: v.optional(v.object({
      city: v.string(),
      postcode: v.optional(v.string()),
      radius: v.number(), // in miles
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
    completedAt: v.optional(v.number()),
    isComplete: v.optional(v.boolean()),
  })
    .index("userId", ["userId"]),
  campaigns: defineTable({
    userId: v.string(),
    campaignName: v.string(),
    dailyBudget: v.number(),
    targetLocation: v.string(),
    businessInfo: v.object({
      businessName: v.string(),
      phone: v.string(),
      serviceArea: v.string(),
    }),
    adGroups: v.array(v.object({
      name: v.string(),
      keywords: v.array(v.string()),
      adCopy: v.object({
        headlines: v.array(v.string()),
        descriptions: v.array(v.string()),
        finalUrl: v.string(),
      }),
    })),
    callExtensions: v.array(v.string()),
    complianceNotes: v.array(v.string()),
    status: v.string(), // "draft" | "active" | "paused"
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"]),
});

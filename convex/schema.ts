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
  googleAdsTokens: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scope: v.string(),
    createdAt: v.number(),
    isActive: v.boolean(),
    disconnectedAt: v.optional(v.number()),
  })
    .index("userId", ["userId"]),

  // LEGAL COMPLIANCE TABLES - Evidence for legal protection
  complianceAuditTrail: defineTable({
    userId: v.string(),
    eventType: v.string(), // "warning_shown", "terms_accepted", "acknowledgment_clicked", "violation_flagged"
    eventData: v.any(), // Full details of what happened
    timestamp: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    pageUrl: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("eventType", ["eventType"])
    .index("timestamp", ["timestamp"]),

  // Terms of Service acceptance tracking
  termsAcceptances: defineTable({
    userId: v.string(),
    termsVersion: v.string(), // "v2.1_compliance_enhanced"
    acceptedAt: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    acceptanceMethod: v.string(), // "checkbox_click", "button_click", "signup_flow"
    pageUrl: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("termsVersion", ["termsVersion"]),

  // Compliance warnings and user acknowledgments
  complianceAcknowledgments: defineTable({
    userId: v.string(),
    warningType: v.string(), // "gas_safe_warning", "24_7_service_warning", "compliance_responsibility"
    warningContent: v.string(), // Exact text shown to user
    acknowledgedAt: v.number(),
    pageContext: v.string(), // "onboarding", "campaign_generation", "settings"
    ipAddress: v.optional(v.string()),
    required: v.boolean(), // Was this a required acknowledgment?
    sessionId: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("warningType", ["warningType"])
    .index("pageContext", ["pageContext"]),

  // User certifications and verification
  userCertifications: defineTable({
    userId: v.string(),
    certificationType: v.string(), // "gas_safe", "part_p", "insurance", "business_registration"

    // Gas Safe details
    gasSafeNumber: v.optional(v.string()),
    gasSafeExpiry: v.optional(v.number()),
    gasSafeVerified: v.optional(v.boolean()),

    // Electrical certification
    partPNumber: v.optional(v.string()),
    niceicNumber: v.optional(v.string()),
    electricalVerified: v.optional(v.boolean()),

    // Insurance
    insuranceProvider: v.optional(v.string()),
    insurancePolicyNumber: v.optional(v.string()),
    insuranceCoverage: v.optional(v.number()),
    insuranceExpiry: v.optional(v.number()),
    insuranceVerified: v.optional(v.boolean()),

    // Business registration
    companyNumber: v.optional(v.string()),
    companyName: v.optional(v.string()),
    businessType: v.optional(v.string()), // "limited_company", "sole_trader", "partnership"
    businessVerified: v.optional(v.boolean()),

    // Document storage
    documentUrl: v.optional(v.string()),
    documentType: v.optional(v.string()), // "certificate", "insurance_policy", "registration"

    // Verification tracking
    uploadedAt: v.number(),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.string()), // Admin who verified
    verificationNotes: v.optional(v.string()),
    verificationStatus: v.string(), // "pending", "verified", "rejected", "expired"

    // Legal audit trail
    lastChecked: v.optional(v.number()),
    autoVerificationAttempted: v.optional(v.boolean()),
  })
    .index("userId", ["userId"])
    .index("certificationType", ["certificationType"])
    .index("verificationStatus", ["verificationStatus"]),

  // Compliance violations tracking
  complianceViolations: defineTable({
    userId: v.string(),
    violationType: v.string(), // "false_certification", "misleading_availability", "unsubstantiated_claims"
    description: v.string(),
    severity: v.string(), // "low", "medium", "high", "critical"

    // Context
    campaignId: v.optional(v.string()),
    contentFlagged: v.optional(v.string()),
    detectionMethod: v.string(), // "ai_filter", "manual_review", "user_report", "external_complaint"

    // Resolution
    resolved: v.boolean(),
    resolutionAction: v.optional(v.string()), // "content_updated", "user_educated", "account_suspended"
    resolutionNotes: v.optional(v.string()),
    resolvedBy: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),

    // Legal tracking
    reportedToAuthorities: v.optional(v.boolean()),
    authorityReference: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("violationType", ["violationType"])
    .index("severity", ["severity"])
    .index("resolved", ["resolved"]),
});

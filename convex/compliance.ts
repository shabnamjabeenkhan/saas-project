import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Log compliance events for legal evidence
export const logComplianceEvent = mutation({
  args: {
    userId: v.string(),
    eventType: v.string(),
    eventData: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    pageUrl: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("complianceAuditTrail", {
      userId: args.userId,
      eventType: args.eventType,
      eventData: args.eventData,
      timestamp: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      pageUrl: args.pageUrl,
      sessionId: args.sessionId,
    });
  },
});

// Get user's last accepted terms version
export const getUserLastAcceptedTermsVersion = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const lastAcceptance = await ctx.db
      .query("termsAcceptances")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    return lastAcceptance?.termsVersion || null;
  },
});

// Check if user has accepted current terms version
export const hasUserAcceptedCurrentTerms = query({
  args: {
    userId: v.string(),
    currentTermsVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const lastAcceptance = await ctx.db
      .query("termsAcceptances")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    return lastAcceptance?.termsVersion === args.currentTermsVersion;
  },
});

// Record terms of service acceptance
export const recordTermsAcceptance = mutation({
  args: {
    userId: v.string(),
    termsVersion: v.string(),
    acceptanceMethod: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    pageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("termsAcceptances", {
      userId: args.userId,
      termsVersion: args.termsVersion,
      acceptedAt: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      acceptanceMethod: args.acceptanceMethod,
      pageUrl: args.pageUrl,
    });
  },
});

// Record compliance acknowledgments
export const recordComplianceAcknowledgment = mutation({
  args: {
    userId: v.string(),
    warningType: v.string(),
    warningContent: v.string(),
    pageContext: v.string(),
    ipAddress: v.optional(v.string()),
    required: v.boolean(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("complianceAcknowledgments", {
      userId: args.userId,
      warningType: args.warningType,
      warningContent: args.warningContent,
      acknowledgedAt: Date.now(),
      pageContext: args.pageContext,
      ipAddress: args.ipAddress,
      required: args.required,
      sessionId: args.sessionId,
    });
  },
});

// Store user certification information
export const storeCertification = mutation({
  args: {
    userId: v.string(),
    certificationType: v.string(),
    gasSafeNumber: v.optional(v.string()),
    gasSafeExpiry: v.optional(v.number()),
    partPNumber: v.optional(v.string()),
    niceicNumber: v.optional(v.string()),
    insuranceProvider: v.optional(v.string()),
    insurancePolicyNumber: v.optional(v.string()),
    insuranceCoverage: v.optional(v.number()),
    insuranceExpiry: v.optional(v.number()),
    companyNumber: v.optional(v.string()),
    companyName: v.optional(v.string()),
    businessType: v.optional(v.string()),
    documentUrl: v.optional(v.string()),
    documentType: v.optional(v.string()),
    verificationNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userCertifications", {
      userId: args.userId,
      certificationType: args.certificationType,
      gasSafeNumber: args.gasSafeNumber,
      gasSafeExpiry: args.gasSafeExpiry,
      gasSafeVerified: false,
      partPNumber: args.partPNumber,
      niceicNumber: args.niceicNumber,
      electricalVerified: false,
      insuranceProvider: args.insuranceProvider,
      insurancePolicyNumber: args.insurancePolicyNumber,
      insuranceCoverage: args.insuranceCoverage,
      insuranceExpiry: args.insuranceExpiry,
      insuranceVerified: false,
      companyNumber: args.companyNumber,
      companyName: args.companyName,
      businessType: args.businessType,
      businessVerified: false,
      documentUrl: args.documentUrl,
      documentType: args.documentType,
      uploadedAt: Date.now(),
      verificationNotes: args.verificationNotes,
      verificationStatus: "pending",
    });
  },
});

// Record compliance violations
export const recordViolation = mutation({
  args: {
    userId: v.string(),
    violationType: v.string(),
    description: v.string(),
    severity: v.string(),
    campaignId: v.optional(v.string()),
    contentFlagged: v.optional(v.string()),
    detectionMethod: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("complianceViolations", {
      userId: args.userId,
      violationType: args.violationType,
      description: args.description,
      severity: args.severity,
      campaignId: args.campaignId,
      contentFlagged: args.contentFlagged,
      detectionMethod: args.detectionMethod,
      resolved: false,
      createdAt: Date.now(),
    });
  },
});

// Get user's complete compliance evidence for legal defense
export const getUserComplianceEvidence = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const [auditTrail, termsAcceptances, acknowledgments, certifications, violations] = await Promise.all([
      ctx.db
        .query("complianceAuditTrail")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .collect(),

      ctx.db
        .query("termsAcceptances")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .collect(),

      ctx.db
        .query("complianceAcknowledgments")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .collect(),

      ctx.db
        .query("userCertifications")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .collect(),

      ctx.db
        .query("complianceViolations")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .collect(),
    ]);

    return {
      auditTrail,
      termsAcceptances,
      acknowledgments,
      certifications,
      violations,
      evidenceGeneratedAt: Date.now(),
      totalEvents: auditTrail.length + termsAcceptances.length + acknowledgments.length,
    };
  },
});

// Get user's current certification status
export const getUserCertifications = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userCertifications")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .collect();
  },
});

// Get unresolved compliance violations
export const getUnresolvedViolations = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("complianceViolations")
      .filter(q => q.eq(q.field("resolved"), false));

    if (args.userId) {
      query = query.filter(q => q.eq(q.field("userId"), args.userId));
    }

    return await query.order("desc").collect();
  },
});

// Mark violation as resolved
export const resolveViolation = mutation({
  args: {
    violationId: v.id("complianceViolations"),
    resolutionAction: v.string(),
    resolutionNotes: v.string(),
    resolvedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.violationId, {
      resolved: true,
      resolutionAction: args.resolutionAction,
      resolutionNotes: args.resolutionNotes,
      resolvedBy: args.resolvedBy,
      resolvedAt: Date.now(),
    });
  },
});

// Update certification verification status
export const updateCertificationStatus = mutation({
  args: {
    certificationId: v.id("userCertifications"),
    verificationStatus: v.string(),
    verifiedBy: v.optional(v.string()),
    verificationNotes: v.optional(v.string()),
    gasSafeVerified: v.optional(v.boolean()),
    electricalVerified: v.optional(v.boolean()),
    insuranceVerified: v.optional(v.boolean()),
    businessVerified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      verificationStatus: args.verificationStatus,
      lastChecked: Date.now(),
    };

    if (args.verificationStatus === "verified") {
      updates.verifiedAt = Date.now();
      updates.verifiedBy = args.verifiedBy;
    }

    if (args.verificationNotes) {
      updates.verificationNotes = args.verificationNotes;
    }

    if (args.gasSafeVerified !== undefined) {
      updates.gasSafeVerified = args.gasSafeVerified;
    }

    if (args.electricalVerified !== undefined) {
      updates.electricalVerified = args.electricalVerified;
    }

    if (args.insuranceVerified !== undefined) {
      updates.insuranceVerified = args.insuranceVerified;
    }

    if (args.businessVerified !== undefined) {
      updates.businessVerified = args.businessVerified;
    }

    return await ctx.db.patch(args.certificationId, updates);
  },
});
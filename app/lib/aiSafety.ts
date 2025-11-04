// AI Content Safety and Compliance Filtering System

export interface ComplianceResult {
  approved: boolean;
  violations: ComplianceViolation[];
  warnings: ComplianceWarning[];
  suggestions: string[];
}

export interface ComplianceViolation {
  type: string;
  phrase: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  replacement?: string;
}

export interface ComplianceWarning {
  type: string;
  phrase: string;
  concern: string;
  recommendation: string;
}

// Banned phrases that violate UK trade regulations
const complianceFilters = {
  // Gas Work Restrictions - CRITICAL
  gasWork: {
    bannedPhrases: [
      "gas repairs",
      "gas installations",
      "gas safety checks",
      "carbon monoxide testing",
      "gas leak repairs",
      "boiler installations",
      "gas appliance servicing",
      "gas pipe work",
      "gas fitting",
    ],
    severity: 'critical' as const,
    reason: "Gas work requires valid Gas Safe registration",
    replacements: {
      "gas repairs": "heating system maintenance (Gas Safe certified)",
      "gas installations": "heating installations (Gas Safe certified)",
      "gas safety checks": "heating safety inspections (Gas Safe certified)",
      "carbon monoxide testing": "safety testing (Gas Safe certified)",
      "gas leak repairs": "heating system repairs (Gas Safe certified)",
      "boiler installations": "boiler services (Gas Safe certified)",
    }
  },

  // Electrical Work Restrictions - CRITICAL
  electricalWork: {
    bannedPhrases: [
      "all electrical work",
      "electrical installations",
      "rewiring",
      "electrical safety certificates",
      "consumer unit replacement",
      "electrical inspection",
      "part p work",
    ],
    severity: 'critical' as const,
    reason: "Electrical work requires Part P certification",
    replacements: {
      "all electrical work": "qualified electrical services",
      "electrical installations": "electrical services (Part P certified)",
      "rewiring": "electrical upgrades (Part P certified)",
      "electrical safety certificates": "electrical inspections (Part P certified)",
    }
  },

  // Service Availability Claims - HIGH PRIORITY
  availability: {
    bannedPhrases: [
      "24/7 service",
      "24 hour service",
      "always available",
      "emergency service guaranteed",
      "instant response",
      "immediate attendance",
      "24/7 emergency",
      "round the clock",
    ],
    severity: 'high' as const,
    reason: "Availability claims must be accurate and deliverable",
    replacements: {
      "24/7 service": "emergency callouts available",
      "24 hour service": "same-day service available",
      "always available": "rapid response available",
      "emergency service guaranteed": "emergency services offered",
      "instant response": "quick response times",
      "immediate attendance": "prompt service available",
    }
  },

  // Pricing Claims - HIGH PRIORITY
  pricing: {
    bannedPhrases: [
      "cheapest guaranteed",
      "lowest prices",
      "best value guaranteed",
      "free estimates*",
      "no hidden costs*",
      "unbeatable prices",
      "price match guarantee",
    ],
    severity: 'high' as const,
    reason: "Price guarantees must be substantiated and truthful",
    replacements: {
      "cheapest guaranteed": "competitive pricing",
      "lowest prices": "fair pricing",
      "best value guaranteed": "excellent value",
      "free estimates*": "upfront quotes available",
      "no hidden costs*": "transparent pricing",
    }
  },

  // Certification Claims - CRITICAL
  certificationClaims: {
    bannedPhrases: [
      "gas safe certified",
      "part p qualified",
      "fully licensed",
      "certified engineer",
      "qualified professional",
    ],
    severity: 'critical' as const,
    reason: "Certification claims must be verified before advertising",
    replacements: {
      "gas safe certified": "[REQUIRES VERIFICATION] Gas Safe registered",
      "part p qualified": "[REQUIRES VERIFICATION] Part P certified",
      "fully licensed": "[REQUIRES VERIFICATION] Licensed professional",
    }
  },

  // Safety/Emergency Claims - HIGH PRIORITY
  safetyClaims: {
    bannedPhrases: [
      "100% safe",
      "guaranteed safe",
      "risk-free",
      "completely safe",
      "no risk",
      "absolutely safe",
    ],
    severity: 'high' as const,
    reason: "Absolute safety claims cannot be guaranteed",
    replacements: {
      "100% safe": "safe working practices",
      "guaranteed safe": "safety-focused approach",
      "risk-free": "careful risk management",
    }
  }
};

// Warning phrases that require user verification
const warningPhrases = {
  timeCommitments: [
    "same day",
    "within hours",
    "immediate",
    "urgent",
    "emergency",
  ],
  locationClaims: [
    "throughout UK",
    "nationwide",
    "all areas",
    "everywhere",
  ],
  qualificationHints: [
    "professional",
    "qualified",
    "certified",
    "licensed",
    "registered",
  ]
};

export function scanContentForCompliance(content: string): ComplianceResult {
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];
  const suggestions: string[] = [];

  const lowerContent = content.toLowerCase();

  // Check for banned phrases
  Object.entries(complianceFilters).forEach(([category, filter]) => {
    filter.bannedPhrases.forEach(phrase => {
      if (lowerContent.includes(phrase.toLowerCase())) {
        const replacement = filter.replacements?.[phrase];

        violations.push({
          type: category,
          phrase,
          reason: filter.reason,
          severity: filter.severity,
          replacement
        });

        if (replacement) {
          suggestions.push(`Replace "${phrase}" with "${replacement}"`);
        }
      }
    });
  });

  // Check for warning phrases
  Object.entries(warningPhrases).forEach(([category, phrases]) => {
    phrases.forEach(phrase => {
      if (lowerContent.includes(phrase.toLowerCase())) {
        warnings.push({
          type: category,
          phrase,
          concern: getWarningConcern(category, phrase),
          recommendation: getWarningRecommendation(category, phrase)
        });
      }
    });
  });

  return {
    approved: violations.length === 0,
    violations,
    warnings,
    suggestions
  };
}

function getWarningConcern(category: string, phrase: string): string {
  const concerns: Record<string, Record<string, string>> = {
    timeCommitments: {
      "same day": "Ensure you can actually deliver same-day service",
      "within hours": "Verify you can respond within stated timeframe",
      "immediate": "Confirm you can provide immediate response",
      "urgent": "Ensure urgent response capability is available",
      "emergency": "Verify you offer genuine emergency services"
    },
    locationClaims: {
      "throughout UK": "Confirm you actually service entire UK",
      "nationwide": "Verify nationwide coverage is accurate",
      "all areas": "Ensure all areas claim is truthful",
      "everywhere": "Confirm universal coverage capability"
    },
    qualificationHints: {
      "professional": "Ensure professional credentials are valid",
      "qualified": "Verify all qualifications are current",
      "certified": "Confirm certifications are up to date",
      "licensed": "Verify all licenses are valid",
      "registered": "Confirm registration status is current"
    }
  };

  return concerns[category]?.[phrase] || "Verify this claim is accurate";
}

function getWarningRecommendation(category: string, phrase: string): string {
  const recommendations: Record<string, Record<string, string>> = {
    timeCommitments: {
      "same day": "Consider 'same-day service available' if not guaranteed",
      "within hours": "Specify actual response timeframe",
      "immediate": "Use 'rapid response' or 'quick service'",
      "urgent": "Consider 'priority service available'",
      "emergency": "Ensure 24/7 availability or clarify hours"
    },
    locationClaims: {
      "throughout UK": "List specific regions you cover",
      "nationwide": "Specify actual coverage areas",
      "all areas": "List covered postcodes or regions",
      "everywhere": "Be specific about service boundaries"
    },
    qualificationHints: {
      "professional": "Include specific professional credentials",
      "qualified": "List relevant qualifications",
      "certified": "Specify certifications held",
      "licensed": "Include license numbers where applicable",
      "registered": "Include registration numbers (Gas Safe, etc.)"
    }
  };

  return recommendations[category]?.[phrase] || "Provide evidence or specifics";
}

// Auto-replacement function for safe content
export function applySafeReplacements(content: string): string {
  let safeContent = content;

  Object.values(complianceFilters).forEach(filter => {
    if (filter.replacements) {
      Object.entries(filter.replacements).forEach(([banned, replacement]) => {
        const regex = new RegExp(banned, 'gi');
        safeContent = safeContent.replace(regex, replacement);
      });
    }
  });

  return safeContent;
}

// Check if user has required certifications for content
export function validateCertificationRequirements(
  content: string,
  userCertifications: { gasSafe?: boolean; partP?: boolean; insurance?: boolean }
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const lowerContent = content.toLowerCase();

  // Check gas work without Gas Safe
  const gasKeywords = ["gas", "boiler", "heating", "carbon monoxide"];
  const hasGasContent = gasKeywords.some(keyword => lowerContent.includes(keyword));

  if (hasGasContent && !userCertifications.gasSafe) {
    violations.push({
      type: 'missing_gas_safe',
      phrase: 'Gas-related services mentioned',
      reason: 'Gas Safe registration required for gas work advertising',
      severity: 'critical'
    });
  }

  // Check electrical work without Part P
  const electricalKeywords = ["electrical", "wiring", "socket", "switch", "fuse"];
  const hasElectricalContent = electricalKeywords.some(keyword => lowerContent.includes(keyword));

  if (hasElectricalContent && !userCertifications.partP) {
    violations.push({
      type: 'missing_part_p',
      phrase: 'Electrical services mentioned',
      reason: 'Part P certification required for electrical work advertising',
      severity: 'critical'
    });
  }

  // Check insurance requirement
  if (!userCertifications.insurance) {
    violations.push({
      type: 'missing_insurance',
      phrase: 'Service advertising without insurance verification',
      reason: 'Public liability insurance required for trade service advertising',
      severity: 'high'
    });
  }

  return violations;
}

// Generate compliance report for legal evidence
export function generateComplianceReport(
  content: string,
  userCertifications: any,
  scanResult: ComplianceResult
) {
  return {
    timestamp: Date.now(),
    contentScanned: content,
    userCertifications,
    scanResult,
    complianceVersion: "1.0",
    scanEngine: "TradeBoost AI Safety Filter",
    regulatoryFramework: "UK Trading Standards & Consumer Protection",
    evidenceGenerated: true
  };
}
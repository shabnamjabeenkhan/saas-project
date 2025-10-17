// Mock campaign data for testing various scenarios without Google Ads API
export interface MockCampaignData {
  campaignName: string;
  dailyBudget: number;
  targetLocation: string;
  businessInfo: {
    businessName: string;
    phone: string;
    serviceArea: string;
  };
  adGroups: {
    name: string;
    keywords: string[];
    adCopy: {
      headlines: string[];
      descriptions: string[];
      finalUrl: string;
    };
  }[];
  callExtensions: string[];
  complianceNotes: string[];
  optimizationSuggestions?: string[];
  seasonalRecommendations?: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  qualityScore?: number;
  estimatedPerformance?: {
    expectedClicks: number;
    expectedCost: number;
    expectedConversions: number;
    competitionLevel: 'low' | 'medium' | 'high';
  };
}

export const mockCampaignScenarios: Record<string, MockCampaignData> = {
  // Perfect compliance scenario
  perfectCampaign: {
    campaignName: "London Emergency Plumbing - 24/7 Service",
    dailyBudget: 35,
    targetLocation: "London, UK",
    businessInfo: {
      businessName: "QuickFix Plumbing",
      phone: "020 7123 4567",
      serviceArea: "London, SW1A 0AA"
    },
    adGroups: [
      {
        name: "Emergency Plumbing London",
        keywords: [
          "emergency plumber london",
          "24/7 plumber london",
          "urgent plumber london",
          "plumber near me london",
          "emergency plumbing london",
          "burst pipe repair london",
          "blocked drain london",
          "boiler repair london"
        ],
        adCopy: {
          headlines: [
            "24/7 Emergency Plumber London",
            "Gas Safe Registered",
            "No Call Out Fee"
          ],
          descriptions: [
            "Professional emergency plumbing services. Gas Safe registered engineers available 24/7 across London.",
            "Fast response times. Transparent pricing. Public liability insurance. Call now for immediate assistance."
          ],
          finalUrl: "https://quickfixplumbing.co.uk"
        }
      },
      {
        name: "Boiler Installation London",
        keywords: [
          "boiler installation london",
          "new boiler london",
          "boiler replacement london",
          "combi boiler installation",
          "boiler fitting london",
          "central heating london"
        ],
        adCopy: {
          headlines: [
            "New Boiler Installation",
            "Gas Safe Certified",
            "10 Year Warranty"
          ],
          descriptions: [
            "Professional boiler installations by Gas Safe registered engineers. Free quotes, competitive prices.",
            "Quality boilers with extended warranties. Finance options available. Book your free assessment today."
          ],
          finalUrl: "https://quickfixplumbing.co.uk/boiler-installation"
        }
      }
    ],
    callExtensions: ["020 7123 4567"],
    complianceNotes: [
      "All gas work performed by Gas Safe registered engineers",
      "Public liability insurance up to £2 million",
      "Transparent pricing with no hidden charges",
      "All work complies with UK building regulations"
    ],
    optimizationSuggestions: [
      "Add location extensions for better local visibility",
      "Include sitelink extensions for key service pages",
      "Consider adding customer review extensions",
      "Test mobile bid adjustments for emergency searches"
    ],
    seasonalRecommendations: [
      "Winter: Increase budget for heating emergency keywords",
      "Add 'frozen pipes' and 'no heating' keywords during cold spells",
      "Summer: Focus on boiler servicing and installation keywords"
    ],
    status: 'approved',
    qualityScore: 95,
    estimatedPerformance: {
      expectedClicks: 48,
      expectedCost: 420,
      expectedConversions: 8,
      competitionLevel: 'medium'
    }
  },

  // Compliance issues scenario
  problematicCampaign: {
    campaignName: "Cheapest Plumber - Guaranteed Best Prices!",
    dailyBudget: 50,
    targetLocation: "Birmingham, UK",
    businessInfo: {
      businessName: "Budget Plumbing",
      phone: "0121 456 7890",
      serviceArea: "Birmingham, B1 1AA"
    },
    adGroups: [
      {
        name: "Cheap Emergency Plumbing",
        keywords: [
          "cheapest plumber birmingham",
          "cheap emergency plumber",
          "discount plumbing birmingham",
          "budget plumber birmingham"
        ],
        adCopy: {
          headlines: [
            "Cheapest Plumber Birmingham",
            "Guaranteed Lowest Prices",
            "£20 Emergency Callouts"
          ],
          descriptions: [
            "We guarantee the cheapest prices in Birmingham! Beat any quote or money back guaranteed.",
            "Quick emergency response. No job too small. Call now for unbeatable deals on all plumbing work."
          ],
          finalUrl: "https://budgetplumbing.co.uk"
        }
      }
    ],
    callExtensions: ["0121 456 7890"],
    complianceNotes: [
      "⚠️ Claims of 'cheapest' and 'guaranteed' may violate advertising standards",
      "⚠️ No mention of Gas Safe registration for gas work",
      "⚠️ Emergency callout fee of £20 may be misleading",
      "⚠️ 'Money back guarantee' needs terms and conditions"
    ],
    status: 'rejected',
    qualityScore: 32,
    estimatedPerformance: {
      expectedClicks: 15,
      expectedCost: 180,
      expectedConversions: 2,
      competitionLevel: 'high'
    }
  },

  // Electrical contractor scenario
  electricalCampaign: {
    campaignName: "Manchester Electrical Services - Part P Compliant",
    dailyBudget: 28,
    targetLocation: "Manchester, UK",
    businessInfo: {
      businessName: "PowerTech Electrical",
      phone: "0161 234 5678",
      serviceArea: "Manchester, M1 1AA"
    },
    adGroups: [
      {
        name: "Emergency Electrician Manchester",
        keywords: [
          "emergency electrician manchester",
          "24/7 electrician manchester",
          "power cut electrician",
          "electrical fault manchester",
          "electrician near me manchester"
        ],
        adCopy: {
          headlines: [
            "24/7 Emergency Electrician",
            "Part P Compliant",
            "NICEIC Approved"
          ],
          descriptions: [
            "Qualified electricians available 24/7. Part P compliant work. NICEIC approved contractors.",
            "Fast response to electrical emergencies. Fully insured. Free quotes. Call now for immediate help."
          ],
          finalUrl: "https://powertechelectrical.co.uk"
        }
      },
      {
        name: "Electrical Installation Manchester",
        keywords: [
          "electrical installation manchester",
          "rewiring manchester",
          "consumer unit upgrade",
          "electrical testing manchester",
          "PAT testing manchester"
        ],
        adCopy: {
          headlines: [
            "Professional Electrical Work",
            "City & Guilds Qualified",
            "17th Edition Compliant"
          ],
          descriptions: [
            "Complete electrical installations and rewiring. All work certified and compliant with current regulations.",
            "Qualified to 17th Edition standards. Building regulations approval. Competitive prices, quality work."
          ],
          finalUrl: "https://powertechelectrical.co.uk/installation"
        }
      }
    ],
    callExtensions: ["0161 234 5678"],
    complianceNotes: [
      "All work complies with Part P Building Regulations",
      "NICEIC approved contractor status verified",
      "Public liability insurance £2 million",
      "All certificates provided for notifiable work"
    ],
    optimizationSuggestions: [
      "Add 'electrical safety' keywords for higher intent",
      "Include 'EV charger installation' for growing market",
      "Test bid adjustments for commercial vs residential"
    ],
    seasonalRecommendations: [
      "Winter: Emphasize heating electrical faults",
      "Summer: Focus on outdoor electrical installations",
      "Year-round: PAT testing for businesses"
    ],
    status: 'draft',
    qualityScore: 88,
    estimatedPerformance: {
      expectedClicks: 42,
      expectedCost: 385,
      expectedConversions: 7,
      competitionLevel: 'medium'
    }
  },

  // Multi-trade scenario
  combinedTradesCampaign: {
    campaignName: "Leeds Plumbing & Electrical - All Trades",
    dailyBudget: 45,
    targetLocation: "Leeds, UK",
    businessInfo: {
      businessName: "AllTrades Leeds",
      phone: "0113 567 8901",
      serviceArea: "Leeds, LS1 1AA"
    },
    adGroups: [
      {
        name: "Emergency Plumbing Leeds",
        keywords: [
          "emergency plumber leeds",
          "boiler repair leeds",
          "gas engineer leeds",
          "heating engineer leeds"
        ],
        adCopy: {
          headlines: [
            "Emergency Plumber Leeds",
            "Gas Safe Registered",
            "24/7 Service Available"
          ],
          descriptions: [
            "Professional plumbing and heating services. Gas Safe registered engineers for all gas work.",
            "Emergency callouts available. Transparent pricing. Fully insured. Call for immediate assistance."
          ],
          finalUrl: "https://alltradesleeds.co.uk/plumbing"
        }
      },
      {
        name: "Electrical Services Leeds",
        keywords: [
          "electrician leeds",
          "electrical repair leeds",
          "rewiring leeds",
          "electrical fault leeds"
        ],
        adCopy: {
          headlines: [
            "Qualified Electrician Leeds",
            "Part P Registered",
            "Same Day Service"
          ],
          descriptions: [
            "Certified electrical contractors. Part P compliant work. All electrical installations and repairs.",
            "Fast response times. Quality workmanship guaranteed. Free estimates. Building regulations compliant."
          ],
          finalUrl: "https://alltradesleeds.co.uk/electrical"
        }
      }
    ],
    callExtensions: ["0113 567 8901"],
    complianceNotes: [
      "Gas Safe registration for all gas and heating work",
      "Part P compliance for electrical installations",
      "Public liability insurance covers both trades",
      "All work certificated and guaranteed"
    ],
    status: 'pending_approval',
    qualityScore: 91,
    estimatedPerformance: {
      expectedClicks: 65,
      expectedCost: 580,
      expectedConversions: 12,
      competitionLevel: 'medium'
    }
  }
};

export const getRandomMockCampaign = (): MockCampaignData => {
  const scenarios = Object.values(mockCampaignScenarios);
  return scenarios[Math.floor(Math.random() * scenarios.length)];
};

export const getMockCampaignByScenario = (scenario: keyof typeof mockCampaignScenarios): MockCampaignData => {
  return mockCampaignScenarios[scenario];
};

// Helper to generate compliance checks based on campaign data
export const generateMockComplianceChecks = (campaign: MockCampaignData) => {
  const checks = [];

  // Check for Gas Safe mentions in gas-related content
  const hasGasContent = campaign.adGroups.some(group =>
    group.keywords.some(k => k.includes('gas') || k.includes('boiler') || k.includes('heating')) ||
    group.adCopy.headlines.some(h => h.includes('gas') || h.includes('boiler') || h.includes('heating'))
  );

  if (hasGasContent) {
    const hasGasSafe = campaign.adGroups.some(group =>
      group.adCopy.headlines.some(h => h.toLowerCase().includes('gas safe')) ||
      group.adCopy.descriptions.some(d => d.toLowerCase().includes('gas safe'))
    );

    checks.push({
      rule: {
        id: 'gas_safe_registration',
        title: 'Gas Safe Registration Required',
        description: 'Gas work must mention Gas Safe registration',
        category: 'legal' as const,
        severity: 'error' as const,
        tradeTypes: ['plumbing', 'both'] as ('plumbing' | 'electrical' | 'both')[]
      },
      passed: hasGasSafe,
      message: hasGasSafe
        ? 'Gas Safe registration is properly mentioned'
        : 'Gas work detected but no Gas Safe registration mentioned',
      suggestions: hasGasSafe ? [] : [
        'Add "Gas Safe Registered" to headlines',
        'Include Gas Safe registration number',
        'Mention Gas Safe credentials in descriptions'
      ]
    });
  }

  // Check for misleading claims
  const misleadingClaims = ['cheapest', 'guaranteed lowest', 'best price', 'unbeatable'];
  const hasMisleadingClaims = campaign.adGroups.some(group =>
    [...group.adCopy.headlines, ...group.adCopy.descriptions].some(text =>
      misleadingClaims.some(claim => text.toLowerCase().includes(claim))
    )
  );

  checks.push({
    rule: {
      id: 'misleading_claims',
      title: 'No Misleading Price Claims',
      description: 'Avoid superlative claims about pricing',
      category: 'legal' as const,
      severity: 'error' as const,
      tradeTypes: ['plumbing', 'electrical', 'both'] as ('plumbing' | 'electrical' | 'both')[]
    },
    passed: !hasMisleadingClaims,
    message: hasMisleadingClaims
      ? 'Potentially misleading price claims detected'
      : 'No misleading price claims found',
    suggestions: hasMisleadingClaims ? [
      'Replace "cheapest" with "competitive prices"',
      'Use "transparent pricing" instead of guarantees',
      'Focus on value rather than price claims'
    ] : []
  });

  // Check for emergency claims substantiation
  const hasEmergencyClaims = campaign.adGroups.some(group =>
    [...group.adCopy.headlines, ...group.adCopy.descriptions, ...group.keywords].some(text =>
      text.toLowerCase().includes('24/7') || text.toLowerCase().includes('emergency')
    )
  );

  checks.push({
    rule: {
      id: 'emergency_substantiation',
      title: 'Emergency Service Claims',
      description: 'Emergency claims must be substantiated',
      category: 'safety' as const,
      severity: 'warning' as const,
      tradeTypes: ['plumbing', 'electrical', 'both'] as ('plumbing' | 'electrical' | 'both')[]
    },
    passed: true, // Assume valid for mock data
    message: hasEmergencyClaims
      ? 'Emergency service claims present - ensure these are substantiated'
      : 'No emergency service claims found',
    suggestions: hasEmergencyClaims ? [
      'Ensure 24/7 availability is genuine',
      'Have processes in place for emergency response',
      'Consider response time commitments'
    ] : []
  });

  return checks;
};
// UK Trades Compliance Rules and Validation
export interface ComplianceRule {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  tradeTypes: ('plumbing' | 'electrical' | 'both')[];
  category: 'legal' | 'safety' | 'advertising' | 'location';
}

export interface ComplianceCheck {
  rule: ComplianceRule;
  passed: boolean;
  message: string;
  suggestions?: string[];
}

export interface CampaignData {
  tradeType: 'plumbing' | 'electrical' | 'both';
  serviceArea: {
    city: string;
    postcode?: string;
    radius: number;
  };
  serviceOfferings: string[];
  adCopy: {
    headlines: string[];
    descriptions: string[];
  };
  keywords: string[];
}

// UK Compliance Rules Database
export const UK_COMPLIANCE_RULES: ComplianceRule[] = [
  // Gas Safety Regulations
  {
    id: 'gas-safe-registration',
    title: 'Gas Safe Registration Required',
    description: 'All gas work must be carried out by Gas Safe registered engineers',
    severity: 'error',
    tradeTypes: ['plumbing', 'both'],
    category: 'legal',
  },
  {
    id: 'gas-safety-certificate',
    title: 'Gas Safety Certificate Advertising',
    description: 'Must mention Gas Safe registration when advertising gas services',
    severity: 'error',
    tradeTypes: ['plumbing', 'both'],
    category: 'advertising',
  },

  // Electrical Regulations
  {
    id: 'part-p-compliance',
    title: 'Part P Building Regulations',
    description: 'Electrical work in homes must comply with Part P of Building Regulations',
    severity: 'error',
    tradeTypes: ['electrical', 'both'],
    category: 'legal',
  },
  {
    id: 'electrical-qualifications',
    title: 'Electrical Qualifications Display',
    description: 'Must display relevant electrical qualifications (City & Guilds, NVQ, etc.)',
    severity: 'warning',
    tradeTypes: ['electrical', 'both'],
    category: 'advertising',
  },
  {
    id: 'electrical-testing-certificates',
    title: 'Electrical Testing & Certificates',
    description: 'Must offer electrical testing and provide certificates for notifiable work',
    severity: 'warning',
    tradeTypes: ['electrical', 'both'],
    category: 'safety',
  },

  // General Trading Standards
  {
    id: 'trading-standards-compliance',
    title: 'Trading Standards Compliance',
    description: 'All advertising must comply with UK Trading Standards regulations',
    severity: 'error',
    tradeTypes: ['plumbing', 'electrical', 'both'],
    category: 'legal',
  },
  {
    id: 'price-transparency',
    title: 'Price Transparency',
    description: 'Must be transparent about pricing, call-out charges, and additional costs',
    severity: 'warning',
    tradeTypes: ['plumbing', 'electrical', 'both'],
    category: 'advertising',
  },
  {
    id: 'no-misleading-claims',
    title: 'No Misleading Claims',
    description: 'Cannot make false or misleading claims about services or qualifications',
    severity: 'error',
    tradeTypes: ['plumbing', 'electrical', 'both'],
    category: 'advertising',
  },

  // Insurance & Liability
  {
    id: 'public-liability-insurance',
    title: 'Public Liability Insurance',
    description: 'Must have valid public liability insurance and mention it in advertising',
    severity: 'warning',
    tradeTypes: ['plumbing', 'electrical', 'both'],
    category: 'legal',
  },

  // Location-Specific
  {
    id: 'london-low-emission-zone',
    title: 'London Low Emission Zone',
    description: 'Vehicles operating in London must comply with Low Emission Zone requirements',
    severity: 'info',
    tradeTypes: ['plumbing', 'electrical', 'both'],
    category: 'location',
  },
];

// Check campaign against compliance rules
export function validateCampaignCompliance(campaign: CampaignData): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  for (const rule of UK_COMPLIANCE_RULES) {
    // Skip rules that don't apply to this trade type
    if (!rule.tradeTypes.includes(campaign.tradeType)) {
      continue;
    }

    const check = performComplianceCheck(rule, campaign);
    checks.push(check);
  }

  return checks;
}

function performComplianceCheck(rule: ComplianceRule, campaign: CampaignData): ComplianceCheck {
  const adText = [...campaign.adCopy.headlines, ...campaign.adCopy.descriptions].join(' ').toLowerCase();
  const services = campaign.serviceOfferings.join(' ').toLowerCase();
  const keywords = campaign.keywords.join(' ').toLowerCase();
  const allText = `${adText} ${services} ${keywords}`;

  switch (rule.id) {
    case 'gas-safe-registration':
      return checkGasSafeRequirements(rule, campaign, allText);
    case 'gas-safety-certificate':
      return checkGasSafeMentioned(rule, campaign, allText);
    case 'part-p-compliance':
      return checkPartPCompliance(rule, campaign, allText);
    case 'electrical-qualifications':
      return checkElectricalQualifications(rule, campaign, allText);
    case 'price-transparency':
      return checkPriceTransparency(rule, campaign, allText);
    case 'no-misleading-claims':
      return checkMisleadingClaims(rule, campaign, allText);
    case 'london-low-emission-zone':
      return checkLondonLEZ(rule, campaign);
    default:
      return {
        rule,
        passed: true,
        message: 'Compliance check passed',
      };
  }
}

function checkGasSafeRequirements(rule: ComplianceRule, campaign: CampaignData, allText: string): ComplianceCheck {
  const hasGasServices = allText.includes('gas') || allText.includes('boiler') || allText.includes('heating');

  if (!hasGasServices) {
    return {
      rule,
      passed: true,
      message: 'No gas services advertised - Gas Safe registration not required',
    };
  }

  const hasGasSafeMention = allText.includes('gas safe') || allText.includes('gas-safe');

  return {
    rule,
    passed: hasGasSafeMention,
    message: hasGasSafeMention
      ? 'Gas Safe registration mentioned - compliant'
      : 'Gas services offered but Gas Safe registration not mentioned',
    suggestions: hasGasSafeMention ? undefined : [
      'Add "Gas Safe Registered" to your ad headlines',
      'Include Gas Safe registration number in ad description',
      'Mention "Fully qualified Gas Safe engineer" in your copy',
    ],
  };
}

function checkGasSafeMentioned(rule: ComplianceRule, campaign: CampaignData, allText: string): ComplianceCheck {
  const hasGasServices = allText.includes('gas') || allText.includes('boiler') || allText.includes('heating');

  if (!hasGasServices) {
    return {
      rule,
      passed: true,
      message: 'No gas services advertised',
    };
  }

  const hasGasSafeMention = allText.includes('gas safe') || allText.includes('registered');

  return {
    rule,
    passed: hasGasSafeMention,
    message: hasGasSafeMention
      ? 'Gas Safe credentials properly mentioned'
      : 'Gas services offered without proper credentials mentioned',
    suggestions: hasGasSafeMention ? undefined : [
      'Add your Gas Safe registration number',
      'Include "Gas Safe Registered Engineer" in headlines',
    ],
  };
}

function checkPartPCompliance(rule: ComplianceRule, campaign: CampaignData, allText: string): ComplianceCheck {
  const hasNotifiableWork = allText.includes('rewiring') || allText.includes('consumer unit') ||
                           allText.includes('electrical installation') || allText.includes('fuse box');

  if (!hasNotifiableWork) {
    return {
      rule,
      passed: true,
      message: 'No notifiable electrical work advertised',
    };
  }

  const hasPartPMention = allText.includes('part p') || allText.includes('building regulations') ||
                          allText.includes('compliant') || allText.includes('certified');

  return {
    rule,
    passed: hasPartPMention,
    message: hasPartPMention
      ? 'Part P compliance mentioned'
      : 'Notifiable electrical work offered without Part P compliance mention',
    suggestions: hasPartPMention ? undefined : [
      'Add "Part P Building Regulations compliant" to your ad',
      'Mention "Certified electrical installations"',
      'Include "Building Regulations approved" in your copy',
    ],
  };
}

function checkElectricalQualifications(rule: ComplianceRule, campaign: CampaignData, allText: string): ComplianceCheck {
  const hasQualificationMention = allText.includes('qualified') || allText.includes('certified') ||
                                 allText.includes('city & guilds') || allText.includes('nvq') ||
                                 allText.includes('qualification');

  return {
    rule,
    passed: hasQualificationMention,
    message: hasQualificationMention
      ? 'Electrical qualifications mentioned'
      : 'Consider mentioning electrical qualifications for credibility',
    suggestions: hasQualificationMention ? undefined : [
      'Add "Fully qualified electrician" to your headlines',
      'Mention "City & Guilds certified" in descriptions',
      'Include "NVQ Level 3 qualified" in your ad copy',
    ],
  };
}

function checkPriceTransparency(rule: ComplianceRule, campaign: CampaignData, allText: string): ComplianceCheck {
  const hasPricingInfo = allText.includes('free quote') || allText.includes('no call out') ||
                        allText.includes('transparent') || allText.includes('upfront') ||
                        allText.includes('fixed price') || allText.includes('no hidden');

  return {
    rule,
    passed: hasPricingInfo,
    message: hasPricingInfo
      ? 'Price transparency information included'
      : 'Consider adding pricing transparency information',
    suggestions: hasPricingInfo ? undefined : [
      'Add "Free, no-obligation quotes" to your ad',
      'Include "No hidden charges" in descriptions',
      'Mention "Transparent, upfront pricing"',
      'Add "No call-out fees" if applicable',
    ],
  };
}

function checkMisleadingClaims(rule: ComplianceRule, campaign: CampaignData, allText: string): ComplianceCheck {
  const misleadingTerms = ['cheapest', 'best in uk', 'guaranteed lowest', 'always available', 'instant', '100% guaranteed'];
  const foundMisleading = misleadingTerms.filter(term => allText.includes(term));

  return {
    rule,
    passed: foundMisleading.length === 0,
    message: foundMisleading.length === 0
      ? 'No potentially misleading claims detected'
      : `Potentially misleading claims found: ${foundMisleading.join(', ')}`,
    suggestions: foundMisleading.length === 0 ? undefined : [
      'Replace absolute claims with qualified statements',
      'Use "competitive pricing" instead of "cheapest"',
      'Say "reliable service" instead of "always available"',
      'Use "fast response" instead of "instant"',
    ],
  };
}

function checkLondonLEZ(rule: ComplianceRule, campaign: CampaignData): ComplianceCheck {
  const isLondon = campaign.serviceArea.city.toLowerCase().includes('london');

  if (!isLondon) {
    return {
      rule,
      passed: true,
      message: 'Not operating in London - LEZ requirements not applicable',
    };
  }

  return {
    rule,
    passed: true,
    message: 'Operating in London - ensure vehicles comply with Low Emission Zone requirements',
    suggestions: [
      'Ensure all vehicles meet ULEZ standards',
      'Consider mentioning "Eco-friendly service vehicles" in ads',
      'Check daily charge requirements for older vehicles',
    ],
  };
}

// Get compliance summary
export function getComplianceSummary(checks: ComplianceCheck[]) {
  const errors = checks.filter(c => !c.passed && c.rule.severity === 'error').length;
  const warnings = checks.filter(c => !c.passed && c.rule.severity === 'warning').length;
  const info = checks.filter(c => !c.passed && c.rule.severity === 'info').length;

  const overall = errors === 0 ? (warnings === 0 ? 'excellent' : 'good') : 'needs-attention';

  return {
    overall,
    errors,
    warnings,
    info,
    total: checks.length,
    passed: checks.filter(c => c.passed).length,
  };
}
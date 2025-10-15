// Enhanced AI Campaign Generation for UK Trades
export interface OnboardingData {
  tradeType: 'plumbing' | 'electrical' | 'both';
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  serviceArea: {
    city: string;
    postcode?: string;
    radius: number;
  };
  serviceOfferings: string[];
  availability: {
    workingHours: string;
    emergencyCallouts: boolean;
    weekendWork: boolean;
  };
  acquisitionGoals: {
    monthlyLeads: number;
    averageJobValue: number;
    monthlyBudget: number;
  };
}

export interface EnhancedCampaignData {
  campaignName: string;
  dailyBudget: number;
  targetLocation: string;
  businessInfo: {
    businessName: string;
    phone: string;
    serviceArea: string;
  };
  adGroups: Array<{
    name: string;
    keywords: string[];
    adCopy: {
      headlines: string[];
      descriptions: string[];
      finalUrl: string;
    };
    suggestedBidAdjustments: {
      location: number;
      timeOfDay: number;
      device: number;
    };
  }>;
  callExtensions: string[];
  complianceNotes: string[];
  optimizationSuggestions: string[];
  seasonalRecommendations: string[];
}

// UK-specific keyword research data
export const UK_TRADE_KEYWORDS = {
  plumbing: {
    emergency: ['emergency plumber', 'burst pipe', '24 hour plumber', 'plumber near me', 'leak repair'],
    boiler: ['boiler repair', 'boiler installation', 'new boiler', 'boiler service', 'gas boiler', 'combi boiler'],
    heating: ['central heating', 'radiator repair', 'heating engineer', 'no heating', 'cold radiators'],
    bathroom: ['bathroom plumber', 'toilet repair', 'shower installation', 'tap repair', 'bathroom fitting'],
    drainage: ['blocked drain', 'drain cleaning', 'toilet blocked', 'sink blocked', 'drainage engineer'],
    local: ['plumber {city}', '{city} plumber', 'local plumber', 'plumber {postcode}', 'plumbing services {city}'],
  },
  electrical: {
    emergency: ['emergency electrician', '24 hour electrician', 'electrician near me', 'power cut', 'electrical fault'],
    installation: ['electrical installation', 'socket installation', 'light fitting', 'ceiling fan installation', 'electric shower'],
    safety: ['electrical testing', 'pat testing', 'electrical certificate', 'electrical inspection', 'fuse box'],
    rewiring: ['house rewiring', 'electrical rewiring', 'consumer unit', 'fuse box replacement', 'electrical upgrade'],
    smart: ['smart home electrician', 'ev charger installation', 'home automation', 'security lighting', 'outdoor lighting'],
    local: ['electrician {city}', '{city} electrician', 'local electrician', 'electrician {postcode}', 'electrical services {city}'],
  },
};

// UK postcode areas for local targeting
export const UK_MAJOR_AREAS = {
  london: ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'],
  birmingham: ['B'],
  manchester: ['M'],
  liverpool: ['L'],
  leeds: ['LS'],
  glasgow: ['G'],
  edinburgh: ['EH'],
  cardiff: ['CF'],
  bristol: ['BS'],
  nottingham: ['NG'],
  sheffield: ['S'],
  newcastle: ['NE'],
};

// Generate enhanced campaign with UK-specific optimizations
export function generateEnhancedCampaign(onboardingData: OnboardingData): string {
  const businessContext = buildBusinessContext(onboardingData);
  const locationContext = buildLocationContext(onboardingData.serviceArea);
  const complianceContext = buildComplianceContext(onboardingData.tradeType);
  const seasonalContext = buildSeasonalContext();

  const prompt = `
You are an expert Google Ads campaign manager specializing in UK trades marketing. Generate a comprehensive Google Ads campaign for the following business:

BUSINESS CONTEXT:
${businessContext}

LOCATION TARGETING:
${locationContext}

COMPLIANCE REQUIREMENTS:
${complianceContext}

SEASONAL CONSIDERATIONS:
${seasonalContext}

CAMPAIGN REQUIREMENTS:
1. Create 3-4 targeted ad groups with distinct themes
2. Generate 8-10 high-intent keywords per ad group (include local variations)
3. Write 3 compelling headlines (max 30 chars each) and 2 descriptions (max 90 chars each) per ad group
4. Ensure all copy is compliant with UK regulations and mentions required credentials
5. Include location-specific keywords for ${onboardingData.serviceArea.city}
6. Add call extensions with the business phone number
7. Suggest bid adjustments for location, time of day, and device
8. Provide optimization suggestions and seasonal recommendations
9. Calculate appropriate daily budget based on £${onboardingData.acquisitionGoals.monthlyBudget} monthly budget

FOCUS ON:
- Local SEO optimization for ${onboardingData.serviceArea.city}
- Emergency service keywords (high commercial intent)
- Compliance-safe language that builds trust
- Mobile-first ad copy (60% of searches are mobile)
- Competitive differentiation through credentials and guarantees

OUTPUT FORMAT: Return a JSON object matching the EnhancedCampaignData interface exactly.

Generate the campaign now:`;

  return prompt;
}

function buildBusinessContext(data: OnboardingData): string {
  const services = data.serviceOfferings.join(', ');
  const emergencyText = data.availability.emergencyCallouts ? 'Offers 24/7 emergency callouts' : 'Standard hours only';
  const weekendText = data.availability.weekendWork ? 'Works weekends' : 'Weekdays only';

  return `
- Business: ${data.businessName}
- Trade Type: ${data.tradeType === 'both' ? 'Plumbing & Electrical' : data.tradeType}
- Services: ${services}
- Contact: ${data.phone}
- Working Hours: ${data.availability.workingHours}
- Emergency Service: ${emergencyText}
- Weekend Work: ${weekendText}
- Target Leads: ${data.acquisitionGoals.monthlyLeads}/month
- Average Job Value: £${data.acquisitionGoals.averageJobValue}
- Monthly Budget: £${data.acquisitionGoals.monthlyBudget}`;
}

function buildLocationContext(serviceArea: { city: string; postcode?: string; radius: number }): string {
  const city = serviceArea.city;
  const postcode = serviceArea.postcode || '';
  const radius = serviceArea.radius;

  // Detect major UK city for enhanced targeting
  const majorCity = detectMajorCity(city);
  const postcodeArea = postcode ? postcode.split(' ')[0] : '';

  return `
- Primary Location: ${city}
- Postcode Area: ${postcodeArea || 'Not specified'}
- Service Radius: ${radius} miles
- Major City Context: ${majorCity || 'Regional area'}
- Target nearby areas within ${radius} miles of ${city}
- Include postcode-specific keywords if major urban area
- Consider local landmarks and area names for geo-targeting`;
}

function buildComplianceContext(tradeType: 'plumbing' | 'electrical' | 'both'): string {
  let compliance = `
- All advertising must comply with UK Trading Standards
- Must not make false or misleading claims
- Price transparency required (mention upfront quotes, no hidden charges)
- Public liability insurance should be mentioned`;

  if (tradeType === 'plumbing' || tradeType === 'both') {
    compliance += `
- Gas work requires Gas Safe registration (MUST be mentioned)
- Include Gas Safe registration number in ads for gas/heating services
- Boiler work must reference Gas Safe credentials`;
  }

  if (tradeType === 'electrical' || tradeType === 'both') {
    compliance += `
- Electrical work must comply with Part P Building Regulations
- Mention relevant qualifications (City & Guilds, NVQ Level 3, etc.)
- Notifiable work requires Building Regulations compliance
- Electrical testing and certification capabilities should be highlighted`;
  }

  return compliance;
}

function buildSeasonalContext(): string {
  const currentMonth = new Date().getMonth();
  const season = getSeason(currentMonth);

  const seasonalInsights = {
    winter: 'Winter peak season - emphasize emergency heating, boiler repairs, frozen pipes, urgent electrical faults',
    spring: 'Spring renovation season - bathroom upgrades, electrical installations, garden lighting, spring maintenance',
    summer: 'Summer improvement season - outdoor electrical work, garden features, AC installation, holiday preparations',
    autumn: 'Autumn preparation season - heating system checks, electrical safety inspections, winter readiness',
  };

  return `
- Current Season: ${season}
- Seasonal Focus: ${seasonalInsights[season]}
- Consider weather-related keywords and urgency messaging
- Adjust bidding for seasonal demand patterns`;
}

function detectMajorCity(city: string): string | null {
  const cityLower = city.toLowerCase();

  if (cityLower.includes('london')) return 'London';
  if (cityLower.includes('birmingham')) return 'Birmingham';
  if (cityLower.includes('manchester')) return 'Manchester';
  if (cityLower.includes('liverpool')) return 'Liverpool';
  if (cityLower.includes('leeds')) return 'Leeds';
  if (cityLower.includes('glasgow')) return 'Glasgow';
  if (cityLower.includes('edinburgh')) return 'Edinburgh';
  if (cityLower.includes('cardiff')) return 'Cardiff';
  if (cityLower.includes('bristol')) return 'Bristol';
  if (cityLower.includes('nottingham')) return 'Nottingham';
  if (cityLower.includes('sheffield')) return 'Sheffield';
  if (cityLower.includes('newcastle')) return 'Newcastle';

  return null;
}

function getSeason(month: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

// Generate local keyword variations
export function generateLocalKeywords(baseKeywords: string[], city: string, postcode?: string): string[] {
  const localVariations: string[] = [];

  baseKeywords.forEach(keyword => {
    // Add city variations
    localVariations.push(keyword.replace('{city}', city.toLowerCase()));
    localVariations.push(`${keyword} ${city.toLowerCase()}`);
    localVariations.push(`${city.toLowerCase()} ${keyword}`);

    // Add postcode variations if available
    if (postcode) {
      const postcodeArea = postcode.split(' ')[0];
      localVariations.push(keyword.replace('{postcode}', postcodeArea));
      localVariations.push(`${keyword} ${postcodeArea}`);
    }

    // Add "near me" variations
    localVariations.push(`${keyword} near me`);
    localVariations.push(`local ${keyword}`);
  });

  return [...new Set(localVariations)]; // Remove duplicates
}

// Calculate optimal bid adjustments
export function calculateBidAdjustments(data: OnboardingData) {
  const city = data.serviceArea.city.toLowerCase();
  const isEmergencyService = data.availability.emergencyCallouts;
  const tradeType = data.tradeType;

  // Location adjustments based on competition in major cities
  const locationAdjustment = city.includes('london') ? 1.3 :
                           city.includes('birmingham') || city.includes('manchester') ? 1.2 : 1.0;

  // Time of day adjustments
  const timeAdjustments = isEmergencyService ? {
    'morning': 1.1,    // 6-12: High demand
    'afternoon': 1.0,  // 12-18: Normal
    'evening': 1.3,    // 18-22: Emergency peak
    'night': 1.5,      // 22-6: Emergency premium
  } : {
    'morning': 1.2,    // 6-12: Planning time
    'afternoon': 1.0,  // 12-18: Normal
    'evening': 0.8,    // 18-22: Lower intent
    'night': 0.3,      // 22-6: Very low intent
  };

  // Device adjustments (mobile-first for trades)
  const deviceAdjustments = {
    'mobile': 1.2,     // Higher intent on mobile for trades
    'tablet': 1.0,     // Normal
    'desktop': 0.9,    // Slightly lower for emergency services
  };

  return {
    location: locationAdjustment,
    timeOfDay: timeAdjustments,
    device: deviceAdjustments,
  };
}
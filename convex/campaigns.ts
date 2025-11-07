import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Helper function to get current user's token identifier
async function getCurrentUserToken(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject || null;
}

// Define campaign schema types for validation
const adGroupSchema = v.object({
  name: v.string(),
  keywords: v.array(v.string()),
  adCopy: v.object({
    headlines: v.array(v.string()),
    descriptions: v.array(v.string()),
    finalUrl: v.string(),
  }),
});

const campaignSchema = v.object({
  campaignName: v.string(),
  dailyBudget: v.number(),
  targetLocation: v.string(),
  businessInfo: v.object({
    businessName: v.string(),
    phone: v.string(),
    serviceArea: v.string(),
  }),
  adGroups: v.array(adGroupSchema),
  callExtensions: v.array(v.string()),
  complianceNotes: v.array(v.string()),
});

// Generate AI campaign using OpenAI
export const generateCampaign = action({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    campaignId: string;
    campaignData: any;
  }> => {
    const userId = args.userId || await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get user's onboarding data
    const onboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);

    if (!onboardingData) {
      throw new Error("No onboarding data found");
    }

    // Check if OpenAI API key is configured
    const openAIApiKey = process.env.OPENAI_API_KEY;

    if (!openAIApiKey) {
      throw new Error("OpenAI API key is not configured. Please add OPENAI_API_KEY to your Convex environment variables.");
    }

    try {
      // Prepare prompt with user data
      const prompt = buildCampaignPrompt(onboardingData);

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Google Ads campaign creator specializing in UK trades (plumbing and electrical). Generate comprehensive, compliant campaigns for local tradespeople.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error("No response from OpenAI");
      }

      // Parse AI response into structured campaign data
      const campaignData = parseAIResponse(aiResponse, onboardingData);

      // Save generated campaign to database
      const campaignId: string = await ctx.runMutation(api.campaigns.saveCampaign, {
        userId,
        campaignData,
      });

      return {
        success: true,
        campaignId,
        campaignData,
      };

    } catch (error) {
      console.error('Campaign generation failed:', error);
      throw new Error(`Failed to generate campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Save generated campaign to database
export const saveCampaign = mutation({
  args: {
    userId: v.string(),
    campaignData: campaignSchema,
  },
  handler: async (ctx, args) => {
    // Check if campaign already exists
    const existingCampaign = await ctx.db
      .query("campaigns")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    const saveData = {
      ...args.campaignData,
      userId: args.userId,
      createdAt: Date.now(),
      status: "draft" as const,
    };

    if (existingCampaign) {
      // Update existing campaign
      await ctx.db.patch(existingCampaign._id, {
        ...saveData,
        updatedAt: Date.now(),
      });
      return existingCampaign._id;
    } else {
      // Create new campaign
      return await ctx.db.insert("campaigns", saveData);
    }
  },
});

// Get user's generated campaign
export const getCampaign = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || await getCurrentUserToken(ctx);

    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("campaigns")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();
  },
});

// Get campaign by ID
export const getCampaignById = query({
  args: {
    campaignId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const campaign = await ctx.db.get(args.campaignId as any);

    if (!campaign) {
      return null;
    }

    // Type assertion and ownership check
    const campaignData = campaign as any;
    if (campaignData.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return campaignData;
  },
});

// Update campaign status (e.g., when pushed to Google Ads)
export const updateCampaignStatus = mutation({
  args: {
    campaignId: v.string(),
    googleCampaignId: v.optional(v.string()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Find the campaign by its Convex _id
    const campaignDoc = await ctx.db.get(args.campaignId as any);

    if (!campaignDoc) {
      throw new Error("Campaign not found");
    }

    // Type assertion to ensure we have a campaign document
    const campaign = campaignDoc as any;

    if (campaign.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Update the campaign
    await ctx.db.patch(args.campaignId as any, {
      status: args.status,
      updatedAt: Date.now(),
      ...(args.googleCampaignId && { googleCampaignId: args.googleCampaignId }),
    });

    return args.campaignId;
  },
});

// Push campaign to Google Ads
export const pushToGoogleAds: any = action({
  args: {
    campaignId: v.string(),
    pushOptions: v.optional(v.object({
      createAsDraft: v.boolean(),
      testMode: v.boolean(),
    })),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getCurrentUserToken(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      // Get the campaign data using a query
      const campaign: any = await ctx.runQuery(api.campaigns.getCampaignById, {
        campaignId: args.campaignId
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.userId !== userId) {
        throw new Error("Unauthorized");
      }

      // Check if user has connected Google Ads account
      const googleAdsTokens = await ctx.runQuery(api.googleAds.getTokens);

      if (!googleAdsTokens) {
        throw new Error("Google Ads account not connected. Please connect your account first.");
      }

      // Prepare campaign data for Google Ads API
      const googleAdsData: any = {
        name: campaign.campaignName,
        budget: campaign.dailyBudget,
        keywords: campaign.adGroups[0]?.keywords || [],
        adCopy: {
          headline: campaign.adGroups[0]?.adCopy.headlines[0] || "Professional Service",
          description: campaign.adGroups[0]?.adCopy.descriptions[0] || "Quality service you can trust",
        },
        location: campaign.targetLocation,
        phone: campaign.businessInfo.phone,
        finalUrl: campaign.adGroups[0]?.adCopy.finalUrl || "https://example.com",
      };

      // Options for the push
      const pushOptions = args.pushOptions || { createAsDraft: true, testMode: true };

      console.log('🚀 Pushing campaign to Google Ads:', {
        campaignName: googleAdsData.name,
        budget: googleAdsData.budget,
        options: pushOptions,
      });

      // Call the Node.js Google Ads action
      const result: any = await ctx.runAction(api.campaigns.createGoogleAdsCampaign, {
        campaignData: googleAdsData,
        pushOptions,
      });

      if (result.success) {
        // Update campaign status
        await ctx.runMutation(api.campaigns.updateCampaignStatus, {
          campaignId: args.campaignId,
          googleCampaignId: result.campaignId,
          status: pushOptions.createAsDraft ? "pushed_draft" : "pushed_live",
        });

        return {
          success: true,
          message: `Campaign ${pushOptions.createAsDraft ? 'drafted' : 'launched'} successfully in Google Ads`,
          googleCampaignId: result.campaignId,
          resourceName: result.resourceName,
          budget: result.budget,
          status: result.status,
        };
      } else {
        throw new Error('Failed to create campaign in Google Ads');
      }

    } catch (error) {
      console.error('Push to Google Ads failed:', error);

      // Update campaign with error status
      await ctx.runMutation(api.campaigns.updateCampaignStatus, {
        campaignId: args.campaignId,
        status: "push_failed",
      });

      throw new Error(`Failed to push to Google Ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Mock Google Ads API operations (for development and testing)
export const createGoogleAdsCampaign = action({
  args: {
    campaignData: v.object({
      name: v.string(),
      budget: v.number(),
      keywords: v.array(v.string()),
      adCopy: v.object({
        headline: v.string(),
        description: v.string(),
      }),
      location: v.string(),
      phone: v.string(),
      finalUrl: v.string(),
    }),
    pushOptions: v.object({
      createAsDraft: v.boolean(),
      testMode: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    console.log('🔧 Mock Google Ads API: Creating campaign', args.campaignData.name);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;

    if (!success) {
      throw new Error('Mock API error: Rate limit exceeded');
    }

    const mockCampaignId = `mock_campaign_${Date.now()}`;

    console.log('✅ Mock campaign creation successful!');
    console.log('🎯 Mock campaign ID:', mockCampaignId);

    return {
      success: true,
      campaignId: mockCampaignId,
      resourceName: `customers/mock/campaigns/${mockCampaignId}`,
      budget: Math.min(args.campaignData.budget, 0.01),
      status: 'PAUSED',
    };
  },
});

// Helper functions for enhanced prompts
function getSeason(month: number): 'winter' | 'spring' | 'summer' | 'autumn' {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

function getSeasonalFocus(season: 'winter' | 'spring' | 'summer' | 'autumn'): string {
  const seasonalInsights = {
    winter: 'Winter peak season - emphasize emergency heating, boiler repairs, frozen pipes, urgent electrical faults',
    spring: 'Spring renovation season - bathroom upgrades, electrical installations, garden lighting, spring maintenance',
    summer: 'Summer improvement season - outdoor electrical work, garden features, AC installation, holiday preparations',
    autumn: 'Autumn preparation season - heating system checks, electrical safety inspections, winter readiness',
  };
  return seasonalInsights[season];
}

function buildComplianceRequirements(tradeType: string): string {
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

// Helper function to build the enhanced campaign generation prompt
function buildCampaignPrompt(onboardingData: any): string {
  const tradeType = onboardingData.tradeType;
  const businessName = onboardingData.businessName;
  const serviceArea = onboardingData.serviceArea;
  const serviceOfferings = onboardingData.serviceOfferings || [];
  const phone = onboardingData.phone;
  const availability = onboardingData.availability;
  const acquisitionGoals = onboardingData.acquisitionGoals;

  const city = serviceArea?.city || 'UK';
  const emergencyText = availability?.emergencyCallouts ? 'Offers 24/7 emergency callouts' : 'Standard hours only';
  const weekendText = availability?.weekendWork ? 'Works weekends' : 'Weekdays only';
  const currentMonth = new Date().getMonth();
  const season = getSeason(currentMonth);

  return `
You are an expert Google Ads campaign manager specializing in UK trades marketing. Generate a comprehensive, compliance-focused Google Ads campaign for the following business:

**BUSINESS CONTEXT:**
- Business: ${businessName}
- Trade Type: ${tradeType === 'both' ? 'Plumbing & Electrical' : tradeType}
- Services: ${serviceOfferings.join(', ')}
- Contact: ${phone}
- Location: ${city}, ${serviceArea?.postcode || ''} (${serviceArea?.radius || 10} mile radius)
- Working Hours: ${availability?.workingHours || 'Standard hours'}
- Emergency Service: ${emergencyText}
- Weekend Work: ${weekendText}
- Target Leads: ${acquisitionGoals?.monthlyLeads || 10}/month
- Average Job Value: £${acquisitionGoals?.averageJobValue || 250}
- Monthly Budget: £${acquisitionGoals?.monthlyBudget || 300}

**UK COMPLIANCE REQUIREMENTS:**
${buildComplianceRequirements(tradeType)}

**SEASONAL CONTEXT:**
- Current Season: ${season}
- Seasonal Focus: ${getSeasonalFocus(season)}

**CAMPAIGN REQUIREMENTS:**
1. Create 3-4 targeted ad groups with distinct themes (emergency, installation, maintenance, etc.)
2. Generate 8-10 high-intent keywords per ad group including local variations for ${city}
3. Write 3 compelling headlines (max 30 chars) and 2 descriptions (max 90 chars) per ad group
4. Ensure ALL copy is UK-compliant and mentions required credentials (Gas Safe, Part P, etc.)
5. Include location-specific keywords: "${city} {service}", "{service} near me", "local {service}"
6. Add emergency/urgency keywords if applicable: "24/7", "emergency", "urgent"
7. Include call extensions with phone number
8. Add compliance notes for UK regulatory requirements
9. Suggest optimization tips and seasonal recommendations
10. Calculate daily budget: £${Math.round((acquisitionGoals?.monthlyBudget || 300) / 30)}

**CRITICAL COMPLIANCE POINTS:**
- Gas work MUST mention "Gas Safe Registered" if offering gas/heating services
- Electrical work MUST reference "Part P compliant" for notifiable work
- No misleading claims ("cheapest", "guaranteed", etc.)
- Price transparency required ("free quotes", "no hidden charges")
- Professional credentials must be highlighted

**OUTPUT FORMAT:**
Return ONLY a valid JSON object with this exact structure:
{
  "campaignName": "string",
  "dailyBudget": number,
  "targetLocation": "string",
  "businessInfo": {
    "businessName": "string",
    "phone": "string",
    "serviceArea": "string"
  },
  "adGroups": [
    {
      "name": "string",
      "keywords": ["array of strings"],
      "adCopy": {
        "headlines": ["3 headlines"],
        "descriptions": ["2 descriptions"],
        "finalUrl": "string"
      }
    }
  ],
  "callExtensions": ["array"],
  "complianceNotes": ["array"],
  "optimizationSuggestions": ["array"],
  "seasonalRecommendations": ["array"]
}

Focus on LOCAL SEO optimization for ${city}, emergency service keywords (high commercial intent), and compliance-safe language that builds trust with UK consumers.
`;
}

// Helper function to parse AI response into structured data
function parseAIResponse(aiResponse: string, onboardingData: any): any {
  try {
    // Try to parse as JSON first
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return validateAndEnhanceCampaignData(parsed, onboardingData);
    }

    // If not JSON, create structured data from text
    return createFallbackCampaignData(aiResponse, onboardingData);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return createFallbackCampaignData(aiResponse, onboardingData);
  }
}

// Validate and enhance the parsed campaign data
function validateAndEnhanceCampaignData(data: any, onboardingData: any): any {
  const serviceArea = onboardingData.serviceArea;
  const businessName = onboardingData.businessName;
  const phone = onboardingData.phone;

  return {
    campaignName: data.campaignName || `${businessName} - ${onboardingData.tradeType} Services`,
    dailyBudget: data.dailyBudget || Math.round((onboardingData.acquisitionGoals?.monthlyBudget || 300) / 30),
    targetLocation: data.targetLocation || `${serviceArea?.city}, UK`,
    businessInfo: {
      businessName: businessName,
      phone: phone,
      serviceArea: `${serviceArea?.city}${serviceArea?.postcode ? ', ' + serviceArea.postcode : ''}`,
    },
    adGroups: data.adGroups || [],
    callExtensions: data.callExtensions || [phone],
    complianceNotes: data.complianceNotes || [
      "All ads comply with UK advertising standards",
      "Emergency services claims must be substantiated",
      "Pricing should be transparent and include VAT where applicable",
    ],
  };
}

// Create fallback campaign data if parsing fails
function createFallbackCampaignData(aiResponse: string, onboardingData: any): any {
  const serviceArea = onboardingData.serviceArea;
  const businessName = onboardingData.businessName;
  const phone = onboardingData.phone;
  const tradeType = onboardingData.tradeType;

  return {
    campaignName: `${businessName} - ${tradeType} Services`,
    dailyBudget: Math.round((onboardingData.acquisitionGoals?.monthlyBudget || 300) / 30),
    targetLocation: `${serviceArea?.city}, UK`,
    businessInfo: {
      businessName: businessName,
      phone: phone,
      serviceArea: `${serviceArea?.city}${serviceArea?.postcode ? ', ' + serviceArea.postcode : ''}`,
    },
    adGroups: [
      {
        name: `Emergency ${tradeType}`,
        keywords: [`emergency ${tradeType}`, `24/7 ${tradeType}`, `urgent ${tradeType}`],
        adCopy: {
          headlines: [`Fast Emergency ${tradeType}`, "Available 24/7", "No Call Out Fee"],
          descriptions: [`Professional ${tradeType} services in ${serviceArea?.city}`, "Call now for immediate assistance"],
          finalUrl: "https://yoursite.com",
        },
      },
    ],
    callExtensions: [phone],
    complianceNotes: [
      "Generated campaign requires manual review",
      "AI response could not be fully parsed",
      "Please verify all claims and pricing",
    ],
  };
}
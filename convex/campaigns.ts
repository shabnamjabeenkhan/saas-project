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

// Helper function to build the campaign generation prompt
function buildCampaignPrompt(onboardingData: any): string {
  const tradeType = onboardingData.tradeType;
  const businessName = onboardingData.businessName;
  const serviceArea = onboardingData.serviceArea;
  const serviceOfferings = onboardingData.serviceOfferings || [];
  const phone = onboardingData.phone;
  const availability = onboardingData.availability;
  const acquisitionGoals = onboardingData.acquisitionGoals;

  return `
Create a comprehensive Google Ads campaign for a UK ${tradeType} business with the following details:

**Business Information:**
- Business Name: ${businessName}
- Trade Type: ${tradeType}
- Phone: ${phone}
- Service Area: ${serviceArea?.city}, ${serviceArea?.postcode || ''} (${serviceArea?.radius} mile radius)
- Working Hours: ${availability?.workingHours || 'Standard hours'}
- Emergency Services: ${availability?.emergencyCallouts ? 'Yes' : 'No'}
- Weekend Work: ${availability?.weekendWork ? 'Yes' : 'No'}

**Services Offered:**
${serviceOfferings.join(', ')}

**Business Goals:**
- Monthly Lead Target: ${acquisitionGoals?.monthlyLeads || 'Not specified'}
- Average Job Value: £${acquisitionGoals?.averageJobValue || 'Not specified'}
- Monthly Budget: £${acquisitionGoals?.monthlyBudget || 'Not specified'}

**Requirements:**
1. Create a campaign with 3-4 ad groups targeting different service types
2. Include 5-8 relevant keywords per ad group (mix of exact, phrase, and broad match)
3. Generate 3 headlines and 2 descriptions per ad group
4. Include call extensions with the business phone number
5. Suggest appropriate daily budget based on monthly budget
6. Ensure all content is UK-compliant and uses British terminology
7. Focus on local SEO with location-based keywords
8. Include urgency for emergency services if applicable
9. Add compliance notes for any regulatory considerations

**Output Format:**
Return as a JSON structure with:
- campaignName
- dailyBudget (number)
- targetLocation
- businessInfo (name, phone, serviceArea)
- adGroups (array with name, keywords, adCopy with headlines/descriptions/finalUrl)
- callExtensions (array of phone numbers)
- complianceNotes (array of important compliance points)

Make it professional, compelling, and designed to generate quality leads for a local ${tradeType} business in the UK.
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
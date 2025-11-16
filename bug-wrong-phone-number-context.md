# Bug Context: Wrong Phone Number in Google Ads

## Error Description

### What's Happening
Despite fixing the AI prompt contamination and Google Ads API code, and regenerating a new campaign in the project app, the wrong phone number (`077 684 7429`) is still appearing in Google Ads previews instead of the correct number. The incorrect number `077 684 7429` is shown in Google Ads instead of the one from the onboarding form (`07563826777`).

### The Contamination Source
AI prompts previously included hardcoded examples in the prompt instructions:

```
**EXAMPLES OF CORRECT AD TEXT (NO PHONE NUMBERS):**
✅ "Emergency Plumber Ready" (NOT "Call 07X-XXX-XXXX")
✅ "24/7 Gas Safe Service" (NOT "Ring [PHONE]")
✅ "Call Now - Free Quote" (NOT "Call [NUMBER]")
✅ "Urgent Repairs London" (NOT any phone number)

**FORBIDDEN PHONE NUMBER PATTERNS:**
❌ Do NOT include: 077, 078, 020, 01XX, +44, any 11-digit numbers
❌ Do NOT include: "Call 07X...", "Ring 02X...", "Phone 07X..."
❌ Do NOT include: any formatted numbers or actual phone digits
```

This contaminated phone number (`077 684 7429`) occasionally gets incorporated into AI-generated campaign data instead of using the user's actual onboarding number.

### Expected vs Actual
- **Expected**: Call extensions show `07563826777` (user's real number from onboarding)
- **Actual**: Call extensions show `077 684 7429` (AI hallucinated number)

---

## User Journey

### Step 1: Initial Setup
- User completes onboarding with correct phone number: `07563826777`
- Data stored correctly in database

### Step 2: Campaign Generation (First Time)
- User clicks "Generate Campaign"
- AI uses contaminated prompt with hardcoded example: `077 684 7429`
- AI occasionally uses the prompt example instead of real user data
- Campaign saved to database with wrong phone number

### Step 3: User Pushes to Google Ads
- User clicks "Push to Google Ads"
- System uses existing campaign data (which has wrong number)
- Google Ads shows wrong number: `077 684 7429`
- User sees error in Google Ads preview

---

## Jam.dev Replay
- URL: https://jam.dev/c/03902966-475f-4522-8f0d-d30143ba94f8

---

## Screenshots
*Note: Screenshots were mentioned but not provided. Add screenshots showing:*
- Google Ads preview with wrong phone number
- Campaign dashboard showing correct phone
- Console logs showing validation

---

## Client-side Logs
*Note: Client-side logs were mentioned but not provided. Add logs showing:*
- Phone validation messages
- Campaign generation logs
- Google Ads push logs

---

## Network Tab
*Note: Network tab information was mentioned but not provided. Add:*
- Failed requests (if any)
- Response payloads showing phone numbers
- Status codes

---

## Code Analysis

### Issue 1: Campaign Data Persistence Problem
**File**: `convex/campaigns.ts:255-311`

```typescript
// The problem: When campaign exists, it updates with fresh data but 
// businessInfo.phone might still come from contaminated campaignData
export const saveCampaign = mutation({
  handler: async (ctx, args) => {
    const existingCampaign = await ctx.db
      .query("campaigns")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingCampaign) {
      // Updates existing campaign but doesn't guarantee phone number refresh
      await ctx.db.patch(existingCampaign._id, {
        ...saveData,  // ← This saveData might contain old phone number
        updatedAt: Date.now(),
      });
    }
  }
});
```

**Problem**: When a campaign exists, the update uses `saveData` which may still contain the contaminated phone number from earlier AI generation. No forced refresh of phone data from onboarding.

---

### Issue 2: Campaign Data Validation Not Blocking Wrong Data
**File**: `convex/campaigns.ts:930-952`

```typescript
// This validates structure but contaminated data passes validation
function validateAndEnhanceCampaignData(data: any, onboardingData: any): any {
  return {
    businessInfo: {
      businessName: businessName,
      phone: phone,  // ← Uses onboarding phone (correct)
    },
    callExtensions: [phone], // ← Uses onboarding phone (correct)
    // BUT AI-generated data.callExtensions might still have wrong numbers
  };
}
```

**Problem**: Validates structure but contaminated data from AI passes through. Nested phone references in AI response aren't caught.

---

### Issue 3: AI Response Parsing Issue
**File**: `convex/campaigns.ts:827-843`

```typescript
// Problem: AI response might contain contaminated phone numbers in nested data
function parseAIResponse(aiResponse: string, onboardingData: any): any {
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const cleanedData = sanitizePhoneNumbers(parsed);  // ← Sanitization might miss some
    return validateAndEnhanceCampaignData(cleanedData, onboardingData);
  }
}
```

**Problem**: AI response might contain contaminated phone numbers in nested data that sanitization doesn't catch.

---

### Issue 4: Phone Number Sanitization Gaps
**File**: `convex/campaigns.ts:846-881`

```typescript
// Sanitizes ad text but might miss callExtensions or other nested data
function sanitizePhoneNumbers(campaignData: any): any {
  const phoneRegex = /(0[1-9]\d{8,9}|(\+44\s?)?[1-9]\d{8,9}|07\d{9}|077\s?\d{3}\s?\d{4})/g;

  // Only cleans adGroups.adCopy but might miss other places
  if (campaignData.adGroups && Array.isArray(campaignData.adGroups)) {
    // Cleans headlines and descriptions only
  }

  // ❌ MISSING: Doesn't clean campaignData.callExtensions or businessInfo.phone
  return campaignData;
}
```

**Critical Gaps**:
- ❌ Doesn't sanitize `campaignData.callExtensions`
- ❌ Doesn't sanitize `businessInfo.phone`
- ❌ Doesn't sanitize other nested phone references
- ✅ Only cleans ad copy headlines and descriptions

---

### Issue 5: Google Ads Push Using Stale Campaign Data
**File**: `convex/campaigns.ts:504-516`

```typescript
// The push action gets campaign data that might be contaminated
export const pushToGoogleAds = action({
  handler: async (ctx, args) => {
    const campaign: any = await ctx.runQuery(api.campaigns.getCampaignById, {
      campaignId: args.campaignId  // ← Gets existing campaign with potential wrong phone
    });

    // Validation checks onboarding vs campaign phone
    if (onboardingPhone !== campaignPhone) {
      // ❌ This should catch mismatch but logs show it's passing
    }
  }
});
```

**Problem**: Gets campaign data that might be contaminated. Validation logic isn't catching the mismatch properly.

---

### Issue 6: Mixed Data Sources in Google Ads Integration
**File**: `convex/googleAdsCampaigns.ts:158-162`

```typescript
// Gets campaign data that might have contaminated phone numbers
const campaignData = await ctx.runQuery(api.campaigns.getCampaignById, {
  campaignId: args.campaignId
});

// Even though we get fresh onboarding data later, some parts might use campaignData
```

**Problem**: Campaign data pulled from database may have contaminated phone numbers. Fresh onboarding data not consistently applied to all fields.

---

## Core Root Cause

### The Main Problem: Incomplete Sanitization + Data Persistence

The `sanitizePhoneNumbers` function only cleans ad copy text but **fails to sanitize campaign-level structured data**:

```
CURRENT BEHAVIOR:
┌─ AI Response
├─ parseAIResponse()
├─ sanitizePhoneNumbers()  ← Only cleans adGroups.adCopy
│  └─ callExtensions: ["077 684 7429"] ← NOT SANITIZED ❌
│  └─ businessInfo.phone: "077 684 7429" ← NOT SANITIZED ❌
├─ validateAndEnhanceCampaignData()
└─ saveCampaign()
   └─ Database stores contaminated data

WHEN PUSHING TO GOOGLE ADS:
├─ getCampaignById() → returns stale data with "077 684 7429"
├─ Validation passes (checks against onboarding)
└─ Google Ads uses contaminated callExtensions
```

### Key Issue: Missing Phone Sanitization in Campaign Data

The main problem is in the `sanitizePhoneNumbers` function - it only cleans ad text but doesn't clean the campaign-level phone data:

```typescript
// ❌ CURRENT: Only cleans ad copy
function sanitizePhoneNumbers(campaignData: any): any {
  // Cleans headlines/descriptions but NOT:
  // - campaignData.businessInfo.phone
  // - campaignData.callExtensions
  // - Other nested phone references
}
```

The contaminated phone number persists in campaign data structure even after sanitization.

---

## AI Prompt Function Analysis

### Function: `buildCampaignPrompt()`
**Location**: `convex/campaigns.ts` lines 729-869

### Key Components:

#### 1. Business Context (Lines 782-793)
```typescript
- Business: ${businessName}
- Contact: ${phone}  // ← This includes the correct phone from onboarding
```

#### 2. Phone Number Rules (Lines 802-807)
```
🚨 CRITICAL PHONE NUMBER RULES:
- NEVER include ANY phone numbers in headlines or descriptions
- Do NOT use {PHONE}, ${phone}, or any phone number variables in ad text
- Phone numbers will be handled separately via call extensions
```

#### 3. Examples Section (Lines 828-837) - FIXED
```
EXAMPLES OF CORRECT AD TEXT (NO PHONE NUMBERS):
✅ "Emergency Plumber Ready" (NOT "Call 07X-XXX-XXXX")
✅ "Call Now - Free Quote" (NOT "Call [NUMBER]")

FORBIDDEN PHONE NUMBER PATTERNS:
❌ Do NOT include: any formatted numbers or actual phone digits
```

#### 4. JSON Output Structure (Lines 845-849)
```json
{
  "businessInfo": {
    "businessName": "string",
    "phone": "string",        // ← AI should put correct phone here
    "serviceArea": "string"
  }
}
```

**Analysis**: The prompt correctly includes your real phone number in the business context (`Contact: ${phone}`) and no longer has hardcoded wrong examples. The AI should be generating the correct phone number now. If it's still wrong, run the debug and we'll see exactly what the Google Ads API is receiving.

---

## AI Prompt Rules (For Reference)

### Critical Phone Number Rules
```
🚨 CRITICAL PHONE NUMBER RULES:
- NEVER include ANY phone numbers in headlines or descriptions
- If you need to reference calling, use phrases like "Call Now", "Call Today", "Phone Us"
- Do NOT use {PHONE}, ${phone}, or any phone number variables in ad text
- Phone numbers will be handled separately via call extensions
- Violating this rule wastes advertising budget and confuses customers
```

### Examples of Correct Ad Text (NO PHONE NUMBERS)
```
✅ "Emergency Plumber Ready" (NOT "Call 07X-XXX-XXXX")
✅ "24/7 Gas Safe Service" (NOT "Ring [PHONE]")
✅ "Call Now - Free Quote" (NOT "Call [NUMBER]")
✅ "Urgent Repairs London" (NOT any phone number)
```

### Forbidden Phone Number Patterns
```
❌ Do NOT include: 077, 078, 020, 01XX, +44, any 11-digit numbers
❌ Do NOT include: "Call 07X...", "Ring 02X...", "Phone 07X..."
❌ Do NOT include: any formatted numbers or actual phone digits
```

### Campaign Requirements
1. Create exactly 4 targeted ad groups with distinct themes (emergency, installation, maintenance, repair, etc.)
2. Generate 8-10 high-intent keywords per ad group including local variations for `${city}`
3. Write 3 compelling headlines (max 30 chars) and 2 descriptions (max 90 chars) per ad group
4. Ensure ALL copy is UK-compliant and mentions required credentials (Gas Safe, Part P, etc.)
5. Include location-specific keywords: `"${city} {service}"`, `"{service} near me"`, `"local {service}"`
6. Add emergency/urgency keywords if applicable: "24/7", "emergency", "urgent"
7. Use "Call Now", "Call Today", "Phone Us" instead of actual phone numbers in ad text
8. Add compliance notes for UK regulatory requirements
9. Suggest optimization tips and seasonal recommendations
10. Calculate daily budget: £`${Math.round((acquisitionGoals?.monthlyBudget || 300) / 30)}`

### Critical Compliance Points
- Gas work MUST mention "Gas Safe Registered" if offering gas/heating services
- Electrical work MUST reference "Part P compliant" for notifiable work
- No misleading claims ("cheapest", "guaranteed", etc.)
- Price transparency required ("free quotes", "no hidden charges")
- Professional credentials must be highlighted

---

## Environment
- **Mode**: Development
- **Database**: Convex
- **API**: Google Ads API

---

## Reproduction Steps

### Step 1: Generate Initial Campaign
1. Navigate to `/dashboard/campaigns`
2. Click "Generate Campaign" button
3. Wait for campaign generation to complete
4. Campaign data gets saved to database (may contain contaminated phone number)

### Step 2: Push to Google Ads (First Attempt)
1. Click "Push to Google Ads" button
2. Wait for push to complete successfully
3. Check console logs - will show:
   - ✅ Phone validation passed - numbers match: `07563826777`
   - ✅ Campaign drafted successfully in Google Ads

### Step 3: View Google Ads Preview
1. Go to Google Ads interface/preview
2. Navigate to created campaign
3. Look at call extensions section
4. **ERROR**: Shows wrong phone number `077 684 7429` instead of `07563826777`

### Step 4: Reproduce Error Again (After Fixes)
1. Return to campaign dashboard
2. Click "Push to Google Ads" again (without regenerating)
3. Console shows success again
4. Google Ads still shows wrong number

### Why Error Persists
- Console validation passes because it checks onboarding vs campaign phone match
- But campaign data in database still has contaminated phone from previous AI generation
- Google Ads gets mixed data - some from fresh onboarding, some from stale campaign data

### Expected vs Actual
- **Expected**: Call extensions show `07563826777` (user's real number)
- **Actual**: Call extensions show `077 684 7429` (AI hallucinated number)

---

## Fix Strategy

### Required Changes

1. **Extend Sanitization to All Nested Data**
   - File: `convex/campaigns.ts` (`sanitizePhoneNumbers` function)
   - Sanitize: `callExtensions`, `businessInfo.phone`, all nested phone references

2. **Force Phone Data Refresh on Campaign Update**
   - File: `convex/campaigns.ts` (`saveCampaign` mutation)
   - Always apply fresh onboarding phone to all phone fields

3. **Add Validation for Structured Data**
   - File: `convex/campaigns.ts` (`validateAndEnhanceCampaignData` function)
   - Check for contaminated numbers in `callExtensions` before validation passes

4. **Clean Campaign Data Before Google Ads Push**
   - File: `convex/googleAdsCampaigns.ts` (`pushToGoogleAds` action)
   - Apply final sanitization + phone override before sending to Google Ads API

5. **Audit Prompt Contamination**
   - Remove all hardcoded phone number examples from AI prompts
   - Ensure only pattern examples, not actual numbers, are used

---

## Testing Checklist

- [ ] Generate campaign and verify database contains correct phone number
- [ ] Push to Google Ads and verify call extensions show correct number
- [ ] Re-push same campaign without regenerating - verify phone doesn't revert
- [ ] Check Google Ads preview shows correct number
- [ ] Verify logs show "Phone validation passed" for correct numbers
- [ ] Audit database directly for any `077 684 7429` entries

---

## Status

### Fixes Implemented ✅
- ✅ Extended `sanitizePhoneNumbers()` to sanitize `callExtensions` and `businessInfo.phone`
- ✅ Force phone refresh from onboarding data in `validateAndEnhanceCampaignData()`
- ✅ Added validation to catch contaminated numbers before save
- ✅ Ensure `saveCampaign()` always uses fresh onboarding phone
- ✅ Added contamination detection and logging
- ✅ Added final validation checks

### Protection Layers
1. **Sanitization Layer**: Removes contaminated phones from AI response
2. **Validation Layer**: Overwrites with onboarding phone + validates
3. **Save Layer**: Forces fresh onboarding phone even if contaminated data reaches save
4. **Final Validation**: Throws errors if anything slips through

---

## Related Files
- `convex/campaigns.ts` - Campaign generation, sanitization, and data management
- `convex/googleAdsCampaigns.ts` - Google Ads integration and campaign extension creation
- `convex/onboarding.ts` - Onboarding data storage

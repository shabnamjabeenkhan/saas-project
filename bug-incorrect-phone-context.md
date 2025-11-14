# Bug Context: Inconsistent Phone Numbers & Data Inconsistency

## 1. Error Description

### 1.1 Inconsistent Phone Numbers Across Ad Groups

**Problem:** Different ad groups in the same campaign show different phone numbers.

**Evidence:**
- Some ads show `077 684 7429` (wrong)
- Other ads show `01217638262` (correct from onboarding)

**Impact:** 
- Confusing for customers
- Inconsistent branding
- Lost trust in campaign accuracy

---

### 1.2 Website URL Mismatch

**Problem:** Campaign uses placeholder URLs instead of actual business website.

**Evidence:** 
- Shows `www.example.com` instead of real business URL

**Root Cause:** 
- No website URL field in onboarding data

**Context:** 
- Websites aren't legally required for UK trades (confirmed)

---

### 1.3 Missing Debug Console Logs

**Problem:** Debug logs for phone number tracking don't appear in browser console.

**Missing Logs:**
- `🔍 VALIDATION DEBUG: Phone from onboarding:`
- `🔍 VALIDATION DEBUG: Phone from AI data:`
- `🔍 FALLBACK DEBUG:`

**Impact:** 
- Can't trace where the wrong phone numbers are coming from

**Likely Cause:** 
- Backend Convex logs don't always reach frontend console

---

## 2. Core Issue Summary

The main problem is **data inconsistency**: your onboarding has the correct phone number (`01217638262`) but the campaign generation/Google Ads integration is creating mixed results with both old and new phone numbers appearing in different parts of the campaign.

---

## 3. User Journey

### Initial State
1. Completed onboarding with phone number: `01217638262`
2. Generated first campaign — likely got cached with wrong phone data
3. Campaign stored in database with incorrect phone: `077 684 7429`

### Discovery Phase
4. Pushed campaign to Google Ads — noticed phone mismatch
5. Investigation of codebase — found campaign generation logic looked correct
6. Compared onboarding vs campaign data — identified the discrepancy

### Root Cause Analysis
7. Traced the data flow:
   - Onboarding data: `01217638262`
   - Campaign database: `077 684 7429`
   - Google Ads result: `077 684 7429`
8. Found the issue: Campaign data was using old cached/stale data instead of fresh onboarding data

### Debug Attempt
9. Added debug logging to trace phone number flow through:
   - Onboarding data retrieval
   - AI response parsing
   - Campaign validation
10. Attempted to see debug logs — but they don't appear in frontend console (Convex backend logs limitation)

### Successful Fix
11. Regenerated the campaign — pulled fresh onboarding data
12. Most ads now show correct number: `01217638262`

### Remaining Issue
13. Some ad groups still show wrong number: `077 684 7429`
14. Mixed phone numbers across ad groups — suggests partial update or Google Ads caching old call extensions

### Current State
- Onboarding data: ✅ Correct
- Most ads: ✅ Correct phone number
- Some ads: ❌ Still showing old phone number
- Debug visibility: ⚠️ Limited due to backend logging

**The error was caused by stale campaign data not syncing with updated onboarding information, requiring a full campaign regeneration to fix.**

---

## 4. Evidence & References

### Jam.dev Replay
https://jam.dev/c/8c2632e7-c6ec-4687-b891-e0ca9dc32957

### Screenshots
- Google Ads dashboard showing mixed phone numbers
- Onboarding form with correct phone
- Campaign details page with inconsistent data

### Client-side Logs
- Network requests to campaign API
- Google Ads API responses with wrong phone data
- Onboarding data retrieval responses

### Network Tab
- POST requests to `pushToGoogleAds` showing campaign data payload
- API responses from Google Ads with call extension confirmations
- Backend responses containing cached campaign data

---

## 5. Code Snippets & Key Error Points

### 5.1 Campaign Generation — Where Phone Should Come From

**File:** `convex/campaigns.ts` - `validateAndEnhanceCampaignData()`

```typescript
function validateAndEnhanceCampaignData(data: any, onboardingData: any): any {
  const serviceArea = onboardingData.serviceArea;
  const businessName = onboardingData.businessName;
  const phone = onboardingData.phone; // ✅ Should be: 01217638262

  // 🔍 DEBUG: Log phone numbers during validation
  console.log('🔍 VALIDATION DEBUG: Phone from onboarding:', phone);
  console.log('🔍 VALIDATION DEBUG: Phone from AI data:', data?.businessInfo?.phone || 'NOT IN AI DATA');

  return {
    // ...
    businessInfo: {
      businessName: businessName,
      phone: phone, // ✅ Uses onboarding phone
      serviceArea: `${serviceArea?.city}${serviceArea?.postcode ? ', ' + serviceArea.postcode : ''}`,
    },
    // ...
    callExtensions: data.callExtensions || [phone], // ✅ Should use correct phone
  };
}
```

**Key Point (✅ Line 1):** Phone is correctly extracted from onboarding data.

---

### 5.2 Campaign Database Update — Where Data Gets Saved

**File:** `convex/campaigns.ts` - `saveCampaign()`

```typescript
export const saveCampaign = mutation({
  handler: async (ctx, args) => {
    const existingCampaign = await ctx.db
      .query("campaigns")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingCampaign) {
      // ⚠️ PROBLEM AREA: Update existing campaign
      await ctx.db.patch(existingCampaign._id, {
        ...saveData, // Should contain fresh phone data
        updatedAt: Date.now(),
        // Preserve regeneration tracking fields
        regenerationCount: existingCampaign.regenerationCount,
        lastRegeneration: existingCampaign.lastRegeneration,
        // ❌ Issue: If saveData has wrong phone, it gets saved
      });
      return existingCampaign._id;
    }
  },
});
```

**Key Point (❌ Line 2):** Campaign database update may preserve old data if `saveData` isn't completely refreshed.

---

### 5.3 Google Ads Call Extension Creation — Where Wrong Number Gets Pushed

**File:** `convex/googleAdsCampaigns.ts` - `createGoogleAdsCampaign()`

```typescript
// Step 10: Create call extensions
const phoneNumber = campaignData.businessInfo?.phone; // ❌ Gets wrong number from campaign DB
console.log('📞 Attempting call extension creation...');
console.log('📞 Raw businessInfo object:', JSON.stringify(campaignData.businessInfo, null, 2));
console.log('📞 Extracted phone number:', phoneNumber || 'UNDEFINED/NULL');

if (phoneNumber) {
  console.log('📞 Creating call extensions with phone:', phoneNumber);

  // First create the call asset
  const callAssetRequestBody = {
    operations: [{
      create: {
        type: 'CALL',
        callAsset: {
          phoneNumber: phoneNumber, // ❌ Wrong number: 077 684 7429
          countryCode: 'GB',
          callConversionReportingState: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION'
        }
      }
    }]
  };
  // ...
}
```

**Key Point (❌ Line 3):** Phone number is pulled from campaign database which may contain stale data.

---

### 5.4 Campaign Schema — Data Structure

**File:** `convex/schema.ts`

```typescript
businessInfo: v.object({
  businessName: v.string(),
  phone: v.string(), // ❌ Contains wrong number in existing campaigns
  serviceArea: v.string(),
}),
callExtensions: v.array(v.union(
  v.string(), // ❌ Contains wrong number
  v.object({
    phoneNumber: v.string(),
    callHours: v.optional(v.string()),
  })
)),
```

**Key Point (❌ Line 4):** Schema stores phone number but doesn't validate against onboarding data.

---

### 5.5 Frontend Push Handler — Where Success Is Reported

**File:** `app/components/campaign/CampaignHeaderControls.tsx`

```typescript
const handlePushToGoogleAds = async () => {
  // ...
  try {
    const result = await pushToGoogleAds({
      campaignId: campaign._id, // ❌ Uses campaign with wrong phone data
      pushOptions: {
        createAsDraft: true,
        testMode: true,
      },
    });

    if (result.success) {
      // ❌ Shows success even with wrong phone number
      toast.success(`✅ ${result.message}`);
    }
  } catch (error) {
    // This catch block never triggered because wrong phone isn't an "error"
    console.error('❌ Campaign push error occurred:', error);
  }
};
```

**Key Point (❌ Line 5):** Success is reported despite the campaign containing stale data.

---

## 6. Data Flow Analysis

```
┌─────────────────────────────────────────────────────────────┐
│ Onboarding Data (CORRECT)                                   │
│ phone: 01217638262                                          │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ Campaign Generation (validateAndEnhanceCampaignData)        │
│ phone: 01217638262 ✅                                       │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ Campaign Database Save (STALE DATA ISSUE)                   │
│ Existing campaign preserved with old phone                  │
│ phone: 077 684 7429 ❌                                      │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ Google Ads Integration (createGoogleAdsCampaign)           │
│ Reads phone from database: 077 684 7429 ❌                 │
│ Creates call extensions with WRONG number                  │
└─────────────┬───────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│ Google Ads Campaign (INCONSISTENT RESULTS)                  │
│ Ad Group 1: 077 684 7429 ❌                                │
│ Ad Group 2: 01217638262 ✅ (partial fix)                   │
│ Ad Group 3: 077 684 7429 ❌                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Key Error Points Summary

| # | Location | Issue | Current State |
|---|----------|-------|---------------|
| 1 | `validateAndEnhanceCampaignData()` | Phone correctly extracted from onboarding | ✅ Working |
| 2 | `saveCampaign()` - Database update | Stale campaign data not fully refreshed | ❌ Problem |
| 3 | `createGoogleAdsCampaign()` | Phone retrieved from outdated DB record | ❌ Problem |
| 4 | Campaign schema | No validation against onboarding source | ⚠️ Design issue |
| 5 | `handlePushToGoogleAds()` | Success reported without data verification | ⚠️ Design issue |

---

## 8. Environment

- **Status:** Production
- **Integration:** Google Ads API
- **Backend:** Convex serverless
- **Frontend:** React Router v7
- **Region:** UK (GB phone numbers)

---

## 9. Reproduction Steps

### Prerequisites
- Existing user account with completed onboarding
- Phone number in onboarding: `01217638262`

### Step 1: Initial Campaign Generation
1. Navigate to `/dashboard/campaigns`
2. Click "Generate Campaign" button
3. Wait for AI generation to complete
4. **Expected:** Campaign shows phone `01217638262`
5. **Actual:** Campaign may show wrong phone `077 684 7429`

### Step 2: Push to Google Ads
1. Click "Push to Google Ads" button
2. Wait for success message: "Campaign drafted successfully in Google Ads"
3. Note the Google Campaign ID (e.g., `23267147458`)

### Step 3: Verify in Google Ads Dashboard
1. Open Google Ads dashboard in new tab
2. Navigate to the created campaign
3. Check all ad groups individually:
   - Click on each ad group name
   - Look at the ad previews
   - Note the phone numbers shown

### Step 4: Observe the Issue
**Expected Result:** All ads show `01217638262`

**Actual Result:**
- Some ad groups show `01217638262` ✅
- Other ad groups show `077 684 7429` ❌
- Inconsistent phone numbers across ad groups in same campaign

### Step 5: Debug Console (Won't Work)
1. Open browser dev tools (F12)
2. Try to regenerate campaign
3. Look for debug logs starting with `🔍`
4. **Observed:** Debug logs don't appear in frontend console
5. **Reason:** Backend Convex logs don't reach browser

### Step 6: Partial Fix Attempt
1. Click "Regenerate Campaign" button
2. Wait for regeneration to complete
3. Click "Push to Google Ads" again
4. **Result:** Some ads get fixed, others may still show wrong number

---

### Alternative Reproduction Methods

#### Scenario A: Fresh User
1. Complete onboarding with phone `01217638262`
2. Generate first campaign
3. May work correctly (no cached data)

#### Scenario B: Existing User
1. User has existing campaign data in database
2. Campaign contains old phone number `077 684 7429`
3. Regenerate campaign
4. Mixed results: Some parts updated, others use cached data

#### Timing-Based Reproduction
- **Issue occurs when:** User has existing campaign data that wasn't fully refreshed
- **Issue frequency:** Intermittent — depends on data state
- **Consistency:** Once wrong number is cached, it persists until full regeneration

---

## 10. Key Indicators of the Bug

1. ✅ Onboarding shows correct phone: `01217638262`
2. ❌ Some Google Ads show wrong phone: `077 684 7429`
3. ❌ Mixed phone numbers within same campaign
4. ❌ Debug logs don't appear in console
5. ⚠️ Success message shown despite data inconsistency

---

## 11. Required for Reproduction

- User with completed onboarding
- Existing campaign data in database
- Google Ads integration enabled
- Mixed old/new data in campaign database

---

## 12. Root Cause Analysis

The bug is **data consistency related** rather than a direct code error, making it somewhat unpredictable to reproduce consistently.

### Why It Happens

1. **First campaign generation** may initialize with cached/stale data
2. **Database update logic** doesn't perform a full data refresh — it patches the existing record
3. **Google Ads integration** reads from the patched record, which may still contain old values
4. **Partial regeneration** updates some fields but not all, leaving inconsistent data

### The Core Problem

```typescript
// ❌ BAD: Patching existing data with partial updates
await ctx.db.patch(existingCampaign._id, {
  ...saveData, // This might not contain ALL fields from onboarding
  updatedAt: Date.now(),
});

// ✅ GOOD: Should fetch fresh onboarding data and completely rebuild campaign data
const freshOnboardingData = await getOnboardingData(userId);
const freshCampaignData = validateAndEnhanceCampaignData(aiResponse, freshOnboardingData);
await ctx.db.patch(existingCampaign._id, freshCampaignData);
```

---

## 13. Next Steps for Resolution

1. **Force full data refresh** on campaign regeneration (don't patch, rebuild)
2. **Validate campaign phone** against onboarding phone before pushing to Google Ads
3. **Add frontend validation** to catch data inconsistencies before user sees them
4. **Implement proper logging** to track data transformations through the pipeline
5. **Add Convex middleware** to log validation steps server-side with frontend visibility



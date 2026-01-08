# Bug: Ads and Keywords Not Created in Google Ads

**Bug ID:** ADS-NOT-CREATED-001  
**Date Reported:** January 8, 2026  
**Severity:** Critical  
**Status:** Under Investigation  
**Environment:** Development  

---

## 1. Error Description

When pushing a campaign from the app to Google Ads, the **campaign is created successfully**, but **ads and keywords are NOT successfully published** to Google Ads. 

### Observed Behavior
- ✅ Campaign object is created in Google Ads
- ✅ Ad groups are created (names visible in Google Ads)
- ❌ Responsive Search Ads are NOT created (or only partially created)
- ❌ Keywords are NOT created (or only partially created)
- ❌ Campaign shows as "Paused" with no active ads or keywords

### Impact
- Campaign cannot run because there are no ads or keywords
- User sees "pushed successfully" in the app but nothing actually works
- Partial failures occur silently - some services get ads, others don't

---

## 2. User Journey (Step-by-Step)

| Step | Action | Expected | Actual |
|------|--------|----------|--------|
| 1 | User signs up | Account created | ✅ Works |
| 2 | User completes onboarding form (business type, city, phone, services) | Data saved | ✅ Works |
| 3 | User selects services (e.g., Leak Repair, Emergency Plumbing, Gas Safety Certificates) | Services stored | ✅ Works |
| 4 | App generates campaign draft with ad groups per service | Campaign with 15 headlines + 4 descriptions + keywords per ad group | ✅ Works |
| 5 | User sees Ad Preview inside app | Preview shows correct content | ✅ Works |
| 6 | User connects Google Ads account (OAuth) | Connection successful | ✅ Works |
| 7 | User clicks "Push campaign" | Campaign published to Google Ads | ⚠️ Partial |
| 8 | User opens Google Ads → Campaign | Campaign exists | ✅ Works |
| 9 | User clicks Campaign → Ad groups → Ads | At least 1 RSA per ad group | ❌ **No ads created** |
| 10 | User clicks Campaign → Ad groups → Keywords | Keyword rows visible | ❌ **No keywords created** |

---

## 3. Jam.dev Replay

🔗 **Session Recording:** https://jam.dev/c/588d1769-91aa-4445-b29e-cb44e87c86fb

---

## 4. Screenshots

### Google Ads - Ads View (No Ads Created)
![Ads View](./screenshots/ads-not-created-ads-view.png)

**Observation:** All ad groups show "Pending" status with 0 clicks, 0 impressions. Ad strength shows "Pending" but no actual ads are visible when drilling down.

### Google Ads - Ad Groups View
![Ad Groups View](./screenshots/ads-not-created-adgroups-view.png)

**Observation:** Ad groups exist (Leak Repair Birmingham, Gas Safety Certificates Birmingham, etc.) but all show:
- Status: "Paused, Campaign is paused"
- Clicks: 0
- Impressions: 0

### Convex Logs - Error Messages
![Convex Logs](./screenshots/ads-not-created-logs.png)

**Key Error:**
```
❌ Ad creation for "Gas Safety Certificates Birmingham" failed: { 
  errorMessage: 'Ad creation failed',
  errorDetails: '{\n  "message": "Ad creation failed",\n  "stack": "Error: Ad creation failed\\n    at createResponsiveSearchAd (convex:/user/googleAdsCampaigns.js:579:11)...
}
```

---

## 5. Server-side Logs

### Error Pattern 1: Ad Creation Failure
```
Jan 08, 16:43:34.893  ❌ Ad creation for "Gas Safety Certificates Birmingham" failed: { 
  errorMessage: 'Ad creation failed',
  errorDetails: '{
    "message": "Ad creation failed",
    "stack": "Error: Ad creation failed\n    at createResponsiveSearchAd..."
  }',
  adGroupName: 'Gas Safety Certificates Birmingham',
  adCopy: {
    headlinesCount: 15,
    descriptionsCount: 4,
    finalUrl: 'https://tradeboostai.tech'
  }
}
```

### Error Pattern 2: Silent Failures in Loop
The ad group loop continues processing even when individual ads fail:
```typescript
} catch (adError: any) {
  // ... error logging ...
  // Continue processing other ad groups even if one fails  ← SILENT FAILURE
}
```

### Error Pattern 3: Keywords Not Created
```
⚠️ No keywords found for ad group "Gas Safety Certificates Birmingham" - ad group will have no keywords!
```

Or:
```
❌ Keywords creation failed for "Emergency Plumbing Birmingham": [error details]
```

---

## 6. Root Cause Analysis

### Primary Suspects

#### 1. **Silent Failure Pattern** (HIGH PROBABILITY)
The code catches errors but continues processing, causing partial failures:

```typescript:convex/googleAdsCampaigns.ts
// Lines 848-878
} catch (adError: any) {
  // Better error logging for SDK errors
  let errorMessage = 'Unknown error';
  // ... logging ...
  console.error(`❌ Ad creation for "${adGroup.name}" failed:`, { ... });
  // Continue processing other ad groups even if one fails  ← BUG: No retry, no tracking
}
```

**Problem:** The function returns success even when some/all ads fail to create.

#### 2. **Missing `adCopy` Data**
If `adGroup.adCopy` is undefined or malformed, the ad creation is skipped entirely:

```typescript:convex/googleAdsCampaigns.ts
// Line 839
if (adGroup.adCopy) {  // ← If falsy, ad creation is SKIPPED
  try {
    const adResult = await createResponsiveSearchAd(adGroup.adCopy, customer, adGroupResourceName);
```

#### 3. **Phone Number Blocking**
The code has aggressive phone number detection that may block legitimate ads:

```typescript:convex/googleAdsCampaigns.ts
// Lines 1077-1088
if (contaminatedPhoneRegex.test(payloadString)) {
  console.error('🚨 CRITICAL: Contaminated phone number FOUND in ad payload!');
  throw new Error('Contaminated phone number detected in ad payload - aborting send');
}

const phoneMatches = payloadString.match(ukPhoneRegex);
if (phoneMatches && phoneMatches.length > 0) {
  throw new Error(`Phone numbers detected in ad content: ${phoneMatches.join(', ')}`);
}
```

#### 4. **Keyword Sanitization Edge Cases**
Keywords are limited to 10 per ad group and sanitized:

```typescript:convex/googleAdsCampaigns.ts
// Lines 907-914
const sanitizedKeywords = keywords
  .slice(0, 10) // Limit to 10 keywords per ad group
  .map(kw => kw.trim())
  .filter(kw => kw.length > 0 && kw.length <= 80);

if (sanitizedKeywords.length === 0) {
  return { success: false, createdCount: 0, errors: ['No valid keywords after sanitization'] };
}
```

#### 5. **Result Counting Bug**
The results are set optimistically BEFORE actual creation:

```typescript:convex/googleAdsCampaigns.ts
// Lines 637-638
results.adGroupsCreated = campaignData.adGroups.length;
results.adsCreated = campaignData.adGroups.length; // One ad per ad group ← WRONG: Assumes success
```

---

## 7. Code Snippets

### File 1: `convex/googleAdsCampaigns.ts` - Ad Group Loop (Lines 734-889)

```typescript
for (let i = 0; i < campaignData.adGroups.length; i++) {
  const adGroup = campaignData.adGroups[i];
  console.log(`🎯🎯 PROCESSING Ad Group ${i + 1}/${campaignData.adGroups.length}: ${adGroup.name}`);

  try {
    // ... ad group creation code ...

    // Create Keywords for this ad group
    if (adGroup.keywords && adGroup.keywords.length > 0) {
      console.log(`🔑 Creating ${adGroup.keywords.length} keywords for "${adGroup.name}"...`);
      const keywordResult = await createKeywords(adGroup.keywords, customer, adGroupResourceName);
      if (keywordResult.success) {
        console.log(`✅ Keywords created for "${adGroup.name}": ${keywordResult.createdCount}/${adGroup.keywords.length}`);
      } else {
        console.error(`❌ Keywords creation failed for "${adGroup.name}":`, keywordResult.errors);
      }
    } else {
      console.warn(`⚠️ No keywords found for ad group "${adGroup.name}" - ad group will have no keywords!`);
    }

    // Create Responsive Search Ad for this ad group
    if (adGroup.adCopy) {
      try {
        console.log(`📝 Attempting to create ad for "${adGroup.name}"...`);
        const adResult = await createResponsiveSearchAd(adGroup.adCopy, customer, adGroupResourceName);
        if (adResult?.success) {
          console.log(`✅ Ad created successfully for ${adGroup.name}`);
        } else {
          console.error(`❌ Ad creation for "${adGroup.name}" returned unsuccessful result:`, JSON.stringify(adResult, null, 2));
        }
      } catch (adError: any) {
        // ... error logging ...
        // Continue processing other ad groups even if one fails  ← BUG: Silent failure
      }
    }
  } catch (error) {
    console.error(`❌ Error creating ad group ${adGroup.name}:`, { ... });
  }
}
```

### File 2: `convex/googleAdsCampaigns.ts` - createResponsiveSearchAd (Lines 960-1120)

```typescript
async function createResponsiveSearchAd(
  adCopy: any,
  customer: Customer,
  adGroupResourceName: string
) {
  // ... sanitization and validation ...

  try {
    const adPayloadData = {
      ad_group: adGroupResourceName,
      status: 'PAUSED',
      ad: {
        type: 'RESPONSIVE_SEARCH_AD',
        final_urls: [finalUrl],
        responsive_search_ad: {
          headlines: headlines.map((headline: string) => ({ text: headline })),
          descriptions: descriptions.map((description: string) => ({ text: description }))
        }
      }
    };

    // Phone number blocking check
    const phoneMatches = payloadString.match(ukPhoneRegex);
    if (phoneMatches && phoneMatches.length > 0) {
      throw new Error(`Phone numbers detected in ad content: ${phoneMatches.join(', ')}`);
    }

    const adResult = await customer.adGroupAds.create([adPayloadData as any]);
    return { success: true, resourceName: adResult.results[0]?.resource_name };
  } catch (adError: any) {
    throw new Error(errorMessage);  // ← This gets caught and swallowed in parent
  }
}
```

### File 3: `convex/campaigns.ts` - Push to Google Ads (Lines 860-898)

```typescript
console.log('📞 Calling googleAdsCampaigns.createGoogleAdsCampaign with campaignId:', args.campaignId);
const result: any = await ctx.runAction(api.googleAdsCampaigns.createGoogleAdsCampaign, {
  campaignId: args.campaignId,
  pushOptions: pushOptions,
});

if (result.success) {
  // Update campaign status
  await ctx.runMutation(api.campaigns.updateCampaignStatus, {
    campaignId: args.campaignId,
    status: pushOptions.createAsDraft ? "pushed_draft" : "pushed_live",
  });

  const detailMessage = `Campaign: ✅ | Ad Groups: ${result.adGroupsCreated || 0} | Ads: ${result.adsCreated || 0} | Extensions: ${result.extensionsCreated || 0}`;
  
  return {
    success: true,
    message: `Campaign pushed to Google Ads successfully`,
    // ...
  };
}
```

---

## 8. Convex Data

### Campaign Data Structure (from schema)
```typescript
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
  // ...
})
```

### Queries to Run
```bash
# Check campaign data structure
bunx convex data campaigns --limit 1

# Check if adGroups have proper structure
bunx convex run campaigns:getCampaignById --args '{"campaignId": "<CAMPAIGN_ID>"}'
```

---

## 9. Reproduction Steps

### Prerequisites
- User account with completed onboarding
- Google Ads account connected
- At least 3 services selected (e.g., "Boiler Repair", "Emergency Plumbing", "Leak Repair")

### Steps to Reproduce
1. Complete onboarding with multiple services selected
2. Let AI generate the campaign with ad groups for each service
3. Review the campaign preview (should show 15 headlines + 4 descriptions per service)
4. Click "Push campaign to Google Ads"
5. Wait for completion message
6. Open Google Ads dashboard
7. Navigate to: Campaign → Ad groups → Ads
8. **Expected:** At least 1 RSA per ad group
9. **Actual:** No ads created / some ads missing

### Error Patterns to Check in Convex Logs
```
❌ Ad creation for "..." failed:
🚨 CRITICAL: Phone numbers detected in ad payload
⚠️ No keywords found for ad group
❌ Keywords creation failed for "..."
```

---

## 10. Potential Fixes

### Fix 1: Track Actual Success/Failure Counts
```typescript
// Replace optimistic counting with actual tracking
let actualAdsCreated = 0;
let actualKeywordsCreated = 0;

for (const adGroup of campaignData.adGroups) {
  // ... creation code ...
  if (adResult?.success) {
    actualAdsCreated++;
  }
  if (keywordResult?.success) {
    actualKeywordsCreated += keywordResult.createdCount;
  }
}

results.adsCreated = actualAdsCreated;
```

### Fix 2: Return Partial Failure Status
```typescript
// Instead of returning success: true when some ads fail
return {
  success: actualAdsCreated === campaignData.adGroups.length,
  partialSuccess: actualAdsCreated > 0 && actualAdsCreated < campaignData.adGroups.length,
  adGroupsCreated: campaignData.adGroups.length,
  adsCreated: actualAdsCreated,
  adsExpected: campaignData.adGroups.length,
  failedAdGroups: failedAdGroupNames,
};
```

### Fix 3: Add Retry Logic
```typescript
async function createAdWithRetry(adCopy, customer, adGroupResourceName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createResponsiveSearchAd(adCopy, customer, adGroupResourceName);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`⚠️ Retry ${attempt}/${maxRetries} for ad creation...`);
      await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
    }
  }
}
```

---

## 11. Related Files

| File | Purpose | Lines of Interest |
|------|---------|-------------------|
| `convex/googleAdsCampaigns.ts` | Google Ads API integration | 470-1120 |
| `convex/campaigns.ts` | Campaign management, push logic | 860-915 |
| `convex/schema.ts` | Database schema definitions | 89-129 |
| `app/routes/onboarding.tsx` | User onboarding flow | All |

---

## 12. Questions for Investigation

1. **What specific Google Ads API error is being thrown?** The logs show "Ad creation failed" but not the underlying Google Ads error code.

2. **Is the `adCopy` object properly populated for all ad groups?** Need to verify the campaign data in Convex before push.

3. **Are phone numbers being detected in ad content?** The phone blocking regex may be too aggressive.

4. **What is the Google Ads API response body?** Need to capture the full error response from the SDK.

5. **Are there rate limits being hit?** Multiple ad creations in quick succession may trigger rate limiting.

---

## 13. Syntax Bug Found

**CRITICAL:** There appears to be a **missing opening brace** in the codebase search output for the phone number check. However, upon closer inspection of the actual file, the syntax is correct. The search result showed:

```typescript
// Lines 1085-1089 (from search result - APPEARED broken)
if (phoneMatches && phoneMatches.length > 0)  // ← Missing brace in output
  console.error('🚨 CRITICAL: Phone numbers detected...');
```

**Actual code (verified):**
```typescript
// Lines 1085-1089 (actual file - CORRECT)
if (phoneMatches && phoneMatches.length > 0) {
  console.error('🚨 CRITICAL: Phone numbers detected in ad payload (helper function):', phoneMatches);
  console.error('🚨 Ad text should NEVER contain phone numbers - BLOCKING SEND');
  throw new Error(`Phone numbers detected in ad content: ${phoneMatches.join(', ')}`);
}
```

---

## 14. Next Steps

- [ ] Add detailed error logging to capture Google Ads API error codes
- [ ] Verify campaign data structure in Convex before push
- [ ] Test with a single service to isolate the issue
- [ ] Check Google Ads API quotas and rate limits
- [ ] Review phone number regex for false positives
- [ ] Implement proper success/failure tracking
- [ ] Add retry logic with exponential backoff
- [ ] Add a verification step after push to confirm ads were created in Google Ads


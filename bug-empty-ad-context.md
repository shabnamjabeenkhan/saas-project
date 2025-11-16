# Bug Report: Empty Ad Context - "Request contains an invalid argument"

## 1. Error Description

The same "Request contains an invalid argument" error is occurring for all 4 ad groups during ad creation. Looking at the logs:

**Key observations:**
1. ✅ Campaign created successfully
2. ✅ Ad Groups created successfully (4/4)
3. ✅ Call extensions created successfully (1/1)
4. ❌ All ads failed to create (0/4) with "Request contains an invalid argument"

**Root cause:** The ad content (headlines/descriptions) being sent to Google Ads API is invalid. This could be due to:

1. **Empty content** - Headlines or descriptions are empty after processing
2. **Invalid characters** - Special characters that Google Ads doesn't accept
3. **Length violations** - Content exceeds Google's limits (30 chars for headlines, 90 for descriptions)
4. **Missing required fields** - The ad structure is malformed

---

## 2. User Journey

1. User completes onboarding with phone number `07563826777`
2. User generates campaign - AI creates campaign with mixed phone numbers (correct `07563826777` + contaminated `077 684 7429`)
3. User clicks "Push to Google Ads"
4. System validation passes - Phone numbers match, no contamination detected in pre-push checks
5. Google Ads API calls begin:
   - ✅ Campaign created successfully
   - ✅ Budget created successfully
   - ✅ 4 Ad Groups created successfully
   - ✅ Keywords added to all ad groups successfully
   - ✅ 1 Call extension created with correct phone number (phone alternation issue resolved)
6. Ad creation fails completely:
   - ❌ All 4 ad groups fail ad creation with "Request contains an invalid argument"
   - ❌ 0 ads created across entire campaign
7. User sees error message: "Failed to push to Google Ads: Incomplete campaign creation"

**Current State:**
- Campaign structure: ✅ Complete (campaign, ad groups, keywords, call extensions)
- Phone number issue: ✅ RESOLVED (only 1 call extension created with correct number)
- Blocking issue: ❌ Ad content validation - all headlines/descriptions are being rejected by Google Ads API

The user has a campaign shell in Google Ads but no actual ads, making it non-functional. The phone alternation issue is fixed, but there's a separate ad content validation problem preventing completion.

---

## 3. Jam.dev Replay

https://jam.dev/c/ffb9d1dd-ee36-4d31-9453-15ab2debd6f6

---

## 4. Screenshots

_Note: Screenshots were mentioned but not provided in the original request. Add screenshots here when available._

---

## 5. Server-side Logs

_Note: Server-side logs were mentioned but not provided in the original request. Add logs here when available._

**Expected log pattern:**
```
✅ Campaign created successfully
✅ Ad Groups created successfully (4/4)
✅ Call extensions created successfully (1/1)
❌ Ad creation for "Emergency Plumbing Solutions" failed with status 400: Request contains an invalid argument
❌ Ad creation for "Boiler Repair & Setup" failed with status 400: Request contains an invalid argument
❌ Ad creation for "Leak Repair Solutions" failed with status 400: Request contains an invalid argument
❌ Ad creation for "Central Heating Services" failed with status 400: Request contains an invalid argument
```

---

## 6. Client-side Logs

_Note: Client-side logs were mentioned but not provided in the original request. Add logs here when available._

---

## 7. Network Tab

_Note: Network tab information was mentioned but not provided in the original request. Add network request/response details here when available._

**Expected API call:**
- **Endpoint:** `POST https://googleads.googleapis.com/v22/customers/{customerId}/adGroupAds:mutate`
- **Status:** 400 Bad Request
- **Error:** "Request contains an invalid argument"

---

## 8. Code Snippets

### 8.1 Ad Creation Logic

**File:** `convex/googleAdsCampaigns.ts:345-366`

```345:366:convex/googleAdsCampaigns.ts
          // Step 9: Create ads in the ad group
          console.log(`📝 Creating ads for ${adGroup.name}...`);

          const adOperations = [];
          const headlines = adGroup.adCopy.headlines.slice(0, 3); // Max 3 headlines
          const descriptions = adGroup.adCopy.descriptions.slice(0, 2); // Max 2 descriptions

          adOperations.push({
            create: {
              adGroup: adGroupResourceName,
              status: 'ENABLED',
              ad: {
                type: 'RESPONSIVE_SEARCH_AD',
                finalUrls: [adGroup.adCopy.finalUrl || 'https://example.com'],
                responsiveSearchAd: {
                  headlines: headlines.map((headline: string) => ({
                    text: headline.substring(0, 30) // Ensure max 30 chars
                  })),
                  descriptions: descriptions.map((description: string) => ({
                    text: description.substring(0, 90) // Ensure max 90 chars
                  }))
                }
              }
            }
          });
```

### 8.2 API Call and Error Handling

**File:** `convex/googleAdsCampaigns.ts:374-402`

```374:402:convex/googleAdsCampaigns.ts
          const adResponse = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}/adGroupAds:mutate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
              'login-customer-id': customerId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adRequestBody)
          });

          if (!adResponse.ok) {
            const adError = await adResponse.text();
            console.error(`❌ Ad creation for ${adGroup.name} failed with status ${adResponse.status}:`, adError);

            // Parse and log detailed Google Ads API error
            try {
              const errorDetails = JSON.parse(adError);
              console.error(`🔍 Google Ads API Error Details for ${adGroup.name}:`, {
                status: adResponse.status,
                statusText: adResponse.statusText,
                error: errorDetails.error,
                details: errorDetails.details || errorDetails.message || errorDetails
              });
              results.errors.push(`Ad creation for "${adGroup.name}" failed: ${errorDetails.error?.message || errorDetails.message || 'API Error'}`);
            } catch (parseError) {
              console.error(`🔍 Raw Google Ads API Error for ${adGroup.name}:`, adError);
              results.errors.push(`Ad creation for "${adGroup.name}" failed: ${adError.substring(0, 100)}`);
            }
          }
```

### 8.3 Request Logging

**File:** `convex/googleAdsCampaigns.ts:372`

```372:372:convex/googleAdsCampaigns.ts
          console.log(`📋 Ad request body for ${adGroup.name}:`, JSON.stringify(adRequestBody, null, 2));
```

### 8.4 Ad Copy Data Structure

**Interface definition** (from `app/components/campaign/AdGroupCard.tsx`):

```typescript
interface AdGroup {
  name: string;
  keywords: string[];
  adCopy: {
    headlines: string[];
    descriptions: string[];
    finalUrl: string;
  };
}
```

### 8.5 Key Issues in Current Code

1. **No data validation before API call** - headlines/descriptions could be empty strings
2. **Aggressive substring() truncation** - could create empty content if original is empty
3. **Missing sanitization** - was removed in revert
4. **No logging of actual content** - being sent to Google Ads API

The error occurs at the Google Ads API level when the request body contains invalid ad content structure.

---

## 9. Environment

- **Environment:** Production
- **API Version:** Google Ads API v22
- **Endpoint:** `https://googleads.googleapis.com/v22/customers/{customerId}/adGroupAds:mutate`

---

## 10. Convex Data

_Note: Use `bunx convex data` commands to fetch relevant database state. Add findings here._

**Commands to run:**
```bash
# Check campaign data structure
bunx convex data get campaigns <campaignId>

# Check ad groups data
bunx convex data query campaigns --filter '{_id: "<campaignId>"}'

# Verify adCopy structure in database
```

**Expected data structure:**
```json
{
  "adGroups": [
    {
      "name": "Emergency Plumbing Solutions",
      "keywords": [...],
      "adCopy": {
        "headlines": ["...", "...", "..."],
        "descriptions": ["...", "..."],
        "finalUrl": "..."
      }
    }
  ]
}
```

---

## 11. Reproduction Steps

1. Navigate to: `http://localhost:5173/dashboard/campaigns`
2. Click: "Regenerate Campaign" button (green button)
   - Wait for AI to generate campaign data
   - Verify campaign shows 4 ad groups in preview
3. Click: "Push to Google Ads" button (gray button with lightning icon)
4. Observe Console Logs: You'll see this exact sequence:
   - ✅ Campaign created successfully
   - ✅ Ad Groups created successfully (4/4)
   - ✅ Call extensions created successfully (1/1)
   - ❌ All 4 ads fail: "Request contains an invalid argument"
5. Error Appears: Red toast notification with:
   ```
   Failed to push to Google Ads: Incomplete campaign creation:
   Ad creation for "Emergency Plumbing Solutions" failed: Request contains an invalid argument.,
   Ad creation for "Boiler Repair & Setup" failed: Request contains an invalid argument.,
   Ad creation for "Leak Repair Solutions" failed: Request contains an invalid argument.,
   Ad creation for "Central Heating Services" failed: Request contains an invalid argument.
   ```

**Error Pattern:**
- 100% reproducible - happens every time
- All 4 ad groups fail - none succeed
- Same error message for all: "Request contains an invalid argument"
- Partial campaign created in Google Ads (campaign shell exists but no ads)

**Root Cause Location:**
The error occurs in `googleAdsCampaigns.ts:374-402` when the Google Ads API rejects the ad content being submitted in the request body.

---

## 12. Debugging Checklist

- [ ] Verify `adGroup.adCopy.headlines` array contains non-empty strings
- [ ] Verify `adGroup.adCopy.descriptions` array contains non-empty strings
- [ ] Check if `headline.substring(0, 30)` creates empty strings
- [ ] Check if `description.substring(0, 90)` creates empty strings
- [ ] Validate Google Ads API requirements:
  - [ ] Minimum 3 headlines required for Responsive Search Ads
  - [ ] Minimum 2 descriptions required for Responsive Search Ads
  - [ ] Headlines must be 1-30 characters
  - [ ] Descriptions must be 1-90 characters
  - [ ] No special characters that violate Google Ads policies
- [ ] Add logging to capture actual request body before API call
- [ ] Test with sample valid ad content to isolate issue
- [ ] Check Convex database for actual adCopy values

---

## 13. Potential Fixes

### Fix 1: Add Content Validation Before API Call

```typescript
// Validate headlines and descriptions before creating ad operations
const headlines = adGroup.adCopy.headlines
  .slice(0, 3)
  .map(h => h.trim())
  .filter(h => h.length > 0 && h.length <= 30);

const descriptions = adGroup.adCopy.descriptions
  .slice(0, 2)
  .map(d => d.trim())
  .filter(d => d.length > 0 && d.length <= 90);

// Google Ads requires minimum 3 headlines and 2 descriptions for Responsive Search Ads
if (headlines.length < 3) {
  throw new Error(`Insufficient headlines for ${adGroup.name}: ${headlines.length}/3 required`);
}

if (descriptions.length < 2) {
  throw new Error(`Insufficient descriptions for ${adGroup.name}: ${descriptions.length}/2 required`);
}
```

### Fix 2: Add Detailed Logging

```typescript
console.log(`📋 Ad content validation for ${adGroup.name}:`, {
  headlines: headlines.map(h => ({ text: h, length: h.length })),
  descriptions: descriptions.map(d => ({ text: d, length: d.length })),
  finalUrl: adGroup.adCopy.finalUrl
});
```

### Fix 3: Sanitize Content

```typescript
// Remove invalid characters and ensure proper formatting
const sanitizeText = (text: string, maxLength: number): string => {
  return text
    .trim()
    .replace(/[^\w\s\-.,!?()]/g, '') // Remove invalid special chars
    .substring(0, maxLength)
    .trim();
};

const headlines = adGroup.adCopy.headlines
  .slice(0, 3)
  .map(h => sanitizeText(h, 30))
  .filter(h => h.length > 0);
```

---

## 14. Related Issues

- Phone alternation issue (RESOLVED) - Previously caused multiple call extensions, now fixed
- Campaign structure creation - Working correctly
- Ad group creation - Working correctly
- Keyword addition - Working correctly

---

## 15. Next Steps

1. **Immediate:** Add validation and logging to capture actual ad content being sent
2. **Debug:** Check Convex database to see actual `adCopy` values stored
3. **Test:** Verify Google Ads API requirements for Responsive Search Ads
4. **Fix:** Implement content validation and sanitization
5. **Verify:** Test with valid ad content to confirm fix works


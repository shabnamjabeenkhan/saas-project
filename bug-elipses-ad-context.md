# Bug Context: Ellipses in Ad Descriptions & Related Issues

## 1. Error Description

Multiple related issues affecting ad quality and Google Ads campaign creation:

### Issue 1: Ellipses in Ad Descriptions
- **Problem**: Ad descriptions contain ellipses (`...`) that should not appear
- **Location**: Visible in Google Ads interface after campaign push
- **Impact**: Unprofessional appearance, potential policy violations

### Issue 2: Repeated Descriptions in Ad Preview
- **Problem**: In the TradeBoost app ad preview, within the same asset group, the description appears repeated three times
- **Location**: Ad preview component in the TradeBoost application
- **Impact**: Confusing user experience, misleading preview

### Issue 3: Missing Ad Creation
- **Problem**: An ad for one of the selected services was not created in Google Ads
- **Specific Service**: "Gas Safety Inspections London" ad group failed to create ad
- **Error**: Policy violation - `POLICY_FINDING` error with `PROHIBITED` policy topic
- **Impact**: Incomplete campaign, missing ad coverage

### Issue 4: City Abbreviation in Headline
- **Problem**: City abbreviation appears in ad headline (e.g., "B'ham" instead of "Birmingham")
- **Location**: Google Ads headlines
- **Impact**: Unprofessional appearance, potential truncation issues

### Issue 5: Campaign Push Error
- **Problem**: Campaign push failed with partial success error
- **Error Message**: `Only 2/3 ads were created. Some ad groups failed: Gas Safety Inspections London`
- **Impact**: Campaign creation incomplete, user sees error

---

## 2. User Journey

### Step 1: Campaign Creation
- User signs up and creates a campaign through the onboarding flow
- Campaign includes multiple ad groups for different services
- User selects services including "Gas Safety Inspections London"

### Step 2: Ad Preview Review
- User views ad preview in TradeBoost app
- **BUG**: Description appears repeated three times in the same asset group preview
- User may notice ellipses in descriptions

### Step 3: Google Ads Connection & Push
- User connects their Google Ads account
- User attempts to push campaign to Google Ads
- Campaign push process starts

### Step 4: Google Ads Review
- User navigates to Google Ads interface
- **BUG**: Sees ellipses in ad descriptions
- **BUG**: Sees city abbreviation in headline (e.g., "B'ham")
- **BUG**: Notices that ad for "Gas Safety Inspections London" service was not created
- **BUG**: Campaign push shows error: "Only 2/3 ads were created"

---

## 3. Jam.dev Replay

**Recording Link**: https://jam.dev/c/3ca92d77-8948-416e-bdcf-487c8b64db86

The replay shows:
- Google search results with ellipses in ad descriptions
- Google Ads interface showing paused ads with policy violations
- Ad preview showing repeated descriptions
- Error logs indicating campaign creation failures

---

## 4. Screenshots

### Screenshot 1: Google Search Results with Ellipses
- Shows ad with ellipses in description: "Reliable, Gas Safe certified heating services in London. Get your heating fixed today. Prompt and professional..."
- URL: `www.tradeboostai.tech/`
- Phone: `07462846297`

### Screenshot 2: Google Ads Interface
- Shows paused ads with zero clicks/impressions
- Ad status: "Paused" (Ad group paused, Campaign is paused)
- Ad strength: "Pending"
- Two ads visible:
  1. "Heating Service Ldn | Plumber 24 Hour Heat Help | Certified Heating Engineer"
  2. "Boiler Fix London | 24/7 Heating Help | Plumber Gas Safe Expert"

### Screenshot 3: Ad Preview in TradeBoost App
- Shows ad preview with multiple service listings
- Descriptions appear repeated multiple times
- Shows phone number and website URL

### Screenshot 4: Error Logs
- Shows Convex logs with error: "Campaign creation failed"
- Error details: `Only 2/3 ads were created. Some ad groups failed: Gas Safety Inspections London`
- Policy error: `POLICY_FINDING` with `PROHIBITED` policy topic

---

## 5. Server-side Logs

### Convex Logs (from dashboard.convex.dev)

**Error Entry 1**:
```
Timestamp: Jan 13, 00:08:24.080
Function: campaigns:pushToGoogleAds
Status: error
Message: Campaign creation failed. Result: {
  adGroupsCreated: 3,
  adsCreated: 2,
  adsExpected: 3,
  error: 'Only 2/3 ads were created. Some ad groups failed: Gas Safety Inspections London',
  errors: [
    'Ad creation failed for "Gas Safety Inspections London": Ad creation failed: {"policy_finding_error":"POLICY_FINDING"}: The resource has been disapproved since the policy summary includes policy topics of type PROHIBITED.'
  ],
  extensionsCreated: 1,
  failedAdGroups: [],
  failedAds: ['Gas Safety Inspections London'],
  failedKeywords: [],
  googleCampaignId: '23458402462',
  keywordsCreated: 30,
  partialSuccess: true,
  resourceName: 'customers/9099633029/campaigns/23458402462',
  success: false
}
```

**Error Entry 2**:
```
Timestamp: Jan 13, 00:08:24.081
Function: campaigns:pushToGoogleAds
Status: error
Message: Push to Google Ads failed: [Error: Failed to create campaign in Google Ads: Only 2/3 ads were created. Some ad groups failed: Gas Safety Inspections London]
```

**Error Entry 3**:
```
Timestamp: Jan 13, 00:08:24.126
Function: campaigns:pushToGoogleAds
Status: failure
Duration: 36.8s
Message: Uncaught Error: Failed to push to Google Ads: Failed to create campaign in Google Ads: Only 2/3 ads were created. Some ad groups failed: Gas Safety Inspections London
```

### Execution Details
- **Execution ID**: `446383cc-023a-4d0c-925...`
- **Function**: `campaigns:pushToGoogleAds`
- **Type**: Action
- **Started at**: `13/01/2026, 00:07:10`
- **Completed at**: `13/01/2026, 00:07:47`
- **Duration**: `36.8s`
- **Environment**: Convex Production

---

## 6. Client-side Logs

### Browser Console Errors

**Error 1**:
```
[CONVEX A(campaigns:pushToGoogleAds)] [Request ID: d84358a92d05ea4f] Server Error
```

**Error 2**:
```
Campaign push error occurred: Error: [CONVEX A(campaigns:pushToGoogleAds)] [Request ID: d84358a92d05ea4f] Server Error
Called by client
at Jt.action (api.YVf-quRN.js:2:41418)
at async b (campaigns.BJİKPiS7.js:51:14613)
```

**Error 3**:
```
Error type: object
Error message: [CONVEX A(campaigns:pushToGoogleAds)] [Request ID: d84358a92d05ea4f] Server Error
Called by client
```

**Final Status**:
```
Campaign push process completed, resetting UI state
```

---

## 7. Code Snippets

### 7.1 Ellipses Sanitization Logic

**Location**: `convex/googleAdsCampaigns.ts` (lines 433-438) and `convex/campaigns.ts` (lines 1037-1042)

```typescript
// 🚨 CRITICAL: Remove ellipses from descriptions/headlines (all variations)
cleaned = cleaned.replace(/\.{2,}/g, ''); // Remove 2+ consecutive dots
cleaned = cleaned.replace(/\s*\.\.\.\s*/g, ' '); // Remove "..." with surrounding spaces
cleaned = cleaned.replace(/\s*\.\.\s*/g, ' '); // Remove ".." with surrounding spaces
cleaned = cleaned.replace(/\s+\.\s*$/g, ' '); // Remove trailing single dot with space
cleaned = cleaned.replace(/\.\s*\./g, '.'); // Remove double periods
```

**Also in**: `convex/googleAdsCampaigns.ts` (lines 1541-1546) - Description sanitization

```typescript
// 🚨 CRITICAL: Remove ellipses from descriptions (all variations)
cleaned = cleaned.replace(/\.{2,}/g, ''); // Remove 2+ consecutive dots
cleaned = cleaned.replace(/\s*\.\.\.\s*/g, ' '); // Remove "..." with surrounding spaces
cleaned = cleaned.replace(/\s*\.\.\s*/g, ' '); // Remove ".." with surrounding spaces
cleaned = cleaned.replace(/\s+\.\s*$/g, ' '); // Remove trailing single dot with space
cleaned = cleaned.replace(/\.\s*\./g, '.'); // Remove double periods
```

### 7.2 City Abbreviation Replacement Logic

**Location**: `convex/campaigns.ts` (lines 1840-1848, 1993-2001)

```typescript
const CITY_ABBREVIATIONS: Record<string, string> = {
  'birmingham': "B'ham",
  'manchester': "M'cr",
  'nottingham': "Notts",
  'southampton': "S'ton",
  'stoke-on-trent': 'Stoke',
  'newcastle upon tyne': 'Newcastle',
  'kingston upon hull': 'Hull',
};

// Step 1: Replace ALL city abbreviations with full city names (we never want abbreviations)
for (const [city, abbrev] of Object.entries(CITY_ABBREVIATIONS)) {
  // Escape special regex characters in abbreviation (e.g., B'ham has apostrophe)
  const escapedAbbrev = abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const abbrevPattern = new RegExp(escapedAbbrev, 'gi');
  // Capitalize first letter of city for replacement
  const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1);
  cleaned = cleaned.replace(abbrevPattern, capitalizedCity).replace(/\s+/g, ' ').trim();
}
```

### 7.3 Policy Compliance Transformations

**Location**: `convex/campaigns.ts` (lines 1014-1031, 1056-1060)

```typescript
const POLICY_COMPLIANT_TRANSFORMATIONS: Record<string, string> = {
  // Gas services - avoid "certificates" which implies issuing official documents
  'Gas Safety Certificates': 'Gas Safety Checks',
  'Gas Safety Certificate': 'Gas Safety Check',
  'gas safety certificates': 'gas safety checks',
  'gas safety certificate': 'gas safety check',
  'Gas Certificate': 'Gas Safety Check',
  'CP12 Certificate': 'CP12 Gas Check',
  'Landlord Gas Certificate': 'Landlord Gas Safety',
  
  // Electrical services - same issue
  'Electrical Safety Certificates': 'Electrical Safety Testing',
  'Electrical Safety Certificate': 'Electrical Safety Test',
  'electrical safety certificates': 'electrical safety testing',
  'electrical safety certificate': 'electrical safety test',
  'EICR Certificate': 'EICR Testing',
  'Electrical Certificate': 'Electrical Testing',
};

// Apply all transformations (case-insensitive where needed)
for (const [problematic, compliant] of Object.entries(POLICY_COMPLIANT_TRANSFORMATIONS)) {
  // Create case-insensitive regex for matching
  const regex = new RegExp(problematic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  sanitized = sanitized.replace(regex, compliant);
}
```

### 7.4 Ad Creation Error Handling

**Location**: `convex/googleAdsCampaigns.ts` (lines 803-819)

```typescript
if (!allAdsCreated) {
  return {
    success: false,
    partialSuccess: true,
    error: `Only ${adGroupResults.adsCreated}/${expectedAdGroups} ads were created. Some ad groups failed: ${adGroupResults.failedAds.join(', ')}`,
    googleCampaignId,
    resourceName: campaignResourceName,
    adGroupsCreated: adGroupResults.adGroupsCreated,
    adsCreated: adGroupResults.adsCreated,
    adsExpected: expectedAdGroups,
    keywordsCreated: adGroupResults.keywordsCreated,
    extensionsCreated: results.extensionsCreated,
    failedAdGroups: adGroupResults.failedAdGroups,
    failedAds: adGroupResults.failedAds,
    failedKeywords: adGroupResults.failedKeywords,
    errors: adGroupResults.errors
  };
}
```

### 7.5 Ad Preview Component

**Location**: `app/components/campaign/AdGroupCard.tsx` (lines 76-81)

```typescript
{/* Descriptions */}
{adGroup.adCopy.descriptions.map((description, idx) => (
  <div key={idx} className="text-gray-300 text-sm">
    {description}
  </div>
))}
```

**Issue**: The component renders all descriptions without deduplication, which may cause repetition in the preview.

### 7.6 Description Deduplication Logic

**Location**: `convex/googleAdsCampaigns.ts` (lines 1568-1579)

```typescript
// 🔧 FIX: Deduplicate descriptions within this ad group
const uniqueDescriptions = deduplicateAssets(sanitizedDescriptions);

// 🔧 FIX: Filter out descriptions already used in other ad groups of this campaign
const availableDescriptions = filterAlreadyUsedAssets(uniqueDescriptions, usedDescriptionsInCampaign);

console.log('🔍 Descriptions deduplication:', {
  rawCount: sanitizedDescriptions.length,
  uniqueCount: uniqueDescriptions.length,
  availableCount: availableDescriptions.length,
  alreadyUsedInCampaign: uniqueDescriptions.length - availableDescriptions.length
});
```

---

## 8. Environment

- **Environment**: Production and Development
- **Convex Deployment**: Production (`mellow-vole-759`)
- **Google Ads Account**: Connected and active
- **Campaign ID**: `23458402462`
- **Customer ID**: `9099633029`

---

## 9. Convex Data

### Campaign State
- **Campaign Status**: `push_failed` (after error)
- **Google Campaign ID**: `23458402462`
- **Resource Name**: `customers/9099633029/campaigns/23458402462`

### Ad Groups Created
- **Total Ad Groups**: 3
- **Created**: 3
- **Failed**: 0

### Ads Created
- **Expected**: 3
- **Created**: 2
- **Failed**: 1 ("Gas Safety Inspections London")

### Keywords Created
- **Total**: 30 keywords successfully created

### Extensions Created
- **Call Extensions**: 1 successfully created
- **Phone**: `07462846297`

### Failed Ad Details
- **Ad Group**: "Gas Safety Inspections London"
- **Error Type**: `POLICY_FINDING`
- **Policy Topic**: `PROHIBITED`
- **Error Message**: "The resource has been disapproved since the policy summary includes policy topics of type PROHIBITED."

---

## 10. Reproduction Steps

### Step 1: Campaign Creation
1. User signs up and completes onboarding
2. User creates a campaign with multiple services
3. User selects "Gas Safety Inspections London" as one of the services
4. Campaign is generated with ad groups and ad copy

### Step 2: Ad Preview Review
1. User navigates to campaign preview page
2. User selects an ad group to preview
3. **BUG OBSERVED**: Description appears repeated three times in the ad preview
4. User may notice ellipses in descriptions

### Step 3: Google Ads Connection & Push
1. User connects their Google Ads account
2. User clicks "Push to Google Ads" button
3. Campaign push process begins
4. System attempts to create campaign, ad groups, keywords, and ads

### Step 4: Error Occurs
1. **BUG**: Ad creation fails for "Gas Safety Inspections London" ad group
2. **Error**: `POLICY_FINDING` with `PROHIBITED` policy topic
3. System returns partial success: `Only 2/3 ads were created`
4. Campaign push fails with error message

### Step 5: Google Ads Review
1. User navigates to Google Ads interface
2. **BUG**: Sees ellipses in ad descriptions (e.g., "Prompt and professional...")
3. **BUG**: Sees city abbreviation in headline (e.g., "B'ham" instead of "Birmingham")
4. **BUG**: Notices that ad for "Gas Safety Inspections London" was not created
5. **BUG**: Campaign shows as paused with error status

---

## Root Cause Analysis

### Issue 1: Ellipses in Descriptions
**Root Cause**: The sanitization regex patterns may not be catching all ellipsis variations, or ellipses are being introduced after sanitization (e.g., during truncation or by Google Ads API).

**Potential Issues**:
- Ellipses may be added by `shortenDescriptionAtSentenceBoundary` function when truncating
- Google Ads API may be adding ellipses during ad rendering
- Sanitization may not run on all code paths

### Issue 2: Repeated Descriptions in Preview
**Root Cause**: The ad preview component (`AdGroupCard.tsx`) renders all descriptions without checking for duplicates. The deduplication logic exists in the backend but may not be applied to the preview data.

**Potential Issues**:
- Preview component doesn't filter duplicate descriptions
- Backend deduplication may not be working correctly
- Data structure may contain duplicates before rendering

### Issue 3: Policy Violation for Gas Safety Inspections
**Root Cause**: The ad group name or ad copy contains terms that trigger Google Ads policy violations. The `POLICY_COMPLIANT_TRANSFORMATIONS` may not be catching all variations of "Gas Safety Inspections" or "Gas Safety Certificates".

**Potential Issues**:
- Ad group name "Gas Safety Inspections London" may need transformation
- Ad copy may contain "certificate" terminology not caught by transformations
- Policy transformations may not be applied to ad group names

### Issue 4: City Abbreviation in Headline
**Root Cause**: The city abbreviation replacement logic in `validateAndFixHeadline` may not be running on all headlines, or abbreviations may be introduced after validation.

**Potential Issues**:
- Abbreviation replacement may not run on fallback headlines
- AI-generated headlines may contain abbreviations not in the `CITY_ABBREVIATIONS` map
- Replacement logic may have regex escaping issues

### Issue 5: Campaign Push Error
**Root Cause**: When ad creation fails for one ad group, the entire campaign push is marked as failed, even though other ads were created successfully.

**Potential Issues**:
- Error handling treats partial success as complete failure
- User sees error even though 2/3 ads were created successfully
- No retry mechanism for failed ads

---

## Recommended Fixes

### Fix 1: Enhanced Ellipses Removal
- Add more comprehensive ellipsis detection patterns
- Ensure sanitization runs after all text transformations
- Add post-processing check before sending to Google Ads API

### Fix 2: Preview Deduplication
- Add deduplication logic to `AdGroupCard.tsx` component
- Filter duplicate descriptions before rendering
- Ensure backend deduplication is working correctly

### Fix 3: Policy Compliance for Gas Safety
- Add "Gas Safety Inspections" to policy transformations
- Apply transformations to ad group names, not just ad copy
- Add pre-validation before ad creation

### Fix 4: City Abbreviation Fix
- Ensure all headlines go through `validateAndFixHeadline`
- Add abbreviation replacement to fallback headline generation
- Expand `CITY_ABBREVIATIONS` map if needed

### Fix 5: Partial Success Handling
- Update error handling to allow partial success
- Show success message with warnings for failed ads
- Provide retry mechanism for failed ad groups

---

## Related Files

- `convex/googleAdsCampaigns.ts` - Ad creation and sanitization logic
- `convex/campaigns.ts` - Campaign validation and policy compliance
- `app/components/campaign/AdGroupCard.tsx` - Ad preview component
- `app/components/campaign/CampaignPreviewCard.tsx` - Campaign preview component

---

## Additional Notes

- The ellipsis sanitization exists in multiple places but may not be comprehensive enough
- Policy transformations focus on "certificates" but "inspections" may also trigger violations
- City abbreviation logic exists but may not cover all cases
- Ad preview component needs client-side deduplication
- Error handling should distinguish between complete failure and partial success

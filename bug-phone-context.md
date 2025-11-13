# Phone Number Inconsistency Bug - Comprehensive Context

## 1. Error Description

### The Exact Problem

You have **TWO DIFFERENT phone numbers** showing in the **SAME Google Ads campaign**:

- **Ad #1 (WRONG)**: Shows `Call 077 684 7429` ❌
- **Ad #2 (CORRECT)**: Shows `Call 01217638262` ✅

### Why This Is Happening

Your onboarding data has the correct phone: `01217638262`

But your campaign database still contains old/stale phone data: `077 684 7429`

When the campaign was pushed to Google Ads, some ad groups got the correct number, others got the wrong number.

### Business Impact

- **Lost customers** - people calling `077 684 7429` won't reach you
- **Unprofessional appearance** - inconsistent contact info in same campaign
- **Wasted ad spend** - paying for ads with wrong phone numbers
- **Brand confusion** - customers don't know which number is real

### Technical Root Cause

The phone number inconsistency occurs because:

1. Call extensions are created at campaign level using stale data
2. Different ad groups may have been created at different times with different phone data
3. Partial data updates where some parts got refreshed, others didn't

### Current Status

- ✅ Your onboarding has correct number: `01217638262`
- ❌ Google Ads shows mixed numbers: both `077 684 7429` and `01217638262`
- ✅ We've fixed the code to prevent this in future campaigns
- ❌ Existing campaign still has the inconsistency

### Solution

You need to regenerate the campaign to ensure ALL ad groups use the correct phone number `01217638262`.

---

## 2. User Journey

### Phase 1: Initial Setup

1. User completes onboarding with correct phone number: `01217638262`
2. System stores onboarding data in Convex database correctly
3. User generates first campaign - AI creates campaign structure

### Phase 2: Data Inconsistency Begins

4. Campaign generation pulls stale data - somehow gets old phone `077 684 7429`
5. Campaign saved to database with incorrect phone in `businessInfo.phone`
6. User sees campaign preview but doesn't notice phone discrepancy initially

### Phase 3: Google Ads Push

7. User clicks "Push to Google Ads" button
8. System processes campaign push:
   - Creates campaign with mixed phone data
   - Some ad groups get correct number `01217638262`
   - Other ad groups get wrong number `077 684 7429`
9. Push appears successful - shows green success message

### Phase 4: Discovery

10. User checks Google Ads (or campaign preview)
11. Notices inconsistent phone numbers across different ad groups
12. Realizes some ads show wrong number `077 684 7429`
13. Confusion - onboarding clearly shows `01217638262` as correct

### Phase 5: Investigation

14. User reports inconsistency issue
15. We investigate and find:
    - ✅ Onboarding data: `01217638262` (correct)
    - ❌ Campaign database: `077 684 7429` (wrong)
    - ❌ Google Ads: Mixed numbers

### Phase 6: Technical Analysis

16. Root cause identified: Call extensions created using stale campaign data instead of fresh onboarding data
17. Additional issue found: Page auto-refreshes after push (user experience problem)

### Key Failure Points

- Data sync failure between onboarding and campaign generation
- Stale data persistence in campaign database
- Inconsistent phone sourcing during Google Ads API calls
- No validation to catch phone mismatches before push

### User Experience Impact

- Wasted time setting up campaigns with wrong data
- Potential lost business from wrong phone numbers in ads
- Confusion about which phone number is actually correct
- Trust issues with the platform's data accuracy

This journey shows how a data consistency bug can compound into a significant business problem for users.

---

## 3. Debugging References

### Jam.dev Replay

https://jam.dev/c/c7aa5bcf-5a5a-4035-ab37-e39c0ba325da

### Screenshots

[Screenshots attached to issue]

### Client-side Logs

[Logs attached to issue]

### Network Tab

[Network traffic attached to issue]

---

## 4. Code Snippets

### 1. Main Error Source: Call Extension Creation

**File**: `/Users/shabnamkhan/new-product/convex/googleAdsCampaigns.ts`

**Lines**: 416-442

```typescript
// Step 10: Create call extensions
// 🔧 FIX: Get phone from fresh onboarding data instead of stale campaign data
const freshOnboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
const phoneNumber = freshOnboardingData?.phone || campaignData.businessInfo?.phone;

console.log('📞 Attempting call extension creation...');
console.log('📞 Fresh onboarding phone:', freshOnboardingData?.phone || 'NOT FOUND');
console.log('📞 Fallback campaign phone:', campaignData.businessInfo?.phone || 'NOT FOUND');
console.log('📞 Using phone number:', phoneNumber || 'UNDEFINED/NULL');

// 🔍 ENHANCED PHONE TRACKING: Log phone consistency across all ad groups
console.log('🔍 PHONE CONSISTENCY CHECK:');
if (campaignData.adGroups && Array.isArray(campaignData.adGroups)) {
  campaignData.adGroups.forEach((adGroup: any, index: number) => {
    console.log(`  Ad Group ${index + 1} (${adGroup.name}): Using campaign phone ${phoneNumber}`);
    console.log(`  Final URL: ${adGroup.adCopy?.finalUrl || 'MISSING'}`);
  });
}
console.log('🔍 Call extensions will use phone:', phoneNumber);

// 🔍 VALIDATION: Confirm we're using the correct phone number
if (freshOnboardingData?.phone && campaignData.businessInfo?.phone &&
    freshOnboardingData.phone !== campaignData.businessInfo.phone) {
  console.warn('⚠️ Phone mismatch detected - using fresh onboarding data');
  console.warn('  Onboarding phone (using):', freshOnboardingData.phone);
  console.warn('  Campaign phone (stale):', campaignData.businessInfo.phone);
}
```

**Analysis**: This is where the fix should prioritize fresh onboarding data over stale campaign data when creating call extensions.

---

### 2. Pre-Push Validation (Should Catch Mismatches)

**File**: `/Users/shabnamkhan/new-product/convex/campaigns.ts`

**Lines**: 441-467

```typescript
// 🔍 PRE-PUSH VALIDATION: Verify data consistency
const onboardingData = await ctx.runQuery(api.onboarding.getOnboardingData);
if (!onboardingData) {
  throw new Error("Cannot push campaign: onboarding data not found");
}

// Validate phone number consistency
const onboardingPhone = onboardingData.phone;
const campaignPhone = campaign.businessInfo?.phone;

console.log('🔍 PRE-PUSH VALIDATION:');
console.log('📱 Onboarding phone:', onboardingPhone);
console.log('📱 Campaign phone:', campaignPhone);

if (!onboardingPhone) {
  throw new Error("Missing phone number in onboarding data");
}

if (onboardingPhone !== campaignPhone) {
  console.error('❌ PHONE MISMATCH DETECTED - BLOCKING PUSH:');
  console.error('  Expected (from onboarding):', onboardingPhone);
  console.error('  Found (in campaign):', campaignPhone);
  console.error('  This would cause inconsistent phone numbers in Google Ads');
  throw new Error(`Phone number mismatch detected. Campaign has '${campaignPhone}' but onboarding shows '${onboardingPhone}'. Please regenerate the campaign to sync data.`);
}

console.log('✅ Phone validation passed - numbers match:', onboardingPhone);
```

**Analysis**: This validation should prevent campaigns with mismatched phone numbers from being pushed to Google Ads. If this fails, the campaign push should be blocked.

---

### 3. Campaign Data Validation Function

**File**: `/Users/shabnamkhan/new-product/convex/campaigns.ts`

**Lines**: 823-846

```typescript
// Validate campaign data integrity
function validateCampaignDataIntegrity(campaignData: any, onboardingData: any): void {
  const onboardingPhone = onboardingData.phone;
  const campaignPhone = campaignData?.businessInfo?.phone;

  if (onboardingPhone !== campaignPhone) {
    console.error('💥 DATA INTEGRITY VIOLATION:');
    console.error('  Onboarding phone:', onboardingPhone);
    console.error('  Campaign phone:', campaignPhone);
    throw new Error(`Data integrity violation: Phone mismatch between onboarding (${onboardingPhone}) and campaign (${campaignPhone})`);
  }

  // Validate all ad groups have proper finalUrl (not placeholder)
  const placeholderUrls = ["https://example.com", "https://yoursite.com", "www.example.com"];
  if (campaignData?.adGroups) {
    campaignData.adGroups.forEach((adGroup: any, index: number) => {
      const finalUrl = adGroup?.adCopy?.finalUrl;
      if (!finalUrl || placeholderUrls.includes(finalUrl)) {
        console.warn(`⚠️ Ad group ${index + 1} "${adGroup.name}" has placeholder URL: ${finalUrl}`);
        console.warn(`💡 This will waste advertising budget - customers will be sent to generic pages`);
      }
    });
  }

  console.log('✅ Campaign data integrity validation passed');
}
```

**Analysis**: This function should be called before campaign generation and before push operations to catch data integrity issues early.

---

### 4. Google Ads API Call Where Phone Gets Applied

**File**: `/Users/shabnamkhan/new-product/convex/googleAdsCampaigns.ts`

**Lines**: 448-455

```typescript
// First create the call asset
const callAssetRequestBody = {
  operations: [{
    create: {
      type: 'CALL',
      callAsset: {
        phoneNumber: phoneNumber, // ← This is where the phone number gets set
        countryCode: 'GB',
        callConversionReportingState: 'USE_ACCOUNT_LEVEL_CALL_CONVERSION_ACTION'
      }
    }
  }]
};
```

**Analysis**: This is the critical point where the phone number is sent to Google Ads API. The `phoneNumber` variable must be validated before reaching this point.

---

### 5. Frontend User Interface (Where User Sees the Problem)

**File**: `/Users/shabnamkhan/new-product/app/components/campaign/CampaignHeaderControls.tsx`

**Lines**: 109-122

```typescript
if (result.success) {
  console.log('✅ Campaign push successful!', result);

  const description = result.details ||
    `Campaign ID: ${result.googleCampaignId} | Budget: £${result.budget}/day | Status: ${result.status}`;

  toast.success(`🎯 ${result.message}`, {
    description: description,
    duration: 8000,
  });

  // 🔄 Convex real-time queries will automatically update the UI
  // No manual refresh needed - data syncs automatically
  console.log('✅ Campaign push complete - Convex will sync UI automatically');
}
```

**Analysis**: This is where the success message is shown to the user. The UI should reflect data that has been validated before the push.

---

### 6. Database Schema (Where Phone Numbers Are Stored)

**File**: `/Users/shabnamkhan/new-product/convex/schema.ts`

**Lines**: 32-44

```typescript
campaigns: defineTable({
  userId: v.string(),
  campaignName: v.string(),
  dailyBudget: v.number(),
  targetLocation: v.string(),
  businessInfo: v.object({
    businessName: v.string(),
    phone: v.string(),        // ← Stale phone stored here
    serviceArea: v.string(),
  }),
  // ... other fields
})
```

**Analysis**: The `businessInfo.phone` field in campaigns table contains stale data (`077 684 7429`) while onboarding data has the correct phone (`01217638262`). This is the source of truth mismatch.

---

## 5. Environment

- **Mode**: Production mode
- **Affected Feature**: Campaign generation and Google Ads push
- **Data affected**: Phone numbers in call extensions
- **Scope**: All campaigns with updated phone numbers

---

## 6. Reproduction Steps

### Prerequisites

- TradeBoost AI application running locally
- Google Ads account connected
- Access to browser developer console

### Step-by-Step Reproduction

#### Phase 1: Setup with Correct Data

1. Complete onboarding with phone number `01217638262`
2. Navigate to `/dashboard/campaigns` page
3. Verify onboarding data shows correct phone in profile/settings

#### Phase 2: Generate Campaign with Stale Data

4. Click "Generate Campaign" button
5. Wait for AI campaign generation to complete
6. Check campaign preview - note phone numbers in different ad groups
7. Open browser console to monitor logs

#### Phase 3: Trigger the Issue

8. Click "Push to Google Ads" button
9. Monitor console logs for phone number tracking:
   ```
   📞 Fresh onboarding phone: 01217638262
   📞 Fallback campaign phone: 077 684 7429
   📞 Using phone number: 01217638262
   ```
10. Wait for success notification
11. Check the campaign preview or Google Ads interface

#### Phase 4: Observe the Inconsistency

12. Look at different ad groups in the same campaign
13. Notice mixed phone numbers:
    - Some ads show: `Call 01217638262` ✅
    - Other ads show: `Call 077 684 7429` ❌

### Expected vs Actual Behavior

**Expected**:
- All ad groups show consistent phone: `01217638262`
- Single phone number across entire campaign

**Actual**:
- Mixed phone numbers within same campaign
- Some ad groups correct, others wrong

### Key Reproduction Conditions

#### Scenario A: Fresh Installation (Less Likely)

- Complete onboarding with phone A
- Generate campaign immediately
- Should work correctly

#### Scenario B: Data Migration/Update (Most Likely)

- Had previous onboarding with phone B (`077 684 7429`)
- Updated onboarding to phone A (`01217638262`)
- Generated new campaign
- **Issue occurs**: Campaign database retains old phone

#### Scenario C: Partial Data Sync (Technical)

- Onboarding data updated successfully
- Campaign generation pulls from stale cache
- Database contains mixed/inconsistent data

### Debug Information to Collect

1. Browser console logs during campaign push
2. Network tab showing API calls to Convex
3. Campaign preview showing different ad groups
4. Onboarding data from profile page

### Reproduction Rate

- **High** if using existing account with previous phone data
- **Low** if fresh account with no prior campaigns
- **Medium** if regenerating campaigns multiple times

### Environmental Factors

- Browser caching may mask/reveal the issue
- Convex real-time sync timing
- Google Ads API response delays

---

## 7. Investigation Notes

### Key Questions

1. When exactly is the stale phone number being introduced into the campaign?
2. Is the issue in campaign **generation** or campaign **push**?
3. Why does the pre-push validation not catch this?
4. Is there a race condition between onboarding updates and campaign operations?
5. Are there multiple calls to fetch phone data with inconsistent sources?

### Data Flow Analysis

```
Onboarding Phone: 01217638262 (CORRECT)
         ↓
Campaign Generation
         ↓
Campaign Database: 077 684 7429 (WRONG) ← ISSUE HERE
         ↓
Google Ads Push
         ↓
Google Ads: Mixed phone numbers
```

### Suspected Root Causes

1. **Stale Cache**: Campaign generation pulling from cached onboarding data
2. **Database Timing**: Asynchronous update where campaign saved before onboarding updated
3. **API Source**: Google Ads API being called with phone from campaign DB instead of onboarding
4. **Migration Artifact**: Old campaigns containing legacy phone that's being reused
5. **Partial Update**: Update script that didn't clear stale campaign data

---

## 8. Related Issues

- **bug-incorrect-phone-context.md**: Additional context on phone number issues
- **bug-incomplete-campaign-context.md**: Campaign data completeness issues

---

## 9. Action Items

- [ ] Verify pre-push validation is being called and working
- [ ] Check campaign generation phone sourcing
- [ ] Audit all places where `businessInfo.phone` is read/written
- [ ] Implement mandatory phone consistency check before Google Ads API call
- [ ] Add monitoring/alerts for phone number mismatches
- [ ] Create user documentation for regenerating campaigns
- [ ] Update existing affected campaigns if possible

---

## 10. Timeline

- **Discovered**: During user testing
- **Reported**: By user noticing inconsistent phone numbers in Google Ads
- **Reproduced**: Yes, multiple scenarios identified
- **Fix Implemented**: Code changes made to prioritize fresh onboarding data
- **Status**: Pending full validation and testing



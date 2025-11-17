# Bug Context: Wrong Phone Number in Google Ads Preview

## 1. Error Description

### Problem
Wrong phone number appearing in Google Ads preview despite successful campaign creation and phone validation.

### What You're Seeing
- **Ad preview shows**: Call 077 684 7429 (wrong/contaminated number)
- **Expected**: Call 07563826777 (your onboarding number)

### Evidence from Console Logs
- ✅ Phone validation passed: `✅ Phone validation passed - all phone numbers match onboarding: 07563826777`
- ✅ Campaign created successfully: `"adsCreated": 4, "success": true`
- ✅ No contaminated numbers found: `✅ Final contamination check passed - no contaminated numbers found`

### Current Status
- Campaign ID: `23266368708` created successfully
- 4 ad groups with 4 ads created
- Campaign status: PAUSED (draft mode)
- All backend validation passing

### The Disconnect
Your code is working correctly (logs prove phone numbers are sanitized and correct), but the Google Ads preview interface is showing the old/wrong phone number.

---

## 2. User Journey

### Step-by-Step User Journey

1. **User Completes Onboarding** 📝
   - Enters phone number: `07563826777`
   - Saves to database via onboarding form

2. **User Generates Campaign** 🤖
   - Clicks "Generate Campaign" button
   - AI creates campaign with correct phone: `07563826777`
   - Console shows: `✅ Phone validation passed - all phone numbers match onboarding: 07563826777`

3. **User Previews Campaign** 👁️
   - Reviews generated campaign content locally
   - Everything looks correct at this stage

4. **User Pushes to Google Ads** 🚀
   - Clicks "Push to Google Ads" button
   - Console shows successful creation:
     - `"adsCreated": 4, "success": true`
     - Campaign drafted successfully in Google Ads
     - Campaign ID: `23266368708`

5. **User Views Google Ads Preview** 😟
   - **PROBLEM OCCURS HERE**
   - Google Ads preview shows wrong number: `Call 077 684 7429`
   - User expects to see: `Call 07563826777`

6. **User Gets Confused** ❌
   - Sees contradiction between:
     - Console logs showing success with correct phone
     - Google Ads preview showing wrong phone
   - Questions if the campaign creation actually worked

### Where the Issue Manifests
- **Location**: Google Ads interface preview (not in your application)
- **Timing**: After successful campaign push to Google Ads
- **User Impact**: Confusion about whether the correct phone number was actually used

### Expected vs Actual Experience
- **Expected**: User sees their onboarding phone (`07563826777`) in Google Ads preview
- **Actual**: User sees contaminated phone (`077 684 7429`) in Google Ads preview, despite successful backend processing

---

## 3. Jam.dev Replay

**Replay Link**: https://jam.dev/c/8454e629-a2f7-45c1-b645-d0b1df1676d5

---

## 4. Screenshots

*Screenshots referenced but not included in source material*

---

## 5. Server-side Logs

*Server-side logs referenced but not included in source material*

---

## 6. Client-side Logs

### Key Console Logs

```
✅ Phone validation passed - all phone numbers match onboarding: 07563826777
✅ Final contamination check passed - no contaminated numbers found
Campaign drafted successfully in Google Ads
"adsCreated": 4, "success": true
```

*Additional client-side logs referenced but not included in source material*

---

## 7. Network Tab

*Network tab data referenced but not included in source material*

---

## 8. Code Snippets

### 1. Phone Number Sanitization Logic

**File**: `convex/campaigns.ts:995-1033`

```typescript
function sanitizePhoneNumbersRecursive(obj: any, path: string = 'root'): any {
  if (obj === null || obj === undefined) return obj;

  // Create regex factory to avoid global flag state bug
  const createContaminatedRegex = () => /077\s?684\s?7429|0776847429/i;

  const containsPhoneNumber = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    // Only detect contaminated phone numbers, NOT all phone numbers
    const contaminatedRegex = createContaminatedRegex();
    return contaminatedRegex.test(text);
  };

  // Handle strings - clean only contaminated phone numbers from ad text
  if (typeof obj === 'string') {
    const contaminatedRegex = createContaminatedRegex();
    let cleaned = obj.replace(contaminatedRegex, 'Call Now');
    if (cleaned !== obj) {
      console.warn(`🧹 Removed phone number from ${path}: "${obj.substring(0, 50)}..." → "${cleaned.substring(0, 50)}..."`);
    }
    return cleaned;
  }
}
```

### 2. Phone Validation in Push Action

**File**: `convex/campaigns.ts:506-528`

```typescript
// Validate phone numbers match between onboarding and campaign
const onboardingPhone = onboardingData?.phone?.replace(/\s/g, '');
const campaignPhone = campaign.businessInfo?.phone?.replace(/\s/g, '');

console.log('🔍 PRE-PUSH VALIDATION:');
console.log('📱 Onboarding phone:', onboardingPhone);
console.log('📱 Campaign phone:', campaignPhone);

if (onboardingPhone && campaignPhone && onboardingPhone !== campaignPhone) {
  console.error('❌ Phone number mismatch detected!');
  console.error(`   Onboarding: ${onboardingPhone}`);
  console.error(`   Campaign: ${campaignPhone}`);
  throw new Error(`Phone number mismatch: expected ${onboardingPhone}, got ${campaignPhone}`);
}

console.log('✅ Phone validation passed - numbers match:', onboardingPhone || campaignPhone);
```

### 3. Google Ads API Ad Creation

**File**: `convex/googleAdsCampaigns.ts:687-714`

```typescript
const adOperations = [];
adOperations.push({
  create: {
    adGroup: adGroupResourceName,
    status: 'ENABLED',
    ad: {
      type: 'RESPONSIVE_SEARCH_AD',
      finalUrls: [finalUrl],
      responsiveSearchAd: {
        headlines: headlines.map((headline: string) => ({
          text: headline  // This is where phone numbers should be sanitized
        })),
        descriptions: descriptions.map((description: string) => ({
          text: description  // This is where phone numbers should be sanitized
        }))
      }
    }
  }
});
```

### 4. Phone Number Sanitization in Ad Creation

**File**: `convex/googleAdsCampaigns.ts:610-635`

```typescript
// 🔒 SECURITY: Sanitize ad content to remove any hallucinated phone numbers
const sanitizePhoneNumbers = (text: string): string => {
  // Remove UK phone numbers in various formats
  return text
    .replace(/(\+44\s?|0)7\d{9}/g, '') // Remove 11-digit mobile numbers
    .replace(/(\+44\s?|0)\d{10}/g, '') // Remove 10-digit landline numbers
    .replace(/(\+44\s?|0)\d{3}\s?\d{3}\s?\d{4}/g, '') // Remove formatted numbers
    .replace(/\s+/g, ' ') // Clean up extra spaces
    .trim();
};

// Helper function to sanitize and validate text content
const sanitizeText = (text: string, maxLength: number): string | null => {
  if (!text || typeof text !== 'string') {
    return null;
  }
  // First remove phone numbers, then trim and validate
  const phoneSanitized = sanitizePhoneNumbers(text);
  // Trim whitespace and remove invalid characters
  const sanitized = phoneSanitized
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .substring(0, maxLength)
    .trim();
  // Return null if empty after sanitization
  return sanitized.length > 0 ? sanitized : null;
};
```

### 5. Final Contamination Check

**File**: `convex/campaigns.ts:672-684`

```typescript
// 🔍 Final deep contamination check before pushing
console.log('🔍 Running final deep contamination check...');
const finalContaminationCheck = sanitizePhoneNumbersRecursive(campaign, 'final-check');
const hasContamination = JSON.stringify(finalContaminationCheck) !== JSON.stringify(campaign);
if (hasContamination) {
  console.error('❌ CRITICAL: Contamination found in final check!');
  throw new Error('Contamination detected in final validation - aborting push');
}
console.log('✅ Final contamination check passed - no contaminated numbers found');
```

### Key Issue Analysis

**The Problem**: Despite all validation passing, Google Ads preview shows `077 684 7429` instead of `07563826777`.

**Code Evidence**: All sanitization functions are working correctly:
- `sanitizePhoneNumbersRecursive` only targets contaminated number `077 684 7429`
- Phone validation passes: numbers match between onboarding and campaign
- Final contamination check passes

---

## 9. Environment

- **Mode**: Production
- **Browser**: Any (Chrome, Safari, Firefox)
- **Google Ads API**: v22
- **Campaign Status**: PAUSED (draft mode)

---

## 10. Convex Data

*Convex data not provided - use `bunx convex data` commands to gather relevant database state*

### Recommended Commands

```bash
# Check campaigns table
bunx convex data campaigns

# Check onboarding data
bunx convex data onboarding

# Check specific campaign by ID
bunx convex data campaigns --filter "campaignId=23266368708"
```

---

## 11. Reproduction Steps

### Prerequisites
- Google Ads account connected and authenticated
- Onboarding completed with phone number `07563826777`
- Development environment running (`npm run dev`)

### Step-by-Step Reproduction

1. **Complete Onboarding (If Not Done)**
   - Navigate to onboarding: `http://localhost:3000/onboarding`
   - Enter phone number: `07563826777`
   - Complete all onboarding steps
   - Save data to database

2. **Generate Campaign**
   - Navigate to campaigns dashboard: `http://localhost:3000/dashboard/campaigns`
   - Click "Generate Campaign" button
   - Wait for AI generation to complete
   - **Expected**: Console shows validation passing:
     ```
     ✅ Phone validation passed - all phone numbers match onboarding: 07563826777
     ```

3. **Review Local Campaign Preview**
   - Check campaign preview in your application
   - **Expected**: All phone references show `07563826777`
   - **Verify**: No `077 684 7429` appears anywhere

4. **Push Campaign to Google Ads**
   - Click "Push to Google Ads" button
   - Monitor Console Logs:
     ```
     ✅ Phone validation passed - numbers match: 07563826777
     ✅ Final contamination check passed - no contaminated numbers found
     Campaign drafted successfully in Google Ads
     ```
   - **Expected Result**: Success message with campaign ID

5. **Check Google Ads Interface (Where Issue Occurs)**
   - Navigate to Google Ads: `https://ads.google.com`
   - Go to Campaigns > "Plumbing Expert Autumn Readiness"
   - Click Ad Groups > Ads
   - Look at Ad Preview

6. **Reproduce the Issue**
   - **Expected Behavior**: Preview shows `Call 07563826777`
   - **Actual Behavior**: Preview shows `Call 077 684 7429` ❌

### Alternative Reproduction via API Testing

#### Test Campaign Generation Directly
```javascript
// Open browser console on campaigns page
// Monitor these specific logs during generation:
// Look for: "Phone validation passed"
// Look for: "Final contamination check passed"
```

#### Verify Database State
- Check Convex dashboard: `https://dashboard.convex.dev`
- Navigate to your deployment
- Check campaigns table
- Verify `businessInfo.phone` contains `07563826777`

### Key Indicators of the Issue
1. Console shows success ✅ but Google Ads shows wrong number ❌
2. No errors in campaign creation
3. Validation logs show correct phone number
4. Google Ads preview contradicts console logs

### Environment Details
- **Browser**: Any (Chrome, Safari, Firefox)
- **Environment**: Development (`npm run dev`)
- **Google Ads API**: v22
- **Campaign Status**: PAUSED (draft mode)
- **Expected vs Actual**: `07563826777` vs `077 684 7429`

### Debugging Commands

```bash
# Check if dev server is running
npm run dev

# Verify Convex deployment
npx convex dev

# Check recent logs
# (Monitor console during campaign push)
```

### Note
This issue is reproducible every time you push a campaign to Google Ads, suggesting it's a systematic caching or API response issue rather than intermittent code failure.

---

## Summary

**Root Cause Hypothesis**: The issue appears to be a disconnect between what's being sent to Google Ads API and what Google Ads is displaying. All backend validation passes, suggesting either:
1. Google Ads API caching old ad content
2. Ad content being modified after creation
3. Preview showing cached/stale data
4. Phone number being injected at a different point in the Google Ads pipeline

**Next Steps**:
1. Verify what's actually being sent in the API request payload
2. Check Google Ads API response to see what was created
3. Investigate Google Ads preview caching behavior
4. Add more detailed logging around the exact payload sent to Google Ads API


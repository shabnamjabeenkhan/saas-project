# Progress: Ad Quality Improvements & Campaign Management

## Current Status

Implementation ~100% complete - Testing in progress, blocker found: truncated words issue

## Completed

- ✅ Feature plan created (`feature-ad-quality-plan.md`)
- ✅ Architecture review completed - identified key files and current system structure
- ✅ **Phase 1: Campaign Generation (AI Prompt & Service Filtering)**
  - Created service-to-theme mapping function (`SERVICE_TO_THEME_MAP`, `groupServicesByTheme`)
  - Updated `buildCampaignPrompt` to enforce PRD requirements:
    - 12 headlines per ad group (was 3)
    - 30-char limit without truncation
    - Conditional ad group creation (only themes with matching services)
    - Service-specific keyword generation
  - Added post-processing validation:
    - `validateAndFixHeadline` - smart truncation (word removal/replacement before hard truncation)
    - `generateFallbackHeadlines` - ensures exactly 12 headlines
    - `validateAdGroupServices` - ensures keywords match serviceOfferings
  - Updated `validateAndEnhanceCampaignData` to enforce headline count and length
- ✅ **Phase 2: Regeneration Limits & Trial/Paid Gating**
  - Implemented `checkRegenerationLimits` with trial/paid logic:
    - Trial: 3 total generations (1 initial + 2 regenerations) within 3 days
    - Paid: 3 regenerations per calendar month
    - Cooldown: 1 minute between regenerations
  - Updated `updateRegenerationTracking` to handle monthly resets for paid users
  - **Phase 4.2 Step 3: Settings-based regeneration** ✅
    - Created `hasRelevantOnboardingChanges` helper to detect changes in:
      - tradeType, businessName, phone, websiteUrl, serviceArea, serviceOfferings, availability, acquisitionGoals
    - Created `updateOnboardingAndRegenerate` action that:
      - Saves onboarding data
      - Checks if relevant fields changed
      - Only triggers regeneration if changes detected AND user has completed onboarding
      - Handles regeneration errors gracefully
    - Updated onboarding flow to use new action when re-doing onboarding
  - **Phase 4.2 Step 4: Frontend gating** ✅
    - Fixed regeneration count display (3 instead of 10)
    - Added cooldown timer with countdown
    - Disabled button during cooldown
    - Added "Upgrade Plan" CTA for trial expired users
  - **Phase 4.2 Step 5: Trial expiry & subscription cancellation UI** ✅
    - Created `getSubscriptionState` query to detect trial expiry and cancellation
    - Implemented UI states for trial expired (view-only, disable actions)
    - Implemented UI states for cancelled subscription (active until period end)
    - Added warning cards and appropriate messaging
  - Files modified: `convex/campaigns.ts`, `convex/onboarding.ts`, `convex/subscriptions.ts`, `app/routes/onboarding.tsx`, `app/components/campaign/CampaignHeaderControls.tsx`, `app/routes/dashboard/settings.tsx`, `app/routes/dashboard/index.tsx`
- ✅ **Phase 3: Dashboard Simplification**
  - Removed complex metrics tiles (ad spend, revenue, ROI)
  - Replaced "Quick Summary" card with campaign status card:
    - Shows "No campaigns yet" + CTA button if no campaign
    - Shows "Active campaign" + "View Campaign" button if campaign exists
  - Files modified: `app/routes/dashboard/index.tsx`
- ✅ **Phase 5: Google Ads Push Flow (Safety)**
  - Added subscription/trial status check before push
  - Added validation for minimum headlines (3) and descriptions (2) per ad group
  - Added placeholder URL validation for production
  - Files modified: `convex/campaigns.ts`
- ✅ Build verification passed:
  - TypeScript compilation: ✅ (no errors in modified files)
  - React Router build: ✅
  - Convex compilation: ✅

## Current Work

- 🔄 **Post-Implementation Bug Fixing - Fix Truncated Words Issue**
  - ✅ Strengthened AI prompt in `buildCampaignPrompt` to enforce no truncated words
  - ⏭️ Next: Update code-level truncation functions (sanitizeAdText, validateAndFixHeadline)

## Remaining Tasks

### Phase 4.4 - Campaign Quality UI Enhancements
- ✅ **Step 1: Ensure CampaignQualityChecker receives optimization suggestions** ✅
  - Added `optimizationSuggestions` and `seasonalRecommendations` to `campaignSchema` validator
  - Added fields to Convex schema (`convex/schema.ts`)
  - Updated `validateAndEnhanceCampaignData` to preserve optimization suggestions from AI response
  - Updated `app/routes/dashboard/campaigns.tsx` to use real optimization suggestions from campaign data instead of hardcoded values
  - Files modified: `convex/campaigns.ts`, `convex/schema.ts`, `app/routes/dashboard/campaigns.tsx`

- ✅ **Step 2: Optionally show "Ad Strength" analogue** ✅
  - Added Ad Strength calculation based on:
    - Passed vs failed compliance checks (70% weight)
    - Presence of 12 diverse headlines per group (30% weight)
  - Displayed Ad Strength indicator in top-right header area (replaces previous score display)
  - Added `adGroups` prop to CampaignQualityChecker component
  - Updated campaigns.tsx to pass adGroups data
  - Files modified: `app/components/campaign/CampaignQualityChecker.tsx`, `app/routes/dashboard/campaigns.tsx`

### Section 5 - Testing Strategy
- ⏭️ **Manual testing** (in progress)
  - 5.1: Ad Quality & Generation (plumber/electrician scenarios) - ⚠️ Found issues: truncated words, Poor ad strength, missing keywords in headlines, descriptions need uniqueness, missing sitelinks, missing ad for Installation ad group
  - 5.2: Regeneration Limits & Cooldown (trial/paid flows)
  - 5.3: Dashboard Behavior (no campaign vs with campaign)
- ⏭️ **Debug missing Installation ad group**
  - Check Convex logs for Installation ad group during Google Ads push
  - Identify validation failures (headlines < 3, descriptions < 2, invalid URL)
  - Check for API errors or phone number detection blocking ad creation
  - Verify adGroup.adCopy data structure exists and is valid
- ✅ **Fix truncated words issue** (COMPLETED)
  - ✅ Updated AI prompt in `buildCampaignPrompt` to enforce ≤30 char headlines without truncated words
    - Added explicit examples of forbidden truncations ("Birm", "Londo", "Stoke-")
    - Added 5-step priority order for shortening headlines
    - Added verification checklist before outputting headlines
    - Strengthened JSON schema description to emphasize no truncated words
    - Added critical requirements section with city name examples
  - ✅ Updated `sanitizeAdText` to use word-boundary truncation
    - Created `truncateAtWordBoundary` helper function
    - Replaced `substring(0, maxLength)` with word-boundary-aware truncation
  - ✅ Removed redundant truncation in `createResponsiveSearchAd`
    - Removed `substring(0, 30)` and `substring(0, 90)` calls (headlines/descriptions already sanitized)
    - Updated logging to show text length instead of truncated previews
  - ✅ Improved `validateAndFixHeadline` fallback handling
    - Fixed edge case where single long word exceeds maxLength
    - Added warning log for edge cases
    - Improved word-boundary truncation logic
  - ⏭️ Test with long city names (Birmingham, Stoke-on-Trent) to verify fix
- ⏭️ **Fix Google Ads Ad Strength issues**
  - Increase headline count from 12 to 15 per ad group (Google Ads maximum)
  - Ensure headlines include popular keywords from ad group keyword list
  - Generate more unique/varied descriptions (currently may be too similar)
  - Add sitelink extensions to campaigns (currently missing)
  - Update AI prompt to generate 15 headlines instead of 12
  - Update validation to ensure 15 headlines per ad group

## Blockers

- ✅ **Truncated words in headlines** (FIXED)
  - **Issue:** Headlines are being truncated mid-word during Google Ads push (e.g., "Birmingham" → "Birm", "London" → "Londo")
  - **Impact:** Violates PRD requirement of 0% headlines with truncated words, causes "Poor" ad strength in Google Ads
  - **Root causes:**
    - AI prompt needed stronger instructions (✅ FIXED - strengthened prompt with explicit examples and verification steps)
    - `sanitizeAdText` function uses `substring(0, maxLength)` which can truncate mid-word (✅ FIXED - now uses word-boundary truncation)
    - `createResponsiveSearchAd` has redundant `substring(0, 30)` truncation (✅ FIXED - removed redundant truncation)
    - `validateAndFixHeadline` fallback can truncate mid-word in edge cases (✅ FIXED - improved word-boundary logic)
  - **Documented in:** `feature-ad-quality-plan.md` Section 6 (Risks & Mitigations)
  - **Status:** All fixes complete ✅ - Ready for testing

- ⚠️ **Google Ads Ad Strength: Poor** (Found during testing)
  - **Issue:** Google Ads shows "Poor" ad strength with multiple quality issues
  - **Google Ads suggestions:**
    - ✅ "Add more headlines" - Currently only 12 headlines (Google recommends 15)
    - ⚠️ "Include popular keywords in your headlines" - Headlines missing popular/keyword-rich terms
    - ✅ "Make your headlines more unique" - Addressed
    - ⚠️ "Make your descriptions more unique" - Descriptions lack variety/uniqueness
    - ⚠️ "Add more sitelinks" - Missing sitelink extensions
  - **Impact:** Poor ad strength reduces ad performance, lower quality scores, potentially higher costs
  - **Mitigation needed:**
    - Increase headline count from 12 to 15 per ad group (Google Ads maximum)
    - Ensure headlines include popular keywords from the ad group's keyword list
    - Generate more unique/varied descriptions
    - Add sitelink extensions to campaigns
  - **Status:** Needs fix to improve ad quality and meet Google Ads best practices

- ⚠️ **Missing ad for Installation ad group** (Found during testing)
  - **Issue:** Installation ad group was created in Google Ads but no ad was created for it
  - **Impact:** Ad group exists but cannot serve ads, effectively non-functional
  - **Possible root causes (needs debugging):**
    - Validation failure: Insufficient headlines (< 3) or descriptions (< 2) after sanitization
    - Invalid final URL format causing ad group to be skipped
    - Phone number detection blocking ad creation
    - Google Ads API error during ad creation (caught but logged)
    - Missing `adGroup.adCopy` data structure
  - **Where to check:** Convex function logs for Installation ad group:
    - Look for: `🎯 Creating ad group X/Y: Installation`
    - Check: `📋 Ad content validation for Installation` (headlines/descriptions counts)
    - Look for: `❌ Insufficient valid headlines` or `❌ Ad creation for Installation failed`
  - **Status:** Needs debugging to identify root cause, then fix

## Next Steps

1. **Debug missing Installation ad group** (see Blockers section)
   - Check Convex logs for Installation ad group validation/creation errors
   - Identify root cause (validation failure, API error, or data issue)
2. Fix truncated words blocker (see Blockers section)
3. Fix Google Ads Ad Strength issues (see Blockers section)
4. Continue manual testing per test matrix in plan (Section 5)
5. Re-test ad quality after fixes to verify improvements

## Key Decisions

- Using Composer 1 + RepoPrompt Context Builder (not Factory AI) - moderate complexity feature
- Manual testing first, automated tests later
- Extending existing Convex schema (`campaigns` and `subscriptions` tables) rather than creating new tables
- Service-to-theme mapping centralized in TypeScript code (`SERVICE_TO_THEME_MAP`)
- Headline validation: smart truncation (word removal/replacement) before hard truncation
- Trial logic: `regenerationCount` includes initial campaign, so check `>= 3` for trial limit
- Monthly reset: Based on 30-day period, not calendar month (simpler implementation)
- Settings regeneration: Only triggers when relevant fields change (not on every save)

## Files Changed

- `convex/campaigns.ts`:
  - Added service-to-theme mapping
  - Updated prompt generation
  - Added headline validation functions
  - Implemented regeneration limits with trial/paid gating
  - Added Google Ads push safety checks
- `convex/onboarding.ts`:
  - Added `hasRelevantOnboardingChanges` helper function
  - Added `updateOnboardingAndRegenerate` action with change detection
- `app/routes/onboarding.tsx`:
  - Updated final submission to use `updateOnboardingAndRegenerate` for re-do cases
  - Initial onboarding still uses direct `generateCampaign` call
- `app/routes/dashboard/index.tsx`:
  - Simplified dashboard UI
  - Replaced metrics with campaign status card
- `app/components/campaign/CampaignHeaderControls.tsx`:
  - Fixed regeneration count display (3 instead of 10)
  - Added cooldown timer with countdown
  - Disabled button during cooldown
  - Added "Upgrade Plan" CTA for trial expired users
- `app/routes/dashboard/settings.tsx`:
  - Added regeneration limits check
  - Disabled editing UI when regeneration not allowed
  - Added "Upgrade Plan" CTA for trial expired users
  - Added trial expiry and cancellation state handling
  - Shows warning cards for trial expired/cancelled states
- `app/routes/dashboard/index.tsx`:
  - Added subscription state check
  - Shows warning cards for trial expired/cancelled states
  - Disables "Create Campaign" button when trial expired/cancelled
- `convex/subscriptions.ts`:
  - Added `getSubscriptionState` query to detect trial expiry and cancellation
- **Phase 4.4 Step 1: Campaign Quality UI Enhancements** ✅
  - `convex/campaigns.ts`: Added `optimizationSuggestions` and `seasonalRecommendations` to `campaignSchema` validator; updated `validateAndEnhanceCampaignData` to preserve these fields
  - `convex/schema.ts`: Added `optimizationSuggestions` and `seasonalRecommendations` as optional fields to campaigns table
  - `app/routes/dashboard/campaigns.tsx`: Updated to use real optimization suggestions from campaign data instead of hardcoded values
- **Phase 4.4 Step 2: Ad Strength analogue** ✅
  - `app/components/campaign/CampaignQualityChecker.tsx`: Added Ad Strength calculation and display in header
  - `app/routes/dashboard/campaigns.tsx`: Added adGroups prop to CampaignQualityChecker
  - Ad Strength combines compliance score (70%) and headline completeness (30%)
  - Displays as percentage with color-coded badge (Excellent/Good/Fair/Poor)

## Context Management

- Last compacted at: Phase 4.4 Step 2 complete - All implementation tasks finished
- Current context usage: ~50%
- Remaining tasks: Manual testing only

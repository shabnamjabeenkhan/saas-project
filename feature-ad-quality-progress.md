# Progress: Ad Quality Improvements

## Current Status
Implementation complete - keyword-rich headline generation implemented

## Completed
- ✅ **Keyword-First Headline Strategy** in AI prompt:
  - Added detailed KEYWORD RULES section to `buildCampaignPrompt`
  - Mandates 4-6 of 15 headlines contain main service keyword
  - Requires at least 2 headlines with service + city together
  - Prioritizes search-style phrases over marketing slogans
  - Examples of good vs bad keyword headlines

- ✅ **Updated `generateFallbackHeadlines`**:
  - Extracts service type from ad group name for specific keywords
  - First 8 templates prioritize KEYWORD + LOCATION combinations
  - Added KEYWORD + URGENCY templates (24/7 Plumber, Emergency Plumber)
  - Added KEYWORD + TRUST templates (Gas Safe Plumber, Certified Plumber)

- ✅ **Updated `generateFallbackAdGroup`**:
  - Reordered headlines to prioritize keyword-rich phrases
  - Added more keyword + location headlines (4-5 instead of 3)
  - Added keyword + urgency headlines (24/7, Emergency, Same Day)
  - Keywords now include more popular search variations

- ✅ Centralized length constants in `convex/campaigns.ts`:
  - `MAX_HEADLINE_CHARS = 25`
  - `MAX_DESCRIPTION_CHARS = 80`
  - `TARGET_HEADLINES_PER_AD_GROUP = 15`
  - `MIN_DESCRIPTIONS_PER_AD_GROUP = 2`
  - `MAX_DESCRIPTIONS_PER_AD_GROUP = 4`
  - `REGENERATION_COOLDOWN_MS = 60000` (60 seconds)
  - `TRIAL_DURATION_MS` (3 days)
  - `MONTHLY_RESET_MS` (30 days)
  - `MAX_REGENERATIONS_PER_PERIOD = 3`

- ✅ Hardened `validateAndFixHeadline` function:
  - Added `CITY_ABBREVIATIONS` map for long city names (Birmingham → B'ham, etc.)
  - 5-strategy approach: remove filler words → replace long words → abbreviate cities → remove articles → word-boundary truncation
  - **Never truncates mid-word** (no more "Birm", "Londo")
  - Falls back to generic headline instead of truncating
  - Uses 25-char limit (stricter than Google's 30-char max for safety buffer)

- ✅ Updated `generateFallbackHeadlines`:
  - Uses abbreviated city names for long cities
  - Templates designed to stay under 25 chars
  - Includes trust indicators (Gas Safe, Part P)
  - Includes CTAs and value propositions

- ✅ Updated `validateAndEnhanceCampaignData`:
  - Uses centralized constants throughout
  - Filters empty headlines from failed validation
  - Double-validates headlines after processing
  - Ensures exactly 15 headlines per ad group

- ✅ Updated regeneration limits:
  - Uses centralized constants for cooldown, trial duration, monthly reset
  - Consistent messaging with actual limits

- ✅ Updated `CampaignQualityChecker.tsx`:
  - Added `TARGET_HEADLINES_PER_AD_GROUP` constant
  - Shows headline completion details (X/Y ad groups complete)
  - Added explanation text for Ad Strength calculation
  - Returns detailed breakdown (complianceScore, headlineScore, headlineDetails)

- ✅ Verified dashboard MVP (status-only display) - already implemented correctly

## Current Work
- ✅ Keyword-rich headline generation implemented

## Blockers
- ⚠️ None

## Recently Fixed (This Session)
- ✅ **Keyword-First Headline Strategy** - Updated AI prompt and fallback generators to prioritize popular search keywords
- ✅ **"B'ham Birmingham" duplication** - Added detection for duplicate city references in headlines
- ✅ **Only 2 ad groups in Google Ads** - Fixed DUPLICATE_ADGROUP_NAME error by checking for existing ad groups before creating

## Next Steps
- ⏭️ Manual testing with real campaign generation
- ⏭️ Verify headlines contain keyword phrases (e.g., "Plumber London", "24/7 Plumber")
- ⏭️ Test with long city names (Birmingham, Stoke-on-Trent)
- ⏭️ Verify 15 headlines per ad group with strong keyword coverage
- ⏭️ Check Ad Strength in Google Ads after push

## Key Decisions
- **Keyword-First Headlines**: Prioritize headlines that match what users actually search for (e.g., "Plumber London", "24/7 Plumber")
- **4-6 keyword headlines per ad group**: Ensures better Ad Relevance and Ad Strength in Google Ads
- **Service + City together**: At least 2 headlines must have both (e.g., "Boiler Repair Birmingham")
- **No mid-word truncation**: Instead of truncating "Birmingham" to "Birm", we use full words or omit city
- **Stricter limits**: Using 25/80 chars (vs Google's 30/90 max) as safety buffer for display variations
- **15 headlines per ad group**: RSA optimal for Google Ads performance
- **Weighted Ad Strength**: 70% compliance + 30% headline completeness (matches PRD)
- **Constants centralized**: All magic numbers moved to top of `campaigns.ts` for easy maintenance

## Files Changed
1. `convex/campaigns.ts` - Backend campaign generation and validation
2. `app/components/campaign/CampaignQualityChecker.tsx` - Ad Strength UI

## Context Management
- Last compacted at: Initial implementation
- Current context usage: ~30%

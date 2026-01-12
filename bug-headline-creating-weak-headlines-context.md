# Bug Context: Headlines Creating Weak/Truncated Headlines in Google Ads

**Date:** 2026-01-12  
**Severity:** High  
**Status:** Open  
**Environment:** Development & Production  

---

## 1. Error Description

### Summary
Headlines pushed to Google Ads are truncated, contain single words, fragments, or are stripped of meaning. This results in "Poor" Ad Strength ratings in Google Ads because:

1. **Headlines are truncated too aggressively** - The system uses a 25-character limit when Google Ads allows 30 characters
2. **Headlines are too similar to each other** - Not meaningfully different
3. **Popular keywords are missing** - Critical service terms (plumber, heating, boiler, electrician, gas safe) and city names (like "Plumber Birmingham" or "Heating Engineer Birmingham") are being removed
4. **Headlines don't match user search intent** - They sound like marketing slogans instead of search queries

### Expected Behavior
Each headline should be:
- Short, clear, search-style phrases (≤30 characters including spaces)
- Focused on ONE idea
- Meaningfully different from other headlines
- Include real service keywords (plumber, heating, boiler, electrician, gas safe)
- Several should combine service + city (e.g., "Plumber Birmingham")
- Cover different purposes: location, emergency speed, trust/credentials, value, action
- Sound natural and catchy, NOT marketing slogans
- Never full sentences
- Never cut off or abbreviated
- Always fit within 30 characters so words are fully visible

### Actual Behavior
- Headlines like "Plumber Birmingham - No - Plumber Birmingham - Gas" appear truncated and nonsensical
- Single words or fragments appear instead of complete phrases
- City names get removed entirely
- Service keywords get stripped
- Headlines become too similar ("Quality Service" repeated)
- Google Ads flags "Poor" Ad Strength with suggestions to:
  - Add more headlines
  - Include popular keywords in headlines
  - Make headlines more unique
  - Make descriptions more unique

---

## 2. User Journey

### Step 1: Sign Up / Login
- User arrives at the app
- Creates account or logs in via Clerk auth

### Step 2: Complete Onboarding (`/onboarding`)

| Step | Title | What User Does |
|------|-------|----------------|
| 1 | Trade Type | Select "Plumbing" or "Electrical" |
| 2 | Contact Info | Enter business name, phone, email |
| 3 | Service Area | Set target location/radius (e.g., Birmingham) |
| 4 | Services | Pick specific services offered (e.g., "Boiler Repair", "Rewiring") |
| 5 | Availability & Goals | Set daily budget, availability hours |
| 6 | Compliance | Verify certifications, accept terms |
| 7 | Summary | Review all info, click "Complete" |

**On completion:**
- `generateCampaign({})` is called automatically
- AI (GPT-4) generates campaign with ad groups, keywords, headlines, descriptions
- User redirects to `/dashboard/campaigns`

### Step 3: Review Generated Campaign (`/dashboard/campaigns`)
- User sees campaign overview:
  - Campaign name
  - Daily budget
  - Target location
  - Status (Draft)
- Tabs available:
  - Overview - Summary + next steps
  - Creatives - Ad groups with headlines, descriptions, keywords
  - Compliance - Verification status

### Step 4: Connect Google Ads Account
1. Click "Connect Google Ads" button in header
2. Redirected to Google OAuth consent screen
3. Grant adwords permission
4. Callback to `/auth.google-ads`
5. Tokens saved, redirected back to campaigns page
6. Button now shows "Connected ✓"

### Step 5: Push Campaign to Google Ads
1. Click "Push to Google Ads" button
2. System validates:
   - Phone number consistency
   - Google Ads connected
   - Campaign data complete
3. Campaign created in Google Ads:
   - Budget created
   - Campaign created (PAUSED)
   - Ad groups created
   - Keywords added
   - Responsive search ads created
   - Call extensions added
4. Success toast: "Campaign pushed successfully!"
5. Campaign status updates to show Google Campaign ID

### Step 6: Activate in Google Ads (Manual)
- User goes to Google Ads dashboard
- Reviews the PAUSED campaign
- Enables when ready to go live

### Step 7: Check Ad Strength (Where Bug Manifests)
- User goes to Google Ads → Ads & assets → Ads
- Sees "Poor" Ad Strength rating
- Google flags:
  - "Add more headlines"
  - "Include popular keywords in your headlines"
  - "Make your headlines more unique"
  - "Make your descriptions more unique"

---

## 3. Jam.dev Replay

**Link:** https://jam.dev/c/fb4b69ca-aee2-4914-a9d1-586529145789

---

## 4. Screenshots

### Screenshot 1: Ad Preview in Google Ads
Shows headline displaying as:
```
Plumber Birmingham - No - Plumber Birmingham - Gas
```
With description:
```
Certified plumbers with 10+ years experience. Fully insured. 
Boiler not working? Our Gas Safe engineers can help today.
```

### Screenshot 2: Google Ads Editor View
Shows:
- Ad strength: **Poor**
- Suggestions:
  - ○ Add more headlines
  - ○ Include popular keywords in your headlines
  - ○ Make your headlines more unique
  - ✓ Make your descriptions more unique (completed)
  - ○ Add more sitelinks
- Final URL: `https://tradeboostai.tech`
- Display path: `www.tradeboostai.tech/`
- Phone: `07564897550`

---

## 5. Code Snippets - Problem Areas

### Problem Area 1: `sanitizeAdText()` truncates to 25 chars (should be 30)

**File:** `convex/googleAdsCampaigns.ts` (lines 1181-1184)

```typescript
const rawHeadlines = adCopy.headlines?.slice(0, 15) || ['Your Business Name'];
const sanitizedHeadlines = rawHeadlines
  .map((h: string) => sanitizeAdText(h, 25))  // ⚠️ TRUNCATES TO 25 CHARS - SHOULD BE 30
  .filter((h: string | null): h is string => h !== null);
```

**The truncation function:** `convex/googleAdsCampaigns.ts` (lines 343-380)

```typescript
// Helper function to truncate at word boundary (prevents mid-word truncation)
function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  // If we found a space and it's not at the very beginning, truncate there
  if (lastSpaceIndex > 0) {
    return truncated.substring(0, lastSpaceIndex).trim();
  }
  
  // If no space found (single very long word), truncate at maxLength
  // This is edge case - ideally AI should avoid generating such headlines
  return truncated.trim();
}

// Helper function to sanitize and validate text content
function sanitizeAdText(text: string, maxLength: number): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }
  // First remove phone numbers, then trim and validate
  const phoneSanitized = sanitizePhoneNumbersFromText(text);
  // Trim whitespace and remove invalid characters
  const cleaned = phoneSanitized
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  
  // Truncate at word boundary to prevent mid-word truncation
  const sanitized = truncateAtWordBoundary(cleaned, maxLength).trim();
  
  // Return null if empty after sanitization
  return sanitized.length > 0 ? sanitized : null;
}
```

### Problem Area 2: Fallback headlines use `.substring()` which can truncate mid-word

**File:** `convex/googleAdsCampaigns.ts` (lines 1207-1212)

```typescript
const fallbackHeadlines = [
  `${adGroupName.substring(0, 20)} Expert`,      // ⚠️ Can create "Boiler Repai Expert"
  `Call Now - ${adGroupName.substring(0, 15)}`,  // ⚠️ Can create "Call Now - Boiler Repai"
  `${adGroupName.substring(0, 15)} Today`,       // ⚠️ Truncates mid-word
  `Best ${adGroupName.substring(0, 18)}`,        // ⚠️ Truncates mid-word
  `Local ${adGroupName.substring(0, 17)}`        // ⚠️ Truncates mid-word
].filter(h => h.length <= 30 && !usedHeadlinesInCampaign.has(h.toLowerCase().trim()));
```

### Problem Area 3: `validateAndFixHeadline()` aggressive word removal

**File:** `convex/campaigns.ts` (lines 1725-1744)

```typescript
// Strategy 1: Remove less important words (in order of importance to remove)
const lessImportantWords = ['professional', 'local', 'expert', 'trusted', 'qualified', 'certified', 'reliable', 'experienced'];
let shortened = cleaned;
for (const word of lessImportantWords) {
  const regex = new RegExp(`\\b${word}\\b`, 'gi');
  shortened = shortened.replace(regex, '').replace(/\s+/g, ' ').trim();
  if (shortened.length <= maxLength) {
    return shortened;
  }
}

// Strategy 2: Remove additional low-value words (no abbreviations allowed)
const additionalRemovableWords = ['installation', 'emergency', 'services', 'service', 'available', 'immediate', 'assistance'];
for (const word of additionalRemovableWords) {
  const regex = new RegExp(`\\b${word}\\b`, 'gi');
  shortened = shortened.replace(regex, '').replace(/\s+/g, ' ').trim();
  if (shortened.length <= maxLength) {
    return shortened;
  }
}
```

**Issue:** Removes meaningful words like "emergency", "service", "local" which are important keywords for Google Ads relevance.

### Problem Area 4: Word-boundary truncation as "last resort" with generic fallback

**File:** `convex/campaigns.ts` (lines 1761-1791)

```typescript
// Strategy 5: Truncate at full-word boundary (last resort)
// CRITICAL: Never truncate mid-word to avoid "Birm", "Londo", etc.
if (shortened.length > maxLength) {
  const words = shortened.split(' ');
  let result = '';
  for (const word of words) {
    const candidate = result ? result + ' ' + word : word;
    if (candidate.length <= maxLength) {
      result = candidate;
    } else {
      break;
    }
  }
  
  // If we have a result from word-boundary truncation, return it
  if (result && result.length > 0) {
    return result.trim();
  }
  
  // Edge case: single word exceeds maxLength
  // Instead of truncating mid-word (which creates "Birm", "Londo"), 
  // return a safe fallback - NO abbreviations allowed
  const firstWord = words[0] || '';
  if (firstWord.length > maxLength) {
    // Log warning and return a generic fallback instead of truncating mid-word
    console.warn(`⚠️ Headline word "${firstWord}" exceeds ${maxLength} chars - using fallback (truncation avoided)`);
    return 'Quality Service';  // ⚠️ Generic fallback loses all meaning
  }
```

**Issue:** Falls back to generic "Quality Service" which has no keywords and doesn't match search intent.

### Problem Area 5: MAX_HEADLINE_CHARS constant set to 25 instead of 30

**File:** `convex/campaigns.ts` (line 10)

```typescript
/** Maximum characters allowed for a Google Ads headline */
const MAX_HEADLINE_CHARS = 25;  // ⚠️ SHOULD BE 30 - Google Ads allows 30 characters
```

### Problem Area 6: AI Prompt instructs 25 chars but Google allows 30

**File:** `convex/campaigns.ts` (lines 1247-1251)

```typescript
⚠️ HARD LIMIT: Each headline MUST be ≤ 25 characters (NOT 30!)
- Count EVERY character including spaces and punctuation BEFORE outputting
- If a headline exceeds 25 characters, DO NOT OUTPUT IT - rewrite it shorter
- Headlines are SHORT PHRASES, not full sentences
- NEVER truncate words - if it doesn't fit, rewrite completely
```

---

## 6. Summary of Problem Areas

| Location | Line(s) | Issue |
|----------|---------|-------|
| `googleAdsCampaigns.ts` | 1183 | `sanitizeAdText(h, 25)` — 25 char limit too aggressive |
| `googleAdsCampaigns.ts` | 1207-1212 | `.substring()` truncates mid-word in fallbacks |
| `campaigns.ts` | 10 | `MAX_HEADLINE_CHARS = 25` — should be 30 |
| `campaigns.ts` | 1247-1251 | AI prompt says 25 chars, should say 30 |
| `campaigns.ts` | 1725-1744 | Removes meaningful words like "emergency", "service" |
| `campaigns.ts` | 1761-1791 | Falls back to generic "Quality Service" |

---

## 7. Environment

- **Development:** ✅ Bug reproduces
- **Production:** ✅ Bug reproduces
- **Node.js:** See `package.json`
- **Convex:** Latest
- **Google Ads API:** v22

---

## 8. Convex Data

To inspect relevant campaign data:

```bash
# Get deployment status
bunx convex status

# View campaigns table
bunx convex data campaigns

# View onboarding data
bunx convex data onboardingData
```

### Relevant Tables:
- `campaigns` - Contains generated campaign data with ad groups, headlines, descriptions
- `onboardingData` - Contains user's business info, service area, trade type

---

## 9. Reproduction Steps

### Step 1: Complete Onboarding (`/onboarding`)
1. Navigate to `/onboarding`
2. Complete the 7-step wizard:
   - Step 1: Select trade type (plumbing/electrical)
   - Step 2: Enter contact info (phone, email, business name)
   - Step 3: Set service area (e.g., Birmingham, 10 mile radius)
   - Step 4: Select services offered (e.g., Boiler Repair, Emergency Plumbing)
   - Step 5: Set availability & goals (budget, etc.)
   - Step 6: Compliance & verification
   - Step 7: Review summary
3. Click "Complete" → This triggers `generateCampaign({})` automatically
4. Redirects to `/dashboard/campaigns`

### Step 2: Connect Google Ads Account
1. On the campaigns page (`/dashboard/campaigns`), look at the header controls (`CampaignHeaderControls`)
2. Click "Connect Google Ads" button
3. OAuth flow redirects to Google → user grants adwords scope
4. Callback at `/auth.google-ads` exchanges code for tokens
5. Tokens saved via `api.googleAds.saveTokens`
6. Redirects back to `/dashboard/campaigns`

### Step 3: Push Campaign to Google Ads
1. On `/dashboard/campaigns`, with campaign generated and Google Ads connected
2. Click "Push to Google Ads" button in the header
3. This calls `pushToGoogleAds({ campaignId, pushOptions: { createAsDraft: true, testMode: false } })`
4. The action:
   - Validates phone number consistency (onboarding vs campaign)
   - Checks Google Ads tokens exist
   - Calls `googleAdsCampaigns.createGoogleAdsCampaign`
5. The campaign is created in Google Ads with:
   - Campaign (PAUSED status)
   - Ad groups
   - Keywords
   - Ads (responsive search ads)
   - Call extensions (phone number)

### Step 4: Verify Bug in Google Ads
1. Log into Google Ads dashboard
2. Navigate to Ads & assets → Ads
3. Find the newly created campaign
4. Check Ad Strength - should show "Poor"
5. Review headlines - will show truncated/weak headlines

---

## 10. Root Cause Analysis

### Primary Issues:

1. **Character limit mismatch:** Code enforces 25 characters but Google Ads allows 30 characters for headlines. This causes unnecessary truncation.

2. **Aggressive word removal:** The `validateAndFixHeadline()` function removes important keywords like "emergency", "service", "local" when trying to fit headlines into the 25-char limit.

3. **Poor fallback strategy:** When headlines can't fit, the system falls back to generic phrases like "Quality Service" instead of generating keyword-rich alternatives.

4. **Mid-word truncation in fallbacks:** The fallback headline generator uses `.substring()` which can cut words in the middle (e.g., "Boiler Repai Expert").

5. **AI prompt mismatch:** The AI is instructed to generate headlines ≤25 chars, but could generate better headlines at 30 chars.

### Data Flow:

```
User completes onboarding
    ↓
generateCampaign() called (convex/campaigns.ts)
    ↓
AI generates headlines (GPT-4 with 25-char instruction)
    ↓
parseAIResponse() processes headlines
    ↓
validateAndFixHeadline() truncates/modifies (MAX_HEADLINE_CHARS = 25)
    ↓
Campaign saved to database
    ↓
User clicks "Push to Google Ads"
    ↓
createGoogleAdsCampaign() (convex/googleAdsCampaigns.ts)
    ↓
sanitizeAdText(h, 25) further truncates ← BUG HERE
    ↓
createResponsiveSearchAd() sends to Google Ads
    ↓
Google Ads receives truncated/weak headlines
    ↓
Ad Strength = "Poor"
```

---

## 11. Proposed Fixes

### Fix 1: Update character limits to 30

```typescript
// convex/campaigns.ts line 10
const MAX_HEADLINE_CHARS = 30;  // Changed from 25

// convex/googleAdsCampaigns.ts line 1183
.map((h: string) => sanitizeAdText(h, 30))  // Changed from 25
```

### Fix 2: Update AI prompt to allow 30 characters

```typescript
// convex/campaigns.ts lines 1247-1251
⚠️ HARD LIMIT: Each headline MUST be ≤ 30 characters
- Count EVERY character including spaces and punctuation BEFORE outputting
- If a headline exceeds 30 characters, DO NOT OUTPUT IT - rewrite it shorter
```

### Fix 3: Preserve important keywords in `validateAndFixHeadline()`

Don't remove "emergency", "service", "local" - these are important for Ad Relevance.

### Fix 4: Fix fallback headlines to use word-boundary truncation

```typescript
// Instead of substring(), use a helper that respects word boundaries
const fallbackHeadlines = [
  truncateAtWordBoundary(`${adGroupName} Expert`, 30),
  truncateAtWordBoundary(`Call Now ${adGroupName}`, 30),
  // etc.
].filter(h => h.length > 0 && h.length <= 30);
```

### Fix 5: Generate keyword-rich fallbacks instead of generic ones

```typescript
// Instead of "Quality Service", generate:
return `${tradeTerm} ${city}`.substring(0, 30);  // e.g., "Plumber Birmingham"
```

---

## 12. Related Files

- `convex/campaigns.ts` - Campaign generation, AI prompt, headline validation
- `convex/googleAdsCampaigns.ts` - Push to Google Ads, sanitization, ad creation
- `app/routes/dashboard.campaigns.tsx` - Campaign dashboard UI
- `app/components/campaign/CampaignHeaderControls.tsx` - Push button UI

---

## 13. Testing Checklist

After fixes:
- [ ] Headlines are ≤30 characters (not 25)
- [ ] No mid-word truncation (no "Birm", "Plumb", "Emerg")
- [ ] Service keywords preserved (plumber, electrician, boiler, etc.)
- [ ] City names preserved when possible
- [ ] Headlines are meaningfully different from each other
- [ ] No generic fallbacks like "Quality Service"
- [ ] Ad Strength improves to "Average" or "Good" in Google Ads
- [ ] All 15 headlines per ad group are unique and keyword-rich

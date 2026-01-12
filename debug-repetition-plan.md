# Debug Plan: Repetition in Headlines & Descriptions

## Problem Analysis

### Observed Issues (from screenshot):
1. **Headline repetition**: "Plumber Local Leak Experts - Plumber Leak Fixers Birmingham"
   - Contains "Plumber" twice
   - Suggests similar headlines are being generated

2. **Description repetition**: "Professional plumber in Birmingham. Transparent pricing, no hidden fees. Professional plumber in Birmingham. Leak issues? Call for immediate repair."
   - Contains "Professional plumber in Birmingham" twice
   - Could be:
     a) AI generating single description with repetition
     b) Google Ads concatenating multiple descriptions
     c) Description validation not catching internal repetition

### Root Cause Analysis (Confidence Levels)

#### HIGH CONFIDENCE (90%+)
1. **AI prompt doesn't explicitly forbid repetition within descriptions**
   - Location: `convex/campaigns.ts` lines 1389-1424
   - Issue: Prompt says "UNIQUE and DIFFERENT" but doesn't explicitly forbid repeating phrases within the same description
   - Fix: Add explicit instruction: "NEVER repeat the same phrase within a single description"

2. **Deduplication only checks exact matches, not semantic similarity**
   - Location: `convex/googleAdsCampaigns.ts` lines 1175-1189
   - Issue: `deduplicateAssets()` only checks `normalized === normalized`, not similar phrases
   - Fix: Add similarity check for headlines/descriptions

3. **No validation for repetition within single description**
   - Location: `convex/googleAdsCampaigns.ts` lines 1338-1347
   - Issue: Descriptions are sanitized but not checked for internal repetition
   - Fix: Add function to detect repeated phrases within a description

#### MEDIUM CONFIDENCE (60-80%)
4. **AI may be generating concatenated descriptions**
   - Location: AI response parsing in `convex/campaigns.ts`
   - Issue: AI might output descriptions that are actually multiple sentences concatenated
   - Fix: Add post-processing to split descriptions at sentence boundaries and check for repetition

5. **Headline similarity not caught**
   - Location: `convex/googleAdsCampaigns.ts` lines 1254-1255
   - Issue: "Plumber Local Leak Experts" vs "Plumber Leak Fixers Birmingham" are similar but not exact duplicates
   - Fix: Add similarity scoring for headlines

#### LOW CONFIDENCE (30-50%)
6. **Google Ads concatenating descriptions in preview**
   - Location: Google Ads UI (not our code)
   - Issue: Google Ads might be showing multiple descriptions concatenated
   - Fix: Ensure we're sending separate description strings, not concatenated

## Implementation Plan

### Phase 1: Immediate Fixes (High Confidence Issues)

#### Fix 1: Update AI Prompt to Explicitly Forbid Repetition
**File**: `convex/campaigns.ts`  
**Location**: Lines 1389-1424  
**Confidence**: 95%  
**Impact**: High - Prevents AI from generating repetitive content

```typescript
// Add to description section:
🚨 CRITICAL: NEVER repeat the same phrase within a single description
- Each description must be completely unique
- Do NOT repeat phrases like "Professional plumber in Birmingham" multiple times
- If you find yourself repeating, rewrite the entire description differently
```

#### Fix 2: Add Internal Repetition Detection for Descriptions
**File**: `convex/googleAdsCampaigns.ts`  
**Location**: After line 1347 (after sanitization)  
**Confidence**: 90%  
**Impact**: High - Catches repetition before sending to Google Ads

```typescript
// Add function to detect repeated phrases within a description
function detectInternalRepetition(text: string): boolean {
  const sentences = text.split(/[.!?]\s+/).filter(s => s.length > 10);
  const phrases = new Set<string>();
  
  for (const sentence of sentences) {
    // Extract key phrases (3+ words)
    const words = sentence.toLowerCase().split(/\s+/);
    for (let i = 0; i <= words.length - 3; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      if (phrases.has(phrase)) {
        return true; // Found repetition
      }
      phrases.add(phrase);
    }
  }
  return false;
}
```

#### Fix 3: Enhance Deduplication with Similarity Check
**File**: `convex/googleAdsCampaigns.ts`  
**Location**: Replace `deduplicateAssets()` function  
**Confidence**: 85%  
**Impact**: Medium-High - Catches similar headlines/descriptions

```typescript
function deduplicateAssets(assets: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const asset of assets) {
    const normalized = asset.toLowerCase().trim();
    
    // Check for exact duplicate
    if (seen.has(normalized)) {
      continue;
    }
    
    // Check for similar assets (same key words)
    let isSimilar = false;
    const assetWords = normalized.split(/\s+/).filter(w => w.length > 3);
    for (const existing of seen) {
      const existingWords = existing.split(/\s+/).filter(w => w.length > 3);
      const commonWords = assetWords.filter(w => existingWords.includes(w));
      // If 70%+ words match, consider similar
      if (commonWords.length / Math.max(assetWords.length, existingWords.length) > 0.7) {
        isSimilar = true;
        break;
      }
    }
    
    if (!isSimilar) {
      seen.add(normalized);
      unique.push(asset);
    }
  }
  
  return unique;
}
```

### Phase 2: Validation Layer (Medium Confidence)

#### Fix 4: Add Validation in validateAndEnhanceCampaignData
**File**: `convex/campaigns.ts`  
**Location**: In `validateAndEnhanceCampaignData()` function  
**Confidence**: 75%  
**Impact**: Medium - Catches issues before saving to DB

```typescript
// Add after headline/description validation:
// Check for repetition within descriptions
for (const adGroup of validatedData.adGroups) {
  if (adGroup.adCopy?.descriptions) {
    adGroup.adCopy.descriptions = adGroup.adCopy.descriptions.map((desc: string) => {
      if (detectInternalRepetition(desc)) {
        console.warn(`⚠️ Description has internal repetition: "${desc}"`);
        // Split at sentence boundary and deduplicate
        return removeRepeatedPhrases(desc);
      }
      return desc;
    });
  }
}
```

### Phase 3: Post-Processing (Low Confidence, High Safety)

#### Fix 5: Add Post-Processing in createResponsiveSearchAd
**File**: `convex/googleAdsCampaigns.ts`  
**Location**: Before sending to Google Ads (around line 1440)  
**Confidence**: 60%  
**Impact**: Low-Medium - Safety net

```typescript
// Final check before sending to Google Ads
descriptions = descriptions.map((desc: string) => {
  // Split if it looks like multiple descriptions concatenated
  if (desc.includes('. ') && desc.split('. ').length > 2) {
    const sentences = desc.split(/\.\s+/);
    // Check if any sentence repeats
    const uniqueSentences = [...new Set(sentences)];
    if (uniqueSentences.length < sentences.length) {
      console.warn(`⚠️ Description contains repeated sentences, deduplicating`);
      return uniqueSentences.join('. ').trim();
    }
  }
  return desc;
});
```

## Testing Strategy

1. **Test Case 1**: Generate campaign with AI that might create repetition
   - Expected: Repetition detected and removed
   - Verify: Check logs for warnings

2. **Test Case 2**: Manually inject repetitive description
   - Expected: System detects and fixes
   - Verify: Description is cleaned before sending to Google Ads

3. **Test Case 3**: Similar headlines (e.g., "Plumber Birmingham" vs "Birmingham Plumber")
   - Expected: One is filtered out
   - Verify: Only one appears in final ad

## Google Ads Ad Strength Requirements

From research:
- **Good/Excellent Ad Strength requires**:
  - At least 3 headlines (we have 15 ✅)
  - At least 2 descriptions (we have 4 ✅)
  - Unique headlines and descriptions (NEEDS FIX)
  - Keywords in headlines (we have ✅)
  - No repetition (NEEDS FIX)

## Priority Order

1. **Fix 1** (AI Prompt) - Prevents generation of repetition
2. **Fix 2** (Internal Repetition Detection) - Catches issues before Google Ads
3. **Fix 3** (Similarity Check) - Catches similar headlines
4. **Fix 4** (Validation Layer) - Safety net before DB save
5. **Fix 5** (Post-Processing) - Final safety net

## Files to Modify

1. `convex/campaigns.ts` - AI prompt + validation
2. `convex/googleAdsCampaigns.ts` - Deduplication + post-processing

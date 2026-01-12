# Bug Context: Repeated Poor Quality Ads in Google Ads

## 1. Error Description

### Primary Issues

**Problem 1: Repetition in Descriptions**
- Descriptions contain repeated phrases within the same description
- Descriptions repeat similar themes across multiple descriptions
- Example: "Professional plumber in Birmingham. Transparent pricing. Professional plumber in Birmingham." (repeated phrase)
- Google Ads flags this as "Poor" Ad Strength because descriptions are too similar

**Problem 2: Poor Ad Strength**
- Google Ads marks ads as "Poor" Ad Strength
- Headlines are not truly unique - many are just word swaps
- Examples of non-unique headlines:
  - "Heating Repair Birmingham"
  - "Heating Fix Birmingham"
  - "Birmingham Heating Repair"
  - "Heating Service Birmingham"
- Google treats these as the same headline repeated, creating low variety and limited testing options

**Problem 3: Headlines Not Natural/Human-Sounding**
- Headlines sound mechanical and keyword-stuffed
- Examples of unnatural headlines:
  - "Plumber No Hidden Fees" (doesn't sound natural)
  - Headlines are constructed mechanically instead of written like real business messages
- High-quality ads should read like: "Book a Plumber – Checkatrade official site – Find a Plumber today"
- Current ads feel like keyword chains rather than natural customer-focused messages
- **Why Google Flags This:** The ads are being flagged as weak and showing poor Ad Strength because many of the headlines and descriptions do not sound natural or human, and instead read like keywords stitched together. Phrases such as "Plumber No Hidden Fees" or repeated structures like "Heating Repair Birmingham / Heating Fix Birmingham / Birmingham Heating Repair" lack normal grammar, flow, and variation, which makes the ads feel unnatural and low quality to both users and Google's system. Google expects headlines to read like real business messages that a person would actually say, using clear structure, natural wording, and different angles (service, urgency, trust, value, and action). When headlines are built as robotic fragments, repeat the same idea, or miss connecting words like "with," "for," or "in," Google reduces Ad Strength because it sees low relevance, low creativity, and poor user experience.

**Problem 4: Missing Popular Keywords**
- Headlines don't include popular search keywords naturally
- Headlines lose important keywords during validation/truncation
- Missing keywords like "emergency", "service", "local" reduce Ad Relevance

**Problem 5: Truncation Issues**
- Headlines are cut off mid-word (e.g., "Birm", "Londo", "Emergen", "Plumb")
- Important keywords are removed during validation
- Headlines become incomplete and lose relevance

### Root Cause Analysis

Google expects headlines to cover **different ideas and user intents**, not just word order variations:

1. **Core searches** (e.g., "Plumber Birmingham", "Emergency Plumber Birmingham", "Boiler Repair Birmingham")
2. **Urgency** ("Same Day Plumbing Service", "24 Hour Emergency Plumber")
3. **Trust** ("Gas Safe Registered Plumber", "Fully Insured Local Plumber")
4. **Value** ("Free Plumbing Quotes", "No Call Out Fees")
5. **Actions** ("Call a Plumber Today", "Book a Local Plumber")

When headlines represent different angles rather than small rewrites, Google sees stronger relevance, more combinations to test, and higher ad quality.

**Google's Quality Expectations:**
- Headlines must read like **real business messages** that a person would actually say
- Use **clear structure** and **natural wording** with proper grammar
- Include **connecting words** like "with," "for," or "in" to create natural flow
- Avoid **robotic fragments** that sound like keyword stuffing
- Ensure **variation** in structure, not just word order changes
- When ads lack these qualities, Google reduces Ad Strength because it sees:
  - Low relevance (keywords don't match natural search patterns)
  - Low creativity (repetitive, mechanical construction)
  - Poor user experience (unnatural, unprofessional appearance)

---

## 2. User Journey

Step-by-step what happened leading up to the error:

1. **Sign Up** → Clerk authentication
2. **Onboarding** → 7 steps, enter business info
3. **Campaign Auto-Generated** → AI creates ads automatically
4. **Review Campaign** → See headlines, descriptions, keywords
5. **Connect Google Ads** → OAuth flow, grant permissions
6. **Push Campaign** → Creates campaign in Google Ads (PAUSED)
7. **View in Google Ads** → Go to ads.google.com, see campaign, check Ad Strength

---

## 3. Jam.dev Replay

**URL:** https://jam.dev/c/ae0ea9cb-02ed-431a-93a9-2dc4ca35c382

**Key Observations from Screenshots:**
- Ad Strength shows as "Poor" in Google Ads interface
- Headlines like "Heating Repair Pro - Plumber Fast Response" appear
- Descriptions show repetition: "Professional plumber in Birmingham" appears multiple times
- Google Ads Advisor suggests: "Add more headlines", "Include popular keywords in your headlines", "Make your headlines more unique", "Make your descriptions more unique"

---

## 4. Screenshots

Visual representation of the error:

1. **Google Ads Interface** showing "Poor" Ad Strength
2. **Ad Preview** showing headlines like "24/7 Plumbing Service - Plumber Local Leak Detection"
3. **Search Results Preview** showing "Plumber Local Leak Detection - Emergency Water Repair"
4. **Ads Advisor** suggesting improvements for headline uniqueness and keyword inclusion

---

## 5. Code Snippets

### 5.1 Where Headlines Are Produced

#### AI Prompt Generation (`convex/campaigns.ts` Lines 1245-1386)

```1245:1386:convex/campaigns.ts
2. Generate exactly **15 headlines** per ad group (RSA optimal for Google Ads):
   
   🎯 PRIMARY GOAL: Create natural, human-sounding ads that match real high-performing Google ads
   
   Your writing style must match real high-performing Google ads, for example:
   - "Book a Plumber – Checkatrade official site – Find a Plumber today"
   - "From emergencies to new fittings, find a checked and reviewed plumber…"
   
   These ads are:
   - Clear
   - Natural
   - Search-intent focused
   - Not robotic
   - Not repetitive
   - Not stitched together
   
   🚨🚨🚨 CRITICAL: STANDALONE HEADLINE RULE 🚨🚨🚨
   
   **HOW GOOGLE ADS WORKS:**
   Google automatically JOINS your headlines together with " - " separators in the live ad.
   Example: Your headlines "Plumber Birmingham" + "24 Hour Plumber" + "Gas Safe Registered"
   Become: "Plumber Birmingham - 24 Hour Plumber - Gas Safe Registered"
   
   **THEREFORE: Each headline MUST be ONE simple, standalone phrase.**
   - NO dashes (-) or separators in headlines - Google adds them automatically
   - NO chaining multiple ideas in one headline
   - Each headline must work on its own AND when joined with others
   - Each headline must be a complete, natural phrase
   - Every headline must be meaningfully different
   
   ⚠️ HARD LIMIT: Each headline MUST be ≤ 30 characters
   - Count EVERY character including spaces BEFORE outputting
   - If > 30 characters, DO NOT OUTPUT IT - rewrite shorter
   - NEVER truncate words - if it doesn't fit, rewrite completely
   - NEVER abbreviate words or city names
   
   🚨 KEYWORD & INTENT RULES 🚨
   
   You will receive:
   - Service: ${serviceOfferings.join(', ')}
   - City: ${city}
   - Keyword list: (plumber, electrician, boiler, heating, emergency, 24 hour, near me, gas safe, part p)
   
   You MUST:
   - Include popular search keywords naturally
   - Ensure at least:
     * 4 headlines = service + city (e.g., "Plumber Birmingham", "Boiler Repair Birmingham")
     * 3 headlines = high-intent (emergency, same day, near me, 24 hour)
     * 3 headlines = trust/credibility (Gas Safe, Part P, Certified)
     * 2 headlines = price/value (Free Quotes, No Call Out Fee)
     * 2 headlines = action (Call Now, Book Today)
   - Headlines must look like real searches, not slogans
   
   ✅ GOOD EXAMPLES (natural, search-intent focused):
   - "Plumber Birmingham" (matches search: "plumber birmingham")
   - "Emergency Plumber Birmingham" (matches search: "emergency plumber birmingham")
   - "Same Day Boiler Repair" (matches search: "same day boiler repair")
   - "Gas Safe Plumber" (matches search: "gas safe plumber")
   - "24 Hour Electrician" (matches search: "24 hour electrician")
   - "Boiler Repair Near Me" (matches search: "boiler repair near me")
   
   ❌ BAD EXAMPLES (robotic, marketing slogans):
   - "Best Ultimate Plumbing Solutions" (too generic, no keyword, sounds like marketing)
   - "Birmingham Plumber – Fast – Cheap – Call" (contains dashes, chained ideas)
   - "Plumber Birmingham – No – Hidden – Fees" (contains dashes, chained ideas)
   - "Professional Service" (no keyword, generic)
   - "Quality Guaranteed" (no keyword, marketing jargon)
   
   **EXACT HEADLINE DISTRIBUTION (15 total):**
   
   a) **SERVICE + CITY** (EXACTLY 4 headlines with city name):
      ✅ "Plumber ${city}" (e.g., "Plumber Birmingham")
      ✅ "Boiler Repair ${city}" (e.g., "Boiler Repair Birmingham")
      ✅ "Emergency Plumber ${city}" (e.g., "Emergency Plumber Birmingham")
      ✅ "Heating Engineer ${city}" (e.g., "Heating Engineer Birmingham")
      🚨 Use city name naturally - these are the most important headlines for local SEO
      🚨 Create 4 different service+city combinations based on the services offered
   
   b) **HIGH-INTENT** (EXACTLY 3 headlines - emergency, urgency, near me):
      ✅ "Emergency Plumber" (or "Emergency Electrician", "Emergency Boiler Repair")
      ✅ "Same Day Plumber" (or "Same Day Electrician", "Same Day Boiler Repair")
      ✅ "24 Hour Plumber" (or "24 Hour Electrician", "24 Hour Heating Engineer")
      ✅ "Plumber Near Me" (or "Electrician Near Me", "Boiler Repair Near Me")
      ✅ "Urgent Plumber" (or "Urgent Electrician")
      🚨 These match high commercial intent searches
   
   c) **TRUST/CREDIBILITY** (EXACTLY 3 headlines):
      ✅ "Gas Safe Plumber" (for plumbing/gas services)
      ✅ "Gas Safe Registered" (for gas/heating services)
      ✅ "Part P Electrician" (for electrical services)
      ✅ "Certified Plumber" (or "Certified Electrician")
      ✅ "Fully Insured Plumber" (if fits in 30 chars)
      🚨 These match credential searches - critical for trust
   
   d) **PRICE/VALUE** (EXACTLY 2 headlines):
      ✅ "Free Quotes"
      ✅ "No Call Out Fee"
      ✅ "Free Estimates"
      ✅ "Transparent Pricing" (if fits in 30 chars)
      🚨 These match value-focused searches
   
   e) **ACTION** (EXACTLY 2 headlines):
      ✅ "Call Now"
      ✅ "Book Today"
      ✅ "Get Help Fast" (if fits in 30 chars)
      ✅ "Contact Us Today" (if fits in 30 chars)
      🚨 These are clear calls-to-action
   
   ❌ FORBIDDEN HEADLINE PATTERNS:
     - Headlines with dashes (-) inside them - Google adds separators automatically
     - Truncated words (❌ "Birm", "Londo", "Emergen", "Plumb")
     - Abbreviated city names (❌ "B'ham" → ✅ "Birmingham" or omit)
     - Generic marketing slogans (❌ "Professional Service", "Quality Guaranteed")
     - Chained phrases (❌ "Plumber - Fast - Cheap")
     - Headlines ending with incomplete words (❌ "Plumber Birm", "Boiler Repai")
   
   🚨 CRITICAL RULES:
     a) NO DASHES or separators - Google adds " - " between headlines automatically
     b) ONE idea per headline - simple, natural phrases that sound like search queries
     c) Each headline UNIQUE and meaningfully different
     d) NO city abbreviations (❌ "B'ham" → ✅ "Birmingham" or omit)
     e) NO truncated words (❌ "Birm", "Emerg", "Plumb")
     f) EXACTLY 4 headlines with city name (service + city combinations)
     g) Headlines must sound NATURAL - like what a real person would search for, not marketing copy
     h) If too long → rewrite shorter, do NOT cut
   
   ✅ QUALITY CONTROL (MANDATORY):
   
   Before outputting EACH headline:
     1. Check character count - must be ≤ 30 (count spaces and punctuation)
     2. Confirm no broken phrases - all words complete
     3. Confirm no repeated sentences - each headline unique
     4. Confirm headlines sound natural when joined - read them together with " - "
     5. Confirm wording sounds like a real company wrote it - not keyword spam
     6. Does it contain a real search KEYWORD? (plumber, drain, boiler, electrician, heating, rewiring)
     7. Does it contain ANY dashes? If yes, REWRITE without dashes
     8. Is it ONE simple phrase (not chained ideas)?
     9. Does it sound like something a customer would ACTUALLY TYPE into Google?
     10. Read it aloud - does it sound natural and conversational, or like marketing jargon?
     11. Is this headline meaningfully different from all other headlines? (not just word order changed)
     12. Have I used the same key words in multiple headlines? (e.g., "Plumber" + "Birmingham" should not appear in 4+ headlines)
```

#### Headline Validation & Processing (`convex/campaigns.ts` Lines 2501-2541)

```2501:2541:convex/campaigns.ts
      // 🚨 POLICY COMPLIANCE: Sanitize all headlines to avoid policy violations
      let headlines = (adGroup.adCopy?.headlines || [])
        .map((h: string) => sanitizeForGoogleAdsPolicy(h)) // Apply policy transformations first
        .map((h: string) => validateAndFixHeadline(h, MAX_HEADLINE_CHARS))
        .filter((h: string) => h.length > 0); // Remove empty headlines from failed validation
      
      // 🚨 CRITICAL: Deduplicate headlines containing city name - keep only ONE
      // Google combines headlines with " - ", so multiple city headlines look bad:
      // "Plumber Birmingham - Birmingham Plumber - Local Plumber Birmingham" = BAD
      const cityLower = city.toLowerCase();
      let cityHeadlineKept = false;
      headlines = headlines.filter((h: string) => {
        const hasCityName = h.toLowerCase().includes(cityLower);
        if (hasCityName) {
          if (cityHeadlineKept) {
            console.warn(`⚠️ Removing duplicate city headline: "${h}" (already have one with ${city})`);
            return false; // Remove duplicate city headline
          }
          cityHeadlineKept = true;
        }
        return true;
      });
      
      // Ensure exactly TARGET_HEADLINES_PER_AD_GROUP headlines
      if (headlines.length < TARGET_HEADLINES_PER_AD_GROUP) {
        console.warn(`⚠️ Ad group "${adGroup.name}" has only ${headlines.length} headlines, generating ${TARGET_HEADLINES_PER_AD_GROUP - headlines.length} fallback headlines`);
        const fallbacks = generateFallbackHeadlines(adGroup.name, tradeType, city, headlines, TARGET_HEADLINES_PER_AD_GROUP);
        headlines.push(...fallbacks);
      } else if (headlines.length > TARGET_HEADLINES_PER_AD_GROUP) {
        console.warn(`⚠️ Ad group "${adGroup.name}" has ${headlines.length} headlines, truncating to ${TARGET_HEADLINES_PER_AD_GROUP}`);
        headlines.splice(TARGET_HEADLINES_PER_AD_GROUP);
      }

      // Final validation: ensure all headlines are valid length and no truncated words
      const validatedHeadlines = headlines.map((h: string) => {
        if (h.length > MAX_HEADLINE_CHARS) {
          console.warn(`⚠️ Headline "${h}" still exceeds ${MAX_HEADLINE_CHARS} chars after processing, re-validating`);
          return validateAndFixHeadline(h, MAX_HEADLINE_CHARS);
        }
        return h;
      }).filter((h: string) => h.length > 0);
```

### 5.2 Why Descriptions Have Repetition

#### Problem: AI May Generate Repetitive Descriptions (`convex/campaigns.ts` Lines 1387-1430)

```1387:1430:convex/campaigns.ts
3. Generate exactly **4 descriptions** per ad group (RSA optimal):
   
   ⚠️ HARD LIMIT: Each description MUST be ≤ 80 characters
   - Descriptions ARE full sentences - write naturally
   - Each sentence must be COMPLETE and make sense when read alone
   - NEVER truncate - if it doesn't fit in 80 chars, rewrite the whole sentence
   
   🚨 CRITICAL: Each description MUST be UNIQUE and DIFFERENT 🚨
   - Google flags "Poor" Ad Strength if descriptions are too similar
   - Each description serves a DIFFERENT purpose - do not repeat themes
   - Use different sentence structures, different keywords, different angles
   - 🚨 NEVER repeat the same phrase within a single description
   - 🚨 NEVER repeat phrases across multiple descriptions (e.g., "Professional plumber in Birmingham" should appear at most once)
   
   The 4 descriptions MUST cover these DISTINCT roles (one each):
     a) **Problem + solution**: Address the customer's pain point directly
        ✅ "Blocked drain causing problems? We're here to unblock it quickly."
        ✅ "Boiler stopped working? Our Gas Safe experts are ready to help."
     
     b) **Trust / credentials**: Highlight experience and qualifications
        ✅ "Experienced in all heating systems. Quality service guaranteed."
        ✅ "Over 10 years experience in boiler repairs. Fully insured."
     
     c) **Value / pricing**: Emphasize transparency and value
        ✅ "Get your heating fixed today. Contact us for swift service."
        ✅ "Trusted by ${city} homes for all drainage solutions."
     
     d) **Action / urgency**: Clear call-to-action
        ✅ "Call today for fast, reliable service. Same day available."
        ✅ "Book now for emergency repairs. We respond within the hour."
   
   ❌ BAD DESCRIPTIONS (too similar, repetitive):
     - "Quality service guaranteed." + "Guaranteed quality work." (SAME THEME!)
     - "Professional plumber Birmingham." + "Birmingham professional plumbing." (SAME!)
     - "Professional plumber in Birmingham. Transparent pricing. Professional plumber in Birmingham." (REPEATED PHRASE!)
     - "We offer professional plumbing services in Birmingham with Gas Safe registered eng..." (cut off!)
   
   Before outputting EACH description:
     1. Is it DIFFERENT from the other 3 descriptions?
     2. Does it serve a UNIQUE role (problem/trust/value/action)?
     3. Count characters - must be ≤ 80
     4. Does it sound natural when read aloud?
     5. Have I repeated any phrase from this description in another description?
     6. Have I repeated any phrase WITHIN this description? (CRITICAL - check for duplicate sentences or phrases)
```

#### Problem: Fallback Descriptions Can Repeat (`convex/campaigns.ts` Lines 2197-2254)

```2197:2254:convex/campaigns.ts
function generateFallbackDescriptions(
  adGroupName: string,
  tradeType: string,
  city: string,
  existingDescriptions: string[],
  targetCount: number = MAX_DESCRIPTIONS_PER_AD_GROUP
): string[] {
  const fallbacks: string[] = [];
  const tradeTerm = tradeType === 'plumbing' || tradeType === 'both' ? 'plumbing' : 'electrical';
  const credential = tradeType === 'plumbing' || tradeType === 'both' ? 'Gas Safe registered' : 'Part P certified';
  
  // Templates for 4 descriptions covering different roles
  const templates = [
    // Problem + Solution
    `Need ${tradeTerm} help? Our expert team solves problems fast. Same day service available.`,
    `${tradeTerm.charAt(0).toUpperCase() + tradeTerm.slice(1)} issue? We fix it right the first time. Fast, reliable service.`,
    
    // Trust / Experience
    `Professional ${tradeTerm} services in ${city}. ${credential.charAt(0).toUpperCase() + credential.slice(1)}. Fully insured.`,
    `Trusted ${tradeTerm} experts with years of experience. Quality work guaranteed.`,
    `${credential.charAt(0).toUpperCase() + credential.slice(1)} engineers. Reliable service you can count on.`,
    
    // Value / Pricing
    `Transparent pricing with no hidden fees. Free quotes on all ${tradeTerm} work.`,
    `Affordable ${tradeTerm} services. No call out charge. Upfront honest pricing.`,
    `Free estimates on all work. No obligation quotes. Fair competitive rates.`,
    
    // Action / Next Step
    `Call today for immediate assistance. Fast response times across ${city}.`,
    `Book online or call now. Our friendly team is ready to help you today.`,
    `Get in touch for a free quote. Available 7 days a week for your convenience.`,
  ];

  // Filter out templates that match existing descriptions too closely
  const existingLower = existingDescriptions.map(d => d.toLowerCase());
  for (const template of templates) {
    // 🚨 CRITICAL: Use sentence-boundary shortening instead of substring()
    // This ensures descriptions are never cut mid-word or mid-sentence
    const candidate = shortenDescriptionAtSentenceBoundary(template, MAX_DESCRIPTION_CHARS);
    const candidateLower = candidate.toLowerCase();
    
    // Skip if too similar to existing description (use first 20 chars for comparison only)
    const comparePrefix = candidateLower.length >= 20 ? candidateLower.slice(0, 20) : candidateLower;
    const isSimilar = existingLower.some(existing => {
      const existingPrefix = existing.length >= 20 ? existing.slice(0, 20) : existing;
      return existing.includes(comparePrefix) || candidateLower.includes(existingPrefix);
    });
    
    if (!isSimilar && candidate.length > 0 && candidate.length <= MAX_DESCRIPTION_CHARS) {
      fallbacks.push(candidate);
      if (fallbacks.length >= targetCount - existingDescriptions.length) {
        break;
      }
    }
  }

  return fallbacks;
}
```

**Issue:** Template `"Professional ${tradeTerm} services in ${city}..."` can repeat "Professional plumber in Birmingham" if the AI already generated it.

#### Problem: No Check for Internal Repetition Before Our Fix (`convex/campaigns.ts` Lines 2543-2565)

```2543:2565:convex/campaigns.ts
      // 🚨 POLICY COMPLIANCE: Sanitize descriptions to avoid policy violations
      let descriptions = adGroup.adCopy?.descriptions || [];
      descriptions = descriptions
        .map((d: string) => {
          const sanitized = sanitizeForGoogleAdsPolicy(d); // Apply policy transformations
          // 🚨 CRITICAL: Check for internal repetition within the description
          if (sanitized && detectInternalRepetition(sanitized)) {
            console.warn(`⚠️ Description has internal repetition, cleaning: "${sanitized}"`);
            return removeRepeatedPhrases(sanitized);
          }
          return sanitized;
        })
        .filter((d: string) => d && d.length <= MAX_DESCRIPTION_CHARS);
      
      // Generate fallback descriptions to reach exactly 4 (RSA optimal)
      if (descriptions.length < MAX_DESCRIPTIONS_PER_AD_GROUP) {
        console.warn(`⚠️ Ad group "${adGroup.name}" has only ${descriptions.length} descriptions, generating fallbacks to reach ${MAX_DESCRIPTIONS_PER_AD_GROUP}`);
        const fallbackDescriptions = generateFallbackDescriptions(adGroup.name, tradeType, city, descriptions, MAX_DESCRIPTIONS_PER_AD_GROUP);
        descriptions.push(...fallbackDescriptions);
      }
      if (descriptions.length > MAX_DESCRIPTIONS_PER_AD_GROUP) {
        descriptions.splice(MAX_DESCRIPTIONS_PER_AD_GROUP);
      }
```

### 5.3 Where Headlines Lose Popular Keywords

#### Problem: `validateAndFixHeadline` Removes Important Words (`convex/campaigns.ts` Lines 1967-1990)

```1967:1990:convex/campaigns.ts
  // Strategy 1: Remove only truly low-value words (preserve important keywords for Ad Relevance)
  // 🚨 IMPORTANT: Do NOT remove service keywords like "emergency", "service", "local" - these are critical for Google Ads relevance
  // 🚨 CRITICAL: Do NOT remove natural words like "now", "today", "fast" - these make headlines sound natural and search-like
  const lowValueWords = ['professional', 'expert', 'trusted', 'qualified', 'reliable', 'experienced', 'best', 'top'];
  let shortened = cleaned;
  for (const word of lowValueWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    shortened = shortened.replace(regex, '').replace(/\s+/g, ' ').trim();
    if (shortened.length <= maxLength) {
      return shortened;
    }
  }

  // Strategy 2: Remove only truly unnecessary filler words
  // 🚨 PRESERVE natural words: "now", "today", "fast" make headlines sound like real searches
  // Only remove words that don't add search intent or naturalness
  const fillerWords = ['available', 'immediate', 'assistance'];
  for (const word of fillerWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    shortened = shortened.replace(regex, '').replace(/\s+/g, ' ').trim();
    if (shortened.length <= maxLength) {
      return shortened;
    }
  }
```

**Problem:** When headlines are too long, the function removes words that might be important keywords, potentially reducing Ad Relevance.

#### Problem: Generic Fallback When Headline Too Long (`convex/campaigns.ts` Lines 2007-2042)

```2007:2042:convex/campaigns.ts
  // Strategy 5: Truncate at full-word boundary (last resort)
  // 🚨 CRITICAL: Never truncate mid-word - this creates broken headlines like "Birm", "Londo"
  const words = shortened.split(/\s+/);
  let result = '';
  for (const word of words) {
    const candidate = result ? result + ' ' + word : word;
    if (candidate.length <= maxLength) {
      result = candidate;
    } else {
      break; // Stop before adding word that would exceed limit
    }
  }
  
  // Edge case: single word exceeds maxLength
  // Instead of truncating mid-word (which creates "Birm", "Londo"), 
  // return a keyword-rich fallback - NO abbreviations allowed
  const firstWord = words[0] || '';
  if (firstWord.length > maxLength) {
    // Log warning and return a keyword-rich fallback instead of truncating mid-word
    console.warn(`⚠️ Headline word "${firstWord}" exceeds ${maxLength} chars - using keyword-rich fallback (truncation avoided)`);
    // Return a keyword-rich fallback that will match search intent
    return 'Call Now Free Quote';
  }

  return shortened;
}
```

**Problem:** When a single word exceeds the limit, it returns a generic fallback "Call Now Free Quote" which may not match the service or intent.

### 5.4 Where Headlines Aren't Unique

#### Problem: Weak Similarity Check in Fallbacks (`convex/campaigns.ts` Lines 2129-2133)

```2129:2133:convex/campaigns.ts
    // Skip if too similar to existing headline
    const isSimilar = existingLower.some(existing => 
      existing.includes(candidateLower.substring(0, 10)) || 
      candidateLower.includes(existing.substring(0, 10))
    );
```

**Problem:** This only checks the first 10 characters, so headlines like "Heating Repair Birmingham" and "Heating Fix Birmingham" are not detected as similar.

#### Deduplication Function (`convex/googleAdsCampaigns.ts` Lines 1243-1274)

```1243:1274:convex/googleAdsCampaigns.ts
// Helper function to deduplicate headlines/descriptions to avoid DUPLICATE_ASSET errors
// Enhanced to catch similar assets, not just exact duplicates
function deduplicateAssets(assets: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const asset of assets) {
    // Normalize for comparison (lowercase, trim)
    const normalized = asset.toLowerCase().trim();
    
    // Check for exact duplicate
    if (seen.has(normalized)) {
      console.warn(`⚠️ Filtering out exact duplicate: "${asset}"`);
      continue;
    }
    
    // Check for similar assets (same key words, different order)
    let isSimilar = false;
    for (const existing of seen) {
      if (areAssetsSimilar(normalized, existing, 0.7)) {
        console.warn(`⚠️ Filtering out similar asset: "${asset}" (similar to existing)`);
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

#### Similarity Check Function (`convex/googleAdsCampaigns.ts` Lines 1229-1239)

```1229:1239:convex/googleAdsCampaigns.ts
// Helper function to check if two assets are semantically similar
function areAssetsSimilar(asset1: string, asset2: string, threshold: number = 0.7): boolean {
  const words1 = asset1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = asset2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return false;
  
  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  
  return similarity >= threshold;
}
```

**Problem:** The 0.7 threshold may not catch headlines that are just word swaps (e.g., "Heating Repair Birmingham" vs "Heating Fix Birmingham" have 2/3 words in common = 66% similarity, below threshold).

### 5.5 Internal Repetition Detection (`convex/googleAdsCampaigns.ts` Lines 1176-1226)

```1176:1226:convex/googleAdsCampaigns.ts
function detectInternalRepetition(text: string): boolean {
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 10);
  if (sentences.length < 2) return false;
  
  const phrases = new Set<string>();
  
  for (const sentence of sentences) {
    const words = sentence.toLowerCase().trim().split(/\s+/).filter(w => w.length > 2);
    // Extract key phrases (3+ consecutive words)
    for (let i = 0; i <= words.length - 3; i++) {
      const phrase = words.slice(i, i + 3).join(' ');
      if (phrases.has(phrase)) {
        console.warn(`⚠️ Found repeated phrase in description: "${phrase}"`);
        return true; // Found repetition
      }
      phrases.add(phrase);
    }
  }
  return false;
}

// Helper function to remove repeated phrases from a description
function removeRepeatedPhrases(text: string): string {
  const sentences = text.split(/[.!?]\s+/).filter(s => s.trim().length > 0);
  const seen = new Set<string>();
  const unique: string[] = [];
  
  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().trim();
    // Check if this sentence is too similar to an existing one
    let isDuplicate = false;
    for (const existing of seen) {
      // If 70%+ of words match, consider it a duplicate
      const sentenceWords = normalized.split(/\s+/).filter(w => w.length > 2);
      const existingWords = existing.split(/\s+/).filter(w => w.length > 2);
      const commonWords = sentenceWords.filter(w => existingWords.includes(w));
      const similarity = commonWords.length / Math.max(sentenceWords.length, existingWords.length);
      if (similarity > 0.7) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      seen.add(normalized);
      unique.push(sentence.trim());
    }
  }
  
  return unique.join('. ').trim() + (text.endsWith('.') ? '.' : '');
}
```

**Note:** This function exists but may not catch all cases of repetition, especially when phrases are slightly different.

---

## 6. Environment

- **Mode:** Production and Development
- **Platform:** Convex backend with React Router v7 frontend
- **Google Ads API:** Using Google Ads SDK for campaign creation
- **AI Model:** GPT-4 Turbo Preview for campaign generation

---

## 7. Convex Data

To inspect relevant database state, use:

```bash
bunx convex data
```

**Relevant Tables:**
- `campaigns` - Stores generated campaign data with headlines and descriptions
- `googleAdsCampaigns` - Tracks pushed campaigns and their Google Ads IDs

---

## 8. Reproduction Steps

How to reproduce the issue:

1. **User signs up** and creates campaign
   - Campaign is auto-generated by AI
   - Headlines and descriptions are created

2. **User connects their Google Ads account** and pushes the campaign to Google Ads
   - OAuth flow completes
   - Campaign is created in Google Ads (initially PAUSED)

3. **User goes to Google Ads** to see the Ads
   - Navigate to ads.google.com
   - View the created campaign
   - Check Ad Strength
   - **Expected:** Ad Strength should be "Good" or "Excellent"
   - **Actual:** Ad Strength is "Poor"
   - **Observed Issues:**
     - Repetition in descriptions (e.g., "Professional plumber in Birmingham" appears multiple times)
     - Headlines are not unique (e.g., "Heating Repair Birmingham", "Heating Fix Birmingham", "Birmingham Heating Repair")
     - Headlines don't sound natural (e.g., "Plumber No Hidden Fees")
     - Missing popular keywords in headlines
     - Google Ads Advisor suggests: "Add more headlines", "Include popular keywords in your headlines", "Make your headlines more unique", "Make your descriptions more unique"

---

## 9. Constants and Configuration

```10:25:convex/campaigns.ts
const MAX_HEADLINE_CHARS = 30;
const MAX_DESCRIPTION_CHARS = 80;
const TARGET_HEADLINES_PER_AD_GROUP = 15;
const MAX_DESCRIPTIONS_PER_AD_GROUP = 4;
```

---

## 10. Key Functions Reference

### Headline Generation & Validation
- `buildCampaignPrompt()` - Creates AI prompt for headline generation (`convex/campaigns.ts:1142`)
- `validateAndFixHeadline()` - Validates and fixes headline length (`convex/campaigns.ts:1933`)
- `generateFallbackHeadlines()` - Generates fallback headlines (`convex/campaigns.ts:2047`)
- `deduplicateAssets()` - Removes duplicate/similar headlines (`convex/googleAdsCampaigns.ts:1243`)
- `areAssetsSimilar()` - Checks if two headlines are similar (`convex/googleAdsCampaigns.ts:1229`)

### Description Generation & Validation
- `generateFallbackDescriptions()` - Generates fallback descriptions (`convex/campaigns.ts:2197`)
- `detectInternalRepetition()` - Detects repetition within a description (`convex/googleAdsCampaigns.ts:1176`)
- `removeRepeatedPhrases()` - Removes repeated phrases from descriptions (`convex/googleAdsCampaigns.ts:1198`)

### Ad Creation
- `createResponsiveSearchAd()` - Creates RSA in Google Ads (`convex/googleAdsCampaigns.ts:1309`)
- `validateAndEnhanceCampaignData()` - Validates campaign data before saving (`convex/campaigns.ts:2438`)

---

## 11. Related Files

- `convex/campaigns.ts` - Campaign generation, AI prompt, headline/description validation
- `convex/googleAdsCampaigns.ts` - Push to Google Ads, sanitization, ad creation
- `bug-headline-creating-weak-headlines-context.md` - Related bug context for headline issues
- `bug-unique-ads-context.md` - Related bug context for unique ads

---

## 12. Summary of Issues

1. **AI generates repetitive headlines** - Word swaps like "Heating Repair Birmingham" vs "Heating Fix Birmingham" are treated as duplicates by Google
2. **AI generates repetitive descriptions** - Same phrases appear multiple times within and across descriptions
3. **Headlines don't sound natural** - Mechanical keyword-stuffing instead of natural business messages
4. **Missing popular keywords** - Important keywords like "emergency", "service", "local" are removed during validation
5. **Weak similarity detection** - Similarity checks don't catch word-swap variations effectively
6. **Fallback descriptions can repeat** - Template-based fallbacks may duplicate AI-generated descriptions
7. **Generic fallbacks** - When headlines are too long, generic fallbacks don't match service intent

---

## 13. Expected Behavior

- **Ad Strength:** Should be "Good" or "Excellent"
- **Headlines:** 15 unique headlines covering different angles (service+city, urgency, trust, value, action)
- **Descriptions:** 4 unique descriptions covering different roles (problem/solution, trust, value, action)
- **Natural Language:** Headlines and descriptions should sound like real business messages, not keyword spam
- **Keyword Inclusion:** Popular search keywords should be included naturally
- **No Repetition:** No repeated phrases within or across descriptions

---

## 14. Actual Behavior

- **Ad Strength:** "Poor"
- **Headlines:** Many are word swaps (e.g., "Heating Repair Birmingham", "Heating Fix Birmingham")
- **Descriptions:** Repeated phrases (e.g., "Professional plumber in Birmingham" appears multiple times)
- **Natural Language:** Headlines sound mechanical (e.g., "Plumber No Hidden Fees")
- **Keyword Inclusion:** Important keywords are sometimes removed during validation
- **Repetition:** Phrases repeat within descriptions and across multiple descriptions

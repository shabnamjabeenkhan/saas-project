## Feature Plan: Ad Quality Improvements & Campaign Management

### 1. Scope & Objectives

- Implement `prd-ad-quality-improvements.md` for electricians/plumbers Google Ads campaigns.
- Focus areas:
  - Ad quality: 4 themed ad groups, 12 high‑quality headlines each, 30‑char limit without truncation.
  - Truthful ads: only services selected in onboarding are advertised; keywords match selected services.
  - Trial/subscription gating: 3‑day free trial, 3 regenerations/month for paid users, cooldowns.
  - Regeneration UX: onboarding‑based initial campaign + regenerations via button or settings edit.
  - Minimal dashboard: campaign status + CTA.
- Out of scope for this implementation: ROI/ad‑spend metrics, Google Tag integration, multi‑tier pricing.

Primary success criteria (from PRD):
- ≥ 80% campaigns reach “Good/Excellent” ad strength in Google Ads (manual verification initially).
- 0% headlines with truncated words.
- Ads only reference services chosen in onboarding `serviceOfferings`.

---

### 2. Current Architecture (High Level)

- **Onboarding & Data Capture**
  - `app/routes/onboarding.tsx`
    - Step 1: `tradeType` (`plumbing` | `electrical` | `both`).
    - Step 4: `serviceOfferings: string[]` (plumbing/electrical services via checkboxes).
    - Step 5: availability + acquisition goals (budget, leads, etc.).
  - Convex `convex/onboarding.ts` stores onboarding data into `onboardingData` table.

- **Campaign Generation**
  - Primary path currently goes through `convex/campaigns.ts` (AI call to OpenAI).
  - `app/lib/enhancedCampaignGenerator.ts` holds an older/auxiliary prompt generator (4 ad groups, 3 headlines).
  - Generated campaign persisted in Convex `campaigns` table (`api.campaigns.*`).

- **Google Ads Push**
  - `convex/googleAdsCampaigns.ts`
    - `createGoogleAdsCampaign` action:
      - Reads campaign via `api.campaigns.getCampaignById`.
      - Creates budget, campaign, ad groups, keywords, responsive search ads, call/sitelink extensions via `google-ads-api` SDK.
      - Performs aggressive logging and payload validation (phone sanitization, URL validation).
      - Expects `adGroups[].adCopy.headlines` and `adCopy.descriptions` already exist.
      - Uses up to 15 headlines / 4 descriptions, truncates to 30/90 chars at send time.

- **Campaign Approval & Quality**
  - `app/lib/campaignApprovalWorkflow.ts`
    - Manages approval state for mock campaigns (`draft` → `approved`/`live` etc.).
    - `validateForApproval` performs basic checks (compliance level, budget, ad groups, keywords, min 3 headlines).
  - `app/components/campaign/CampaignQualityChecker.tsx`
    - UI to display compliance checks and optimization suggestions.
    - Already has an overall quality score and “Regenerate Campaign” button.

- **Google Ads Auth**
  - `app/lib/useGoogleAdsAuth.ts`
    - Handles connection/disconnection.
    - Uses Convex `api.googleAds.isConnected` (prod) or localStorage (dev).

- **Sync Simulation**
  - `app/lib/googleAdsSync.ts`
    - Simulates sync status and conversion tracking (for dashboards).
    - Used for demo/analytics only (not core to ad creation).

---

### 3. Data Model & State Changes

#### 3.1 Regeneration Tracking & Subscription

We will extend existing Convex data to support:
- Per‑user regeneration tracking (trial vs paid).
- Trial window and subscription status flags.

**New / updated fields (high‑level only — actual schema wiring later):**

- Table: `subscriptions` (already exists)
  - `status: 'trial' | 'active' | 'canceled' | 'expired'`
  - `trialEndsAt: number` (ms epoch)
  - `billingPeriodEndsAt: number` (ms epoch) – for cancellation behaviour.

- Table: `campaigns` (or a dedicated `regenerationTracking` table referenced by userId)
  - `regenerationCount: number` – total regenerations used this month.
  - `lastRegenerationAt: number`
  - `monthlyRegenResetDate: number` – timestamp when monthly counter last reset.

Business rules:
- **Trial:** 1 initial campaign from onboarding + 2 regenerations (=3 total) within 3 days.
- **Paid:** 3 regenerations per calendar month; onboarding initial does not count.
- **Cooldown:** 1 minute between successful regenerations (any method).
- **Rollover:** Unused regenerations do not roll over.

We will not add full billing logic now; we will assume:
- Convex `subscriptions.ts` (or equivalent) can answer “isTrialActive”, “isPaidActive”, and provide `trialEndsAt`/`billingPeriodEndsAt`.

#### 3.2 Campaign Content

Generated campaign structure from Convex `campaigns` should satisfy:
- Exactly up to 4 ad groups, one per **service theme**:
  - Emergency
  - Installation
  - Maintenance
  - Repair
- But only create themes for which the user has at least one matching service in `serviceOfferings`.
- Each ad group:
  - **12 headlines** (service‑ and trade‑specific, varied styles).
  - 2–4 descriptions, already phone‑sanitized (server side re‑checks).
  - Keywords derived only from selected services and localized via city/postcode.

---

### 4. Implementation Plan (Per Area)

#### 4.1 Campaign Generation (AI Prompt & Service Filtering)

**Primary files:**
- `convex/campaigns.ts` (main AI prompt + parsing).
- `app/lib/enhancedCampaignGenerator.ts` (can be used as reference or consolidated).

**Steps:**
1. **Identify single source of truth for prompt:**
   - Confirm whether `convex/campaigns.ts` or `enhancedCampaignGenerator.ts` is used for production campaign generation.
   - Goal: avoid diverging prompts.

2. **Update prompt to enforce PRD requirements:**
   - 4 service themes (emergency, installation, maintenance, repair) **conditionally**:
     - Only create an ad group if there is at least one service from `serviceOfferings` mapped to that theme.
   - 12 headlines per ad group:
     - Include explicit instruction: “Generate exactly 12 headlines per ad group, each ≤ 30 characters, no truncated words.”
     - Headlines must cover five styles: keyword+city, local benefit, value/offer, trust indicator, action/CTA.
   - 2–4 descriptions per ad group (max 90 chars).
   - Strict “no phone numbers in ad copy” (already largely handled).
   - Emphasize that all services & keywords **must** come from onboarding `serviceOfferings`.

3. **Service‑to‑theme mapping:**
   - Add mapping table (in TS code) from service names → themes:
     - E.g. `Emergency Plumbing` → `emergency`; `Boiler Repair` → `repair`; `Bathroom Installation` → `installation`, etc.
   - Group onboarding `serviceOfferings` by theme.
   - Pass the grouped lists into the AI prompt so it can generate themed ad groups.

4. **Post‑processing / validation:**
   - In `parseAIResponse` (in `convex/campaigns.ts`), validate:
     - Each ad group only references services present in at least one of the user’s `serviceOfferings`.
     - Headline counts per ad group == 12 (fallback: if fewer, auto‑generate safe filler headlines like “Local Certified Electrician”, etc., while keeping within 30 chars).
     - Descriptions: ensure at least 2, max 4.
   - Enforce a final pass that strips/adjusts headlines > 30 chars **without truncating words**:
     - Strategy: if > 30 chars, attempt:
       - Remove less important words (e.g. “professional”, “local”).
       - Replace “installation”→“install”, “emergency”→“urgent”, etc.
       - Only as last resort, hard truncate with full‑word boundary (avoid `Londo`).

5. **Local keyword generation:**
   - Extend `generateLocalKeywords` in `enhancedCampaignGenerator.ts` or mimic equivalent in `convex/campaigns.ts`:
     - Use city, postcode area, and “near me” variants.
   - Ensure each ad group gets 8–10 keywords derived only from **its theme’s services**.

#### 4.2 Regeneration Limits & Trial/Paid Gating

**Primary files:**
- `convex/campaigns.ts` (already has some regeneration tracking logic).
- `convex/subscriptions.ts` (or equivalent) for subscription/trial state.
- `app/components/campaign/CampaignHeaderControls.tsx` (Regenerate button, status text).
- `app/routes/dashboard/settings.tsx` and/or onboarding editing route (for Settings regeneration).

**Steps:**
1. **Backend: regeneration tracking:**
   - Extend existing `checkRegenerationLimits` in `convex/campaigns.ts` to:
     - Accept `userId`.
     - Load subscription/trial info.
     - Compute:
       - `isTrialActive`, `isPaidActive`, `trialEndsAt`, `billingPeriodEndsAt`.
       - `remainingRegensThisMonth` (3 for paid, 0 if not active).
     - Enforce:
       - Trial: allow up to 3 total generations (1 initial + 2 extra) within 3 days.
       - Paid: allow 3 regenerations per calendar month.
       - Cooldown: reject if `lastRegenerationAt` < 60s ago.
     - Return structure with:
       - `allowed: boolean`
       - `remaining: number`
       - `cooldownSecondsRemaining: number`
       - `testing?: boolean` for dev overrides.

2. **Backend: regeneration update:**
   - Ensure regeneration counter is only incremented on **successful** campaign generation.
   - When month boundary detected (via date comparison), automatically reset to 3 (active subscribers only).

3. **Settings‑based regeneration:**
   - Wherever Settings “Save” endpoint exists (likely Convex mutation backing `dashboard/settings.tsx`):
     - After successfully updating onboarding/business info, call the same `generateCampaign` action.
     - Ensure this path also respects `checkRegenerationLimits` and cooldown.

4. **Frontend gating:**
   - `CampaignHeaderControls.tsx`:
     - Use `useQuery(api.campaigns.checkRegenerationLimits, ...)`.
     - Disable Regenerate button when:
       - `!regenerationLimits.allowed`.
       - `cooldownSecondsRemaining > 0` (show timer).
     - Show status text: “X/3 regenerations remaining this month”, “Resets on [date]”.
   - Dashboard/Settings routes:
     - Disable Settings editing UI when regeneration not allowed (paid/trial restrictions).
     - Show “Upgrade Plan” CTA when trial expired or subscription inactive.

5. **Trial expiry & subscription cancellation:**
   - When trial expired:
     - Allow viewing all screens, disallow regenerate/settings edit/connect/push.
   - When subscription cancelled:
     - Buttons remain enabled until `billingPeriodEndsAt`, then treat as inactive.

#### 4.3 Dashboard Simplification

**Primary files:**
- `app/routes/dashboard/index.tsx`

**Steps:**
1. Remove/disable complex metrics tiles (ad spend, revenue, ROI) for MVP (or gate them behind feature flag).
2. Replace middle “Quick Summary” card with:
   - If user has no campaign (`api.campaigns.getCampaign` returns null):
     - “No campaigns yet” message.
     - Button linking to onboarding or campaign generation route.
   - If user has campaign:
     - “Active campaign” label.
     - “View Campaign” button linking to `/dashboard/campaigns`.

This aligns with PRD FR‑32–FR‑34.

#### 4.4 Campaign Quality UI Enhancements

**Primary files:**
- `app/components/campaign/CampaignQualityChecker.tsx`

**Steps (minimal for now):**
1. Ensure `CampaignQualityChecker` can take:
   - Optimization suggestions from backend (e.g., from AI response) for headline variety, service accuracy.
2. Optionally:
   - Show a high‑level “Ad Strength” analogue based on:
     - Passed vs failed compliance checks.
     - Presence of 12 diverse headlines per group.
3. Keep the primary action as “Regenerate Campaign” which triggers backend regeneration respecting limits.

#### 4.5 Google Ads Push Flow (Safety)

**Primary files:**
- `convex/googleAdsCampaigns.ts`
- `app/lib/useGoogleAdsAuth.ts`

**Steps:**
1. Keep campaigns, ad groups, ads **PAUSED** when created (already implemented).
2. Ensure we don’t attempt to create Google Ads campaigns when:
   - Trial expired & not paid.
   - Subscription inactive.
   - Missing/invalid onboarding website URL (FR‑29/30).
3. Validate:
   - Ad groups contain at least 3 valid headlines / 2 descriptions before push (already partially in code).
   - Final URLs are never placeholder `example.com` in production (block push with error).

---

### 5. Testing Strategy (Manual First)

We will rely on **manual testing** for this feature initially, using the following scenarios:

#### 5.1 Ad Quality & Generation

1. **Plumber only, limited services**
   - Onboarding: select trade “Plumbing”; pick 2–3 services (e.g., Emergency Plumbing, Leak Repair).
   - Generate campaign:
     - Confirm:
       - Only relevant themes created (e.g., Emergency/Repair).
       - Each ad group has exactly 12 headlines, all ≤ 30 chars, no truncated words.
       - Keywords mention only selected services + local variants.
   - Push to Google Ads (using test account):
     - Confirm ad strength in Google Ads is “Good/Excellent” (manual).

2. **Electrician only, all services**
   - Select several electrical services.
   - Confirm 4 themed ad groups where applicable, 12 varied headlines each.

3. **Both trades**
   - Select plumbing + electrical services.
   - Confirm themes include mixed services but still only from selected offerings.

4. **Long city names**
   - Use “Birmingham” / “Stoke‑on‑Trent”.
   - Confirm headlines still ≤ 30 chars and readable.

#### 5.2 Regeneration Limits & Cooldown

1. **Trial flow**
   - New user → complete onboarding.
   - Check:
     - Initial campaign auto‑created (1st generation).
     - Two successful regenerations via button allowed.
     - 4th attempt blocked with message about trial limit.
   - Connect Google Ads and push during trial → ensure allowed.
   - After 3 days (or forced via DB/time manipulation):
     - Buttons disabled, “Upgrade Plan” visible, campaigns view‑only.

2. **Paid subscription**
   - Simulate active subscription.
   - Regenerate 3 times in calendar month (button + settings edit).
   - Verify 4th attempt blocked; Settings editing disabled; view‑only.
   - Verify monthly reset (manually adjust date or DB) restores 3 regenerations.

3. **Cooldown**
   - Regenerate once.
   - Immediately attempt another regeneration; expect UI message “Please wait X seconds” and disabled button.
   - After 60 seconds, regeneration allowed again.

4. **Cancellation**
   - Set subscription to “canceled” but with future `billingPeriodEndsAt`.
   - Confirm regenerations allowed until billing period end, then blocked.

#### 5.3 Dashboard Behaviour

1. No campaigns:
   - New user, before onboarding or before generation.
   - Dashboard shows “No campaigns yet” + “Create Your First Campaign →”.
2. With campaign:
   - After generation, dashboard shows “Active campaign” + “View Campaign”.

---

### 6. Risks & Mitigations

- **Risk:** AI returns fewer/malformed headlines or violates 30‑char rule.
  - **Mitigation:** Add strict server‑side validation + fallback headline generation.
- **Risk:** Service‑theme mapping drifts from onboarding service labels.
  - **Mitigation:** Centralize mapping in one module and write small unit tests around it (future improvement).
- **Risk:** Regeneration logic bugs can block legitimate use or under‑charge.
  - **Mitigation:** Log regeneration decisions (allowed/blocked + reason) and test all edge cases manually.
- **Risk:** Google Ads API failures during push.
  - **Mitigation:** Preserve robust error handling & logging already present in `googleAdsCampaigns.ts`, surface friendly error messages in UI.

---

### 7. Next Steps

1. Review this plan with you to confirm:
   - Regeneration rules match your business model.
   - Ad group/service behaviour matches expectations for plumbers vs electricians vs both.
2. Once approved, implement in this order:
   1. Prompt & validation changes for campaign generation (Convex + any shared helpers).
   2. Regeneration tracking + gating (Convex) and UI updates (React).
   3. Dashboard simplification.
   4. Light quality UI tweaks (optional).
3. After implementation, run through manual test matrix and capture screenshots of:
   - Generated ads in app.
   - Google Ads preview + ad strength.
   - Dashboard & campaign screens for each state (trial, paid, exhausted, expired).



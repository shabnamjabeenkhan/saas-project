# PRD: Ad Quality Improvements & Campaign Management System

## 1. Introduction/Overview

This feature enhances the AI-generated Google Ads campaign system for electricians and plumbers. The primary goals are to:

1. **Improve ad quality** from "Poor" to "Good/Excellent" strength ratings in Google Ads
2. **Implement a subscription-based access model** with a 3-day free trial
3. **Add regeneration limits** (3 per month) to manage usage
4. **Create 4 service-themed ad groups** with 12 varied headlines each

The app generates Google Ads campaigns based on user onboarding data (trade type, services offered, location, certifications). Users can connect their Google Ads account to push campaigns directly.

---

## 2. Goals

| Goal | Metric |
|------|--------|
| Improve ad strength rating | Achieve "Good" or "Excellent" rating in Google Ads |
| Prevent headline truncation | 100% of headlines ≤ 30 characters with complete words |
| Reduce ad disapprovals | Zero policy violations in generated ads |
| Convert trial users to paid | Track trial-to-paid conversion rate |
| Ensure ad accuracy | Ads only reference services user selected in onboarding |

---

## 3. User Stories

### Trial User Flow
- **US-1**: As a new user, I complete onboarding and a campaign is automatically generated (this is my 1st generation during trial).
- **US-2**: As a trial user, I can regenerate my campaign 2 more times (total 3 during trial).
- **US-3**: As a trial user, I can connect my Google Ads account and push my campaign within 3 days.
- **US-4**: As a trial user whose trial has expired, I see disabled buttons for regenerate/connect/edit but can still view my campaigns.

### Paid User Flow
- **US-5**: As a paid user, I get 3 regenerations per month (initial onboarding campaign doesn't count toward this limit).
- **US-6**: As a paid user, my regeneration count resets to 3 at the start of each billing month.
- **US-7**: As a paid user who reaches the regeneration limit, I can still view everything but cannot regenerate or edit settings.
- **US-8**: As a user, I must wait 1 minute between regenerations to prevent abuse.

### Settings & Regeneration
- **US-9**: As a user, when I edit my business info in Settings and save, a new campaign is auto-generated (counts as 1 regeneration).
- **US-10**: As a user, if a regeneration fails, it does not count against my limit.
- **US-11**: As a user, I cannot edit settings when my regeneration limit is reached (editing triggers regeneration).

### Subscription Management
- **US-12**: As a user who cancels mid-month with regenerations left, I can continue regenerating until the end of my billing period.
- **US-13**: As a paid user visiting the landing page pricing section, I see which plan I'm currently on.
- **US-14**: As a user whose trial expires mid-regeneration, the regeneration completes but I cannot push to Google Ads afterward.

### Dashboard
- **US-15**: As a user with no campaigns, I see "No campaigns yet" and a "Create Your First Campaign →" button.
- **US-16**: As a user with an active campaign, I see the campaign status and a "View Campaign" button linking to the Campaigns page.

---

## 4. Functional Requirements

### 4.1 Trial & Subscription System

| ID | Requirement |
|----|-------------|
| FR-1 | System shall provide a 3-day free trial upon user signup and onboarding completion |
| FR-2 | During trial, user gets 1 auto-generated campaign + 2 regenerations (3 total) |
| FR-3 | After trial expires, disable these buttons: "Regenerate Campaign", "Connect to Google Ads", "Edit" (in Settings) |
| FR-4 | Display "Upgrade Plan" button that navigates to payment flow when features are disabled |
| FR-5 | Single monthly subscription plan available |
| FR-6 | On landing page pricing section, display user's current plan status if logged in |
| FR-7 | When user cancels subscription, buttons remain enabled until end of billing period |

### 4.2 Regeneration Limits

| ID | Requirement |
|----|-------------|
| FR-8 | Paid users receive 3 regenerations per month (initial onboarding campaign is free, one-time, doesn't count) |
| FR-9 | Regeneration count resets to 3 at the start of each calendar month for active subscribers |
| FR-10 | Unused regenerations do NOT roll over to the next month |
| FR-11 | Editing business info in Settings triggers auto-regeneration and counts as 1 regeneration |
| FR-12 | Failed regenerations shall NOT count against the limit |
| FR-13 | Enforce 1-minute cooldown between regenerations (display countdown timer in UI) |
| FR-14 | When regeneration limit reached, disable "Regenerate Campaign" button and Settings page editing |
| FR-15 | If trial expires mid-regeneration, complete the regeneration but disable "Connect to Google Ads" afterward |

### 4.3 Campaign Generation & Ad Quality

| ID | Requirement |
|----|-------------|
| FR-16 | Generate 4 ad groups per campaign, each focusing on a service theme (Emergency, Installation, Maintenance, Repair) |
| FR-17 | Ad groups must ONLY include services the user selected during onboarding Step 4 (serviceOfferings field) |
| FR-18 | If user didn't select services for a theme (e.g., no Installation services), that ad group is not created |
| FR-19 | Generate 12 headlines per ad group with variety across these styles: Primary Keyword + City, Local Benefit, Value/Offer, Trust Indicators, Action |
| FR-20 | Enforce strict 30-character limit per headline with NO truncated words |
| FR-21 | Handle long city names (e.g., "Stoke-on-Trent", "Birmingham") by abbreviating or restructuring to fit 30 chars |
| FR-22 | All campaigns generated from onboarding form data only |
| FR-23 | Keywords in each ad group must match selected services only |

### 4.4 Headline Quality Requirements

| ID | Requirement |
|----|-------------|
| FR-24 | Headlines must include variety: keyword+city, local benefits, value props, trust indicators, CTAs |
| FR-25 | Include compliance certifications (e.g., "Part P Certified") only if user confirmed relevant certificates in onboarding |
| FR-26 | Avoid generic/weak headlines (e.g., "State Socket Installation London") |
| FR-27 | Use professional, query-matching headlines (e.g., "Expert Socket Installation", "Same-Day Emergency Help") |
| FR-28 | Ensure all headlines make grammatical sense and contain complete words |

### 4.5 Onboarding Updates

| ID | Requirement |
|----|-------------|
| FR-29 | Website URL field is REQUIRED (not optional) - user cannot skip |
| FR-30 | Validate that website URL is a valid URL format |
| FR-31 | User must confirm relevant trade certifications during onboarding |

### 4.6 Dashboard (MVP)

| ID | Requirement |
|----|-------------|
| FR-32 | Dashboard displays campaign status only |
| FR-33 | If no campaign exists: Show "No campaigns yet" message and "Create Your First Campaign →" button |
| FR-34 | If campaign exists: Show "Active campaign" status and "View Campaign" button linking to Campaigns page |

### 4.7 Google Ads Integration

| ID | Requirement |
|----|-------------|
| FR-35 | Campaigns already pushed to Google Ads remain as-is when trial/subscription ends (user manages separately) |
| FR-36 | User cannot push NEW campaigns when trial expired or subscription inactive |

---

## 5. Non-Goals (Out of Scope)

The following are explicitly **NOT** part of this MVP:

- Automatic pausing of campaigns on Google Ads when subscription lapses
- Multiple subscription tiers with different features
- Dashboard metrics: Estimated ROI, Qualified Leads, Ad Spend (MTD), Cost per Lead
- Google Tag installation guidance/integration
- Rollover of unused regenerations between months
- Bulk campaign management

> **Future Consideration**: Dashboard metrics (Estimated ROI, Qualified Leads, Ad Spend MTD, Cost per Lead) are planned for post-MVP if successful.

---

## 6. Design Considerations

### UI States

| State | UI Behavior |
|-------|-------------|
| Trial Active + Has Regenerations | All buttons enabled |
| Trial Active + No Regenerations | Regenerate & Edit disabled, Connect enabled, "Upgrade" visible |
| Trial Expired + Not Paid | All action buttons disabled, "Upgrade Plan" prominent, View-only access |
| Paid + Has Regenerations | All buttons enabled |
| Paid + No Regenerations | Regenerate & Edit disabled, Connect enabled |
| Subscription Cancelled (before period end) | All buttons enabled until billing period ends |

### Cooldown Timer
- Display visible countdown (e.g., "Please wait 45 seconds before regenerating")
- Disable regeneration triggers during cooldown

### Regeneration Count Display
- Show remaining regenerations: "2 of 3 regenerations remaining this month"
- Show reset date: "Resets on [date]"

---

## 7. Technical Considerations

### Headline Generation Logic
```
1. Get user's selected services from onboarding (serviceOfferings field)
2. Group services into themes: Emergency, Installation, Maintenance, Repair
3. For each theme with selected services:
   a. Create ad group
   b. Generate 12 headlines with variety (keyword+city, benefits, value, trust, CTA)
   c. For each headline:
      - Check character count ≤ 30
      - If city name causes overflow, abbreviate or restructure
      - Validate no truncated words
      - Ensure grammatical correctness
4. Only include certification claims if user confirmed in onboarding
```

### Ad Compliance Checks
Research and implement checks for common Google Ads disapproval reasons:
- Trademark violations
- Misleading claims
- Punctuation/symbol abuse
- Capitalization issues
- Destination URL mismatches

### Regeneration Tracking
- Store: `regenerationCount`, `lastRegenerationAt`, `monthResetDate`
- On regeneration attempt: Check cooldown (1 min), check limit (3/month)
- On success: Increment count, update timestamp
- On failure: Do not increment count
- On new month: Reset count to 3 for active subscribers

### Subscription Integration
- Track: `trialEndsAt`, `subscriptionStatus`, `billingPeriodEndsAt`
- Check subscription status before enabling action buttons

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Ad Strength Rating | ≥ 80% of campaigns achieve "Good" or "Excellent" |
| Headline Truncation | 0% of headlines have truncated words |
| Ad Disapproval Rate | < 5% of pushed campaigns |
| Trial to Paid Conversion | Track baseline, improve over time |
| User Regeneration Usage | Track avg regenerations used per user/month |

---

## 9. Open Questions

1. **What is the monthly subscription price?** (Needed for pricing section display)
2. **Should there be email notifications for:**
   - Trial expiring soon (e.g., 24 hours before)?
   - Regeneration limit reached?
   - Monthly reset occurred?
3. **How should long business names be handled in headlines?** (Similar to city name truncation issue)
4. **What happens if a user has Both trades (Electrician + Plumber)?** How many ad groups are created - 4 per trade (8 total) or 4 combined?
5. **Should the 1-minute cooldown be between ANY regeneration methods?** (e.g., regenerate button then immediately try to edit settings)

---

## 10. Appendix

### A. Headline Style Examples

| Style | Example Headlines |
|-------|-------------------|
| Primary Keyword + City | "Home Rewiring London" |
| Local Benefit | "Fast Same-Day Electrician" |
| Value/Offer | "Free Quotes No Hidden Fees" |
| Trust Indicators | "Part P Certified Experts" |
| Action/CTA | "Book Your Install Today" |

### B. Ad Group Theme Mapping

| Theme | Example Electrician Services | Example Plumber Services |
|-------|------------------------------|--------------------------|
| Emergency | Emergency Electrician | Emergency Plumber, Burst Pipe |
| Installation | Socket Installation, Lighting Setup | Bathroom Installation, Boiler Install |
| Maintenance | Electrical Inspections, PAT Testing | Boiler Service, Drain Cleaning |
| Repair | Rewiring, Fault Finding | Leak Repair, Boiler Repair |

### C. Future Features (Post-MVP)

For reference when planning future iterations:
- Dashboard metrics: Estimated ROI, Qualified Leads, Ad Spend (MTD), Cost per Lead
- Google Tag installation guidance
- Advanced analytics and reporting
- Multiple subscription tiers

---

*Document created: November 29, 2025*
*Status: Draft - Ready for Review*

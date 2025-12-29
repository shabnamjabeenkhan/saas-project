# Product Requirements Document: Ad Quality Feature

## 1. Introduction/Overview

This feature improves the AI-generated Google Ads campaigns for electricians and plumbers by ensuring ads achieve "Good" or "Excellent" ad strength ratings. Currently, ads are low quality and risk disapproval. This enhancement focuses on generating varied, compliant headlines that match customer search queries while respecting Google Ads' 30-character limit.

**Problem Statement:** Current ads have poor quality scores with repetitive headlines that don't leverage Google's responsive ad assembly effectively. Headlines may truncate awkwardly, and ads risk disapproval due to compliance issues.

**Target Users:** UK-based electricians and plumbers using the app to generate and push Google Ads campaigns.

---

## 2. Goals

1. **Primary:** Achieve "Good" or "Excellent" ad strength rating in Google Ads for all generated campaigns
2. **Secondary:** Reduce Google Ads disapprovals to near-zero through compliance-aware generation
3. **Tertiary:** Improve headline variety to better match customer search queries

---

## 3. User Stories

### Campaign Generation
- As a user, when I complete onboarding, a campaign is automatically created (counts as 1st generation) with 4 ad groups and 12 high-quality headlines per ad group
- As a user, I want headlines optimized for my specific trade (electrician/plumber/both) so Google can match my ads to relevant searches

### Headline Quality
- As a user, I want all headlines to be complete words (no truncation like "Birming" or "Londo") so my ads look professional
- As a user, I want varied headline styles (keyword+city, benefits, offers, trust indicators, CTAs) so Google can assemble strong ad combinations

### Regeneration
- As a user, I can regenerate my campaign up to 3 times per month (via Regenerate button OR editing settings)
- As a user, I must wait 60 seconds between regenerations to prevent abuse
- As a user, failed regenerations do not count against my limit

### Subscription & Access Control
- As a free trial user (3 days), I can generate campaigns 3 times total, but cannot push to Google Ads after trial expires
- As a paid user, my regeneration count resets to 3 at the start of each month (unused regenerations do not roll over)
- As a user whose limit is reached, I can VIEW all campaigns/pages but cannot regenerate or edit settings
- As a user whose subscription lapses, my campaigns on Google Ads are automatically paused via API

### Dashboard (MVP)
- As a user with no campaign, I see "No campaigns yet" with a "Create Your First Campaign →" button
- As a user with a campaign, I see "Active campaign" status with a "View Campaign" button linking to Campaigns page

---

## 4. Functional Requirements

### 4.1 Headline Generation Engine
1. The system MUST generate exactly 12 headlines per ad group (4 ad groups = 48 headlines total per campaign)
2. The system MUST enforce a strict 30-character limit per headline with NO truncated words
3. The system MUST prioritize headline styles based on trade type:
   - **Electricians:** Part P certification, electrical safety, rewiring, installations
   - **Plumbers:** Gas Safe, emergency repairs, boiler services, leak fixes
   - **Both:** Combined relevant keywords per ad group
4. The system MUST include a mix of 5 headline categories distributed across each ad group:
   - Primary Keyword + City (e.g., "Home Rewiring London")
   - Local Benefit (e.g., "Fast Same-Day Electrician")
   - Value/Offer (e.g., "Free Quotes No Hidden Fees")
   - Trust Indicators (e.g., "Part P Certified Electricians")
   - Action/CTA (e.g., "Book Your Install Today")
5. The system MUST handle long city names gracefully (e.g., "Stoke-on-Trent") by:
   - Using abbreviations where appropriate
   - Restructuring headlines to fit within 30 characters
   - Never truncating mid-word

### 4.2 Compliance & Disapproval Prevention
6. The system MUST only include certification claims (Part P, Gas Safe) if user confirmed certifications during onboarding
7. The system MUST validate that no headlines contain prohibited content per Google Ads policies
8. The system MUST require a valid website URL during onboarding (mandatory field, not optional)
9. The system SHOULD provide guidance on Google Tag installation for optimization tracking

### 4.3 Regeneration System
10. The system MUST count successful regenerations only (failed attempts do not decrement count)
11. The system MUST enforce 60-second cooldown between regeneration attempts
12. The system MUST display remaining regeneration count and cooldown timer in UI
13. The system MUST trigger regeneration when user saves edited settings (counts as 1 regeneration)
14. The system MUST allow in-progress regeneration to complete even if trial expires mid-process

### 4.4 Access Control
15. The system MUST disable Regenerate, Edit Settings, and Connect to Google Ads buttons when:
    - Free trial expires (until payment)
    - Monthly regeneration limit reached (until next month)
16. The system MUST allow VIEW access to all pages/campaigns when buttons are disabled
17. The system MUST reset regeneration count to 3 on the 1st of each month for paying users
18. The system MUST automatically pause Google Ads campaigns via API when subscription lapses
19. The system MUST allow users with remaining regenerations to continue using them until month-end after subscription cancellation

### 4.5 Dashboard (MVP)
20. The dashboard MUST show campaign status only (no metrics in MVP)
21. The dashboard MUST display "No campaigns yet" + "Create Your First Campaign →" if no campaign exists
22. The dashboard MUST display "Active campaign" + "View Campaign" button if campaign exists

### 4.6 Onboarding Update
23. The onboarding form MUST require website URL as a mandatory field
24. The onboarding form MUST validate URL format before proceeding

---

## 5. Non-Goals (Out of Scope)

- **Dashboard Metrics:** Estimated ROI, Qualified Leads, Ad Spend (MTD), Cost per Lead (future feature)
- **Multiple Campaigns:** Users have one active campaign at a time
- **Campaign Editing:** Users cannot manually edit individual headlines (regenerate only)
- **A/B Testing:** No split testing between headline variations
- **Analytics Integration:** No Google Analytics tracking setup
- **Multi-language Support:** UK English only for MVP

---

## 6. Design Considerations

### UI Elements Required
- Regeneration count display (e.g., "2/3 regenerations remaining")
- 60-second cooldown timer with visual indicator
- Disabled button states with tooltips explaining why
- "Upgrade Plan" CTA when trial expires or limit reached
- Simple dashboard with campaign status card

### Settings Page Behavior
- When regeneration limit reached: All edit fields become read-only
- Display message: "Regeneration limit reached. Editing is disabled until [next month/payment]."

---

## 7. Technical Considerations

### Dependencies
- Google Ads API for campaign push and pause functionality
- AI/LLM for headline generation with trade-specific prompting
- Subscription/billing system for access control
- Scheduler for monthly regeneration count reset

### Constraints
- Google Ads headline limit: 30 characters (enforced at generation time)
- Google Ads responsive search ads: 15 headlines max per ad group (we use 12)
- API rate limits for Google Ads pause functionality

### Suggested Implementation Notes
- Pre-validate headline length before AI generation completes
- Build headline templates per trade type for consistent quality
- Cache Google Ads policy rules for compliance checking
- Use atomic transactions for regeneration count updates

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Ad Strength Rating | 90%+ campaigns achieve "Good" or "Excellent" | Google Ads API response |
| Disapproval Rate | <5% of ads disapproved | Google Ads policy violations |
| Headline Truncation | 0% truncated words | Automated validation |
| User Regeneration Usage | Track avg regenerations/user/month | Internal analytics |

---

## 9. Open Questions

1. **Pause Timing:** When exactly should campaigns be paused after subscription lapse? Immediately, or grace period?
2. **Reactivation:** When user re-subscribes, should paused campaigns automatically resume?
3. **Google Tag Guidance:** Should we provide in-app instructions or link to Google's documentation?
4. **Long City Names:** Need comprehensive list of UK cities that exceed character limits when combined with service keywords
5. **Certification Verification:** Is user self-attestation sufficient for Part P/Gas Safe claims, or do we need document upload?

---

## 10. Future Considerations (Post-MVP)

*Note: These are documented for future reference and are NOT part of current scope.*

- Dashboard metrics: Estimated ROI, Qualified Leads, Ad Spend (MTD), Cost per Lead
- Multiple campaign support
- Advanced analytics integration
- Performance recommendations based on Google Ads data

---

*Document Version: 1.0*  
*Created: 2024-12-29*  
*Status: Ready for Development Review*

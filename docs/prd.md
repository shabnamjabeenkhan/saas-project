# MVP PRD – AI Ads Copilot for UK Trades

## Introduction
- **Problem statement:** Independent plumbers and electricians in the UK swing between feast-and-famine demand because paid marketing is either prohibitively expensive (agencies at £4k/month) or too complex/time-consuming (DIY Google Ads). They need dependable inbound leads without becoming marketers.
- **Product vision:** Deliver a 5-minute AI-driven onboarding that outputs a compliance-safe Google Ads campaign draft tailored to the tradesperson’s service area and priorities, smoothing revenue seasonality and freeing them to focus on jobs.

## Objectives & Goals
- Launch a subscription MVP that consistently generates draft Google Ads campaigns ready for approval inside the user’s account.
- Surface lead and cost insights directly inside our dashboard using native Google Ads conversions (no third-party integrations required).
- Validate willingness to pay at £69/£189 tiers by delivering measurable lead volume improvements within 30 days of launch.

## Target Users & Roles
- **Owner-Operator:** single-trade professional juggling jobs and invoicing; needs fast setup and straightforward results tracking.
- **Ops Manager:** small crew coordinator responsible for scheduling vans and managing advertising budget; expects campaign clarity and spend guardrails.

## Core Features for MVP
1. **Five-Step Onboarding Wizard:** Collect trade type (plumbing/electrical/both), core contact info, single primary service area (city + adjustable radius), service offerings, availability, and acquisition goals.
2. **AI Campaign Generator with Google Ads Draft Push:** Generate localized ad groups, keywords, ad copy, and starter daily budget; create a draft campaign via Google Ads API for user review, track conversions through Google Ads reporting, and provide dashboard visibility.

## Future Scope
- Seasonal playbooks (e.g., winter boiler check campaigns) triggered by calendar milestones.
- Multi-location coverage with per-region budgets and performance roll-ups.
- Native integrations with job management tools (Jobber, ServiceM8) and call tracking providers.
- AI-driven optimization loops that adjust bids/ad copy automatically within guardrails.

## User Journey
1. **Account creation & auth:** User signs up via Clerk, lands in onboarding.
2. **Onboarding wizard:** Completes five contextual questions; data stored in Convex; summary shown for confirmation.
3. **Google Ads connect:** OAuth consent flow, scopes limited to campaign management; success returns to dashboard.
4. **Campaign preview:** AI-generated campaign displayed with ad copy, budget suggestions, and compliance notes; user approves to push/refresh draft.
5. **Dashboard monitoring:** Daily sync from Google Ads API shows impressions, clicks, calls/forms (via Google conversion tracking), cost, and estimated ROI.

## Tech Stack
- **Main Stack:** React Router v7 (app shell + SSR), Convex (data + AI request orchestration), Clerk (auth), Polar.sh (subscriptions), Resend (emails), OpenAI (ad generation), Vercel (hosting).
- **3rd Party APIs/Libraries:** Google Ads API (campaign drafts, conversion reporting), Stripe via Polar (billing), Tailwind (UI), React Hook Form/Zod (onboarding validation), Lucide (icons).


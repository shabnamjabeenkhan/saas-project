# Technical Design – AI Ads Copilot MVP

## Architecture Overview
- **Frontend:** React Router v7 app hosted on Vercel with SSR, using Tailwind for styling and ShadCN UI primitives. Clerk handles auth (session tokens, user profiles). Polar embeds provide subscription checkout. Convex client syncs state.
- **Backend:** Convex functions orchestrate onboarding persistence, OpenAI calls, and Google Ads API interactions. Supabase (Postgres) remains source of truth for billing and campaign metadata not suited for Convex. Polar webhooks update subscription status in Convex/Supabase. Resend handles transactional emails.
- **Data Flow:**
  1. User signs up via Clerk → Clerk JWT exchanged for Convex identity.
  2. Onboarding wizard writes to Convex `businessProfiles` table; Convex mirrors essential data into Supabase via service role if needed.
  3. User connects Google Ads → OAuth tokens stored encrypted in Supabase (service table) and referenced by Convex actions through Supabase client.
  4. Campaign generation request triggers Convex action: fetch onboarding data, call OpenAI for assets, build Google Ads payload, push campaign draft via Google Ads API, persist campaign snapshot in Supabase.
  5. Nightly job (Convex cron) pulls performance metrics from Google Ads Reporting API, stores summarized stats in Supabase `campaign_metrics`, surfaces via dashboard queries.
- **Deployment:** Vercel for frontend, Convex cloud for realtime backend, Supabase managed Postgres, Polar + Resend SaaS.

## Key Modules
- `app/routes/dashboard/*` – UI flows for onboarding, campaign preview, performance dashboard.
- `app/components/dashboard/*` – Shared UI components for cards, charts, nav.
- `convex/business.ts` (new) – Mutations/queries for onboarding data.
- `convex/googleAds.ts` (new) – Actions wrapping Google Ads API (campaign drafts, metrics sync).
- `convex/openai.ts` (new) – Action calling OpenAI with prompt templates.
- `convex/subscriptions.ts` – Extend to ingest Polar webhook events.
- `supabase` schema (via `db/schema/index.ts`) – Stores business profile, OAuth tokens, campaigns, metrics, invoices.

## Third-Party Integrations
- **Clerk:** OAuth for Google Ads connection (Clerk integration + custom Google Ads app). Use Clerk’s JWT to secure Convex calls.
- **Polar:** Subscription checkout links; listen to webhook events (`subscription.created`, `subscription.updated`). Sync tiers (`standard`, `premium`).
- **Google Ads API:** Use `CampaignService`, `AdGroupService`, `AdGroupAdService`. Draft mode (`CampaignExperimentService` optional) or set `status=DRAFT`. Reporting via `GoogleAdsService.search` with GAQL queries for conversions/cost.
- **OpenAI:** GPT-4o-mini or finetuned small model for ad copy generation. Prompt templates seeded with onboarding data and compliance rules.
- **Resend:** Send onboarding completion emails, campaign ready notifications.

## Security & Compliance
- Store Google Ads OAuth refresh tokens encrypted at rest in Supabase (pgcrypto or key management). Access tokens requested on demand within Convex action.
- Clerk session tokens validated server-side before performing Convex mutations.
- Implement Supabase RLS to ensure users only access their own records (roles per table defined in schema doc).
- Ad copy prompts include compliance guardrails: avoid instant-response claims, conditional Gas Safe messaging.
- Rate limit AI and Google Ads actions through Convex scheduler to prevent abuse.

## Monitoring & Observability
- Use Convex console metrics for backend operations and schedule jobs.
- Integrate Vercel Analytics for frontend usage.
- Hook Sentry (existing route) for error tracking.
- Log Google Ads API failures to Supabase `integration_logs` table with alerting via Resend email to ops.

## Open Questions / Future Considerations
- Whether to mirror all Convex data into Supabase vs. keep split responsibilities.
- Potential addition of BigQuery or Looker Studio for advanced reporting once data volume grows.
- Evaluate using Vertex AI or local models to reduce OpenAI dependency if campaign volume spikes.


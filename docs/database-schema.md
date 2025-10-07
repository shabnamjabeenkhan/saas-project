# Database Schema – AI Ads Copilot MVP

## Pricing Model Decision
- **Recurring Subscriptions only.** Product delivers continuous value (ongoing campaign monitoring & updates); fits utility SaaS profile. Stick with Standard (£69) and Premium (£189) tiers. Remove one-time payment tables if present; rely on Polar for billing.

## Tables & Relationships

### `users`
- **Purpose:** Core user record synced from Clerk.
- **Columns:** `id (UUID, pk)`, `clerk_user_id (text, unique)`, `email (text, unique)`, `full_name (text)`, `created_at (timestamptz)`.
- **Indexes:** `idx_users_clerk_user_id` (unique), `idx_users_email` (unique).
- **RLS:** `USING (auth.uid() = id)` for user role; service role bypass for system processes.

### `business_profiles`
- **Purpose:** Store onboarding answers.
- **Columns:** `id (UUID, pk)`, `user_id (UUID, fk -> users.id, on delete cascade)`, `trade_type (enum plumbing|electrical|both)`, `company_name (text)`, `phone (text)`, `website (text, nullable)`, `city (text)`, `service_radius_miles (int)`, `services (jsonb array)`, `availability (jsonb)`, `goals (jsonb)`, `created_at`, `updated_at`.
- **Indexes:** `idx_business_profiles_user_id` (btree), `idx_business_profiles_city` (btree) for future regional analytics.
- **RLS:** Allow owner read/write: `USING (auth.uid() = user_id)`.

### `google_ads_accounts`
- **Purpose:** Persist OAuth credentials & account metadata.
- **Columns:** `id (UUID, pk)`, `user_id (UUID, fk -> users.id, on delete cascade)`, `google_customer_id (text)`, `refresh_token (text encrypted)`, `access_token (text encrypted, nullable)`, `token_expiry (timestamptz)`, `scopes (text[])`, `created_at`, `updated_at`.
- **Indexes:** `idx_google_ads_accounts_user_id`.
- **RLS:** Owner access only; `refresh_token` encrypted via pgcrypto and only retrieved by backend service role.

### `campaigns`
- **Purpose:** Snapshot of AI-generated campaigns pushed to Google Ads.
- **Columns:** `id (UUID, pk)`, `user_id (UUID, fk -> users.id, on delete cascade)`, `google_ads_campaign_id (text)`, `name (text)`, `status (enum draft|enabled|paused)`, `daily_budget_minor_units (int)`, `objective (text)`, `ad_groups (jsonb)`, `keywords (jsonb)`, `ad_copy (jsonb)`, `compliance_notes (text)`, `created_at`, `updated_at`.
- **Indexes:** `idx_campaigns_user_id`, `idx_campaigns_google_ads_campaign_id`.
- **RLS:** Owner-only read; write limited to service role for sync updates.

### `campaign_metrics`
- **Purpose:** Store aggregated daily stats.
- **Columns:** `id (UUID, pk)`, `campaign_id (UUID, fk -> campaigns.id, on delete cascade)`, `date (date)`, `impressions (int)`, `clicks (int)`, `conversions (int)`, `conversion_value_minor_units (int)`, `cost_minor_units (int)`, `created_at`.
- **Indexes:** Composite `idx_campaign_metrics_campaign_date (campaign_id, date)` for reporting.
- **RLS:** Join via `campaigns` owner; policy: `USING (EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid()))`.

### `subscriptions`
- **Purpose:** Track Polar subscription linkage.
- **Columns:** `id (UUID, pk)`, `user_id (UUID, fk -> users.id, on delete cascade)`, `polar_subscription_id (text, unique)`, `plan (enum standard|premium)`, `status (enum active|trialing|past_due|canceled)`, `renewal_date (date)`, `created_at`, `updated_at`.
- **Indexes:** `idx_subscriptions_user_id`, `idx_subscriptions_status`.
- **RLS:** Owner read, service role write via Polar webhook ingestion.

### `invoices`
- **Purpose:** Store invoice records from Polar.
- **Columns:** `id (UUID, pk)`, `user_id (UUID, fk -> users.id, on delete cascade)`, `polar_invoice_id (text, unique)`, `amount_minor_units (int)`, `currency (text)`, `status (enum paid|open|void)`, `issued_at (timestamptz)`, `paid_at (timestamptz, nullable)`.
- **Indexes:** `idx_invoices_user_id`, `idx_invoices_status`.
- **RLS:** Owner read; service role insert/update.

### `integration_logs`
- **Purpose:** Audit external API interactions.
- **Columns:** `id (UUID, pk)`, `user_id (UUID, fk -> users.id, on delete cascade)`, `provider (enum google_ads|openai|polar|resend)`, `operation (text)`, `payload (jsonb)`, `response (jsonb)`, `status (enum success|failure)`, `created_at`.
- **Indexes:** `idx_integration_logs_user_id`, `idx_integration_logs_provider_status`.
- **RLS:** Owner read; service role write.

## Index Strategy Summary
- Frequent lookup by user → ensure each table has `user_id` btree index.
- Aggregation by date requires composite indexes on metrics.
- Unique constraints on external IDs to prevent duplication.

## RLS Strategy Summary
- Default deny all, explicitly allow owner read where applicable.
- Write operations via service role (Convex backend) using Supabase service key.
- Sensitive tokens only accessible by service role; users never query token columns directly.

## Migration Notes
- Drop one-time payment tables from base schema if currently present.
- Ensure enums (`trade_type`, `plan`, `status`) created via Supabase migrations.
- Enable pgcrypto extension for token encryption.


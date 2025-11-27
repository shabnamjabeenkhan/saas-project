# Progress: Real-Time Dashboard Metrics

## Current Status
Implementation phase - Backend API setup

## Completed
- ✅ Reviewed feature-plan.md thoroughly
- ✅ Created progress tracking file
- ✅ Understand implementation order from section 10
- ✅ convex/schema.ts - Added qualifiedCalls table with indexes (by_user, by_user_and_start, by_external_id)
- ✅ convex/schema.ts - Added adSpendSnapshots table with indexes (by_user_date, by_user)
- ✅ convex/schema.ts - Added metricsCache table with index (by_user_month)
- ✅ Verified Convex schema: `bunx convex dev --once` passed successfully
- ✅ convex/callTracking.ts - Created NEW FILE with recordCallEvent internal mutation
  - Implements idempotency via (provider, externalCallId) index
  - Applies qualification rules: answered && durationSeconds >= 30
  - Returns qualificationStatus ("qualified" | "unqualified") and qualificationReason
  - Verified Convex deployment: `bunx convex dev --once` passed successfully
- ✅ convex/http.ts - Added POST /call-tracking/webhook route
  - Route: POST /call-tracking/webhook
  - Calls ctx.runMutation(internal.callTracking.recordCallEvent, normalized)
  - Returns 200 quickly to avoid provider timeouts
  - Added mapProviderPayload helper function (generic mapping for MVP)
  - Added signature verification stub (TODO for provider-specific implementation)
  - Validates required fields before processing
  - Verified Convex deployment: `bunx convex dev --once` passed successfully
- ✅ convex/http.ts - Twilio provider integration COMPLETE
  - Implemented Twilio-specific payload mapping in mapProviderPayload()
  - Auto-detects Twilio by CallSid field (starts with "CA")
  - Handles both form-urlencoded (default) and JSON payload formats
  - Maps Twilio fields: CallSid, From, To, CallStatus, CallDuration, Timestamp
  - Converts CallStatus ("completed" = answered, others = not answered)
  - Converts RFC 2822 Timestamp to ms epoch timestamp
  - CallDuration only present in "completed" status (defaults to 0 otherwise)
  - HMAC-SHA1 signature verification placeholder (TWILIO_AUTH_TOKEN env var)
  - userId extraction: Supports AccountSid fallback, metadata.userId, or trackingNumber lookup (future)
  - Created setup guide: guides/twilio-setup.md
  - Removed CallRail-specific code (switched to Twilio due to better pricing for MVP)
  - Verified Convex deployment: `bunx convex dev --once` passed successfully
- ✅ convex/adSpend.ts - Created NEW FILE with refreshCurrentMonthIfStale action
  - Action: refreshCurrentMonthIfStale (checks freshness: 45 min threshold - optimized for MVP)
  - Helper: computeMonthDatesForUser() - computes month date range (defaults to Europe/London timezone)
  - Helper: getLatestSnapshotForUserMonth() - queries latest snapshot for freshness check
  - Fetches daily ad spend from Google Ads API using customer.report()
  - Query: metrics.cost_micros + segments.date for current month (firstOfMonth to todayDate)
  - Upserts daily snapshots via upsertDailySpend internalMutation (called via internal.adSpendMutations)
  - Returns { skipped: boolean, days: number, reason?: string }
  - Reuses Google Ads client pattern from googleAdsCampaigns.ts
  - Handles token refresh automatically via getGoogleAdsClient()
  - Created separate files: adSpendQueries.ts (query) and adSpendMutations.ts (mutation) due to "use node" restriction
  - Fixed: Changed freshness threshold from 15 to 45 minutes (reduces API calls by ~67%)
  - Fixed: Corrected internal mutation call from api.adSpendMutations to internal.adSpendMutations
  - Verified Convex deployment: `bunx convex dev --once --typecheck=disable` passed successfully
- ✅ convex/metrics.ts - Created NEW FILE with getDashboardMetrics query
  - Query: getDashboardMetrics (public query, not action)
  - Helper: computeMonthDatesForUser() - reused from adSpend.ts pattern
  - Aggregates qualified calls count for current month (filters by qualificationStatus === "qualified")
  - Sums ad spend MTD from adSpendSnapshots table (filters by monthKey and todayDate)
  - Gets averageRevenuePerJob from onboardingData.acquisitionGoals.averageJobValue
  - Calculates Cost Per Lead (CPL) = Ad Spend ÷ Qualified Calls (null if 0 calls)
  - Calculates Estimated ROI = (Qualified Calls × Average Revenue Per Job) − Ad Spend
  - Returns: { timeRange, qualifiedCalls, adSpend, costPerLead, estimatedRoi, lastUpdatedAt, hasRealData }
  - Includes proper return validator with v.object() and v.union() for nullable costPerLead
  - Verified Convex deployment: `bunx convex dev --once --typecheck=disable` passed successfully

## Current Work
- 🔄 Next: app/routes/dashboard/index.tsx - Wire UI to metrics query

## Blockers
- ⚠️ userId extraction in webhook: `mapProviderPayload` needs provider-specific logic to extract `userId`
  - Current: Supports AccountSid fallback, metadata.userId, or raw.userId
  - TODO: Implement trackingNumber lookup table for userId resolution (recommended approach)
  - For MVP: Use trackingNumber lookup table mapping Twilio phone numbers to userIds
  - See guides/twilio-setup.md Step 8 for userId setup options

## Next Steps
1. ✅ convex/schema.ts - DONE
2. ✅ convex/callTracking.ts - DONE
3. ✅ convex/http.ts - DONE
4. ✅ convex/adSpend.ts - DONE
5. ✅ convex/metrics.ts - DONE
6. ⏭️ app/routes/dashboard/index.tsx - Wire UI
7. ⏭️ Manual testing (section 9 of feature-plan.md)

## Key Decisions
- Starting with schema first (no dependencies)
- Following feature-plan.md section 10 order exactly
- Using Cursor Composer 1 for implementation
- Fixed typo in metricsCache index: changed from ["userId, monthKey"] to ["userId", "monthKey"]
- recordCallEvent uses internalMutation (not public mutation) - only callable from HTTP actions
- **Freshness threshold: 45 minutes** (optimized for MVP - reduces API calls by ~67% vs 15 minutes)
  - 15 minutes: ~96 API calls/day per user
  - 45 minutes: ~32 API calls/day per user
  - Still updates frequently enough for dashboard metrics
- **Chose Twilio as call tracking provider** (switched from CallRail due to better pricing for MVP)
  - Twilio: $1.15/mo (phone) + pay-as-you-go ($0.0085/min inbound), free trial (no CC required)
  - CallRail: $45/mo minimum subscription (too expensive for low-volume MVP)
  - Nimbata: $120/mo Agency plan required for webhooks (too expensive for MVP)
- Twilio integration: Auto-detects provider by payload structure (CallSid field starting with "CA")
- Payload format: Form-urlencoded by default (can also be JSON)
- userId extraction: Uses trackingNumber lookup (recommended) or AccountSid fallback
- Signature verification: HMAC-SHA1 with base64 encoding (TWILIO_AUTH_TOKEN env var, placeholder implementation)

## Key Learning
- Schema validation successful - all tables and indexes created correctly
- Convex automatically stages indexes during schema push
- Pre-existing TypeScript errors in docs/landing-page/tailus-dashboard don't affect Convex schema
- Internal mutations follow same pattern as other Convex functions (import from _generated/server)
- Qualification logic is straightforward: answered && durationSeconds >= 30
- HTTP routes follow httpRouter pattern - add route before export default http
- mapProviderPayload is intentionally pure (no Convex context) for easy unit testing
- **Twilio Research Findings**:
  - Twilio webhooks available on all plans, free trial (no CC required)
  - Status callback fires when call completes (configurable events: initiated, ringing, answered, completed)
  - Payload format: Form-urlencoded by default (can also be JSON)
  - Payload fields: CallSid (starts with "CA"), From, To, CallStatus, CallDuration (seconds, only in completed), Timestamp (RFC 2822)
  - CallStatus values: "queued", "ringing", "in-progress", "completed", "busy", "failed", "no-answer", "canceled"
  - Signature verification: HMAC-SHA1 with base64 encoding, uses Auth Token (X-Twilio-Signature header)
  - Pricing: $1.15/mo (phone) + $0.0085/min (inbound calls) - pay-as-you-go, no monthly subscription
  - API docs: https://www.twilio.com/docs/voice/api/call-resource#statuscallback
- **Convex "use node" restriction**:
  - Files with "use node" can only export actions (not queries or mutations)
  - Solution: Split adSpend.ts into three files:
    - adSpend.ts ("use node") - contains action and helpers
    - adSpendQueries.ts (no "use node") - contains getSnapshotsForMonth query
    - adSpendMutations.ts (no "use node") - contains upsertDailySpend mutation
  - Actions can call queries/mutations via ctx.runQuery() and ctx.runMutation()
- **Google Ads API integration**:
  - Uses customer.report() with entity: "customer", metrics: ["metrics.cost_micros"], segments: ["segments.date"]
  - Response structure: rows with row.segments.date and row.metrics.cost_micros
  - Date format: "YYYY-MM-DD" strings
  - Spend format: micros (need to divide by 1,000,000 for currency)
  - Token refresh handled automatically by getGoogleAdsClient() helper

## Context Management
- Last updated at: After metrics.ts implementation
- Current context usage: ~50%
- Will compact at 40-60%

## Setup Required
- 📋 **Twilio Setup Guide**: See `guides/twilio-setup.md` for complete setup instructions
- User needs to: Sign up (free trial) → Get phone number → Configure Status Callback URL → Get Auth Token → Set up tracking number lookup for userId → Test
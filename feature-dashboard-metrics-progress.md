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

## Current Work
- 🔄 Next: convex/adSpend.ts - Create refreshCurrentMonthIfStale action

## Blockers
- ⚠️ userId extraction in webhook: mapProviderPayload needs provider-specific logic to extract userId
  - Current: Generic placeholder that checks raw.userId, raw.metadata?.userId
  - TODO: Implement trackingNumber lookup or provider metadata parsing
  - This is expected per feature plan (section 5.2) - provider-specific mapping is TBD

## Next Steps
1. ✅ convex/schema.ts - DONE
2. ✅ convex/callTracking.ts - DONE
3. ✅ convex/http.ts - DONE
4. ⏭️ convex/adSpend.ts - Action (CREATE NEW FILE)
5. ⏭️ convex/metrics.ts - Query
6. ⏭️ app/routes/dashboard/index.tsx - Wire UI
7. ⏭️ Manual testing (section 9 of feature-plan.md)

## Key Decisions
- Starting with schema first (no dependencies)
- Following feature-plan.md section 10 order exactly
- Using Cursor Composer 1 for implementation
- Fixed typo in metricsCache index: changed from ["userId, monthKey"] to ["userId", "monthKey"]
- recordCallEvent uses internalMutation (not public mutation) - only callable from HTTP actions
- Webhook route uses generic payload mapping for MVP (provider-specific logic TBD)
- Signature verification stub added (can be implemented when provider is chosen)

## Key Learning
- Schema validation successful - all tables and indexes created correctly
- Convex automatically stages indexes during schema push
- Pre-existing TypeScript errors in docs/landing-page/tailus-dashboard don't affect Convex schema
- Internal mutations follow same pattern as other Convex functions (import from _generated/server)
- Qualification logic is straightforward: answered && durationSeconds >= 30
- HTTP routes follow httpRouter pattern - add route before export default http
- mapProviderPayload is intentionally pure (no Convex context) for easy unit testing

## Context Management
- Last updated at: After http.ts webhook route implementation
- Current context usage: ~25%
- Will compact at 40-60%
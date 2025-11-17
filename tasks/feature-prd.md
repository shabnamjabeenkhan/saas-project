# PRD: Real-Time Dashboard Metrics

## Introduction/Overview

This feature introduces a real-time metrics dashboard for TradeBoost AI users to monitor the performance of their Google Ads campaigns. The dashboard will display three primary metrics in tile format: Qualified Calls (leads), Ad Spend (current month), and Cost Per Lead. An additional estimated ROI metric will be shown as subtext below the main tiles.

**Problem**: TradeBoost AI users currently lack visibility into their campaign performance and lead generation effectiveness. Without real-time data on qualified calls, ad spend, and cost per lead, users cannot make informed decisions about their marketing budget or assess ROI.

**Goal**: Provide users with an at-a-glance view of their campaign performance to enable data-driven budget decisions and demonstrate the value of TradeBoost AI's service.

## Goals

1. Display real-time qualified call counts updated instantly via call tracking webhooks
2. Show near real-time current month ad spend from Google Ads API
3. Calculate and display cost per lead (Ad Spend ÷ Qualified Calls) automatically
4. Provide estimated ROI visualization based on user-configured revenue per lead
5. Enable users to monitor campaign performance without leaving the TradeBoost AI dashboard

## User Stories

**As a TradeBoost AI user**, I want to see how many qualified customer calls I've received this month so that I can understand if my ads are generating real business opportunities.

**As a TradeBoost AI user**, I want to monitor my current month's ad spend in real-time so that I can stay within my monthly budget and avoid overspending.

**As a TradeBoost AI user**, I want to see my cost per lead calculated automatically so that I can quickly assess whether my marketing investment is efficient.

**As a TradeBoost AI user**, I want to see an estimated ROI based on my qualified calls so that I can justify my marketing spend and understand the potential business value.

**As a new TradeBoost AI user**, I want to configure my average revenue per job during onboarding so that the estimated ROI calculation reflects my business reality.

## Functional Requirements

### Dashboard Display

1. The dashboard must display three primary metric tiles in a horizontal layout:
   - **Qualified Calls**: Total count of qualified calls for the current month
   - **Ad Spend**: Total amount spent on Google Ads for the current month (in USD)
   - **Cost Per Lead**: Calculated value (Ad Spend ÷ Qualified Calls) in USD

2. Each tile must show:
   - Metric name (label)
   - Current value (large, prominent display)
   - Last updated timestamp

3. Below the three main tiles, the dashboard must display a subtext line showing:
   - **Estimated ROI**: Calculated as `(Qualified Calls × Average Revenue Per Job) - Ad Spend`
   - Must include the word "Estimated" clearly visible next to "ROI"

### Qualified Calls Tracking

4. The system must count a phone call as "qualified" only when:
   - The call is answered (not missed/voicemail)
   - The call duration is greater than or equal to 30 seconds

5. The system must receive call data via webhook from the call tracking provider

6. The qualified call count must update in real-time (within 5 seconds of webhook receipt)

7. Calls that do not meet the qualification criteria (unanswered or <30 seconds) must not be counted

### Ad Spend Tracking

8. The system must fetch ad spend data from the Google Ads API

9. Ad spend must reflect the current month-to-date (MTD) total, resetting on the 1st of each month

10. Ad spend data must update near real-time (within 15 minutes of actual spend)

11. Ad spend must be displayed in USD with two decimal places (e.g., $1,234.56)

### Cost Per Lead Calculation

12. The system must automatically calculate Cost Per Lead as: `Ad Spend ÷ Qualified Calls`

13. When there are 0 qualified calls, the Cost Per Lead tile must display "N/A" instead of a dollar amount

14. Cost Per Lead must be displayed in USD with two decimal places (e.g., $45.67)

15. Cost Per Lead must recalculate automatically whenever Ad Spend or Qualified Calls updates

### Estimated ROI Calculation

16. The system must calculate Estimated ROI as: `(Qualified Calls × Average Revenue Per Job) - Ad Spend`

17. The Average Revenue Per Job value must be configured by the user during onboarding

18. Users must be able to update their Average Revenue Per Job value in account settings

19. When there are 0 qualified calls, display "$0.00" for estimated ROI (showing negative ad spend impact)

20. Estimated ROI must be displayed in USD with two decimal places, including negative values (e.g., -$500.00 or +$2,345.67)

### Phone Number Integration

21. When a user pushes a campaign to Google Ads, their tracking phone number must be included as a call extension in the ad

22. Each user must have a unique tracking phone number associated with their account

### Data Persistence

23. The system must store all qualified call records with metadata (timestamp, duration, phone number, qualification status)

24. The system must store daily ad spend snapshots for historical reference

25. The system must maintain month-to-date aggregations that reset on the 1st of each month

## Non-Goals (Out of Scope)

1. **Historical data visualization**: This MVP will not include charts, graphs, trend lines, or historical comparisons. Only current month-to-date numbers will be shown.

2. **Custom date ranges**: Users cannot select custom date ranges. The dashboard will only show current month data.

3. **Previous month comparisons**: No "vs. last month" or period-over-period comparison features.

4. **Multiple campaign tracking**: This MVP assumes one active campaign per user; no campaign-level breakdown.

5. **Call recording or transcription**: Only call metadata (duration, answered status) will be tracked, not call content.

6. **Automated budget alerts**: No notifications when approaching budget limits (future enhancement).

7. **Export/reporting features**: No ability to download reports or export data.

8. **Mobile app**: Dashboard will be web-only; responsive design is not required for this MVP.

## Design Considerations

### UI Layout
- Three equal-width tiles displayed horizontally on desktop
- Each tile should have clear visual hierarchy: label (small), value (large), last updated (tiny)
- Estimated ROI subtext should be visually de-emphasized but clearly readable
- Consider using color coding: green for positive ROI, red for negative ROI
- Use existing TradeBoost AI design system components and styling

### UX Requirements
- Display loading states while fetching initial data
- Show "Setting up..." state for new users with 0 calls and 0 spend
- Include tooltip or info icon explaining how "Qualified Call" is defined (≥30 sec, answered)
- Include tooltip explaining Estimated ROI calculation methodology
- Ensure "Estimated" label is prominent to set user expectations

### Onboarding Flow
- Add a step during user onboarding to capture "Average Revenue Per Job"
- Provide context/examples to help users estimate this value (e.g., "What's the typical value of a completed job for your business?")
- Make this field editable in account settings post-onboarding

## Technical Considerations

### Integrations Needed
1. **Call Tracking Webhook** (to be built):
   - Implement webhook endpoint to receive call events
   - Parse call data (duration, answered status, timestamp, tracking number)
   - Validate webhook authenticity (signature verification)
   - Apply qualification rules (answered + ≥30 sec)
   - Store qualified call records in database
   - Trigger real-time dashboard update

2. **Google Ads API Integration** (existing):
   - Leverage existing Google Ads API connection
   - Fetch current month ad spend on a scheduled basis (every 10-15 minutes)
   - Handle API rate limits and errors gracefully
   - Store daily spend snapshots

### Data Model Requirements
- `qualified_calls` table: user_id, call_timestamp, duration, phone_number, tracking_number, status
- `ad_spend_snapshots` table: user_id, date, cumulative_spend, last_updated
- `user_settings` table: add `average_revenue_per_job` field (decimal)
- `tracking_numbers` table: user_id, phone_number, campaign_id, created_at

### Real-Time Updates
- Consider using WebSockets or Server-Sent Events (SSE) for real-time call updates
- Alternatively, implement short-polling (every 5-10 seconds) if real-time infrastructure isn't available
- Ensure dashboard auto-refreshes when new data arrives

### Performance Considerations
- Cache current month aggregations in Redis or similar for fast reads
- Pre-calculate Cost Per Lead and Estimated ROI rather than computing on every page load
- Index database queries by user_id and month for efficient MTD calculations

### Error Handling
- Handle Google Ads API downtime gracefully (show last known value with timestamp)
- Handle webhook delivery failures (implement retry logic)
- Display user-friendly error messages when data cannot be fetched
- Log all errors for debugging

## Success Metrics

1. **Primary Metric**: **Cost Per Lead visibility** - 100% of active users can view their cost per lead within 24 hours of first qualified call

2. **Real-time accuracy**: Qualified calls appear in dashboard within 5 seconds of call end for 95% of calls

3. **Data freshness**: Ad spend data is no more than 15 minutes old 99% of the time

4. **User engagement**: 70% of active users check dashboard at least once per week

5. **Onboarding completion**: 90% of new users complete the "Average Revenue Per Job" configuration during onboarding

6. **Reduction in support queries**: 30% reduction in "How much have I spent?" and "How many leads did I get?" support tickets

## Edge Cases & Potential Challenges

### Edge Cases

1. **Zero qualified calls scenario**:
   - Cost Per Lead displays "N/A"
   - Estimated ROI shows negative ad spend (e.g., -$500.00)
   - Provide helpful messaging: "No qualified calls yet. Calls must be answered and last at least 30 seconds."

2. **First day of month scenario**:
   - All metrics reset to 0 at midnight on the 1st
   - Previous month data is archived but not displayed in this MVP
   - User sees all zeros until first activity of new month

3. **User changes Average Revenue Per Job mid-month**:
   - Estimated ROI recalculates immediately using new value
   - No historical recalculation (applies new value to all current qualified calls)
   - Consider showing when this value was last updated

4. **Multiple calls in rapid succession**:
   - Webhook must handle concurrent call events without race conditions
   - Ensure accurate counting (no duplicates, no missed calls)

5. **Timezone handling**:
   - "Current month" must respect user's timezone (not server timezone)
   - Month rollover happens at midnight in user's local time
   - Ad spend API may return data in different timezone (normalize to user timezone)

6. **Spam call filtering**:
   - Current rule: <30 seconds = spam/robocall
   - May need to adjust threshold based on user feedback
   - Consider making duration threshold configurable per user in future

7. **New user with no campaigns**:
   - If user hasn't pushed a campaign yet, show empty state
   - Provide CTA to create first campaign
   - Don't show "N/A" or "$0.00" - show "Get Started" messaging

8. **Google Ads account disconnection**:
   - If OAuth token expires or is revoked, ad spend cannot update
   - Show clear error message prompting user to reconnect
   - Maintain last known values while disconnected (with timestamp)

### Potential Challenges

1. **Call tracking provider selection & integration**:
   - Need to choose and set up call tracking service (e.g., CallRail, DialogTech)
   - Webhook format will depend on provider choice
   - May need to purchase/provision tracking phone numbers

2. **Google Ads API rate limits**:
   - API has strict rate limits; fetching every 10-15 min may require careful quota management
   - May need to implement exponential backoff on failures
   - Consider batching requests if managing multiple users

3. **Accuracy of "near real-time" ad spend**:
   - Google Ads API may have inherent delays in reporting spend data
   - Set user expectations appropriately ("updated every 15 minutes")
   - Actual spend may lag by 30-60 minutes in Google's system

4. **Handling partial months for new users**:
   - User who signs up mid-month sees partial month data
   - Ensure calculations are still meaningful (MTD, not full month projections)

5. **Database write load from webhooks**:
   - High-volume users may generate many call events
   - Ensure database can handle write throughput
   - Consider queueing webhook processing if volume is high

6. **Calculating ROI for multi-call jobs**:
   - Current assumption: 1 qualified call = 1 job = 1 revenue event
   - Reality: some jobs may require multiple calls, or some calls may not convert
   - This is why "Estimated" is critical in the label - it's a rough indicator

7. **Currency conversion**:
   - Assuming all users operate in USD for MVP
   - Future: may need to support other currencies if expanding internationally

8. **Security of webhook endpoint**:
   - Must validate webhook signatures to prevent spoofing
   - Implement rate limiting to prevent DoS attacks on webhook endpoint
   - Use HTTPS and secure storage of webhook secrets

## Open Questions

1. Which call tracking provider will be used? (e.g., CallRail, Twilio, DialogTech)

2. How are tracking phone numbers provisioned - automatically on campaign creation, or manual setup?

3. Should there be a "demo mode" for new users to see sample data before their first campaign?

4. What happens to qualified calls data when a user churns/cancels? (data retention policy)

5. Should admin users be able to see aggregated metrics across all users?

6. Is there a maximum ad spend budget that should trigger warnings (even if out of MVP scope)?

7. How should we handle refunds or adjustments to Google Ads spend? (recalculate retroactively or ignore)

8. Should the Average Revenue Per Job field support different values for different service types/categories in the future?

---

## Implementation Notes for Developer

- Start with static dashboard UI first (hardcoded values) to validate design
- Implement database schema and migrations for call tracking and ad spend
- Build webhook endpoint with thorough testing (use webhook testing tools)
- Integrate Google Ads API for spend data (ensure existing OAuth flow works)
- Add real-time update mechanism (WebSockets or polling)
- Implement onboarding step for Average Revenue Per Job
- Add comprehensive error handling and logging
- Test all edge cases listed above
- Ensure all timestamps are timezone-aware
- Write unit tests for calculation logic (especially Cost Per Lead and ROI)

**Priority**: High - This is a key differentiator for demonstrating value to TradeBoost AI users.

**Estimated Effort**: 3-4 weeks for full implementation including testing and integration work.

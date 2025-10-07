# User Flows – AI Ads Copilot MVP

## 1. Onboarding & Campaign Creation (Owner-Operator)
1. Sign up via Clerk → email verified.
2. Land on onboarding wizard; complete five steps (trade, contact, service radius, services, goals/availability).
3. Review summary → submit → Convex stores profile; confirmation toast.
4. Prompted to connect Google Ads → OAuth consent → return success.
5. AI campaign generation kicks off; loading state with compliance reminder.
6. Campaign preview screen displays ad copy, keywords, budget; user clicks “Create Draft”.
7. Draft pushed to Google Ads; success modal with link to Google Ads and dashboard overview.

## 2. Dashboard Monitoring (Owner-Operator)
1. After draft creation, daily login shows performance cards (impressions, clicks, conversions, cost, est. ROI).
2. User can toggle between 7/30 day windows; charts update from `campaign_metrics`.
3. “Optimize” button triggers regenerate flow (reuses onboarding data, calls OpenAI/Google Ads).

## 3. Subscription Management (Owner-Operator)
1. Navigate to billing tab → embed Polar portal shows current plan.
2. Upgrade/downgrade handled via Polar checkout; on completion webhook updates `subscriptions` table.
3. UI reflects new status instantly via Convex subscription query.

## 4. Campaign Refresh Flow (Ops Manager)
1. From dashboard, click “Refresh Copy”.
2. Modal asks for focus (e.g., “push emergency jobs”).
3. Submit triggers OpenAI regeneration; diff view shows old vs new headlines/descriptions.
4. Approve to push update to same Google Ads campaign; log entry created in `integration_logs`.

## 5. Alert Handling (Ops Manager)
1. Automated job detects `cost > conversions_value` threshold.
2. Sends Resend email summarizing issue + CTA to pause in Google Ads.
3. Dashboard surfaces alert banner until acknowledged.


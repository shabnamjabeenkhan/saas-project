### Tap Payments integration for UAE/MENA (and how it coexists with Polar)

This guide explains how to operate payments in the UAE/GCC using Tap Payments in this boilerplate, and how to run Tap alongside the existing Polar integration.

Key takeaways:
- **This repo already works in the UAE with Polar** (cards + Apple/Google Pay through Stripe rails, Merchant of Record). No changes required for basic card-first subscription products.
- **Tap is recommended when you need local GCC rails** (e.g., mada, KNET, Benefit/BenefitPay, NAPS/QPay) and higher regional acceptance.
- **You can run both**: keep Polar for international/MoR and add Tap for MENA-local methods or card recurring. Route users/gateways by market or BIN ranges.

---

### When to use which

- **Polar-only (default here)**: Fastest to ship; Polar is MoR and handles global tax; ideal if cards + wallets suffice in UAE.
- **Tap-only**: Needed if you must support GCC local methods and want a single regional gateway. You will own invoicing/tax instead of MoR.
- **Dual-gateway (Polar + Tap)**: Keep Polar for international + MoR and add Tap for MENA-specific payment rails and/or better acceptance. Choose gateway by user country, BIN, or product.

---

### Supported methods and recurring (Tap specifics)

- Tap supports global cards and GCC local methods (examples: **KNET (KW)**, **Benefit/BenefitPay (BH)**, **NAPS/QPay (QA)**, **Apple Pay** in supported countries, plus cards in **UAE**). See method docs below.
- Recurring/subscriptions with Tap are performed via saved cards + a **Payment Agreement ID**. Some local redirect methods (e.g., KNET, Benefit) **do not support recurring**; use cards for recurring, use local methods for one-time purchases.

References:
- Recurring: `https://developers.tap.company/docs/recurring-payments`
- Web Card SDK: `https://developers.tap.company/docs/card-sdk-web-v2`
- Apple Pay: `https://developers.tap.company/docs/apple-pay`
- Webhooks: `https://developers.tap.company/docs/webhook`
- KNET: `https://developers.tap.company/docs/knet`
- Benefit/BenefitPay: `https://developers.tap.company/docs/benefit`, `https://developers.tap.company/docs/benefitpay-web-sdk`
- NAPS/QPay: `https://developers.tap.company/docs/qpay`

---

### Architecture in this repo today

- Polar integration lives in Convex (`convex/subscriptions.ts`), webhooks are routed via `convex/http.ts` at `/payments/webhook`. Pricing pages redirect to a Polar Checkout URL.
- Database schema in `convex/schema.ts` has a `subscriptions` table with `polar*` columns.

To add Tap, we won’t remove Polar. We’ll add Tap endpoints and map events into either the same `subscriptions` table (with gateway-aware fields) or a new `tapSubscriptions` table. Below shows both options; pick one.

---

### Minimal Tap integration plan (no code here; just steps)

1) Add configuration and env
- App feature flag: add `features: { tap: true }` in `config.ts` (next to `payments`), to toggle Tap UI and backend routes.
- Environment variables:
  - `TAP_SECRET_KEY` (server)
  - `TAP_PUBLIC_KEY` (client, if using Web Card SDK)
  - `TAP_WEBHOOK_SECRET` (if configured; otherwise, secure via a long random webhook path and dashboard auth)
  - For Apple Pay (optional): follow CSR/CER process and domain verification per Tap docs.

2) Schema strategy
- Option A (extend existing table): add fields to `subscriptions`:
  - `gateway: "polar" | "tap"`
  - `tapChargeId`, `tapCustomerId`, `tapCardId`, `tapPaymentAgreementId`
  - `status`, `currency`, `amount`, `interval`, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`
  - Index by `tapPaymentAgreementId` and/or `tapChargeId` for fast lookups.
- Option B (new table): create `tapSubscriptions` with the fields above and link to `users`.

3) Checkout and save card (first subscription)
- Goal: establish a saved card and capture a **Payment Agreement ID** to enable recurring without 3DS.
- Two common flows:
  - Web Card SDK (embedded): use Tap Web Card SDK v2 to tokenize card; call your Convex action to create a Charge with `save_card=true` and your `post`/`redirect` URLs. The first charge will run 3DS if required. On success, persist `tapCustomerId`, `tapCardId`, and `tapPaymentAgreementId` from the response.
  - Hosted redirect (Checkout): create a hosted charge with `save_card=true` and a `redirect.url`. On return, confirm success and persist the same identifiers.
- Important: For recurring, make sure the first successful transaction stores `payment_agreement.id` (Tap’s Payment Agreement) in your DB.

4) Recurring charge (renewals)
- Per Tap docs, for merchant‑initiated recurring:
  - Generate a fresh token from the saved card (Tap tokens are one‑time and expire in ~5 minutes).
  - Create a charge with:
    - `source.id = <token>`
    - `customer_initiated = false` (merchant‑initiated)
    - `payment_agreement.id = <saved payment agreement id>`
  - Amount/currency/metadata as needed.
- Handle response immediately, but treat webhooks as source of truth.
- Note: Some local methods do not support recurring; use card rails for subscriptions.

5) Webhooks in Convex
- Add an HTTP route, e.g., `/tap/webhook` in `convex/http.ts` via `httpAction`. Verify the request per Tap dashboard settings (shared secret or allowed sources) and parse the JSON.
- Idempotency: store a unique webhook identifier (e.g., event ID or `reference.order/transaction`) in a `webhookEvents` table (you already have one) and skip duplicates.
- Event mapping (example statuses you’ll see on charges): `AUTHORIZED`, `CAPTURED` (paid), `FAILED`, `CANCELLED`. Use the `status` and charge data to update your subscription:
  - On paid/captured: set `status = active`, set `currentPeriodStart/End` and any other billing metadata.
  - On failed: mark `incomplete` or `past_due`; schedule retry.
  - On cancelled/refunded: mark `canceled` and set `canceledAt`.
- Keep Polar’s webhook at `/payments/webhook` unchanged.

6) Apple Pay (optional)
- Enable Apple Pay on your Tap account, complete CSR/CER and domain verification as per docs, and surface the Apple Pay button where available. For web, Apple Pay requires Safari and an eligible device.
- Reference: Apple Pay doc above.

7) Cron for renewals (Convex)
- Use Convex `crons` to run daily and find subscriptions due for renewal.
- For each active Tap subscription due: generate token, charge with `customer_initiated=false` and `payment_agreement.id`, then rely on the webhook to finalize state.
- Log and retry transient failures with exponential backoff; notify the user for hard declines.

8) Dual-gateway selection logic
- Introduce a `gateway` field per subscription and a selection strategy:
  - By region (IP/country), by BIN, or by user/org setting.
  - Example: UAE + international → Polar; Saudi/Kuwait/Bahrain/Qatar wanting local methods → Tap.
- Catalog/price mapping:
  - Polar products/prices live in Polar; Tap amounts/currencies are passed per charge.
  - Maintain a small map so the same plan can route to either gateway with corresponding amounts.

9) Client UI notes
- Pricing pages: add buttons for “Pay with card (Polar)” vs “Pay with local methods (Tap)” if you expose both; or auto‑route based on selection/region.
- Dashboard “Manage Subscription”: for Tap, link to your internal billing page (Tap does not provide the same MoR portal as Polar). For Polar, keep the existing portal flow.

10) Compliance/operational
- Polar (MoR) handles global sales taxes. Tap (you are merchant) means you handle VAT/gulf taxes, invoicing, and refunds policies. Consider Stripe Tax alternative if you switch to Stripe Billing instead of MoR.

---

### Testing checklist

- Sandbox keys in `.env.local`; feature flags: `payments` (Polar) and `tap` (Tap) in `config.ts`.
- First-time charge with `save_card=true` succeeds and returns `payment_agreement.id`.
- Webhook receives CAPTURED success → subscription becomes `active`.
- Cron-initiated recurring creates token and recharges with `customer_initiated=false`.
- Failure paths: declines, 3DS failures, webhook retry/idempotency.
- Apple Pay button renders where supported and charges succeed.

---

### FAQs

Q: Can I keep Polar and just add Tap for GCC locals?
- Yes. Keep Polar for global/MoR and add Tap for local methods or card recurring in MENA. Use a `gateway` column and route.

Q: Do I need to drop Polar to use Tap?
- No. They can coexist. Choose per plan, region, or user preference.

Q: Do Tap local methods support subscriptions?
- Generally no for redirect locals like KNET/Benefit. Use cards for recurring; use locals for one‑time.

Q: Does this work in UAE?
- Yes. Cards + Apple/Google Pay work today (Polar). Tap adds regional rails if needed.

---

### References

- Stripe in UAE (products/methods): `https://support.stripe.com/questions/which-payments-methods-and-products-are-available-in-the-uae`
- Polar supported countries / MoR & Connect: `https://docs.polar.sh/merchant-of-record/supported-countries`
- Tap Recurring Payments: `https://developers.tap.company/docs/recurring-payments`
- Tap Web Card SDK v2: `https://developers.tap.company/docs/card-sdk-web-v2`
- Tap Apple Pay: `https://developers.tap.company/docs/apple-pay`
- Tap Webhooks: `https://developers.tap.company/docs/webhook`
- Tap KNET: `https://developers.tap.company/docs/knet`
- Tap Benefit & BenefitPay: `https://developers.tap.company/docs/benefit`, `https://developers.tap.company/docs/benefitpay-web-sdk`
- Tap NAPS/QPay: `https://developers.tap.company/docs/qpay`



# Payments Setup - Adding Subscription Billing

**VIDEO LENGTH**: 5:00
**HOOK**: "Let's add the ability for users to pay you. This transforms your app from free tool to revenue-generating SaaS business."

---

[OPENING - 0:00-0:20]
"Users can sign up and use your app - great! Now let's add payments so you can actually monetize your product. We'll use Polar.sh for subscription billing.

By the end of this video, users will be able to subscribe to paid plans and you'll have a working payment system."

[WHY PAYMENTS MATTER - 0:20-0:50]
"Payments turn your app into a business:

- **Revenue generation**: Users pay for value
- **Product validation**: People vote with their wallets
- **Sustainability**: Fund continued development
- **Scalability**: Pay-as-you-grow pricing

Polar.sh handles all the complexity: subscriptions, webhooks, pricing pages, payment processing."

[UPDATE CONFIGURATION - 0:50-1:10]
"Enable payments in config.ts:

```typescript
export const config: AppConfig = {
  features: {
    auth: true,
    payments: true,      // ✅ Enable payments
    convex: true,
    email: false,
    monitoring: false,
  },
  services: {
    polar: {
      enabled: true,
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      organizationId: process.env.POLAR_ORGANIZATION_ID,
      webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
    },
  },
  ui: {
    showPricing: true,   // ✅ Show pricing page
  },
};
```"

[SET UP NGROK FOR WEBHOOKS - 1:10-1:45]
"Webhooks need HTTPS - ngrok provides this:

1. **Start ngrok:**
```bash
ngrok http 5173
```
Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

2. **Update environment:**
```bash
# .env.local
FRONTEND_URL=https://abc123.ngrok.io
```

3. **Update Vite config:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    allowedHosts: ["abc123.ngrok.app"],
  },
});
```"

[CONFIGURE POLAR.SH - 1:45-2:30]
"Polar handles all billing complexity:

1. **Get API credentials:**
- POLAR_ACCESS_TOKEN: Settings → Developers → New Token
- POLAR_ORGANIZATION_ID: Settings → Profile → Identifier
- Set POLAR_SERVER=sandbox for development

2. **Add to Convex environment variables:**
- All Polar variables plus FRONTEND_URL

3. **Set up webhook:**
- Get Convex HTTP URL (ends in .convex.site)
- Polar Dashboard: Webhooks → Add Endpoint
- URL: https://your-deployment.convex.site/payments/webhook
- Generate webhook secret and add to Convex env"

[CREATE SUBSCRIPTION PRODUCTS - 2:30-3:00]
"Set up your pricing in Polar:

1. **Create organization** (if needed)
2. **Add subscription products:**
   - Name: "Pro Plan"
   - Price: $9.99/month
   - Features: Whatever your app offers
3. **Configure pricing tiers**
4. **Set up test products** for development"

[TEST PAYMENT FLOW - 3:00-4:00]
"Let's test end-to-end:

1. **Restart servers:**
```bash
bun run dev
npx convex dev  # separate terminal
```

2. **Test with ngrok URL:**
- Use https://abc123.ngrok.io in browser
- Sign up/login
- Go to pricing page
- Click subscribe

3. **Use test payment card:**
- Number: 4242 4242 4242 4242
- Any future expiry
- Any CVC (123)

4. **Verify success:**
- Should redirect to success page
- Check dashboard for subscription status
- Data should sync to Convex database"

[WHAT THIS ENABLES - 4:00-4:30]
"With payments working, you now have:

✅ Subscription billing system
✅ Multiple pricing tiers
✅ Payment processing
✅ Webhook integration
✅ Revenue tracking
✅ Customer management

Your app is now a monetizable SaaS business!"

[COMMON ISSUES - 4:30-4:45]
"Most issues are webhook/configuration related:

- **ngrok URL changed**: Update all references
- **Wrong environment variables**: Double-check Convex dashboard
- **Webhook secret missing**: Must be in Convex environment
- **Sandbox mode**: Use POLAR_SERVER=sandbox
- **Test cards only**: Real cards don't work in sandbox"

[NEXT STEPS - 4:45-5:00]
"Perfect! Users can now pay for your service. Next: Email Setup - we'll add transactional emails so you can communicate with customers.

You now have the complete SaaS foundation: auth + database + payments + email = professional product.

See you in the email setup video!"

---

**VISUAL NOTES**:
- Polar.sh dashboard walkthrough
- ngrok setup demonstration
- Webhook configuration steps
- Live payment flow testing
- Test card input demo
- Before/after subscription status
- Revenue dashboard preview

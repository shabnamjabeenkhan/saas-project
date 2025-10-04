# Email Setup - Adding Transactional Emails

**VIDEO LENGTH**: 4:30
**HOOK**: "Let's add the ability to send emails to your users. This enables welcome messages, password resets, payment confirmations - all the professional touches users expect."

---

[OPENING - 0:00-0:20]
"Your app has users and payments - excellent! Now let's add email functionality so you can communicate professionally with your customers.

By the end of this video, you'll be able to send welcome emails, password resets, payment confirmations, and any other transactional emails your app needs."

[WHY EMAIL MATTERS - 0:20-0:50]
"Email is critical for SaaS products:

- **User onboarding**: Welcome emails convert trials to users
- **Password recovery**: Users forget passwords, need reset links
- **Payment confirmations**: Builds trust and provides receipts
- **Marketing**: Newsletters, updates, feature announcements
- **Customer support**: Automated responses and notifications

Resend provides 99.9% deliverability with easy setup."

[UPDATE CONFIGURATION - 0:50-1:10]
"Enable email in config.ts:

```typescript
export const config: AppConfig = {
  features: {
    auth: true,
    payments: true,
    convex: true,
    email: true,       // ✅ Enable email
    monitoring: false,
  },
  services: {
    resend: {
      enabled: true,
      apiKey: process.env.RESEND_API_KEY,
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET,
    },
  },
};
```"

[SET UP RESEND ACCOUNT - 1:10-1:40]
"Resend makes email simple:

1. **Create account** at resend.com
2. **Generate API key:**
   - Go to API Keys section
   - Create key with Full Access
   - Copy the key (starts with re_)

Two setup approaches for development:"

[CHOOSE EMAIL APPROACH - 1:40-2:20]
"**Option A: Quick Testing (Recommended for Development)**
- Use Resend's sandbox: `onboarding@resend.dev`
- Works immediately, no setup needed
- Can only send to your Resend account email
- Perfect for testing functionality

**Option B: Custom Domain (Production Ready)**
- Verify your own domain for branded emails
- Add DNS records (TXT, MX, CNAME)
- Takes minutes to hours to verify
- Professional sender: `noreply@yourdomain.com`

Start with sandbox for development, upgrade to custom domain for production."

[CONFIGURE ENVIRONMENT VARIABLES - 2:20-2:45]
"Add to Convex Dashboard environment variables (not local .env):

```bash
RESEND_API_KEY=re_...
SENDER_EMAIL=onboarding@resend.dev  # For testing
# OR after domain verification:
SENDER_EMAIL=noreply@yourdomain.com  # For production
COMPANY_NAME=Your Company Name
```

⚠️ **Important**: These go in Convex Dashboard → Settings → Environment Variables, not your local .env file."

[SET UP EMAIL WEBHOOKS - 2:45-3:15]
"Webhooks track email delivery:

1. **Get Convex HTTP URL** (ends in .convex.site)

2. **Configure webhook in Resend:**
   - Dashboard → Webhooks → Add Endpoint
   - URL: `https://your-deployment.convex.site/resend-webhook`
   - Enable all `email.*` events
   - Generate webhook secret

3. **Add secret to Convex:**
```bash
RESEND_WEBHOOK_SECRET=whsec_...
```"

[TEST EMAIL FUNCTIONALITY - 3:15-4:00]
"Let's test the email system:

1. **Restart development server:**
```bash
bun run dev
```

2. **Access test form:**
   - Go to /dashboard (authenticated)
   - Find the "Test Email" form
   - Use your Resend account email as recipient

3. **Send test email:**
   - Fill out the form
   - Check spam folder (sandbox emails often go there)

4. **Verify delivery:**
   - Check Resend Dashboard → Logs
   - Confirm email received"

[WHAT THIS ENABLES - 4:00-4:15]
"With email working, you can now send:

✅ Welcome emails for new signups
✅ Password reset emails
✅ Payment confirmations
✅ Subscription receipts
✅ Custom transactional emails
✅ Marketing newsletters

Your app now has professional communication capabilities!"

[COMMON ISSUES - 4:15-4:30]
"Most email issues are configuration:

- **API key missing**: Must be in Convex environment variables
- **Wrong sender**: Use verified domain or sandbox email
- **Testing recipients**: Only your Resend account email for sandbox
- **Spam folder**: Sandbox emails often go to spam
- **Webhooks**: Ensure URL is accessible and secret is set"

[NEXT STEPS - 4:30-4:45]
"Perfect! Your app can now communicate with users. Next: AI Setup - we'll add OpenAI-powered chat functionality to make your app smarter.

You now have the complete SaaS stack: auth + database + payments + email + AI = modern, professional product.

See you in the AI setup video!"

---

**VISUAL NOTES**:
- Resend dashboard walkthrough
- API key generation demo
- Domain verification process (overview)
- Webhook configuration steps
- Test email form demo
- Email delivery logs in dashboard
- Before/after email capabilities

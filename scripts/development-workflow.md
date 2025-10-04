# Development Workflow - Maintaining Your Live App

**VIDEO LENGTH**: 4:15
**HOOK**: "Your app is live! Now you need to know how to maintain it, add features, and fix issues without breaking production. This is the ongoing development cycle."

---

[OPENING - 0:00-0:20]
"Your app is deployed and users are coming in. But development doesn't stop at launch - it's just beginning. You need a solid workflow for maintaining your live application.

I'll show you the daily development setup, best practices, and how to safely add features to your production app."

[DAILY DEVELOPMENT SETUP - 0:20-0:50]
"After initial setup, here's your daily workflow:

**Terminal 1: Main Application**
```bash
bun run dev
```

**Terminal 2: Convex Database**
```bash
npx convex dev
```

**Terminal 3: Webhook Testing (when needed)**
```bash
ngrok http 5173
```

Keep Convex running - it provides your local database server. Only run ngrok when testing webhooks."

[ENVIRONMENT MANAGEMENT - 0:50-1:20]
"ngrok URLs change frequently - update these when they do:

1. **Local Environment** (`.env.local`):
```bash
FRONTEND_URL=https://new-ngrok-url.ngrok.io
```

2. **Convex Environment Variables**:
   - Update `FRONTEND_URL` in Convex Dashboard

3. **Vite Configuration** (`vite.config.ts`):
```typescript
server: {
  allowedHosts: ["new-ngrok-subdomain.ngrok.app"],
},
```

4. **Restart Servers**:
```bash
bun run dev
npx convex dev
```

This keeps your webhook testing working."

[CODE ORGANIZATION - 1:20-1:50]
"Know where everything lives:

**Frontend (React Router):**
- `app/routes/` - File-based routing
- `app/components/` - Reusable UI components
- `app/utils/` - Helper functions
- `app/hooks/` - Custom React hooks

**Backend (Convex):**
- `convex/` - Serverless functions
- `convex/schema.ts` - Database schema
- Queries and mutations organized by domain

**Configuration:**
- `config.ts` - Enable/disable services
- `.env.local` - Local secrets
- `vite.config.ts` - Build configuration"

[DEVELOPMENT BEST PRACTICES - 1:50-2:45]

**Progressive Feature Enablement:**
```typescript
// Start simple, add as needed
features: {
  auth: true,      // Enable first
  convex: true,    // Enable with auth
  payments: false, // Enable when billing ready
  email: false,    // Enable when notifications ready
}
```

**Environment Variables:**
- Never commit secrets to Git
- Use `.env.example` as template
- Document required variables

**Database Schema Changes:**
```typescript
// convex/schema.ts
export default defineSchema({
  users: defineTable({ /* schema */ }),
  // Add new tables as needed
});
```

**Testing Strategy:**
```bash
bun run test:all      # All tests
bun run test:watch    # Unit tests
bun run test:e2e:ui   # E2E tests
```

**Build Verification:**
```bash
bun run build         # Test build
bun run typecheck     # Check types
```

[DEBUGGING COMMON ISSUES - 2:45-3:30]

**Authentication Problems:**
- Check Clerk JWT template configuration
- Verify `VITE_CLERK_FRONTEND_API_URL` in Convex
- Ensure Convex dev server running

**Payment Webhook Failures:**
- Confirm ngrok URL current
- Check Polar webhook configuration
- Verify environment variables in Convex

**Email Delivery Issues:**
- Use sandbox domain for testing
- Check Resend API key in Convex
- Verify webhook secret configuration

**AI Chat Not Working:**
- Confirm OpenAI API key in environments
- Check API rate limits and credits
- Verify Convex functions deployed

[DEPLOYMENT CHECKLIST - 3:30-3:50]
"Before pushing to production:

- [ ] All tests passing
- [ ] Build successful
- [ ] TypeScript errors resolved
- [ ] Environment variables configured
- [ ] Domain purchased and configured
- [ ] Production service accounts created
- [ ] Webhook URLs updated for production
- [ ] SSL certificate valid"

[EXTENSION GUIDES - 3:50-4:15]
"Adding new features:

- Follow progressive configuration approach
- Test locally before production
- Document environment variables needed

For UI development: See Rapid UI Prototyping guide
For database changes: Update schema, run `npx convex deploy`

Your workflow is now established. Focus on building features while infrastructure handles scaling."

[SUPPORT RESOURCES - 4:15-4:30]
"- Documentation: `bun run docs:dev`
- Convex Dashboard: Monitor database/functions
- Service Dashboards: Clerk, Polar, Resend
- Community: GitHub issues for Kaizen questions

You're ready to maintain and grow your live application! 🎉"

---

**VISUAL NOTES**:
- Multi-terminal development setup
- Code organization file structure
- Progressive feature enablement demo
- Testing workflow demonstration
- Common debugging scenarios
- Deployment checklist walkthrough
- Resource dashboard overviews

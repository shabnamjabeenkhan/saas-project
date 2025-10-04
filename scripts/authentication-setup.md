# Authentication Setup - Adding Users and Database

**VIDEO LENGTH**: 4:30
**HOOK**: "Now let's add the ability for users to sign up, log in, and store their data. This is where your app goes from static demo to real SaaS product."

---

[OPENING - 0:00-0:20]
"Our foundation works! Now let's add user management - the core of any SaaS app. We'll enable Clerk for authentication and Convex for the database.

By the end of this video, users will be able to sign up, log in, and we'll have a real-time database backing our app."

[WHY AUTHENTICATION FIRST - 0:20-0:45]
"Authentication and database are foundational:

- **Clerk** handles all user management (sign up, login, passwords, social auth)
- **Convex** gives us a real-time database with automatic sync
- Together they provide end-to-end type safety
- No more managing auth tokens or database connections manually

This is the moment your static demo becomes a real application."

[UPDATE CONFIGURATION - 0:45-1:15]
"Let's enable auth and database in config.ts:

```typescript
export const config: AppConfig = {
  features: {
    auth: true,        // ✅ Enable authentication
    payments: false,   // Keep payments disabled
    convex: true,      // ✅ Enable database
    email: false,      // Keep email disabled
    monitoring: false,
  },
  services: {
    clerk: {
      enabled: true,
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    },
    convex: {
      enabled: true,
      deployment: process.env.CONVEX_DEPLOYMENT,
      url: process.env.VITE_CONVEX_URL,
    },
    // ... other services remain disabled
  },
  ui: {
    showPricing: false,
    showDashboard: true,
    showChat: false,
    showAuth: true,    // ✅ Show auth pages
  },
};
```"

[SET UP CONVEX DATABASE - 1:15-2:00]
"Convex provides our database layer:

1. **Start Convex dev server:**
```bash
npx convex dev
```
- Follow prompts to log in
- Create new project when asked
- This auto-updates your .env.local

2. **Keep it running** - Convex dev server provides local database

The beauty of Convex: instant real-time database with zero configuration."

[CONFIGURE CLERK AUTHENTICATION - 2:00-2:45]
"Clerk handles all authentication:

1. **Add environment variables:**
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

2. **Set up JWT template for Convex:**
- Go to Clerk Dashboard → Configure → JWT Templates
- Click 'New template' → Select 'Convex'
- Click 'Save' (crucial step!)

3. **Configure Convex for Clerk JWT:**
- Go to Convex Dashboard → Settings → Environment Variables
- Add: `VITE_CLERK_FRONTEND_API_URL` with Issuer URL from Clerk

This enables Convex to verify Clerk's JWT tokens automatically."

[RESTART AND TEST - 2:45-3:30]
"Let's test the full flow:

1. **Restart main app:**
```bash
# Stop with Ctrl+C, then:
bun run dev
```

2. **Test authentication:**
- Visit localhost:5173
- Click login/signup
- Should redirect to Clerk auth
- After auth, access dashboard

3. **Verify user creation:**
- New users created in both Clerk and Convex
- Protected routes now require authentication
- User profile management works"

[WHAT THIS ENABLES - 3:30-4:00]
"With auth + database working, you now have:

✅ User registration and login
✅ Protected routes and dashboard
✅ Real-time database with type safety
✅ Automatic data synchronization
✅ Foundation for user-specific features

Your app is now a real SaaS product!"

[COMMON ISSUES - 4:00-4:15]
"Most issues are configuration:

- JWT template not saved in Clerk
- Wrong environment variables
- Convex dev server not running
- Config not restarted after changes

Check these first if auth doesn't work."

[NEXT STEPS - 4:15-4:30]
"Excellent! Users can now sign up and use your app. Next: Payments Setup - we'll add subscription billing with Polar.sh so users can pay for your service.

This is the complete SaaS foundation: auth + database + payments = monetizable product.

See you in the payments video!"

---

**VISUAL NOTES**:
- Show Clerk dashboard JWT template setup
- Convex dashboard walkthrough
- Live authentication flow demo
- Database schema visualization
- Before/after comparison of app functionality
- Progress indicator showing auth + database enabled

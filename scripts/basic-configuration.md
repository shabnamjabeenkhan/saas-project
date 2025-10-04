# Basic Configuration - Testing the Foundation

**VIDEO LENGTH**: 3:15
**HOOK**: "Let's verify our foundation works before adding complexity. We'll run Kaizen with everything disabled to ensure the basics are solid."

---

[OPENING - 0:00-0:15]
"Kaizen is running locally - great! Now let's test that our foundation is solid before we add external services. This is like testing the engine before attaching the transmission.

We'll disable all features and verify the basic React Router setup works."

[WHY BASIC CONFIGURATION - 0:15-0:45]
"Most tutorials skip this step and you only find issues later when debugging is harder. We test progressively:

1. Static app (no external services)
2. Add authentication
3. Add database
4. Add payments
5. Add email

This way, when something breaks, you know exactly which service caused it."

[DISABLE ALL FEATURES - 0:45-1:30]
"Let's modify config.ts to disable everything:

```typescript
export const config: AppConfig = {
  features: {
    auth: false,        // No authentication yet
    payments: false,    // No payments yet
    convex: false,      // No database yet
    email: false,       // No email yet
    monitoring: false,  // No monitoring yet
  },
  services: {
    docs: {
      enabled: true,
      url: process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : undefined,
    },
    betterAuth: { enabled: true, mode: "b2c" },
    clerk: { enabled: false },
    polar: { enabled: false },
    convex: { enabled: false },
    resend: { enabled: false },
    openai: { enabled: false },
  },
  ui: {
    showPricing: false,   // Hide pricing page
    showDashboard: true,  // Show demo dashboard
    showChat: false,      // No AI chat yet
    showAuth: false,      // No auth pages yet
  },
};
```"

[TEST THE BASICS - 1:30-2:15]
"Now let's verify everything works:

1. **Start the server:**
```bash
bun run dev
```

2. **Test homepage** - Visit http://localhost:5173
   - Should load without errors
   - Navigation should work
   - Basic UI should render

3. **Test dashboard** - Navigate to /dashboard
   - Should load in demo mode
   - No authentication required
   - Basic layout should work

4. **Test build process:**
```bash
bun run build
```
Should complete without errors."

[COMMON ISSUES & FIXES - 2:15-2:45]
"If something doesn't work:

**Build fails:**
- Run `bun install` again
- Check Node.js version (should be 24.x.x)
- Verify .env.local exists

**Homepage doesn't load:**
- Check browser console for errors
- Ensure port 5173 is free
- Try incognito mode

**Dashboard blocked:**
- Double-check config.ts settings
- With showAuth: false, it should be accessible"

[WHAT THIS PROVES - 2:45-3:00]
"When this works, you know:
✅ React Router v7 setup is correct
✅ Build process works
✅ Basic routing functions
✅ Static assets load properly
✅ No dependency issues

Your foundation is solid!"

[NEXT STEPS - 3:00-3:15]
"Perfect! Your Kaizen foundation works. Next: Authentication Setup - we'll add Clerk and Convex to enable user accounts and database functionality.

This progressive approach means each step builds on the previous one. You can see exactly how authentication integrates with the rest of the system.

See you in the authentication video!"

---

**VISUAL NOTES**:
- Show config.ts being edited
- Screen recording of homepage loading
- Dashboard demo mode walkthrough
- Build process terminal output
- Error examples and fixes
- Progress indicator showing current step

# Getting Started - Kaizen Tech Stack Deep Dive

**VIDEO LENGTH**: 4:15
**HOOK**: "Let me show you the exact tech stack that lets us build production SaaS apps in days, not months."

---

[OPENING - 0:00-0:20]
"Welcome back! In the overview we talked about the big picture. Now let's dive deep into the Kaizen tech stack - the tools that make this accelerator possible.

I'm going to show you exactly why we chose each technology and how they work together to eliminate infrastructure headaches."

[PREREQUISITES - 0:20-0:50]
"Before we start, make sure you have:

1. Frontend fundamentals (HTML, CSS, JS, React) - Software Engineer Roadmap
2. Backend systems knowledge - AlgoExpert Systems Fundamentals
3. Tech stack basics - Our Kaizen tutorial playlist

If you're missing any of these, pause here and level up first. The rest of this series assumes you have these foundations."

[TECH STACK OVERVIEW - 0:50-2:00]
"Here's our complete stack - each chosen for maximum productivity:

**React Router v7** - Modern full-stack React framework
- SSR out of the box
- File-based routing via app/routes.ts
- Automatic type generation
- Progressive enhancement

**Convex** - Real-time database + serverless functions
- Automatic real-time updates
- End-to-end type safety
- Serverless functions in convex/ directory
- Built-in Clerk integration

**Clerk** - Authentication as a Service
- Multi-provider auth (email, Google, GitHub)
- JWT tokens for Convex
- Pre-built React components
- Enterprise-grade security

**Polar.sh** - Subscription billing
- Recurring payments
- Pre-built checkout flows
- Webhook integration
- Revenue analytics

**Resend** - Transactional email
- 99.9% deliverability
- HTML templates
- Webhook tracking
- Custom domains

**Railway** - Production deployment
- Git-based deployments
- Automatic HTTPS
- Built-in databases
- Pay-as-you-go scaling"

[WHY THIS STACK WORKS - 2:00-2:45]
"What makes this combination special:

1. **Zero Infrastructure Management** - Railway handles everything
2. **Automatic Scaling** - From 1 to 10,000+ users seamlessly
3. **End-to-End Type Safety** - Convex + React Router v7
4. **Real-Time by Default** - No extra work for live updates
5. **Cost Efficiency** - Generous free tiers, pay-as-you-use

This lets you focus 100% on your product, not infrastructure."

[COST BREAKDOWN - 2:45-3:15]
"Cost transparency is crucial for startups:

**Free Tier Limits:**
- Clerk: 10,000 users
- Convex: 1M function calls/month
- Polar.sh: Unlimited until revenue
- Resend: 3,000 emails/month
- Railway: $5/month credit

**Growth Costs (10,000+ DAUs):**
- Total: $200-300/month
- Profit margins: 80%+
- Scales automatically

These services abstract away millions of dollars of infrastructure work."

[WARNING ABOUT UPGRADES - 3:15-3:45]
"⚠️ **Critical Warning**: DO NOT upgrade core dependencies unless following official migration guides. The versions in Kaizen are tested together. Upgrading can break auth, database, and payments.

When you need to upgrade, follow the official guides from each service."

[NEXT STEPS - 3:45-4:15]
"Now you understand the stack. Next videos:

1. Prerequisites - Get your API keys ready
2. Project Setup - Clone and run Kaizen locally
3. Basic Configuration - Verify everything works

The setup process is progressive - we enable features step-by-step so you can see exactly how each piece fits together.

See you in the prerequisites video!"

---

**VISUAL NOTES**:
- Show actual code from app/routes.ts and convex/ directory
- Live demo of Clerk auth flow
- Polar.sh dashboard walkthrough
- Railway deployment demo
- Cost calculator graphics
- Architecture diagrams showing how services connect

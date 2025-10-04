# Prerequisites - Getting Your Keys Ready

**VIDEO LENGTH**: 3:30
**HOOK**: "Before we build anything, let's get all your API keys and accounts set up. This takes 30 minutes but saves you hours later."

---

[OPENING - 0:00-0:15]
"Welcome to the setup series! I'm opening the Prerequisites page now. Before we clone and run Kaizen, we need to get all your accounts and API keys ready. This is the foundation - without these, nothing works.

I'm going to walk you through each service on this page and show you exactly what to do in real-time."

[WHY PREREQUISITES MATTER - 0:15-0:45]
"Most developers skip this step and get stuck later. We set everything up front so you can focus on building features. I'm scrolling through the page...

Each service has a generous free tier, and the setup process is designed to be completed in under 30 minutes. Let me click on each service link to show you the signup process."

[SERVICE-BY-SERVICE SETUP - 0:45-2:45]

**1. GitHub (2 minutes)**
"First, the GitHub section. I'm opening github.com in a new tab... Click 'New repository' - make it private (recommended). I'm typing a name for our project...

Copy the SSH URL (not HTTPS) - I'll paste it here so we don't forget: git@github.com:username/project.git

We'll use this when we clone Kaizen in the next video."

**2. Clerk Authentication (5 minutes)**
"Clerk handles all user authentication. I'm opening clerk.com and clicking sign up... Creating a new application - I'm calling it our project name.

Copy your API keys (Publishable Key, Secret Key) - I'm copying them to a secure note. Enable social providers if needed (Google, GitHub).

We'll use these in our .env file later."

**3. Convex Database (5 minutes)**
"Convex is our real-time database. Opening convex.dev and signing up... Creating a new project - I'm naming it after our app.

Copy your deployment URL and keys - saving these securely. This connects our frontend to the database automatically."

**4. Polar.sh Payments (5 minutes)**
"Polar handles subscriptions and payments. I'm at polar.sh creating an account... Setting up an organization.

Getting your API keys and webhook secrets - copying these down. Setting up your first product pricing - basic plan at $9.99/month."

**5. Resend Email (5 minutes)**
"Resend sends transactional emails. Opening resend.com and signing up... Verifying my email - important for deliverability.

Getting the API key - saving it. I'll set up email templates later when we configure it."

**6. OpenAI (Optional, 3 minutes)**
"For AI features. Opening platform.openai.com and creating account... Getting the API key - this will power our chat features.

Starting with GPT-4 for best results - that's what we'll use in the app."

**7. Railway Deployment (5 minutes)**
"Railway hosts our production app. Signing up at railway.app... Connecting my GitHub account.

Getting the project token ready - this will let us deploy automatically."

[ENVIRONMENT SETUP - 2:45-3:15]
"Once you have all keys, create your .env.local file. I'm opening the code editor and creating the file...

```bash
# Clerk - pasting the keys I just copied
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex - adding the deployment URL
VITE_CONVEX_URL=https://...
CONVEX_DEPLOY_KEY=...

# Polar.sh - webhook secrets
POLAR_ACCESS_TOKEN=...
POLAR_WEBHOOK_SECRET=...

# Resend - API key
RESEND_API_KEY=...

# OpenAI (optional)
OPENAI_API_KEY=...

# Railway - project token
RAILWAY_TOKEN=...
```

I'm saving this file - this is the foundation of our app."

[NEXT STEPS - 3:15-3:30]
"With all your keys ready, you're set for the next video: Project Setup.

We'll clone Kaizen, install dependencies, and get your first 'Hello World' running locally.

The progressive setup approach means we enable features one-by-one, so you can see exactly how each piece works.

See you there!"

---

**VISUAL NOTES**:
- Screen recordings of each signup process
- Show actual dashboards for each service
- Demo copying API keys (with privacy blurring)
- Show the .env.local file structure
- Timeline graphic showing 30-minute setup process
- Checklist overlay for tracking progress

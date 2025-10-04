# Project Setup - Cloning and Running Kaizen

**VIDEO LENGTH**: 4:00
**HOOK**: "Let's get Kaizen running on your machine. This is where the rubber meets the road - from repository to running app in 10 minutes."

---

[OPENING - 0:00-0:20]
"Alright, keys are ready! I'm opening the Project Setup page now. This is the moment where you go from 'interested' to 'actually building'.

I'll walk you through each step on this page, and by the end, you'll have a fully functional SaaS starter running on your machine. Let's start at the top..."

[STEP-BY-STEP PROCESS - 0:20-3:00]

**Step 1: Create GitHub Repository (2 minutes)**
"First, the 'Create GitHub Repository' section. I'm opening github.com in a new tab... Clicking 'New repository' - making it private as recommended.

I'm typing our project name... Copying the SSH URL: git@github.com:username/project-name.git

I'll paste this in my notes - we'll use it in step 3."

**Step 2: Clone Kaizen (1 minute)**
"Now the cloning section. I'm opening the terminal and running:
```bash
git clone https://github.com/code-and-creed/kaizen.git your-project-name
cd your-project-name
rm -rf .git  # Remove Kaizen's git history
```

That cloned our starter template. I can see all the files now."

**Step 3: Initialize Your Git (1 minute)**
"Next section: Initialize Your Git. I'm setting up our own repository:
```bash
git init
git remote add origin git@github.com:username/project-name.git
git add .
git commit -m "Initial commit with Kaizen starter"
git push -u origin main
```

Pushed to our GitHub repo - our project is now version controlled."

**Step 4: Install Dependencies (2 minutes)**
"The 'Install Dependencies' section. Bun makes this fast - I'm running:
```bash
bun install
```

No extra flags needed - Bun handles everything automatically. Watching the packages install..."

**Step 5: Environment Setup (1 minute)**
"Environment setup section. I'm copying the environment file:
```bash
cp .env.example .env.local
```

Now I need to edit .env.local with the API keys we got in the prerequisites video. I'm opening it in the editor and pasting all our keys..."

**Step 6: Build and Run (2 minutes)**
"'Run the Web Server' section. Let's see if everything works:
```bash
bun run build
bun run dev
```

Build completed successfully! Opening http://localhost:5173 in incognito mode... There it is - our app is running!"

**Step 7: Run Documentation (1 minute)**
"Also start the docs server:
```bash
bun run docs:dev
```
Visit http://localhost:3000 for documentation."

[CONFIGURATION OVERVIEW - 3:00-3:30]
"Kaizen uses progressive configuration. We start with everything disabled and enable features step-by-step:

```typescript
// config.ts - We'll modify this as we go
export const config: AppConfig = {
  features: {
    auth: false,      // Step 4: Enable authentication
    payments: false,  // Step 5: Enable payments
    convex: false,    // Step 4: Enable database
    email: false,     // Step 6: Enable email
    monitoring: false,
  },
};
```"

[FILE STRUCTURE EXPLANATION - 3:30-3:50]
"Your project structure now:
```
your-project-name/
├── app/                 # React Router routes and components
├── convex/              # Serverless functions and database schema
├── docs/                # Documentation site (what you're watching)
├── public/              # Static assets
├── config.ts            # Feature configuration
├── .env.local           # Your API keys
└── package.json         # Dependencies and scripts
```"

[NEXT STEPS - 3:50-4:00]
"Perfect! You now have Kaizen running locally. Next video: Basic Configuration - we'll verify everything works without external services, then progressively enable features.

This progressive approach lets you see exactly how each piece fits together. See you in the next video!"

---

**VISUAL NOTES**:
- Full screen recording of entire process
- Show terminal commands being typed
- Browser windows opening to localhost
- File structure visualization
- Progress checklist overlay
- Show the actual running app at the end

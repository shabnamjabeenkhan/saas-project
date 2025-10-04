# 🚂 Migrating from Vercel to Railway

This guide documents the changes needed to deploy a React Router v7 application from Vercel to Railway.

## Overview

When deploying to Railway instead of Vercel, you need to remove Vercel-specific configurations that modify the build output structure. Railway expects a standard Node.js application structure, while Vercel uses serverless functions.

## Changes Required

### 1. Remove Vercel Preset from React Router Config

**File:** `react-router.config.ts`

**Before:**
```typescript
import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
```

**After:**
```typescript
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
} satisfies Config;
```

**Why:** The `vercelPreset()` changes the build output to work with Vercel's serverless architecture, placing the server file in a subdirectory like `build/server/nodejs_eyJydW50aW1lIjoibm9kZWpzIn0/index.js` instead of the expected `build/server/index.js`.

### 2. Remove Vercel-Specific Packages

**File:** `package.json`

Remove these dependencies:
```json
{
  "dependencies": {
    "@vercel/react-router": "^1.1.2",  // Remove this
    "@vercel/analytics": "^1.5.0"  // Remove this
    etc.
  }
}
```

### 3. Remove Vercel Analytics

**File:** `app/root.tsx`

Remove the import:
```typescript
import { Analytics } from "@vercel/analytics/react";  // Remove this line
```

Remove the component:
```tsx
<body>
  <Analytics />  {/* Remove this line */}
  {children}
  ...
</body>
```

**Why:** After removing `@vercel/analytics` from dependencies, any imports or usage will cause build failures.

### 4. Update Start Command to Use PORT Variable

**File:** `package.json`

**Before:**
```json
{
  "scripts": {
    "start": "react-router-serve ./build/server/index.js"
  }
}
```

**After:**
```json
{
  "scripts": {
    "start": "react-router-serve ./build/server/index.js --port ${PORT:-8080}"
  }
}
```

**Why:** Railway provides a `PORT` environment variable that your application must listen on. React Router's serve command defaults to port 8080 and doesn't automatically use the `PORT` variable. The `${PORT:-8080}` syntax means "use `PORT` if set, otherwise default to 8080."

### 5. Update Dockerfile (Optional)

**File:** `Dockerfile`

If you have `--legacy-peer-deps` issues, update npm install commands:

**Before:**
```dockerfile
RUN npm ci
```

**After:**
```dockerfile
RUN npm ci --legacy-peer-deps
```

**Why:** Some dependencies may have peer dependency conflicts. Using `--legacy-peer-deps` allows the build to proceed.

### 6. Clean Up Vercel Build Artifacts

Delete the `.vercel` directory and any Vercel-specific build artifacts:

```bash
rm -rf .vercel
```

## Railway-Specific Configuration

### Environment Variables

**IMPORTANT: Environment variables are split between Railway and Convex Dashboard**

#### Railway Environment Variables (Settings → Variables)

Set these in **Railway's dashboard** - these are for your frontend/Node.js server:

```bash
# Core Configuration
NODE_ENV=production

# Convex - Client & Server
VITE_CONVEX_URL=https://your-deployment.convex.cloud     # ⚠️ REQUIRED at build time
CONVEX_DEPLOYMENT=prod:your-deployment-name              # Server-side only
CONVEX_URL=https://your-deployment.convex.cloud          # Server-side only

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...                   # ⚠️ REQUIRED at build time
CLERK_SECRET_KEY=sk_live_...                             # Server-side secret

# Frontend URL (used by Convex for redirects)
FRONTEND_URL=https://your-app.up.railway.app
```

#### Convex Environment Variables (Convex Dashboard → Settings → Environment Variables)

Set these in **Convex Dashboard** - these are for your Convex backend functions:

```bash
# Clerk (for Convex auth integration)
CLERK_SECRET_KEY=sk_live_...                             # Same as Railway
CLERK_WEBHOOK_SECRET=whsec_...                           # From Clerk webhooks

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-...

# Twilio (if using SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# Resend (if using email)
RESEND_API_KEY=re_...

# Square (if using POS integration)
SQUARE_ENV=sandbox                                       # or 'production'
SQUARE_APPLICATION_ID=sq0idp-...
SQUARE_APPLICATION_SECRET=sq0csb-...
SQUARE_REDIRECT_URL=https://your-app.up.railway.app/api/square/oauth/callback

# Polar (if using payments)
POLAR_ACCESS_TOKEN=polar_...
POLAR_ORGANIZATION_ID=org_...
POLAR_WEBHOOK_SECRET=whsec_...
```

#### Quick Reference: Where Does Each Variable Go?

| Variable | Railway | Convex | Notes |
|----------|---------|--------|-------|
| `VITE_CONVEX_URL` | ✅ | ❌ | Client-side, embedded at build time |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | ❌ | Client-side, embedded at build time |
| `CONVEX_DEPLOYMENT` | ✅ | ❌ | Server-side deployment name |
| `CONVEX_URL` | ✅ | ❌ | Server-side Convex URL |
| `CLERK_SECRET_KEY` | ✅ | ✅ | Both need it (same value) |
| `CLERK_WEBHOOK_SECRET` | ❌ | ✅ | Only Convex needs this |
| `FRONTEND_URL` | ✅ | ❌ | Server-side, for redirects |
| `OPENAI_API_KEY` | ❌ | ✅ | Only Convex backend needs this |
| `TWILIO_*` | ❌ | ✅ | Only Convex backend needs these |
| `RESEND_API_KEY` | ❌ | ✅ | Only Convex backend needs this |
| `SQUARE_*` | ❌ | ✅ | Only Convex backend needs these |

**Key Points:**
- 🔑 **`VITE_` prefixed variables** = Railway only (embedded in client bundle at build time)
- 🔒 **API keys/secrets for backend operations** = Convex only
- 🔄 **`CLERK_SECRET_KEY`** = Both (same value in both places)
- 🌐 **`FRONTEND_URL`** = Railway only (your app's public URL)

### Port Configuration

**Important:** Railway automatically assigns a port via the `PORT` environment variable. Don't hardcode a port number - always use `${PORT}` in your start command.

### Build-Time Environment Variables

**Critical:** Variables prefixed with `VITE_` (like `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CONVEX_URL`) must be available at **build time** because Vite embeds them into the client JavaScript bundle.

Update your `Dockerfile` to accept and pass these variables during the build stage:

```dockerfile
FROM node:20-alpine AS build-env
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
# Pass build-time environment variables for Vite to embed in client bundle
ARG VITE_CONVEX_URL
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN npm run build
```

**Why:** Railway sets environment variables at runtime, but Vite needs them at build time. The `ARG` directive allows Railway to pass them into the Docker build context, and `ENV` makes them available during the `npm run build` step.

Railway will:
1. Set the `PORT` environment variable (usually something like 3000, 8080, etc.)
2. Your app listens on that internal port
3. Railway exposes your app on its public domain (ports 80/443)

### Build & Deploy Settings

In Railway's settings, configure:

- **Build Command:** `npm run build` (or leave empty, Railway will detect from package.json)
- **Start Command:** `npm run start` (or leave empty)
- **Dockerfile:** If present, Railway will automatically use it

## Complete Migration Steps

1. **Remove Vercel preset** from `react-router.config.ts`
2. **Remove `@vercel/react-router` and `@vercel/analytics`** from `package.json` dependencies
3. **Remove Vercel Analytics** imports and components from `app/root.tsx`
4. **Update start command** in `package.json` to use `${PORT:-8080}`
5. **Update Dockerfile** to accept `VITE_` variables at build time (add `ARG` and `ENV` directives)
6. **Run `npm install`** to update `package-lock.json`
7. **Build locally** to verify: `npm run build`
8. **Commit changes** and push to your repository
9. **Connect repository** to Railway
10. **Set environment variables** in Railway dashboard (including all `VITE_` variables)
11. **Deploy!**

## Troubleshooting

### Error: Cannot find module '/app/build/server/index.js'

**Problem:** The Vercel preset is still active, generating the server file in the wrong location.

**Solution:** Remove `vercelPreset()` from `react-router.config.ts` and rebuild.

### Error: Cannot find module "@vercel/analytics/react"

**Problem:** Code still references Vercel packages that were removed.

**Solution:** Search for and remove all imports and usages of `@vercel/analytics` or other Vercel-specific packages.

### App starts but shows "Application failed to respond"

**Problem:** Your app is not listening on Railway's assigned `PORT`.

**Solution:** Ensure your start command includes `--port ${PORT:-8080}`.

### Build fails with peer dependency errors

**Problem:** npm can't resolve peer dependencies.

**Solution:** Add `--legacy-peer-deps` flag to npm install commands in your Dockerfile.

### App loads but shows "Configuration validation failed" or missing Clerk key errors

**Problem:** Client-side environment variables (`VITE_` prefixed) are not being embedded in the build.

**Solution:** 
1. Ensure your `Dockerfile` has `ARG` and `ENV` declarations for all `VITE_` variables in the build stage
2. Verify all `VITE_` variables are set in Railway's environment variables (Variables tab)
3. Trigger a new deployment (Railway will rebuild with the new Dockerfile)

## Benefits of Railway vs Vercel

### Railway Advantages:
- **Simpler architecture:** Standard Node.js server, no serverless complexity
- **Persistent connections:** Better for WebSockets and SSE
- **Docker support:** Full control over the runtime environment
- **Database hosting:** Built-in PostgreSQL, Redis, MongoDB support
- **Monorepo friendly:** Easier to deploy full-stack applications

### When to Use Vercel:
- Need global edge network for static content
- Serverless architecture is preferred
- Heavy integration with Vercel ecosystem (Analytics, Speed Insights, etc.)
- Preview deployments with automatic PR environments

## Summary

The key changes for Railway deployment:
1. ✅ Remove `vercelPreset()` - this was causing the wrong build output structure
2. ✅ Remove `@vercel/react-router` dependency
3. ✅ Remove Vercel Analytics
4. ✅ Use `${PORT}` environment variable in start command
5. ✅ Set environment variables in Railway dashboard

Your app will now build and deploy successfully on Railway! 🎉


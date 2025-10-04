# 🚀 Deploy to Railway

Railway is the recommended deployment platform for Kaizen. It's perfect for teams and solo developers who want:
- Automatic deployments on every push
- PR preview environments
- Easy environment variable management
- Simple setup with GitHub integration

## Prerequisites

- Railway account ([sign up](https://railway.app))
- GitHub repository with your code
- Production Convex deployment ready

---

## Deployment Steps

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your repository
5. Select your Kaizen repository

### 3. Configure Build Settings

Railway uses the provided Dockerfile for builds, which is configured to use npm for consistency in production. For local development, you can use bun.

**Build Command:**
- Uses Dockerfile (npm-based)

**Start Command:**
- Uses Dockerfile (npm-based)

**Root Directory:**
- Leave as `/` (project root)

**Runtime:**
- Railway will use the Dockerfile configuration

### 4. Set Environment Variables

In Railway Dashboard → Your Project → Variables, add:

```bash
# Core
NODE_ENV=production
PORT=8080

# Convex
VITE_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-name

# Authentication (if enabled)
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Payments (if enabled)
POLAR_ACCESS_TOKEN=polar_...
POLAR_ORGANIZATION_ID=org_...
POLAR_WEBHOOK_SECRET=whsec_...

# AI Features (if enabled)
OPENAI_API_KEY=sk-...

# Email (if enabled)
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...

# Monitoring (optional)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
OPENSTATUS_API_KEY=your-key
OPENSTATUS_PROJECT_ID=your-project
```

### 5. Deploy

Railway will automatically deploy when you:
- Push to your main branch
- Manually trigger a deployment
- Create a pull request (creates preview environment)

Your app will be live at `https://your-app.up.railway.app`

### 6. Configure Custom Domain (Optional)

1. **In Railway Dashboard:**
   - Go to Settings → Domains
   - Click "Generate Domain" (get free railway.app domain)
   - Or click "Custom Domain" to add your own

2. **For custom domains:**
   - Add CNAME record: `your-domain.com` → `your-app.up.railway.app`
   - Railway handles SSL automatically

3. **Update service configurations:**
   - Update Clerk allowed origins
   - Update webhook URLs
   - Update Polar.sh redirect URLs

---

## Configure Production Services

### Convex Production Deployment

```bash
npx convex deploy --cmd-url-env-var-name=VITE_CONVEX_URL --prod
```

### Update Webhook URLs

After deployment, update webhook URLs for all integrated services:

**Clerk** (if using authentication):
- Dashboard → Webhooks → Add endpoint
- URL: `https://your-domain.com/api/webhooks/clerk`

**Polar.sh** (if using payments):
- Dashboard → Webhooks → Add endpoint
- URL: `https://your-domain.com/api/webhooks/polar`

**Resend** (if using email):
- Dashboard → Webhooks → Add endpoint  
- URL: `https://your-deployment.convex.cloud/resend-webhook`

---

## Post-Deployment Checklist

- [ ] Homepage loads correctly
- [ ] Authentication works (if enabled)
- [ ] Real-time features work with Convex
- [ ] Webhook endpoints are accessible
- [ ] PR preview environments work
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate is active

---

## Maintenance

### View Logs
Railway Dashboard → Your Project → Deployments → View Logs

### Redeploy
- Push to GitHub (automatic)
- Or click "Redeploy" in Railway Dashboard

### Rollback
Railway Dashboard → Deployments → Select previous deployment → Redeploy

### Monitor Usage
Railway Dashboard → Usage → View metrics and costs

---

## Troubleshooting

### Build Fails
- Check build logs in Railway Dashboard
- Verify `package.json` scripts are correct
- Ensure all dependencies are in `dependencies` (not just `devDependencies`)
- **Package Manager**: The Dockerfile uses npm for production builds. Use bun locally, but ensure `bun.lock` is committed. `package-lock.json` is ignored to prevent conflicts.

### Environment Variables Not Working
- Verify variables are set in Railway Dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding/changing variables

### Port Binding Issues
- Ensure your app listens on `process.env.PORT || 8080`
- Railway automatically assigns PORT

### Database Connection Issues
- Verify Convex deployment is live
- Check CONVEX_URL environment variable
- Test API endpoints manually

---

## Pricing

Railway offers:
- **Free Trial**: $5 credit to start
- **Hobby Plan**: $5/month base + usage
- **Pro Plan**: $20/month + usage for teams

**Typical costs for low-medium traffic:** $5-20/month

---

## Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Pricing](https://railway.app/pricing)
- [GitHub Integration Guide](https://docs.railway.app/guides/github-integration)
- [Convex Production Deployment](https://docs.convex.dev/production/hosting)

---

🎉 **You're all set!** Your Kaizen application is now deployed on Railway with automatic deployments and preview environments.


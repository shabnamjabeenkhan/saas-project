# Production Deployment - Launching Your App Live

**VIDEO LENGTH**: 5:30
**HOOK**: "Your app is complete and tested. Now it's time to launch it live so real customers can use it. This is where your startup becomes real."

---

[OPENING - 0:00-0:20]
"Your app works perfectly locally. Now comes the moment of truth: deploying to production so real users can access it.

This is a comprehensive process, but I'll walk you through each step. By the end, your app will be live with a custom domain and all services configured for production."

[WHY PRODUCTION DEPLOYMENT MATTERS - 0:20-0:50]
"Local development ≠ production reality:

- **Custom domain**: Builds credibility and branding
- **Production services**: Clerk, Polar, etc. require verified domains
- **Real user traffic**: Performance, scaling, monitoring
- **Business validation**: Actual users = real business
- **Revenue generation**: Live payments and subscriptions

This transforms your project from 'demo' to 'business'."

[PREREQUISITES CHECKLIST - 0:50-1:10]
"Before deploying, ensure you have:

✅ Purchased domain name
✅ App working locally with all features
✅ All API keys and environment variables
✅ Database schema finalized
✅ Tested all functionality end-to-end"

[DOMAIN SETUP - 1:10-1:40]
"First, secure your online identity:

1. **Purchase domain** from Namecheap, Porkbun, GoDaddy, etc.
2. **Configure DNS** - Railway provides instructions
   - Usually CNAME record to Railway target
   - Or use Railway nameservers for auto-setup

Your domain is your brand - choose wisely!"

[SERVICE PRODUCTION CONFIGURATION - 1:40-3:00]

**Clerk Production Setup:**
1. Create production app in Clerk Dashboard
2. Choose your purchased domain
3. Configure DNS records (TXT/CNAME)
4. Create JWT template for Convex
5. Copy production API keys

**Polar.sh Production Setup:**
1. Create production organization
2. Copy access token and org ID
3. Set server to 'production'
4. Configure webhook with Convex production URL

**Convex Production Setup:**
1. Switch to production environment
2. Reconfigure all environment variables
3. Generate production deploy key

**Email & AI Production:**
- Update Resend with custom domain
- Ensure OpenAI key in production environment

[RAILWAY DEPLOYMENT - 3:00-4:00]
"Railway makes deployment simple:

1. **Create project** - Deploy from GitHub repo
2. **Configure build settings:**
   - Build: `npx convex deploy --cmd 'bun run build'`
   - Start: `bun run start`

3. **Environment variables** - Critical distinction:
   - **Railway**: Client-side vars (VITE_*), server-side deploy keys
   - **Convex**: Backend secrets (API keys, webhook secrets)

4. **Custom domain** - Add in Railway settings
5. **Deploy** - Automatic on git push"

[ENVIRONMENT VARIABLE MATRIX - 4:00-4:30]
"Where each variable goes (this confuses everyone):

| Variable | Railway | Convex | Notes |
|----------|---------|--------|-------|
| VITE_CONVEX_URL | ✅ | ❌ | Client-side, build-time |
| VITE_CLERK_PUBLISHABLE_KEY | ✅ | ❌ | Client-side, build-time |
| CONVEX_DEPLOY_KEY | ✅ | ❌ | For automatic deployments |
| CLERK_SECRET_KEY | ✅ | ✅ | Both need it (same value) |
| POLAR_* | ❌ | ✅ | Backend only |
| OPENAI_API_KEY | ❌ | ✅ | Backend only |
| RESEND_* | ❌ | ✅ | Backend only |

**Rule**: VITE_ prefixed = Railway (client), secrets = Convex (backend)"

[TESTING PRODUCTION DEPLOYMENT - 4:30-5:00]
"Verify everything works in production:

✅ **Domain**: https://yourdomain.com loads
✅ **SSL**: Padlock icon active
✅ **Auth**: Sign up/in flows work
✅ **Payments**: Checkout succeeds
✅ **Email**: Messages arrive
✅ **Features**: All functionality works
✅ **Performance**: Acceptable load times"

[WHAT THIS ACHIEVES - 5:00-5:15]
"With production deployment complete:

✅ Your startup is live and accessible
✅ Professional domain and branding
✅ Production-grade services configured
✅ Real users can sign up and pay
✅ Revenue generation begins
✅ Business validation starts

You now have a real, live SaaS business!"

[POST-DEPLOYMENT TASKS - 5:15-5:30]
"After launch, focus on:

- **Monitoring**: Error tracking, performance monitoring
- **Security**: Environment variable review, HTTPS verification
- **Documentation**: Update internal docs, create runbooks
- **Maintenance**: Regular updates, cost monitoring, scaling

Your journey from idea to live product is complete!"

[NEXT STEPS - 5:30-5:45]
"Congratulations! Your app is live. Next: Development Workflow - learn how to maintain and improve your production app.

You now have everything needed to run a successful SaaS business. Start acquiring customers and building features they love!"

---

**VISUAL NOTES**:
- Domain purchase walkthrough
- Service dashboard configurations
- Railway deployment process
- Environment variable setup matrix
- Production testing checklist
- Live app demonstration on custom domain
- Cost monitoring dashboards
- Success metrics visualization

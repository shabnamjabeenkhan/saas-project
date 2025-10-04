# AI Setup - Adding ChatGPT to Your App

**VIDEO LENGTH**: 4:00
**HOOK**: "Let's add AI capabilities to your app. This transforms your product from basic SaaS to an intelligent assistant that users love."

---

[OPENING - 0:00-0:20]
"Your app has all the essential SaaS features. Now let's add AI to make it truly intelligent and engaging.

By the end of this video, your users will be able to chat with an AI powered by GPT, with full conversation history and real-time responses."

[WHY AI MATTERS - 0:20-0:45]
"AI transforms basic products into intelligent experiences:

- **Conversational interfaces**: Natural way for users to interact
- **Intelligent assistance**: Help users accomplish tasks
- **Personalization**: AI can adapt to user preferences
- **Scalable support**: Handle common questions automatically
- **Competitive advantage**: AI features differentiate your product

OpenAI's GPT models provide production-ready AI capabilities."

[UPDATE CONFIGURATION - 0:45-1:05]
"Enable AI chat in config.ts:

```typescript
export const config: AppConfig = {
  features: {
    auth: true,
    payments: true,
    convex: true,
    email: true,
    monitoring: false,
  },
  services: {
    openai: {
      enabled: true,    // ✅ Enable OpenAI
      apiKey: process.env.OPENAI_API_KEY,
    },
  },
  ui: {
    showChat: true,     // ✅ Show AI chat
  },
};
```"

[SET UP OPENAI ACCOUNT - 1:05-1:35]
"OpenAI provides the AI brain:

1. **Create account** at openai.com
2. **Complete verification** (phone number, etc.)
3. **Generate API key:**
   - Go to API Keys section
   - Create new secret key
   - Copy the key (starts with sk-)"

[CONFIGURE ENVIRONMENT VARIABLES - 1:35-1:55]
"Add OpenAI key in two places:

1. **Local environment (.env.local):**
```bash
OPENAI_API_KEY=sk-...
```

2. **Convex environment variables:**
   - Go to Convex Dashboard → Settings → Environment Variables
   - Add: `OPENAI_API_KEY=sk-...`

Both local and server-side access needed for full functionality."

[TEST AI CHAT FUNCTIONALITY - 1:55-3:00]
"Let's test the AI chat system:

1. **Restart development server:**
```bash
bun run dev
```

2. **Access AI chat:**
   - Go to /dashboard (authenticated)
   - Navigate to /dashboard/chat
   - Type a message and start conversation

3. **Verify AI responses:**
   - Should receive coherent GPT responses
   - Chat history persists in database
   - Real-time streaming should work
   - Multi-user support (each user sees their own chat)"

[WHAT THIS ENABLES - 3:00-3:30]
"With AI working, your app now has:

✅ Conversational AI with GPT models
✅ Persistent chat history in Convex
✅ Real-time message streaming
✅ Context-aware responses
✅ Multi-user chat isolation
✅ Scalable AI infrastructure

Your product just became an intelligent assistant!"

[USAGE CONSIDERATIONS - 3:30-3:45]
"Important things to know about AI:

**Cost**: OpenAI charges per token (input + output)
- ~$0.002 per 1K tokens for GPT-4
- Monitor usage in OpenAI dashboard

**Rate Limits**: Respect API limits
- RPM (requests per minute)
- TPM (tokens per minute)

**Content Moderation**: Consider filtering if needed

**Performance**: AI requests take time - design UX accordingly"

[COMMON ISSUES - 3:45-4:00]
"Most AI issues are configuration or credits:

- **API key missing**: Must be in both local and Convex environment
- **No credits**: Add payment method to OpenAI account
- **Rate limited**: Slow down requests or upgrade plan
- **Not persisting**: Ensure Convex server running and user authenticated
- **Slow responses**: Normal for AI - implement streaming UI"

[NEXT STEPS - 4:00-4:15]
"Excellent! Your app now has AI capabilities. Next: Production Deployment - we'll get your app live on Railway so real users can access it.

You now have a complete, production-ready SaaS application with AI. Time to launch!

See you in the production deployment video!"

---

**VISUAL NOTES**:
- OpenAI dashboard walkthrough
- API key generation demo
- Live AI chat testing
- Chat history persistence demo
- Real-time streaming visualization
- Cost and usage monitoring
- Before/after AI capabilities comparison

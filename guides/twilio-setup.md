# Twilio Call Tracking Setup Guide

This guide walks you through setting up Twilio call tracking integration with your TradeBoost AI dashboard.

## Prerequisites

- Twilio account (free trial available, no credit card required)
- Twilio phone number ($1.15/month for local numbers)
- Your Convex deployment URL
- Access to Convex environment variables

---

## Step 1: Sign Up for Twilio

1. **Visit**: https://www.twilio.com/try-twilio
2. **Sign up** for a free trial (no credit card required)
3. **Verify your account**: Verify your email and phone number
4. **Get a free trial phone number**: Click "Get a Trial Number" in the Twilio Console

**Pricing**:
- Phone numbers: $1.15/month (local), $2.15/month (toll-free)
- Inbound calls: $0.0085/min (local), $0.0220/min (toll-free)
- Outbound calls: $0.0140/min
- **No monthly subscription required** - pay-as-you-go pricing

---

## Step 2: Get Your Webhook URL

Your webhook endpoint URL is:
```
https://[your-convex-deployment].convex.site/call-tracking/webhook
```

**To find your Convex deployment URL:**
1. Check your `.env.local` file for `VITE_CONVEX_URL`
2. Or run: `bunx convex env get CONVEX_DEPLOYMENT`
3. Format: `https://[deployment-name].convex.site/call-tracking/webhook`

**Example:**
```
https://your-app-123.convex.site/call-tracking/webhook
```

---

## Step 3: Configure Status Callback on Your Twilio Phone Number

Twilio sends status callbacks when calls complete. You need to configure this on your phone number.

### Via Twilio Console:

1. **Log into Twilio Console**: https://console.twilio.com
2. **Navigate to**: Phone Numbers > Manage > Active Numbers
3. **Click on your phone number** (or purchase one if you don't have one)
4. **Scroll to "Voice & Fax"** section
5. **Find "A CALL COMES IN"** section:
   - Set **Webhook URL**: Your Convex webhook URL from Step 2
   - Set **HTTP Method**: `POST`
6. **Find "STATUS CALLBACK URL"** section:
   - Set **Status Callback URL**: Your Convex webhook URL from Step 2
   - Set **Status Callback Method**: `POST`
   - Set **Status Callback Events**: Select `completed` (or all events: `initiated`, `ringing`, `answered`, `completed`)
7. **Click "Save"**

### Via Twilio API (Alternative):

You can also configure status callbacks via API:

```bash
curl -X POST \
  "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/IncomingPhoneNumbers/{PhoneNumberSid}.json" \
  -u "{AccountSid}:{AuthToken}" \
  -d "StatusCallback=https://your-app.convex.site/call-tracking/webhook" \
  -d "StatusCallbackMethod=POST" \
  -d "StatusCallbackEvent=completed"
```

**Note**: Status callbacks fire when calls complete with full call data including `CallDuration`.

---

## Step 4: Get Your Twilio Auth Token

Twilio uses your Auth Token for webhook signature verification:

### Via Twilio Console:

1. Go to **Console Dashboard**: https://console.twilio.com
2. Your **Account SID** and **Auth Token** are displayed on the dashboard
3. Click **"Show"** next to Auth Token to reveal it
4. **Copy the Auth Token** (keep it secret!)

### Via API:

You can also retrieve it via API (requires API key):

```bash
curl -X GET \
  "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}.json" \
  -u "{AccountSid}:{ApiKey}"
```

**Save this token** - you'll need it for signature verification in Step 5.

---

## Step 5: Add Environment Variables

### Required: Twilio Auth Token

Add the auth token to Convex environment variables:

```bash
bunx convex env set TWILIO_AUTH_TOKEN your_auth_token_here
```

**Example:**
```bash
bunx convex env set TWILIO_AUTH_TOKEN abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**To verify it was set:**
```bash
bunx convex env get TWILIO_AUTH_TOKEN
```

**Security Note**: Never commit your Auth Token to git. Always use environment variables.

---

## Step 6: Configure Webhook Data Fields

Twilio automatically sends all call data in the status callback payload. The webhook includes:

### Required Fields (automatically included):
- ✅ **CallSid** - Unique call identifier (e.g., "CA1234567890ABCDE")
- ✅ **From** - Caller's phone number (E.164 format, e.g., "+12349013030")
- ✅ **To** - Called phone number (E.164 format, e.g., "+18005551212")
- ✅ **CallStatus** - Call status: "completed", "busy", "failed", "no-answer", etc.
- ✅ **CallDuration** - Call duration in seconds (only present in "completed" status)
- ✅ **Timestamp** - RFC 2822 format timestamp (e.g., "Tue, 31 Aug 2010 20:36:29 +0000")
- ✅ **Direction** - "inbound" or "outbound-api"

### Additional Fields Available:
- `AccountSid` - Your Twilio account ID
- `ApiVersion` - API version used
- `CallerName` - Caller ID name (if lookup enabled)
- `ForwardedFrom` - Forwarded number (if applicable)
- `RecordingUrl` - Recording URL (if recording enabled)
- `RecordingSid` - Recording SID (if recording enabled)
- And many more (see Twilio API docs)

### Custom Parameters for User ID:

**IMPORTANT**: Twilio status callbacks don't automatically include your `userId`. You have two options:

#### Option A: Custom Parameters in Status Callback URL (Recommended)
1. Add `userId` as a query parameter to your Status Callback URL:
   ```
   https://your-app.convex.site/call-tracking/webhook?userId={USER_ID}
   ```
2. However, Twilio doesn't support dynamic query params directly
3. **Better approach**: Use Twilio's `StatusCallback` parameter when creating calls programmatically

#### Option B: Tracking Number Lookup (Future Enhancement)
- Create a `trackingNumbers` table mapping tracking numbers to userIds
- Update webhook handler to lookup userId from tracking number (`To` field)

**For MVP**: Use Option B (tracking number lookup) - most reliable approach.

---

## Step 7: Test the Integration

1. **Make a Test Call**: Call your Twilio phone number
2. **Let the call complete**: Answer and talk for at least 30 seconds
3. **Check Twilio Console Logs**: 
   - Go to Monitor > Logs > Calls
   - Find your test call
   - Check that Status Callback was sent (should show webhook delivery status)
4. **Check Convex Logs**: 
   ```bash
   bunx convex logs
   ```
   Look for successful webhook processing
5. **Verify in Dashboard**: Check that the call appears in your TradeBoost AI dashboard

---

## Step 8: Link Tracking Numbers to Users

**Current Implementation**: The webhook needs `userId` to associate calls with users.

**Options to provide userId:**

### Option A: Tracking Number Lookup (Recommended)
- Create a `trackingNumbers` table mapping tracking numbers (Twilio phone numbers) to userIds
- Update webhook handler to lookup userId from `To` field (the Twilio number that received the call)
- This is the most reliable approach for Twilio

### Option B: Custom Parameters (Limited)
- When creating calls programmatically via Twilio API, you can add custom parameters
- However, this only works for outbound calls, not inbound calls
- For inbound calls, use Option A

**For MVP**: Use Option A (tracking number lookup) - works for both inbound and outbound calls.

---

## Troubleshooting

### Webhook Not Receiving Calls

1. **Check Status Callback URL**: Ensure it's correctly configured on your phone number
2. **Check Twilio Logs**: 
   - Monitor > Logs > Calls
   - Find your call and check "Status Callback" column
   - Look for delivery status (200 = success, 4xx/5xx = error)
3. **Check Convex Logs**: `bunx convex logs`
4. **Verify Status Callback Events**: Ensure "completed" event is selected
5. **Check HTTP Method**: Ensure Status Callback Method is set to `POST`

### Calls Not Appearing in Dashboard

1. **Check userId**: Ensure `userId` is being resolved (via tracking number lookup)
2. **Check Call Qualification**: Only calls with `CallStatus === "completed"` and `CallDuration >= 30` seconds are qualified
3. **Check Convex Database**: Query `qualifiedCalls` table to see if calls are being recorded
4. **Check Call Direction**: Both "inbound" and "outbound-api" calls are processed

### Signature Verification Errors

1. **Check Auth Token**: Ensure `TWILIO_AUTH_TOKEN` matches your Twilio Console
2. **Verify Signature Header**: Twilio sends signature in `X-Twilio-Signature` header
3. **Check Payload Format**: Twilio sends form-urlencoded by default, signature is based on form params
4. **Note**: Signature verification is currently a placeholder in MVP - full implementation requires crypto module

### Common Issues

**Issue**: "Missing externalCallId" error
- **Solution**: Ensure Twilio is sending `CallSid` field in webhook payload (should be automatic)

**Issue**: Calls not qualifying
- **Solution**: Check that calls have `CallStatus === "completed"` and `CallDuration >= 30` seconds

**Issue**: userId is "TBD_FROM_TRACKING_NUMBER"
- **Solution**: Implement tracking number lookup table (see Step 8)

**Issue**: CallDuration is 0 or missing
- **Solution**: Ensure Status Callback Event includes "completed" - CallDuration only present in completed events

---

## Field Mapping Reference

| Twilio Field | Our Schema Field | Notes |
|--------------|------------------|-------|
| `CallSid` | `externalCallId` | Unique call ID (e.g., "CA1234567890ABCDE") |
| `From` | `fromNumber` | Caller's phone number (E.164 format) |
| `To` | `toNumber` / `trackingNumber` | The Twilio number that received the call |
| `Timestamp` | `startedAt` | RFC 2822 timestamp converted to ms epoch |
| `CallDuration` | `durationSeconds` | Duration in seconds (only in completed status) |
| `CallStatus` | `answered` | "completed" = answered, others = not answered |

---

## Webhook Payload Example

Here's what a Twilio status callback payload looks like (form-urlencoded format):

```
CallSid=CA1234567890ABCDE&
AccountSid=AC1234567890ABCDE&
From=%2B12349013030&
To=%2B18005551212&
CallStatus=completed&
ApiVersion=2010-04-01&
Direction=inbound&
CallDuration=45&
Timestamp=Tue%2C+31+Aug+2010+20%3A36%3A29+%2B0000
```

**Parsed as object:**
```json
{
  "CallSid": "CA1234567890ABCDE",
  "AccountSid": "AC1234567890ABCDE",
  "From": "+12349013030",
  "To": "+18005551212",
  "CallStatus": "completed",
  "ApiVersion": "2010-04-01",
  "Direction": "inbound",
  "CallDuration": "45",
  "Timestamp": "Tue, 31 Aug 2010 20:36:29 +0000"
}
```

---

## Signature Verification

Twilio uses HMAC-SHA1 for webhook signatures:

1. **Header**: `X-Twilio-Signature` header contains the signature
2. **Algorithm**: HMAC-SHA1
3. **Encoding**: Base64
4. **Payload**: Sorted form-urlencoded parameters + full URL

**Signature Verification Algorithm:**
1. Sort all POST parameters alphabetically by key
2. Concatenate sorted key-value pairs as "key=value" strings
3. Append the full URL (including query params) to the string
4. Compute HMAC-SHA1 of resulting string using Auth Token as key
5. Base64 encode the result
6. Compare with `X-Twilio-Signature` header

**Example verification (Node.js with Twilio SDK):**
```javascript
const twilio = require('twilio');
const authToken = process.env.TWILIO_AUTH_TOKEN;
const signature = req.headers.get('X-Twilio-Signature');
const url = req.url;
const params = { /* form params */ };

const isValid = twilio.validateRequest(authToken, signature, url, params);
```

**Note**: Full signature verification is implemented as a placeholder in the webhook handler. For production, implement full HMAC-SHA1 verification using Web Crypto API or Twilio SDK.

---

## Next Steps

After setup:
1. ✅ Test with a real call
2. ✅ Verify calls appear in dashboard
3. ✅ Check qualification rules (CallStatus === "completed" && CallDuration >= 30s)
4. ✅ Monitor Convex logs for any errors
5. ✅ Set up tracking number lookup table for userId resolution

---

## Support

- **Twilio API Docs**: https://www.twilio.com/docs/voice/api
- **Twilio Webhook Docs**: https://www.twilio.com/docs/usage/webhooks/voice-webhooks
- **Twilio Status Callback Docs**: https://www.twilio.com/docs/voice/api/call-resource#statuscallback
- **Twilio Support**: Call 877-857-2713 or submit ticket via dashboard
- **Convex Logs**: `bunx convex logs` for debugging

---

## Implementation Notes

- **Webhook endpoint**: `POST /call-tracking/webhook`
- **Provider detection**: Auto-detects Twilio by `CallSid` field (starts with "CA")
- **Payload format**: Form-urlencoded by default (can also be JSON)
- **Idempotency**: Uses `CallSid` field to prevent duplicate processing
- **Qualification**: Calls must have `CallStatus === "completed"` and `CallDuration >= 30` seconds
- **Signature verification**: HMAC-SHA1 with base64 encoding (configured via `TWILIO_AUTH_TOKEN`)
- **Event type**: Status callback fires on "completed" event (configurable)

---

## Cost Comparison

| Provider | Free Trial | Webhooks Available | Cheapest Plan | Pay-as-you-go |
|----------|------------|-------------------|---------------|---------------|
| **Twilio** | ✅ Free trial, no CC | ✅ All plans | $1.15/mo + usage | ✅ Yes |
| CallRail | ✅ 14 days, no CC | ✅ All plans | $45/mo | ❌ No |
| Nimbata | ❌ Not mentioned | ❌ Agency only | $120/mo | ❌ No |

**Twilio is the best choice for MVP** - cheapest for low volume, pay-as-you-go pricing, and includes free trial!

**Example Monthly Cost** (100 calls/month, ~5 min each):
- **Twilio**: $1.15 (phone) + $0.43 (calls) = **~$1.58/month**
- **CallRail**: **$45/month** (minimum subscription)


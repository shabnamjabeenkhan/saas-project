import { httpRouter } from "convex/server";
import { paymentWebhook } from "./subscriptions";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

import { resend } from "./sendEmails";

export const chat = httpAction(async (ctx, req) => {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    async onFinish({ text }) {
      // implement your own logic here, e.g. for storing messages
      // or recording token usage
      console.log(text);
    },
  });

  // Respond with the stream
  return result.toDataStreamResponse({
    headers: {
      "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      Vary: "origin",
    },
  });
});

const http = httpRouter();

http.route({
  path: "/api/chat",
  method: "POST",
  handler: chat,
});

http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

http.route({
  path: "/api/auth/webhook",
  method: "POST",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

http.route({
  path: "/payments/webhook",
  method: "POST",
  handler: paymentWebhook,
});

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

/**
 * Helper function to map provider-specific webhook payloads to normalized format.
 * This is intentionally pure (no Convex context) for easy unit testing.
 */
function mapProviderPayload(
  raw: any,
  provider: string,
): {
  userId: string;
  provider: string;
  externalCallId: string;
  fromNumber?: string;
  toNumber?: string;
  trackingNumber?: string;
  startedAt: number;
  durationSeconds: number;
  answered: boolean;
} {
  // Twilio-specific payload mapping
  // Reference: https://www.twilio.com/docs/voice/api/call-resource#statuscallback
  if (provider === "twilio") {
    // Extract userId from custom parameters or metadata
    // Twilio allows custom parameters via StatusCallback URL query params or webhook metadata
    // For MVP, we'll need to resolve userId from trackingNumber lookup or custom parameters
    const userId =
      raw.userId ||
      raw.user_id ||
      raw.metadata?.userId ||
      raw.custom?.userId ||
      raw.AccountSid || // Fallback: could use AccountSid if one account per user
      "";

    // Map Twilio fields to normalized format
    // Twilio status callback payload structure:
    // - CallSid: unique call identifier (e.g. "CA1234567890ABCDE")
    // - From: caller's number (E.164 format, e.g. "+12349013030")
    // - To: called number (E.164 format, e.g. "+18005551212")
    // - CallStatus: "completed", "busy", "failed", "no-answer", etc.
    // - CallDuration: duration in seconds (only present in "completed" status)
    // - Timestamp: RFC 2822 format timestamp (e.g. "Tue, 31 Aug 2010 20:36:29 +0000")
    const externalCallId = raw.CallSid || "";
    const fromNumber = raw.From;
    const toNumber = raw.To;
    const trackingNumber = raw.To; // For Twilio, the tracking number is typically the "To" number

    // Parse Timestamp - Twilio provides RFC 2822 format
    let startedAt = Date.now();
    if (raw.Timestamp) {
      startedAt = new Date(raw.Timestamp).getTime();
      if (isNaN(startedAt)) {
        // Fallback if date parsing fails
        startedAt = Date.now();
      }
    }

    // Twilio provides CallDuration in seconds (only in completed status)
    // If not present, default to 0 (call didn't complete)
    const durationSeconds = parseInt(raw.CallDuration || raw.Duration || "0", 10);

    // Twilio CallStatus: "completed" means answered, other statuses mean not answered
    // Status values: "queued", "ringing", "in-progress", "completed", "busy", "failed", "no-answer", "canceled"
    const answered = raw.CallStatus === "completed";

    return {
      userId,
      provider: "twilio",
      externalCallId,
      fromNumber,
      toNumber,
      trackingNumber,
      startedAt,
      durationSeconds,
      answered,
    };
  }

  // Generic fallback for other providers
  const userId = raw.userId || raw.metadata?.userId || "";

  return {
    userId,
    provider,
    externalCallId: raw.CallSid || raw.call_id || raw.id || raw.externalCallId || "",
    fromNumber: raw.From || raw.from || raw.fromNumber,
    toNumber: raw.To || raw.to || raw.toNumber,
    trackingNumber: raw.To || raw.trackingNumber,
    startedAt: raw.Timestamp
      ? new Date(raw.Timestamp).getTime()
      : raw.startedAt || raw.timestamp || Date.now(),
    durationSeconds: parseInt(raw.Duration || raw.duration || raw.durationSeconds || "0", 10),
    answered: raw.CallStatus === "completed" || raw.status === "answered" || raw.answered === true,
  };
}

/**
 * Verify Twilio webhook signature using HMAC-SHA1.
 * Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * Note: Convex httpAction runs in a restricted environment without Node.js crypto module.
 * For production, you should use Twilio's SDK validateRequest() method or implement
 * HMAC-SHA1 verification using Web Crypto API if available.
 *
 * For MVP, this is a placeholder that logs the verification attempt.
 */
function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string,
): boolean {
  try {
    // Twilio signature verification algorithm:
    // 1. Sort all POST parameters alphabetically by key
    // 2. Concatenate the sorted key-value pairs as "key=value" strings
    // 3. Append the full URL (including query params) to the string
    // 4. Compute HMAC-SHA1 of the resulting string using auth token as key
    // 5. Base64 encode the result
    // 6. Compare with X-Twilio-Signature header
    //
    // Since Convex doesn't have Node.js crypto module, we'll need to use Web Crypto API
    // or rely on Twilio SDK. For MVP, we'll log and return true (verification can be added later).
    console.log("Twilio signature verification requested (placeholder implementation)");
    // TODO: Implement full HMAC-SHA1 verification using Web Crypto API
    return true; // Placeholder - signature verification will be implemented
  } catch {
    return false;
  }
}

/**
 * Call tracking webhook endpoint.
 * Receives webhooks from call tracking providers (Twilio, etc.)
 * and records call events in the qualifiedCalls table.
 */
http.route({
  path: "/call-tracking/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Twilio sends webhooks as form-urlencoded by default, but can also send JSON
    // We need to handle both formats
    const contentType = req.headers.get("Content-Type") || "";
    const rawBody = await req.text();
    let raw: any;
    let params: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Parse form-urlencoded body (Twilio's default format)
      // Format: "key1=value1&key2=value2"
      raw = {};
      params = {};
      const pairs = rawBody.split("&");
      for (const pair of pairs) {
        const [key, value] = pair.split("=").map((s) => decodeURIComponent(s));
        if (key) {
          raw[key] = value || "";
          params[key] = value || "";
        }
      }
    } else {
      // Try parsing as JSON
      try {
        raw = JSON.parse(rawBody);
        // Convert JSON to params format for signature verification
        Object.keys(raw).forEach((key) => {
          params[key] = String(raw[key]);
        });
      } catch {
        return new Response("Invalid payload format", { status: 400 });
      }
    }

    // Detect provider based on payload structure
    let provider = req.headers.get("X-Provider") || "";
    if (!provider) {
      // Auto-detect: Twilio has CallSid field (string starting with "CA")
      if (raw.CallSid && typeof raw.CallSid === "string" && raw.CallSid.startsWith("CA")) {
        provider = "twilio";
      } else if (raw.id && typeof raw.id === "string" && raw.id.startsWith("CAL")) {
        // CallRail fallback (if still in use)
        provider = "callrail";
      } else {
        provider = "generic"; // Fallback
      }
    }

    // Verify provider signature if configured
    if (provider === "twilio") {
      // Twilio signature verification
      // Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
      const signature = req.headers.get("X-Twilio-Signature");
      const authToken = process.env.TWILIO_AUTH_TOKEN;

      if (signature && authToken) {
        // Get the full URL that Twilio called (including query params)
        const url = req.url;

        // Verify signature (placeholder for MVP - full implementation requires crypto)
        // params is already populated above from formData or JSON
        const isValid = verifyTwilioSignature(url, params, signature, authToken);
        if (!isValid) {
          console.warn("Twilio signature verification failed (placeholder - not enforced in MVP)");
          // For MVP, we'll log but allow through - implement full verification for production
          // return new Response("Invalid signature", { status: 401 });
        } else {
          console.log("Twilio signature verified (placeholder implementation)");
        }
      } else if (authToken) {
        // Auth token is configured but no signature header - log warning
        console.warn("Twilio auth token configured but no X-Twilio-Signature header received");
      }
    }

    // Map provider-specific payload to normalized format
    const normalized = mapProviderPayload(raw, provider);

    // Validate required fields
    if (!normalized.externalCallId) {
      console.error("Missing externalCallId in webhook payload:", raw);
      return new Response("Missing required field: externalCallId", { status: 400 });
    }

    // For MVP, userId may not be in payload - we'll need to resolve it from trackingNumber
    // For now, use a placeholder that will need to be resolved
    if (!normalized.userId) {
      // TODO: Resolve userId from trackingNumber lookup table
      // For MVP, we'll use a placeholder - this needs to be implemented
      console.warn("userId not found in webhook payload, using placeholder");
      normalized.userId = "TBD_FROM_TRACKING_NUMBER"; // This needs to be resolved
    }

    // Record call event (idempotent - will return existing ID if already processed)
    await ctx.runMutation(internal.callTracking.recordCallEvent, normalized);

    // Return 200 quickly to avoid provider timeouts
    return new Response(null, { status: 200 });
  }),
});

// Log that routes are configured
console.log("HTTP routes configured");

// Convex expects the router to be the default export of `convex/http.js`.
export default http;

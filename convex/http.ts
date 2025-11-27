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
 * 
 * TODO: Implement provider-specific mapping logic (Twilio, CallRail, etc.)
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
  // For MVP: Generic mapping assuming common webhook structure
  // TODO: Add provider-specific parsing (Twilio, CallRail, etc.)
  
  // Extract userId from payload metadata or infer from trackingNumber lookup
  // For MVP, we'll need to determine userId from the payload or tracking number
  // This is a placeholder - actual implementation depends on provider
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
 * Call tracking webhook endpoint.
 * Receives webhooks from call tracking providers (Twilio, CallRail, etc.)
 * and records call events in the qualifiedCalls table.
 */
http.route({
  path: "/call-tracking/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // Determine provider from headers or path (for MVP, default to generic)
    const provider = req.headers.get("X-Provider") || "twilio"; // or infer from headers/path

    // TODO: Verify provider signature from headers
    // Example: Twilio uses X-Twilio-Signature header with HMAC
    // For MVP, we'll add a stub that can be implemented later
    const signature = req.headers.get("X-Twilio-Signature") || req.headers.get("X-Signature");
    if (signature) {
      // TODO: Verify HMAC signature with provider secret
      // const isValid = verifySignature(req, signature, process.env.TWILIO_AUTH_TOKEN);
      // if (!isValid) {
      //   return new Response("Invalid signature", { status: 401 });
      // }
    }

    // Parse webhook payload
    const raw = await req.json();

    // Map provider-specific payload to normalized format
    const normalized = mapProviderPayload(raw, provider);

    // Validate required fields
    if (!normalized.userId || !normalized.externalCallId) {
      console.error("Missing required fields in webhook payload:", normalized);
      return new Response("Missing required fields", { status: 400 });
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

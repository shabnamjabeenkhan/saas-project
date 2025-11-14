import { isFeatureEnabled, isServiceEnabled } from "../../config";
import { api } from "../../convex/_generated/api";
import type { Route } from "./+types/home";
import { Suspense, lazy } from 'react';
import { LovableLanding } from "~/components/lovable/lovable-landing";

// Keep the Kaizen footer
const Footer = lazy(() => import("~/components/homepage/footer"));

export function meta({}: Route.MetaArgs) {
  const title = "TradeBoost AI - AI-Powered Google Ads for UK Plumbers & Electricians";
  const description =
    "Stop paying £4,000/month to marketing agencies. Answer 5 simple questions and let AI generate high-converting Google Ads campaigns in minutes.";
  const keywords = "Google Ads, Plumbers, Electricians, AI Marketing, UK Trades, Lead Generation";
  const siteUrl = "https://www.kaizen.codeandcreed.tech/";
  const imageUrl = "/kaizen.svg";

  return [
    { title },
    {
      name: "description",
      content: description,
    },

    // Open Graph / Facebook
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:url", content: siteUrl },
    { property: "og:site_name", content: "TradeBoost AI" },

    // Twitter Card
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    {
      name: "twitter:description",
      content: description,
    },
    { name: "twitter:image", content: imageUrl },
    {
      name: "keywords",
      content: keywords,
    },
    { name: "author", content: "TradeBoost AI" },
    { name: "favicon", content: imageUrl },
  ];
}

export async function loader(args: Route.LoaderArgs) {
  const authEnabled = isFeatureEnabled("auth") && isServiceEnabled("clerk");
  const convexEnabled = isFeatureEnabled("convex") && isServiceEnabled("convex");
  const paymentsEnabled = isFeatureEnabled("payments") && isServiceEnabled("polar");

  // 1. Auth: get userId and user data if auth enabled, else null
  let userId: string | null = null;
  let user: any = null;
  if (authEnabled) {
    const { getAuth } = await import("@clerk/react-router/ssr.server");
    const { createClerkClient } = await import("@clerk/react-router/api.server");

    ({ userId } = await getAuth(args));

    // Fetch user details if authenticated
    if (userId) {
      try {
        user = await createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY as string,
        }).users.getUser(userId);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    }
  }

  // 2. Fetch subscription status & plans only if Convex enabled
  let subscriptionData: { hasActiveSubscription: boolean } | null = null;
  let plans: any = null;

  if (convexEnabled) {
    const { fetchQuery, fetchAction } = await import("convex/nextjs");

    const promises: Promise<any>[] = [
      userId
        ? fetchQuery(api.subscriptions.checkUserSubscriptionStatus, {
            userId,
          }).catch((error: unknown) => {
            console.error("Failed to fetch subscription data:", error);
            return null;
          })
        : Promise.resolve(null),
    ];

    // Only fetch plans if payments are enabled
    if (paymentsEnabled) {
      promises.push(fetchAction(api.subscriptions.getAvailablePlans));
    } else {
      promises.push(Promise.resolve(null));
    }

    [subscriptionData, plans] = await Promise.all(promises);
  }

  return {
    isSignedIn: !!userId,
    user,
    hasActiveSubscription: subscriptionData?.hasActiveSubscription || false,
    plans,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <LovableLanding isSignedIn={loaderData.isSignedIn} user={loaderData.user} />
      <Suspense fallback={<div className="h-32 bg-muted" />}>
        <Footer />
      </Suspense>
    </>
  );
}

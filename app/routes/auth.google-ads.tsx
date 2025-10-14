import { redirect, type LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    // Handle OAuth error
    console.error("Google Ads OAuth error:", error);
    return redirect("/dashboard?error=oauth_failed");
  }

  if (code) {
    // Exchange code for tokens using Convex action
    // TODO: Implement token exchange
    console.log("OAuth code received:", code);
    return redirect("/dashboard?success=google_ads_connected");
  }

  // If no code or error, redirect to dashboard
  return redirect("/dashboard");
}
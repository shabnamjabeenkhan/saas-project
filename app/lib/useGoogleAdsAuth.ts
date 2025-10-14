import { useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/google-ads`;

export function useGoogleAdsAuth() {
  const [isLoading, setIsLoading] = useState(false);

  const connectGoogleAds = () => {
    setIsLoading(true);

    const scopes = [
      "https://www.googleapis.com/auth/adwords",
    ];

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    // Redirect to Google OAuth
    window.location.href = authUrl.toString();
  };

  return {
    connectGoogleAds,
    isLoading,
  };
}
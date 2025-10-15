import { useState, useEffect } from "react";
import { toast } from "sonner";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DEVELOPMENT_MODE = import.meta.env.VITE_DEVELOPMENT_MODE === "true";

export function useGoogleAdsAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    if (DEVELOPMENT_MODE) {
      // In development, check localStorage for mock connection
      const mockConnection = localStorage.getItem("mock_google_ads_connected");
      setIsConnected(mockConnection === "true");
    } else {
      // In production, check for real OAuth tokens
      const realTokens = localStorage.getItem("google_ads_tokens");
      setIsConnected(!!realTokens);
    }
  }, []);

  const connectGoogleAds = () => {
    // Check if we're on the client side
    if (typeof window === "undefined") return;

    setIsLoading(true);

    // Development mode: Mock successful connection
    if (DEVELOPMENT_MODE) {
      console.log("🔧 Development mode: Mocking Google Ads connection");

      // Simulate API delay
      setTimeout(() => {
        localStorage.setItem("mock_google_ads_connected", "true");
        setIsConnected(true);
        setIsLoading(false);
        toast.success("✅ Google Ads connected (Development Mode)");
      }, 1500);
      return;
    }

    // Production mode: Real OAuth flow
    const REDIRECT_URI = `${window.location.origin}/auth/google-ads`;

    console.log("Google Client ID:", GOOGLE_CLIENT_ID);
    console.log("Redirect URI:", REDIRECT_URI);

    if (!GOOGLE_CLIENT_ID) {
      console.error("VITE_GOOGLE_CLIENT_ID is not set!");
      toast.error("Google Client ID not configured");
      setIsLoading(false);
      return;
    }

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

    console.log("OAuth URL:", authUrl.toString());

    // Redirect to Google OAuth
    window.location.href = authUrl.toString();
  };

  const disconnectGoogleAds = () => {
    if (DEVELOPMENT_MODE) {
      localStorage.removeItem("mock_google_ads_connected");
      console.log("🔧 Development mode: Disconnected Google Ads");
    } else {
      localStorage.removeItem("google_ads_tokens");
    }
    setIsConnected(false);
    toast.success("Google Ads disconnected");
  };

  return {
    connectGoogleAds,
    disconnectGoogleAds,
    isLoading,
    isConnected,
  };
}
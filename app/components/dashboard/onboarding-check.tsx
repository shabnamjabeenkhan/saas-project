"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "@clerk/react-router";

export function OnboardingCheck() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const hasCompleted = useQuery(api.onboarding.hasCompletedOnboarding);

  useEffect(() => {
    // Only redirect if:
    // 1. Auth has loaded
    // 2. User is signed in
    // 3. We have a definitive answer that onboarding is not completed
    if (isLoaded && isSignedIn && hasCompleted === false) {
      navigate("/onboarding", { replace: true });
    }
  }, [hasCompleted, navigate, isLoaded, isSignedIn]);

  // Don't render anything if not completed (will redirect)
  if (isLoaded && isSignedIn && hasCompleted === false) {
    return null;
  }

  // Allow loading state and completed state to pass through
  return null;
}
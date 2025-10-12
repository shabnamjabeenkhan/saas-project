"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export function OnboardingCheck() {
  const navigate = useNavigate();
  const hasCompleted = useQuery(api.onboarding.hasCompletedOnboarding);

  useEffect(() => {
    // Only redirect if we have a definitive answer (not loading)
    if (hasCompleted === false) {
      navigate("/onboarding", { replace: true });
    }
  }, [hasCompleted, navigate]);

  // Don't render anything if not completed (will redirect)
  if (hasCompleted === false) {
    return null;
  }

  // Allow loading state and completed state to pass through
  return null;
}
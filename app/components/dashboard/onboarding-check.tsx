"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, useLocation } from "react-router";
import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/react-router";
import { isAdminEmail } from "~/utils/admin";

export function OnboardingCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const onboardingStatus = useQuery(api.onboarding.hasCompletedOnboarding);
  const hasRedirected = useRef(false);

  // Check if current user is an admin
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = userEmail ? isAdminEmail(userEmail) : false;

  useEffect(() => {
    // Skip if already on onboarding page - allow users to manually navigate there
    if (location.pathname === "/onboarding") {
      // Reset redirect flag when on onboarding page so they can complete it
      hasRedirected.current = false;
      return;
    }

    // Skip if already redirected in this session
    if (hasRedirected.current) {
      return;
    }

    // Wait for proper query result structure
    if (!onboardingStatus || typeof onboardingStatus !== 'object') {
      return;
    }

    // Admin users must still complete onboarding on first signup
    // Only skip onboarding check if admin has already completed onboarding
    if (isAdmin && onboardingStatus.isComplete) {
      console.log('🔑 OnboardingCheck: Admin user with completed onboarding detected, skipping onboarding check');
      return;
    }

    // Only redirect if:
    // 1. Auth has loaded
    // 2. User is signed in
    // 3. Query has returned (either with or without data)
    // 4. Onboarding is not complete (including new users with no data)
    // This applies to ALL users (including admins) who haven't completed onboarding
    const shouldRedirectToOnboarding = isLoaded && isSignedIn && (
      !onboardingStatus.hasData || // New user with no onboarding record
      (onboardingStatus.hasData && !onboardingStatus.isComplete) // Existing user who hasn't completed
    );

    if (shouldRedirectToOnboarding) {
      console.log('🚨 OnboardingCheck: Redirecting to onboarding', {
        isLoaded,
        isSignedIn,
        hasData: onboardingStatus.hasData,
        isComplete: onboardingStatus.isComplete,
        pathname: location.pathname,
        reason: !onboardingStatus.hasData ? 'new_user' : 'incomplete_onboarding'
      });
      hasRedirected.current = true;
      navigate("/onboarding", { replace: true });
    }
  }, [onboardingStatus, navigate, isLoaded, isSignedIn, location.pathname, isAdmin]);

  // Reset redirect flag when onboarding is completed
  useEffect(() => {
    if (onboardingStatus?.isComplete) {
      hasRedirected.current = false;
    }
  }, [onboardingStatus?.isComplete]);

  return null;
}
import React, { useState, useEffect } from 'react';
import { useCompliance } from '~/lib/complianceContext';
import { TermsVersionManager } from '~/lib/termsVersioning';
import { TermsAcceptanceModal } from './TermsAcceptanceModal';
import { useUser } from '@clerk/react-router';
import { isAdminEmail } from '~/utils/admin';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface TermsGuardProps {
  children: React.ReactNode;
  onSignOut?: () => void;
}

export const TermsGuard: React.FC<TermsGuardProps> = ({ children, onSignOut }) => {
  const { userId, isAuthenticated } = useCompliance();
  const { user } = useUser();
  const [needsAcceptance, setNeedsAcceptance] = useState<boolean>(false);
  const [userLastVersion, setUserLastVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Convex queries and mutations
  const getUserLastAcceptedTermsVersion = useQuery(
    api.compliance.getUserLastAcceptedTermsVersion,
    userId && userId !== 'anonymous' ? { userId } : "skip"
  );
  const recordTermsAcceptance = useMutation(api.compliance.recordTermsAcceptance);

  // Add timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('⚠️ Terms check timeout - falling back to localStorage');
        // Fallback to localStorage check if database is taking too long
        try {
          const lastAcceptedVersion = TermsVersionManager.getUserLastAcceptedVersion(userId || '');
          const needsToAccept = TermsVersionManager.checkIfUserNeedsToReAccept(lastAcceptedVersion || '');
          setUserLastVersion(lastAcceptedVersion);
          setNeedsAcceptance(needsToAccept);
          setIsLoading(false);
        } catch (error) {
          console.error('Fallback terms check failed:', error);
          setNeedsAcceptance(true);
          setIsLoading(false);
        }
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, userId]);

  // Check if current route should bypass terms check
  const isPublicRoute = () => {
    if (typeof window === 'undefined') return false;
    const pathname = window.location.pathname;
    const publicRoutes = ['/terms', '/privacy'];
    return publicRoutes.includes(pathname);
  };

  useEffect(() => {
    const checkTermsAcceptance = () => {
      console.log('🔍 Terms check triggered:', {
        userId,
        isAuthenticated,
        queryResult: getUserLastAcceptedTermsVersion,
        queryState: getUserLastAcceptedTermsVersion === undefined ? 'loading' : 'loaded'
      });

      // Skip terms check for public routes
      if (isPublicRoute()) {
        setNeedsAcceptance(false);
        setIsLoading(false);
        return;
      }

      if (!isAuthenticated || !userId || userId === 'anonymous') {
        console.log('🚫 User not authenticated, skipping terms check');
        setIsLoading(false);
        return;
      }

      // Check if user is admin - bypass terms acceptance for admins
      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      if (userEmail && isAdminEmail(userEmail)) {
        console.log('👑 Admin user detected, bypassing terms acceptance');
        setNeedsAcceptance(false);
        setIsLoading(false);
        return;
      }

      // Check if Convex query is still loading or failed
      if (getUserLastAcceptedTermsVersion === undefined) {
        console.log('⏳ Convex query still loading...');
        // Don't change loading state - keep waiting
        return;
      }

      try {
        // Use result from Convex query (null means no records found)
        const lastAcceptedVersion = getUserLastAcceptedTermsVersion;
        setUserLastVersion(lastAcceptedVersion);

        // Check if user needs to re-accept terms
        const needsToAccept = TermsVersionManager.checkIfUserNeedsToReAccept(lastAcceptedVersion || '');
        setNeedsAcceptance(needsToAccept);

        console.log('✅ Terms check completed:', {
          userId,
          lastAcceptedVersion,
          needsToAccept,
          currentVersion: TermsVersionManager.getCurrentTermsVersion().version
        });

        // Query completed successfully
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to check terms acceptance:', error);
        // On error, require acceptance for safety
        setNeedsAcceptance(true);
        setIsLoading(false);
      }
    };

    checkTermsAcceptance();
  }, [userId, isAuthenticated, user, getUserLastAcceptedTermsVersion]);

  const handleTermsAccepted = async () => {
    try {
      if (!userId) {
        throw new Error('No user ID available');
      }

      // Save to database via Convex
      await recordTermsAcceptance({
        userId,
        termsVersion: TermsVersionManager.getCurrentTermsVersion().version,
        acceptanceMethod: 'update_prompt',
        ipAddress: 'unknown', // Will be resolved asynchronously if needed
        userAgent: navigator.userAgent,
        pageUrl: window.location.href,
      });

      // Update local state immediately
      setNeedsAcceptance(false);
      setUserLastVersion(TermsVersionManager.getCurrentTermsVersion().version);

      console.log('Terms accepted and saved to database successfully');
    } catch (error) {
      console.error('Failed to handle terms acceptance:', error);
      // Don't block the user - set acceptance state anyway
      setNeedsAcceptance(false);
      setUserLastVersion(TermsVersionManager.getCurrentTermsVersion().version);
    }
  };

  const handleTermsDeclined = () => {
    // Sign out user if they decline terms
    if (onSignOut) {
      onSignOut();
    } else {
      // Fallback: redirect to sign-out or home page
      window.location.href = '/';
    }
  };

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking legal compliance status...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, just render children
  if (!isAuthenticated || userId === 'anonymous') {
    return <>{children}</>;
  }

  // If user needs to accept terms, show modal and block access
  if (needsAcceptance) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Legal Terms Update Required</h1>
            <p className="text-gray-600 mb-4">
              You must review and accept our updated legal terms to continue using TradeBoost AI.
            </p>
            <p className="text-sm text-red-600 font-medium">
              Access is blocked until terms are accepted.
            </p>
          </div>
        </div>

        <TermsAcceptanceModal
          isOpen={true}
          userLastVersion={userLastVersion}
          onAccept={handleTermsAccepted}
          onDecline={handleTermsDeclined}
        />
      </>
    );
  }

  // If terms are up to date, render children normally
  return <>{children}</>;
};
import React, { useState, useEffect } from 'react';
import { useCompliance } from '~/lib/complianceContext';
import { TermsVersionManager } from '~/lib/termsVersioning';
import { TermsAcceptanceModal } from './TermsAcceptanceModal';

interface TermsGuardProps {
  children: React.ReactNode;
  onSignOut?: () => void;
}

export const TermsGuard: React.FC<TermsGuardProps> = ({ children, onSignOut }) => {
  const { userId, isAuthenticated } = useCompliance();
  const [needsAcceptance, setNeedsAcceptance] = useState<boolean>(false);
  const [userLastVersion, setUserLastVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (!isAuthenticated || !userId || userId === 'anonymous') {
        setIsLoading(false);
        return;
      }

      try {
        // Get user's last accepted version
        const lastAcceptedVersion = TermsVersionManager.getUserLastAcceptedVersion(userId);
        setUserLastVersion(lastAcceptedVersion);

        // Check if user needs to re-accept terms
        const needsToAccept = TermsVersionManager.checkIfUserNeedsToReAccept(lastAcceptedVersion);
        setNeedsAcceptance(needsToAccept);

        console.log('Terms check:', {
          userId,
          lastAcceptedVersion,
          needsToAccept,
          currentVersion: TermsVersionManager.getCurrentTermsVersion().version
        });
      } catch (error) {
        console.error('Failed to check terms acceptance:', error);
        // On error, require acceptance for safety
        setNeedsAcceptance(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkTermsAcceptance();
  }, [userId, isAuthenticated]);

  const handleTermsAccepted = async () => {
    try {
      // Update local state
      setNeedsAcceptance(false);
      setUserLastVersion(TermsVersionManager.getCurrentTermsVersion().version);

      // Force refresh to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Failed to handle terms acceptance:', error);
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
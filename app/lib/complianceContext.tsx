import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/react-router';

interface ComplianceContextType {
  userId: string;
  userEmail: string | null;
  isAuthenticated: boolean;
  getUserIP: () => Promise<string>;
  getSessionId: () => string;
  logComplianceEvent: (eventType: string, eventData: any, pageUrl?: string) => Promise<void>;
}

const ComplianceContext = createContext<ComplianceContextType | null>(null);

export const ComplianceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoaded } = useUser();
  const [sessionId, setSessionId] = useState<string>('');

  // Generate session ID on mount
  useEffect(() => {
    let storedSessionId = sessionStorage.getItem('compliance_session');
    if (!storedSessionId) {
      storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('compliance_session', storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const getSessionId = (): string => {
    return sessionId;
  };

  const logComplianceEvent = async (eventType: string, eventData: any, pageUrl?: string): Promise<void> => {
    if (!isLoaded || !user) {
      console.warn('Cannot log compliance event: User not loaded');
      return;
    }

    try {
      const eventLog = {
        userId: user.id,
        userEmail: user.primaryEmailAddress?.emailAddress || null,
        eventType,
        eventData,
        timestamp: Date.now(),
        ipAddress: await getUserIP(),
        userAgent: navigator.userAgent,
        pageUrl: pageUrl || window.location.pathname,
        sessionId: getSessionId(),
      };

      // Store temporarily in localStorage until Convex API is ready
      const events = JSON.parse(localStorage.getItem('compliance_events') || '[]');
      events.push(eventLog);
      localStorage.setItem('compliance_events', JSON.stringify(events));

      console.log('Compliance event logged:', eventLog);

      // TODO: Replace with actual Convex mutation when API is available
      // await api.compliance.logComplianceEvent(eventLog);

    } catch (error) {
      console.error('Failed to log compliance event:', error);
    }
  };

  const contextValue: ComplianceContextType = {
    userId: user?.id || 'anonymous',
    userEmail: user?.primaryEmailAddress?.emailAddress || null,
    isAuthenticated: isLoaded && !!user,
    getUserIP,
    getSessionId,
    logComplianceEvent,
  };

  return (
    <ComplianceContext.Provider value={contextValue}>
      {children}
    </ComplianceContext.Provider>
  );
};

export const useCompliance = (): ComplianceContextType => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};

// Helper hook for logging specific compliance events
export const useComplianceLogging = () => {
  const { logComplianceEvent } = useCompliance();

  const logWarningShown = async (warningType: string, warningContent: string, pageContext: string) => {
    await logComplianceEvent('warning_shown', {
      warningType,
      warningContent,
      pageContext,
      shownAt: Date.now(),
    });
  };

  const logAcknowledgment = async (warningType: string, warningContent: string, pageContext: string) => {
    await logComplianceEvent('acknowledgment_clicked', {
      warningType,
      warningContent,
      pageContext,
      acknowledgedAt: Date.now(),
    });
  };

  const logViolationDetected = async (violationType: string, content: string, severity: string) => {
    await logComplianceEvent('violation_detected', {
      violationType,
      content,
      severity,
      detectedAt: Date.now(),
      detectionMethod: 'ai_filter',
    });
  };

  const logTermsAccepted = async (termsVersion: string, acceptanceMethod: string) => {
    await logComplianceEvent('terms_accepted', {
      termsVersion,
      acceptanceMethod,
      acceptedAt: Date.now(),
    });
  };

  const logCertificationUploaded = async (certificationType: string, status: string) => {
    await logComplianceEvent('certification_uploaded', {
      certificationType,
      status,
      uploadedAt: Date.now(),
    });
  };

  return {
    logWarningShown,
    logAcknowledgment,
    logViolationDetected,
    logTermsAccepted,
    logCertificationUploaded,
  };
};
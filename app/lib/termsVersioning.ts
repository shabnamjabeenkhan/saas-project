// Terms of Service Version Management System
import React from 'react';

export interface TermsVersion {
  version: string;
  title: string;
  effectiveDate: string;
  majorChanges: string[];
  requiresReAcceptance: boolean;
  isActive: boolean;
  changelog: string;
  legalReviewedBy?: string;
  legalReviewDate?: string;
}

export interface UserTermsAcceptance {
  userId: string;
  termsVersion: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
  acceptanceMethod: 'signup' | 'update_prompt' | 'forced_reaccept';
}

// Version history of terms of service
export const TERMS_VERSIONS: TermsVersion[] = [
  {
    version: "v1.0_basic",
    title: "Basic Terms of Service",
    effectiveDate: "2024-01-01",
    majorChanges: [
      "Initial terms of service",
      "Basic user responsibilities",
      "Standard liability limitations"
    ],
    requiresReAcceptance: false,
    isActive: false,
    changelog: "Initial version for platform launch"
  },
  {
    version: "v2.0_compliance_basic",
    title: "Terms with Basic Compliance",
    effectiveDate: "2024-06-01",
    majorChanges: [
      "Added basic compliance requirements",
      "User responsibility for trade regulations",
      "Platform liability limitations"
    ],
    requiresReAcceptance: true,
    isActive: false,
    changelog: "Added basic compliance framework for trade services"
  },
  {
    version: "v2.1_compliance_enhanced",
    title: "Enhanced Compliance Terms",
    effectiveDate: "2024-10-07",
    majorChanges: [
      "Comprehensive compliance responsibilities section",
      "Required certifications and insurance",
      "Prohibited content guidelines",
      "No legal advice disclaimers",
      "Enhanced indemnification clauses",
      "UK-specific regulatory requirements"
    ],
    requiresReAcceptance: true,
    isActive: true,
    changelog: "Major compliance enhancements for UK trade regulations",
    legalReviewedBy: "UK Commercial Solicitor",
    legalReviewDate: "2024-10-07"
  }
];

// Current active terms version
export const CURRENT_TERMS_VERSION = "v2.1_compliance_enhanced";

// Privacy policy versions
export const PRIVACY_VERSIONS: TermsVersion[] = [
  {
    version: "v1.0_basic",
    title: "Basic Privacy Policy",
    effectiveDate: "2024-01-01",
    majorChanges: [
      "Basic data collection and usage",
      "Standard privacy protections",
      "Cookie policy"
    ],
    requiresReAcceptance: false,
    isActive: false,
    changelog: "Initial privacy policy for platform launch"
  },
  {
    version: "v2.0_compliance_data",
    title: "Compliance Data Privacy Policy",
    effectiveDate: "2024-10-07",
    majorChanges: [
      "Certification verification data collection",
      "Compliance monitoring procedures",
      "Data sharing with regulatory authorities",
      "Extended retention periods for legal protection",
      "Regulatory investigation data handling"
    ],
    requiresReAcceptance: true,
    isActive: true,
    changelog: "Added comprehensive compliance data handling framework",
    legalReviewedBy: "Data Protection Solicitor",
    legalReviewDate: "2024-10-07"
  }
];

export const CURRENT_PRIVACY_VERSION = "v2.0_compliance_data";

export class TermsVersionManager {
  static getCurrentTermsVersion(): TermsVersion {
    const current = TERMS_VERSIONS.find(v => v.version === CURRENT_TERMS_VERSION);
    if (!current) {
      throw new Error(`Current terms version ${CURRENT_TERMS_VERSION} not found`);
    }
    return current;
  }

  static getCurrentPrivacyVersion(): TermsVersion {
    const current = PRIVACY_VERSIONS.find(v => v.version === CURRENT_PRIVACY_VERSION);
    if (!current) {
      throw new Error(`Current privacy version ${CURRENT_PRIVACY_VERSION} not found`);
    }
    return current;
  }

  static checkIfUserNeedsToReAccept(
    userLastAcceptedVersion: string,
    currentVersion: string = CURRENT_TERMS_VERSION
  ): boolean {
    // If user never accepted any version, they need to accept
    if (!userLastAcceptedVersion) {
      return true;
    }

    // If user's version is current, no need to re-accept
    if (userLastAcceptedVersion === currentVersion) {
      return false;
    }

    // Check if any versions between user's version and current require re-acceptance
    const userVersionIndex = TERMS_VERSIONS.findIndex(v => v.version === userLastAcceptedVersion);
    const currentVersionIndex = TERMS_VERSIONS.findIndex(v => v.version === currentVersion);

    if (userVersionIndex === -1 || currentVersionIndex === -1) {
      // If we can't find versions, require re-acceptance for safety
      return true;
    }

    // Check all versions after user's version up to current
    for (let i = userVersionIndex + 1; i <= currentVersionIndex; i++) {
      if (TERMS_VERSIONS[i]?.requiresReAcceptance) {
        return true;
      }
    }

    return false;
  }

  static getVersionChangelog(fromVersion: string, toVersion: string): string[] {
    const fromIndex = TERMS_VERSIONS.findIndex(v => v.version === fromVersion);
    const toIndex = TERMS_VERSIONS.findIndex(v => v.version === toVersion);

    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      return [];
    }

    const changes: string[] = [];
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      const version = TERMS_VERSIONS[i];
      if (version) {
        changes.push(`${version.version}: ${version.changelog}`);
        changes.push(...version.majorChanges.map(change => `  • ${change}`));
      }
    }

    return changes;
  }

  static generateReAcceptanceMessage(
    userLastVersion: string,
    currentVersion: string = CURRENT_TERMS_VERSION
  ): {
    title: string;
    message: string;
    changes: string[];
    severity: 'info' | 'warning' | 'critical';
  } {
    const changelog = this.getVersionChangelog(userLastVersion, currentVersion);
    const currentTerms = this.getCurrentTermsVersion();

    const hasCriticalChanges = currentTerms.majorChanges.some(change =>
      change.toLowerCase().includes('compliance') ||
      change.toLowerCase().includes('liability') ||
      change.toLowerCase().includes('indemnification')
    );

    return {
      title: "Updated Terms of Service",
      message: `We've updated our Terms of Service (${currentVersion}). Please review and accept the changes to continue using TradeBoost AI.`,
      changes: changelog,
      severity: hasCriticalChanges ? 'critical' : 'warning'
    };
  }

  static async logTermsAcceptance(
    acceptance: UserTermsAcceptance,
    recordTermsAcceptanceMutation?: any
  ): Promise<void> {
    if (recordTermsAcceptanceMutation) {
      // Use Convex mutation if available
      try {
        await recordTermsAcceptanceMutation({
          userId: acceptance.userId,
          termsVersion: acceptance.termsVersion,
          acceptanceMethod: acceptance.acceptanceMethod,
          ipAddress: acceptance.ipAddress,
          userAgent: acceptance.userAgent,
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        });
        console.log('Terms acceptance logged to database:', acceptance);
        return;
      } catch (error) {
        console.error('Failed to log terms acceptance to database:', error);
        // Fall back to localStorage
      }
    }

    // Fallback: Store in local storage
    console.log('Terms acceptance logged to localStorage:', acceptance);
    if (typeof window !== 'undefined') {
      const acceptances = JSON.parse(localStorage.getItem('terms_acceptances') || '[]');
      acceptances.push({
        ...acceptance,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('terms_acceptances', JSON.stringify(acceptances));
    }
  }

  static getUserLastAcceptedVersion(userId: string): string | null {
    // This method is now deprecated in favor of the async version
    // Keep for backward compatibility
    if (typeof window === 'undefined') return null;

    const acceptances = JSON.parse(localStorage.getItem('terms_acceptances') || '[]');
    const userAcceptances = acceptances
      .filter((a: any) => a.userId === userId)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return userAcceptances[0]?.termsVersion || null;
  }

  // New async method that uses Convex query
  static async getUserLastAcceptedVersionAsync(
    userId: string,
    getUserLastAcceptedTermsVersionQuery?: any
  ): Promise<string | null> {
    if (getUserLastAcceptedTermsVersionQuery) {
      try {
        const version = await getUserLastAcceptedTermsVersionQuery({ userId });
        return version;
      } catch (error) {
        console.error('Failed to get terms version from database:', error);
        // Fall back to localStorage
      }
    }

    // Fallback to localStorage
    return this.getUserLastAcceptedVersion(userId);
  }

  static createVersionUpdateNotification(fromVersion: string, toVersion: string) {
    const fromTerms = TERMS_VERSIONS.find(v => v.version === fromVersion);
    const toTerms = TERMS_VERSIONS.find(v => v.version === toVersion);

    if (!fromTerms || !toTerms) {
      return null;
    }

    return {
      id: `terms_update_${fromVersion}_to_${toVersion}`,
      type: 'terms_update',
      title: 'Terms of Service Updated',
      message: `Please review and accept our updated Terms of Service (${toVersion})`,
      severity: toTerms.requiresReAcceptance ? 'high' : 'medium',
      actionRequired: toTerms.requiresReAcceptance,
      effectiveDate: toTerms.effectiveDate,
      changes: toTerms.majorChanges,
      changelog: this.getVersionChangelog(fromVersion, toVersion)
    };
  }

  // Quarterly review helper
  static getTermsForQuarterlyReview(): {
    currentVersion: TermsVersion;
    lastReviewDate: string;
    daysSinceReview: number;
    reviewRequired: boolean;
    suggestedActions: string[];
  } {
    const currentTerms = this.getCurrentTermsVersion();
    const lastReviewDate = currentTerms.legalReviewDate || currentTerms.effectiveDate;
    const daysSinceReview = Math.floor(
      (new Date().getTime() - new Date(lastReviewDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const reviewRequired = daysSinceReview > 90; // 3 months

    const suggestedActions: string[] = [];
    if (reviewRequired) {
      suggestedActions.push("Schedule legal review with UK commercial solicitor");
      suggestedActions.push("Check for new UK trade regulations since last review");
      suggestedActions.push("Review user compliance violation patterns");
      suggestedActions.push("Assess if terms cover new platform features");
    }

    return {
      currentVersion: currentTerms,
      lastReviewDate,
      daysSinceReview,
      reviewRequired,
      suggestedActions
    };
  }
}

// Helper hook for React components
export function useTermsVersioning(
  userId: string,
  getUserLastAcceptedTermsVersionQuery?: any,
  recordTermsAcceptanceMutation?: any
) {
  const [needsAcceptance, setNeedsAcceptance] = React.useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const checkTermsAcceptance = async () => {
      try {
        const lastAcceptedVersion = await TermsVersionManager.getUserLastAcceptedVersionAsync(
          userId,
          getUserLastAcceptedTermsVersionQuery
        );
        const needsToAccept = TermsVersionManager.checkIfUserNeedsToReAccept(lastAcceptedVersion || '');

        setNeedsAcceptance(needsToAccept);

        if (needsToAccept) {
          const message = TermsVersionManager.generateReAcceptanceMessage(
            lastAcceptedVersion || 'none',
            CURRENT_TERMS_VERSION
          );
          setUpdateMessage(message);
        }
      } catch (error) {
        console.error('Failed to check terms acceptance:', error);
        // On error, require acceptance for safety
        setNeedsAcceptance(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkTermsAcceptance();
  }, [userId, getUserLastAcceptedTermsVersionQuery]);

  const acceptTerms = async (acceptanceMethod: 'signup' | 'update_prompt' | 'forced_reaccept') => {
    try {
      const acceptance: UserTermsAcceptance = {
        userId,
        termsVersion: CURRENT_TERMS_VERSION,
        acceptedAt: new Date().toISOString(),
        acceptanceMethod,
        ipAddress: 'unknown', // Don't block on IP lookup
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      };

      // Get IP asynchronously without blocking
      getUserIP().then(ip => {
        if (ip !== 'unknown') {
          // Update stored record with actual IP if we get it
          console.log('IP resolved:', ip);
        }
      }).catch(() => {
        // Silent fail - don't block terms acceptance
      });

      await TermsVersionManager.logTermsAcceptance(acceptance, recordTermsAcceptanceMutation);
      setNeedsAcceptance(false);
      setUpdateMessage(null);
    } catch (error) {
      console.error('Failed to accept terms:', error);
      throw error;
    }
  };

  return {
    needsAcceptance,
    updateMessage,
    acceptTerms,
    currentVersion: CURRENT_TERMS_VERSION,
    isLoading
  };
}

async function getUserIP(): Promise<string> {
  try {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}
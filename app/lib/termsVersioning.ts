// Terms of Service Version Management System

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

  static async logTermsAcceptance(acceptance: UserTermsAcceptance): Promise<void> {
    // TODO: This will be implemented once Convex API is available
    console.log('Terms acceptance logged:', acceptance);

    // Store in local storage temporarily for demo
    const acceptances = JSON.parse(localStorage.getItem('terms_acceptances') || '[]');
    acceptances.push({
      ...acceptance,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('terms_acceptances', JSON.stringify(acceptances));
  }

  static getUserLastAcceptedVersion(userId: string): string | null {
    // TODO: This will query Convex once API is available
    const acceptances = JSON.parse(localStorage.getItem('terms_acceptances') || '[]');
    const userAcceptances = acceptances
      .filter((a: any) => a.userId === userId)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return userAcceptances[0]?.termsVersion || null;
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
export function useTermsVersioning(userId: string) {
  const [needsAcceptance, setNeedsAcceptance] = React.useState<boolean>(false);
  const [updateMessage, setUpdateMessage] = React.useState<any>(null);

  React.useEffect(() => {
    if (!userId) return;

    const lastAcceptedVersion = TermsVersionManager.getUserLastAcceptedVersion(userId);
    const needsToAccept = TermsVersionManager.checkIfUserNeedsToReAccept(lastAcceptedVersion);

    setNeedsAcceptance(needsToAccept);

    if (needsToAccept) {
      const message = TermsVersionManager.generateReAcceptanceMessage(
        lastAcceptedVersion || 'none',
        CURRENT_TERMS_VERSION
      );
      setUpdateMessage(message);
    }
  }, [userId]);

  const acceptTerms = async (acceptanceMethod: 'signup' | 'update_prompt' | 'forced_reaccept') => {
    const acceptance: UserTermsAcceptance = {
      userId,
      termsVersion: CURRENT_TERMS_VERSION,
      acceptedAt: new Date().toISOString(),
      acceptanceMethod,
      ipAddress: await getUserIP(),
      userAgent: navigator.userAgent
    };

    await TermsVersionManager.logTermsAcceptance(acceptance);
    setNeedsAcceptance(false);
    setUpdateMessage(null);
  };

  return {
    needsAcceptance,
    updateMessage,
    acceptTerms,
    currentVersion: CURRENT_TERMS_VERSION
  };
}

async function getUserIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}
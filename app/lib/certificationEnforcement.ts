// Certification Requirement Enforcement System
// Prevents users from advertising services they're not qualified for

import { useCompliance } from './complianceContext';

export interface UserCertifications {
  gasSafe: {
    status: 'verified' | 'pending' | 'rejected' | 'expired' | 'missing';
    number?: string;
    expiryDate?: string;
    verifiedAt?: string;
  };
  partP: {
    status: 'verified' | 'pending' | 'rejected' | 'expired' | 'missing';
    number?: string;
    provider?: string;
    verifiedAt?: string;
  };
  insurance: {
    status: 'verified' | 'pending' | 'rejected' | 'expired' | 'missing';
    provider?: string;
    coverage?: number;
    expiryDate?: string;
    verifiedAt?: string;
  };
  businessRegistration: {
    status: 'verified' | 'pending' | 'rejected' | 'expired' | 'missing';
    companyName?: string;
    companyNumber?: string;
    verifiedAt?: string;
  };
}

export interface ServiceRequirement {
  service: string;
  requiredCertifications: (keyof UserCertifications)[];
  description: string;
  legalRisk: string;
  fineAmount?: string;
}

// UK Trade Service Requirements
export const SERVICE_REQUIREMENTS: ServiceRequirement[] = [
  {
    service: 'boiler_installation',
    requiredCertifications: ['gasSafe', 'insurance', 'businessRegistration'],
    description: 'Boiler installation and replacement',
    legalRisk: 'Gas work without Gas Safe registration is illegal and extremely dangerous',
    fineAmount: '£6,000+ and potential imprisonment'
  },
  {
    service: 'boiler_repair',
    requiredCertifications: ['gasSafe', 'insurance', 'businessRegistration'],
    description: 'Boiler repair and maintenance',
    legalRisk: 'Gas work without Gas Safe registration violates Gas Safety Regulations',
    fineAmount: '£6,000+ fine'
  },
  {
    service: 'gas_appliance_installation',
    requiredCertifications: ['gasSafe', 'insurance', 'businessRegistration'],
    description: 'Gas cooker, fire, or appliance installation',
    legalRisk: 'Unsafe gas work can cause explosions, deaths, and criminal liability',
    fineAmount: '£6,000+ and potential manslaughter charges'
  },
  {
    service: 'gas_safety_check',
    requiredCertifications: ['gasSafe', 'insurance', 'businessRegistration'],
    description: 'Annual gas safety inspections and CP12 certificates',
    legalRisk: 'Only Gas Safe engineers can issue legally valid CP12 certificates',
    fineAmount: '£6,000+ fine and invalidated certificates'
  },
  {
    service: 'electrical_rewiring',
    requiredCertifications: ['partP', 'insurance', 'businessRegistration'],
    description: 'Full or partial house rewiring',
    legalRisk: 'Part P notifiable work requires competent person certification',
    fineAmount: '£5,000+ fine and work may need to be redone'
  },
  {
    service: 'electrical_installation',
    requiredCertifications: ['partP', 'insurance', 'businessRegistration'],
    description: 'New electrical installations and circuits',
    legalRisk: 'Unqualified electrical work violates Building Regulations Part P',
    fineAmount: '£5,000+ fine from Building Control'
  },
  {
    service: 'consumer_unit_upgrade',
    requiredCertifications: ['partP', 'insurance', 'businessRegistration'],
    description: 'Fuse box replacement and upgrades',
    legalRisk: 'Consumer unit work is notifiable under Part P regulations',
    fineAmount: '£5,000+ fine and safety hazards'
  },
  {
    service: 'bathroom_electrical',
    requiredCertifications: ['partP', 'insurance', 'businessRegistration'],
    description: 'Electrical work in bathrooms and wet areas',
    legalRisk: 'Special location electrical work requires Part P compliance',
    fineAmount: '£5,000+ fine and potential electrocution risk'
  },
  {
    service: 'emergency_repairs',
    requiredCertifications: ['insurance', 'businessRegistration'],
    description: 'Emergency plumbing repairs (non-gas)',
    legalRisk: 'Public liability insurance required for trade work',
    fineAmount: 'Personal liability for damages without insurance'
  },
  {
    service: 'heating_system_installation',
    requiredCertifications: ['gasSafe', 'insurance', 'businessRegistration'],
    description: 'Central heating system installation',
    legalRisk: 'Gas heating work requires Gas Safe registration',
    fineAmount: '£6,000+ fine'
  }
];

export interface CertificationCheckResult {
  canAdvertise: boolean;
  missingCertifications: string[];
  blockedServices: string[];
  warnings: string[];
  legalRisks: string[];
}

export class CertificationEnforcer {
  static checkServiceEligibility(
    requestedServices: string[],
    userCertifications: UserCertifications
  ): CertificationCheckResult {
    const missingCertifications: string[] = [];
    const blockedServices: string[] = [];
    const warnings: string[] = [];
    const legalRisks: string[] = [];

    for (const service of requestedServices) {
      const requirement = SERVICE_REQUIREMENTS.find(req => req.service === service);

      if (!requirement) {
        // If service not in our requirements list, allow but warn
        warnings.push(`${service}: Service not in compliance database - proceed with caution`);
        continue;
      }

      const missingForThisService: string[] = [];

      for (const requiredCert of requirement.requiredCertifications) {
        const certStatus = userCertifications[requiredCert]?.status;

        if (!certStatus || certStatus === 'missing' || certStatus === 'rejected' || certStatus === 'expired') {
          missingForThisService.push(this.getCertificationDisplayName(requiredCert));
        } else if (certStatus === 'pending') {
          warnings.push(`${requirement.description}: ${this.getCertificationDisplayName(requiredCert)} is pending verification`);
        }
      }

      if (missingForThisService.length > 0) {
        blockedServices.push(requirement.description);
        missingCertifications.push(...missingForThisService);
        legalRisks.push(`${requirement.description}: ${requirement.legalRisk} (${requirement.fineAmount})`);
      }
    }

    return {
      canAdvertise: blockedServices.length === 0,
      missingCertifications: [...new Set(missingCertifications)],
      blockedServices,
      warnings: [...new Set(warnings)],
      legalRisks: [...new Set(legalRisks)]
    };
  }

  static getCertificationDisplayName(cert: keyof UserCertifications): string {
    const names = {
      gasSafe: 'Gas Safe Registration',
      partP: 'Part P Electrical Certification',
      insurance: 'Public Liability Insurance',
      businessRegistration: 'Business Registration'
    };
    return names[cert];
  }

  static getRequiredCertificationsForServices(services: string[]): ServiceRequirement[] {
    return SERVICE_REQUIREMENTS.filter(req =>
      services.some(service => service.includes(req.service) || req.service.includes(service))
    );
  }

  static generateComplianceWarning(result: CertificationCheckResult): string {
    if (result.canAdvertise && result.warnings.length === 0) {
      return 'All certifications verified for requested services.';
    }

    let warning = '⚠️ COMPLIANCE WARNING:\n\n';

    if (result.blockedServices.length > 0) {
      warning += `❌ BLOCKED SERVICES (Missing certifications):\n`;
      warning += result.blockedServices.map(service => `• ${service}`).join('\n');
      warning += '\n\n';
    }

    if (result.missingCertifications.length > 0) {
      warning += `📋 MISSING CERTIFICATIONS:\n`;
      warning += result.missingCertifications.map(cert => `• ${cert}`).join('\n');
      warning += '\n\n';
    }

    if (result.legalRisks.length > 0) {
      warning += `⚖️ LEGAL RISKS:\n`;
      warning += result.legalRisks.map(risk => `• ${risk}`).join('\n');
      warning += '\n\n';
    }

    if (result.warnings.length > 0) {
      warning += `⚠️ WARNINGS:\n`;
      warning += result.warnings.map(warn => `• ${warn}`).join('\n');
      warning += '\n\n';
    }

    warning += '🚨 REMEMBER: False advertising can result in £5,000+ fines and legal action.';
    warning += '\n\nYou are legally responsible for ensuring all claims are accurate and compliant.';

    return warning;
  }

  static async logCertificationViolation(
    userId: string,
    service: string,
    missingCertifications: string[],
    logCompliance: (eventType: string, eventData: any) => Promise<void>
  ) {
    await logCompliance('certification_violation', {
      userId,
      service,
      missingCertifications,
      detectedAt: Date.now(),
      severity: 'high',
      description: `User attempted to advertise ${service} without required certifications: ${missingCertifications.join(', ')}`
    });
  }
}

// Hook for enforcing certification requirements in components
export const useCertificationEnforcement = () => {
  const { logComplianceEvent } = useCompliance();

  const checkAndEnforce = async (
    requestedServices: string[],
    userCertifications: UserCertifications
  ): Promise<CertificationCheckResult> => {
    const result = CertificationEnforcer.checkServiceEligibility(requestedServices, userCertifications);

    // Log any violations
    if (result.blockedServices.length > 0) {
      for (const service of result.blockedServices) {
        await CertificationEnforcer.logCertificationViolation(
          'current-user', // This will be replaced with real user ID from context
          service,
          result.missingCertifications,
          logComplianceEvent
        );
      }
    }

    return result;
  };

  const canAdvertiseService = (
    service: string,
    userCertifications: UserCertifications
  ): boolean => {
    const result = CertificationEnforcer.checkServiceEligibility([service], userCertifications);
    return result.canAdvertise;
  };

  return {
    checkAndEnforce,
    canAdvertiseService,
    generateWarning: CertificationEnforcer.generateComplianceWarning,
    getRequirements: CertificationEnforcer.getRequiredCertificationsForServices
  };
};
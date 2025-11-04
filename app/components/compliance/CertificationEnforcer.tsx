import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  AlertTriangle,
  Shield,
  FileText,
  Lock,
  CheckCircle,
  XCircle,
  Upload
} from "lucide-react";
import {
  useCertificationEnforcement,
  type UserCertifications,
  type CertificationCheckResult,
  SERVICE_REQUIREMENTS
} from "~/lib/certificationEnforcement";

interface CertificationEnforcerProps {
  selectedServices: string[];
  userCertifications: UserCertifications;
  onCertificationUpdate?: (certType: keyof UserCertifications) => void;
  onComplianceCheck?: (result: CertificationCheckResult) => void;
  blockInvalidServices?: boolean;
  showMissingCertifications?: boolean;
}

export const CertificationEnforcer: React.FC<CertificationEnforcerProps> = ({
  selectedServices,
  userCertifications,
  onCertificationUpdate,
  onComplianceCheck,
  blockInvalidServices = true,
  showMissingCertifications = true
}) => {
  const [checkResult, setCheckResult] = useState<CertificationCheckResult | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [acknowledgements, setAcknowledgements] = useState<Record<string, boolean>>({});

  const { checkAndEnforce, generateWarning } = useCertificationEnforcement();

  useEffect(() => {
    const performCheck = async () => {
      if (selectedServices.length === 0) {
        setCheckResult(null);
        setHasChecked(false);
        return;
      }

      const result = await checkAndEnforce(selectedServices, userCertifications);
      setCheckResult(result);
      setHasChecked(true);
      onComplianceCheck?.(result);
    };

    performCheck();
  }, [selectedServices, userCertifications, checkAndEnforce, onComplianceCheck]);

  const getCertificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />;
      case 'rejected':
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCertificationBadge = (status: string) => {
    const variants = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800',
      missing: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.missing}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getCertificationDisplayName = (certKey: keyof UserCertifications): string => {
    const names = {
      gasSafe: 'Gas Safe Registration',
      partP: 'Part P Electrical Certification',
      insurance: 'Public Liability Insurance',
      businessRegistration: 'Business Registration'
    };
    return names[certKey];
  };

  const handleAcknowledgement = (riskIndex: number, acknowledged: boolean) => {
    setAcknowledgements(prev => ({
      ...prev,
      [riskIndex]: acknowledged
    }));
  };

  const allRisksAcknowledged = checkResult?.legalRisks.length
    ? checkResult.legalRisks.every((_, index) => acknowledgements[index])
    : true;

  if (!hasChecked || !checkResult) {
    return (
      <div className="space-y-4">
        {selectedServices.length > 0 && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Checking certification requirements for selected services...
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card className={checkResult.canAdvertise ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${checkResult.canAdvertise ? 'text-green-700' : 'text-red-700'}`}>
            {checkResult.canAdvertise ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
            Certification Status
          </CardTitle>
          <CardDescription>
            {checkResult.canAdvertise
              ? 'All required certifications verified for selected services'
              : 'Missing certifications prevent advertising some services'
            }
          </CardDescription>
        </CardHeader>
        {!checkResult.canAdvertise && (
          <CardContent>
            <Alert className="border-red-200 bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Services Blocked:</strong> You cannot advertise the following services until you provide the required certifications.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Blocked Services */}
      {checkResult.blockedServices.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Blocked Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checkResult.blockedServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white border border-red-200 rounded">
                  <span className="font-medium text-red-800">{service}</span>
                  <Badge className="bg-red-100 text-red-800">BLOCKED</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Certifications */}
      {showMissingCertifications && checkResult.missingCertifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Required Certifications
            </CardTitle>
            <CardDescription>
              Upload these certifications to advertise blocked services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(userCertifications).map(([certKey, certData]) => {
                const displayName = getCertificationDisplayName(certKey as keyof UserCertifications);
                const isMissing = checkResult.missingCertifications.includes(displayName);

                return (
                  <div key={certKey} className={`border rounded-lg p-4 ${isMissing ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCertificationIcon(certData.status)}
                        <span className="font-medium">{displayName}</span>
                      </div>
                      {getCertificationBadge(certData.status)}
                    </div>

                    {isMissing && (
                      <div className="space-y-2">
                        <p className="text-sm text-red-600">Required for blocked services</p>
                        {onCertificationUpdate && (
                          <Button
                            size="sm"
                            onClick={() => onCertificationUpdate(certKey as keyof UserCertifications)}
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload {displayName}
                          </Button>
                        )}
                      </div>
                    )}

                    {certData.status === 'verified' && certData.verifiedAt && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Verified on {new Date(certData.verifiedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal Risks and Acknowledgment */}
      {checkResult.legalRisks.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Legal Risk Acknowledgment Required
            </CardTitle>
            <CardDescription>
              You must acknowledge these legal risks before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkResult.legalRisks.map((risk, index) => (
                <div key={index} className="space-y-3 p-4 bg-white border border-orange-200 rounded">
                  <p className="text-sm text-orange-800 font-medium">{risk}</p>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`risk-${index}`}
                      checked={acknowledgements[index] || false}
                      onCheckedChange={(checked) => handleAcknowledgement(index, checked === true)}
                    />
                    <label htmlFor={`risk-${index}`} className="text-sm text-orange-700 cursor-pointer">
                      I acknowledge this legal risk and confirm I will not advertise this service without proper certification
                    </label>
                  </div>
                </div>
              ))}

              {!allRisksAcknowledged && (
                <Alert className="border-orange-200 bg-orange-100">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    You must acknowledge all legal risks above to proceed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {checkResult.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Compliance Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {checkResult.warnings.map((warning, index) => (
                <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Compliance Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Legal Compliance Reminder</div>
              <p>
                You are legally responsible for ensuring all advertised services match your actual certifications.
                False claims can result in £5,000+ fines, legal action, and pose serious safety risks.
                Trading Standards actively monitor and investigate false advertising claims.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
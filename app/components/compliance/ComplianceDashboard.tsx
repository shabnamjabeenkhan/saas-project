import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  FileText,
  UserCheck,
  AlertCircle
} from "lucide-react";

interface ComplianceDashboardProps {
  certifications: CertificationStatus[];
  violations: ComplianceViolation[];
  complianceScore: number;
  onViewCertification: (type: string) => void;
  onUploadCertification: (type: string) => void;
}

interface CertificationStatus {
  type: 'gas_safe' | 'part_p' | 'insurance' | 'business_registration';
  status: 'verified' | 'pending' | 'rejected' | 'expired' | 'missing';
  expiryDate?: string;
  daysUntilExpiry?: number;
  verifiedAt?: string;
  required: boolean;
}

interface ComplianceViolation {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolved: boolean;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  certifications,
  violations,
  complianceScore,
  onViewCertification,
  onUploadCertification
}) => {
  const getCertificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
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

  const getViolationSeverityBadge = (severity: string) => {
    const variants = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={variants[severity as keyof typeof variants]}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const getCertificationTitle = (type: string) => {
    const titles = {
      gas_safe: 'Gas Safe Registration',
      part_p: 'Part P Electrical Certification',
      insurance: 'Public Liability Insurance',
      business_registration: 'Business Registration'
    };
    return titles[type as keyof typeof titles] || type;
  };

  const getComplianceScoreColor = () => {
    if (complianceScore >= 80) return 'text-green-600';
    if (complianceScore >= 60) return 'text-yellow-600';
    if (complianceScore >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getComplianceScoreBackground = () => {
    if (complianceScore >= 80) return 'bg-green-100';
    if (complianceScore >= 60) return 'bg-yellow-100';
    if (complianceScore >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const unresolvedViolations = violations.filter(v => !v.resolved);
  const criticalViolations = unresolvedViolations.filter(v => v.severity === 'critical');

  return (
    <div className="space-y-6">
      {/* Compliance Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Compliance Status
          </CardTitle>
          <CardDescription>
            Your overall compliance score and verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${getComplianceScoreBackground()}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Overall Compliance Score</span>
                <span className={`text-2xl font-bold ${getComplianceScoreColor()}`}>
                  {complianceScore}%
                </span>
              </div>
              <Progress value={complianceScore} className="h-2" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {certifications.filter(c => c.status === 'verified').length}
                </div>
                <div className="text-sm text-gray-500">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {certifications.filter(c => c.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {criticalViolations.length}
                </div>
                <div className="text-sm text-gray-500">Critical Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {certifications.filter(c => c.daysUntilExpiry && c.daysUntilExpiry <= 30).length}
                </div>
                <div className="text-sm text-gray-500">Expiring Soon</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {(criticalViolations.length > 0 || certifications.some(c => c.status === 'expired')) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Critical Compliance Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalViolations.map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                  <div>
                    <div className="font-medium text-red-800">{violation.description}</div>
                    <div className="text-sm text-red-600">Created: {new Date(violation.createdAt).toLocaleDateString()}</div>
                  </div>
                  {getViolationSeverityBadge(violation.severity)}
                </div>
              ))}

              {certifications.filter(c => c.status === 'expired').map((cert) => (
                <div key={cert.type} className="flex items-center justify-between p-3 bg-white rounded border border-red-200">
                  <div>
                    <div className="font-medium text-red-800">{getCertificationTitle(cert.type)} has expired</div>
                    <div className="text-sm text-red-600">Immediate action required</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUploadCertification(cert.type)}
                  >
                    Renew
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certifications.map((cert) => (
          <Card key={cert.type} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  {getCertificationIcon(cert.status)}
                  {getCertificationTitle(cert.type)}
                </CardTitle>
                {getCertificationBadge(cert.status)}
              </div>
              {cert.required && (
                <Badge variant="outline" className="w-fit">Required</Badge>
              )}
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {cert.status === 'verified' && cert.verifiedAt && (
                  <div className="text-sm text-green-600">
                    ✓ Verified on {new Date(cert.verifiedAt).toLocaleDateString()}
                  </div>
                )}

                {cert.expiryDate && (
                  <div className="text-sm">
                    <span className="text-gray-500">Expires: </span>
                    <span className={cert.daysUntilExpiry && cert.daysUntilExpiry <= 30 ? 'text-orange-600 font-medium' : ''}>
                      {new Date(cert.expiryDate).toLocaleDateString()}
                      {cert.daysUntilExpiry !== undefined && (
                        <span className="ml-1">
                          ({cert.daysUntilExpiry} days)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  {cert.status === 'missing' ? (
                    <Button
                      size="sm"
                      onClick={() => onUploadCertification(cert.type)}
                      className="flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      Upload
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewCertification(cert.type)}
                    >
                      View Details
                    </Button>
                  )}

                  {cert.status === 'rejected' || cert.status === 'expired' && (
                    <Button
                      size="sm"
                      onClick={() => onUploadCertification(cert.type)}
                    >
                      Re-upload
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Violations */}
      {unresolvedViolations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Recent Compliance Issues
            </CardTitle>
            <CardDescription>
              Issues that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unresolvedViolations.slice(0, 5).map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">{violation.description}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(violation.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getViolationSeverityBadge(violation.severity)}
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legal Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Legal Compliance Reminder</div>
              <p>
                You are legally responsible for maintaining valid certifications and accurate advertising.
                All uploaded documents may be verified against official registers.
                False claims can result in £5,000+ fines and legal action.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
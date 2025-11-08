import React, { useState } from 'react';
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Upload, CheckCircle, XCircle, AlertTriangle, FileText } from "lucide-react";

interface CertificationUploadProps {
  certificationType: 'gas_safe' | 'part_p' | 'insurance' | 'business_registration';
  onUpload: (certificationData: CertificationData) => void;
  existingCertification?: CertificationData;
}

interface CertificationData {
  type: string;
  number?: string;
  expiryDate?: string;
  provider?: string;
  coverage?: number;
  companyNumber?: string;
  companyName?: string;
  document?: File;
  verified: boolean;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
}

export const CertificationUpload: React.FC<CertificationUploadProps> = ({
  certificationType,
  onUpload,
  existingCertification
}) => {
  const [formData, setFormData] = useState<Partial<CertificationData>>(
    existingCertification || { type: certificationType, verified: false, status: 'pending' }
  );
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCertificationConfig = () => {
    const configs = {
      gas_safe: {
        title: "Gas Safe Registration",
        description: "Required for all gas work including boilers, heating systems, and gas appliances",
        fields: [
          { key: 'number', label: 'Gas Safe Registration Number', placeholder: '123456', required: true },
          { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true }
        ],
        documentLabel: "Gas Safe Certificate",
        helpText: "Your Gas Safe ID card or certificate showing current registration status"
      },
      part_p: {
        title: "Part P Electrical Certification",
        description: "Required for electrical work in domestic properties",
        fields: [
          { key: 'number', label: 'Part P/NICEIC Number', placeholder: 'NICEIC123456', required: true },
          { key: 'provider', label: 'Certification Body', placeholder: 'NICEIC, NAPIT, etc.', required: true }
        ],
        documentLabel: "Part P Certificate",
        helpText: "Certificate from recognized body (NICEIC, NAPIT, etc.)"
      },
      insurance: {
        title: "Public Liability Insurance",
        description: "Minimum £1,000,000 coverage required for trade services",
        fields: [
          { key: 'provider', label: 'Insurance Provider', placeholder: 'Insurance Company Name', required: true },
          { key: 'number', label: 'Policy Number', placeholder: 'POL123456789', required: true },
          { key: 'coverage', label: 'Coverage Amount (£)', type: 'number', placeholder: '1000000', required: true },
          { key: 'expiryDate', label: 'Expiry Date', type: 'date', required: true }
        ],
        documentLabel: "Insurance Certificate",
        helpText: "Current insurance certificate showing policy details and coverage"
      },
      business_registration: {
        title: "Business Registration",
        description: "Legal business registration with HMRC or Companies House",
        fields: [
          { key: 'companyName', label: 'Business Name', placeholder: 'Your Business Ltd', required: true },
          { key: 'companyNumber', label: 'Registration Number', placeholder: 'Companies House or UTR', required: true },
          { key: 'provider', label: 'Registration Type', placeholder: 'Companies House, HMRC Self-Employment', required: true }
        ],
        documentLabel: "Registration Document",
        helpText: "Companies House certificate or HMRC registration confirmation"
      }
    };

    return configs[certificationType];
  };

  const config = getCertificationConfig();

  const handleInputChange = (key: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, JPEG, or PNG file');
        return;
      }

      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      setDocumentFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      const requiredFields = config.fields.filter(field => field.required);
      const missingFields = requiredFields.filter(field => !formData[field.key as keyof CertificationData]);

      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`);
        return;
      }

      if (!documentFile && !existingCertification?.document) {
        alert('Please upload a supporting document');
        return;
      }

      // Special validation for insurance coverage
      if (certificationType === 'insurance' && formData.coverage && formData.coverage < 1000000) {
        alert('Public liability insurance must be at least £1,000,000');
        return;
      }

      const certificationData: CertificationData = {
        ...formData,
        type: certificationType,
        document: documentFile || existingCertification?.document,
        verified: false,
        status: 'pending'
      } as CertificationData;

      onUpload(certificationData);

      // TODO: Upload file to storage and save to Convex
      console.log('Certification data to upload:', certificationData);

    } catch (error) {
      console.error('Failed to upload certification:', error);
      alert('Failed to upload certification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    if (!existingCertification) return null;

    switch (existingCertification.status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!existingCertification) return null;

    const variants = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={variants[existingCertification.status] || variants.pending}>
        {existingCertification.status.charAt(0).toUpperCase() + existingCertification.status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              {config.title}
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Certification Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id={field.key}
                  type={(field as any).type || 'text'}
                  placeholder={(field as any).placeholder}
                  value={String(formData[field.key as keyof CertificationData] || '')}
                  onChange={(e) => handleInputChange(
                    field.key,
                    (field as any).type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                  )}
                  required={field.required}
                />
              </div>
            ))}
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="document">
              {config.documentLabel} <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <Input
                id="document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Label htmlFor="document" className="cursor-pointer">
                <div className="space-y-2">
                  {documentFile ? (
                    <p className="text-sm text-green-600">
                      ✓ {documentFile.name} ({(documentFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  ) : existingCertification?.document ? (
                    <p className="text-sm text-blue-600">
                      ✓ Document uploaded previously
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Click to upload or drag and drop
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    PDF, JPEG, PNG up to 5MB
                  </p>
                </div>
              </Label>
            </div>
            <p className="text-xs text-gray-500">{config.helpText}</p>
          </div>

          {/* Legal Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">⚠️ Legal Verification Notice</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• All information will be verified against official registers</li>
              <li>• False certification claims may result in account suspension</li>
              <li>• You are legally responsible for the accuracy of this information</li>
              <li>• Documents may be shared with regulatory authorities if required</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {existingCertification ? 'Update Certification' : 'Upload Certification'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
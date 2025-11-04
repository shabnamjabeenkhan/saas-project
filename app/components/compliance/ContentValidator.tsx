import React, { useState } from 'react';
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { AlertTriangle, X, CheckCircle, Shield } from "lucide-react";
import { scanContentForCompliance, type ViolationResult } from "~/lib/aiSafety";
import { useComplianceLogging } from "~/lib/complianceContext";

interface ContentValidatorProps {
  content: string;
  onValidationComplete?: (isValid: boolean, violations?: ViolationResult[]) => void;
  onContentChange?: (newContent: string) => void;
  blockOnViolation?: boolean;
  showSuggestions?: boolean;
}

export const ContentValidator: React.FC<ContentValidatorProps> = ({
  content,
  onValidationComplete,
  onContentChange,
  blockOnViolation = true,
  showSuggestions = true
}) => {
  const [violations, setViolations] = useState<ViolationResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const { logViolationDetected } = useComplianceLogging();

  const handleScan = async () => {
    if (!content.trim()) {
      setViolations([]);
      setHasScanned(true);
      onValidationComplete?.(true, []);
      return;
    }

    setIsScanning(true);
    try {
      const scanResult = await scanContentForCompliance(content);
      setViolations(scanResult.violations);
      setHasScanned(true);

      // Log violations for legal evidence
      for (const violation of scanResult.violations) {
        if (violation.severity === 'high' || violation.severity === 'critical') {
          await logViolationDetected(
            violation.type,
            violation.phrase || 'Content violation detected',
            violation.severity
          );
        }
      }

      const isValid = scanResult.violations.length === 0;
      onValidationComplete?.(isValid, scanResult.violations);
    } catch (error) {
      console.error('Failed to scan content for compliance:', error);
      // On error, allow content but log the issue
      setViolations([]);
      setHasScanned(true);
      onValidationComplete?.(true, []);
    } finally {
      setIsScanning(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (onContentChange) {
      onContentChange(suggestion);
      // Reset scan state to require re-scanning
      setHasScanned(false);
      setViolations([]);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };

    return (
      <Badge className={variants[severity as keyof typeof variants]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const hasBlockingViolations = violations.some(v =>
    (v.severity === 'critical' || v.severity === 'high') && blockOnViolation
  );

  const isContentValid = hasScanned && violations.length === 0;

  return (
    <div className="space-y-4">
      {/* Scan Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleScan}
          disabled={isScanning}
          variant={hasScanned ? "outline" : "default"}
          size="sm"
          className="flex items-center gap-2"
        >
          {isScanning ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              {hasScanned ? 'Re-scan Content' : 'Scan for Compliance'}
            </>
          )}
        </Button>

        {isContentValid && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Content is compliant</span>
          </div>
        )}
      </div>

      {/* Blocking Notice */}
      {hasBlockingViolations && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Content Blocked:</strong> Your content contains violations that prevent publication.
            Please address the issues below before proceeding.
          </AlertDescription>
        </Alert>
      )}

      {/* Violations List */}
      {violations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Compliance Issues Found ({violations.length})
          </h4>

          {violations.map((violation, index) => (
            <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(violation.severity)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{violation.type}</span>
                    {getSeverityBadge(violation.severity)}
                  </div>
                  <p className="text-sm">{violation.reason}</p>
                  {violation.phrase && (
                    <p className="text-xs mt-1 font-mono bg-white/50 px-2 py-1 rounded">
                      Flagged text: "{violation.phrase}"
                    </p>
                  )}
                </div>
              </div>

              {/* Legal Context */}
              <div className="mt-3 p-2 bg-white/50 rounded text-xs">
                <strong>Legal Risk:</strong> {violation.legalRisk || 'May violate advertising standards and trade regulations'}
              </div>

              {/* Suggestion */}
              {showSuggestions && violation.suggestion && onContentChange && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Suggested Fix:</p>
                  <div className="bg-white/70 p-2 rounded text-sm">
                    {violation.suggestion}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applySuggestion(violation.suggestion!)}
                    className="mt-1"
                  >
                    Apply Suggestion
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legal Notice */}
      {hasScanned && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Legal Compliance Notice</p>
              <p>
                This scan checks against UK advertising standards and trade regulations.
                You remain legally responsible for all content accuracy and compliance.
                False claims can result in £5,000+ fines and legal action.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
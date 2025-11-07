import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Badge } from "~/components/ui/badge";
import { AlertTriangle, FileText, Shield } from "lucide-react";
import { TermsVersionManager } from "~/lib/termsVersioning";
import { useComplianceLogging } from "~/lib/complianceContext";

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  userLastVersion: string | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({
  isOpen,
  userLastVersion,
  onAccept,
  onDecline
}) => {
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { logTermsAccepted } = useComplianceLogging();

  const updateMessage = TermsVersionManager.generateReAcceptanceMessage(
    userLastVersion || 'none'
  );

  const currentTerms = TermsVersionManager.getCurrentTermsVersion();
  const currentPrivacy = TermsVersionManager.getCurrentPrivacyVersion();

  const canAccept = hasReadTerms && hasReadPrivacy;

  const handleAccept = async () => {
    if (!canAccept) return;

    setIsSubmitting(true);
    try {
      await logTermsAccepted(
        currentTerms.version,
        userLastVersion ? 'update_prompt' : 'signup'
      );
      onAccept();
    } catch (error) {
      console.error('Failed to log terms acceptance:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    onDecline();
  };

  const getSeverityIcon = () => {
    switch (updateMessage.severity) {
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      default:
        return <FileText className="w-6 h-6 text-blue-500" />;
    }
  };

  const getSeverityBadge = () => {
    const variants = {
      critical: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-blue-100 text-blue-800'
    };

    return (
      <Badge className={variants[updateMessage.severity]}>
        {updateMessage.severity.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getSeverityIcon()}
            {updateMessage.title}
            {getSeverityBadge()}
          </DialogTitle>
          <DialogDescription>
            {updateMessage.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Legal Compliance Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <div className="font-medium mb-1">⚠️ MANDATORY LEGAL UPDATE</div>
                <p>
                  These terms contain critical compliance requirements for UK trade regulations.
                  You cannot access TradeBoost AI without accepting these updated terms.
                  <strong> Continued use without acceptance may result in legal violations.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* What's Changed - Condensed */}
          {updateMessage.changes.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 text-sm">What's Changed:</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <ul className="text-xs text-blue-800 space-y-0.5">
                  {updateMessage.changes.slice(0, 3).map((change, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                  {updateMessage.changes.length > 3 && (
                    <li className="text-blue-600 text-xs">+ {updateMessage.changes.length - 3} more changes</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Required Reading Confirmations */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 text-sm">Required Actions:</h3>

            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2 border rounded-lg">
                <Checkbox
                  id="terms-read"
                  checked={hasReadTerms}
                  onCheckedChange={(checked) => setHasReadTerms(checked === true)}
                />
                <div className="flex-1">
                  <label htmlFor="terms-read" className="text-xs font-medium cursor-pointer">
                    I have read and understand the updated Terms of Service ({currentTerms.version})
                  </label>
                  <div className="mt-1">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600"
                      onClick={() => {
                        // Open in new window using absolute URL
                        const newWindow = window.open(window.location.origin + '/terms', '_blank', 'noopener,noreferrer');
                        if (!newWindow) {
                          // Fallback if popup blocked - navigate in same tab temporarily
                          window.location.href = '/terms';
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Terms of Service
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 border rounded-lg">
                <Checkbox
                  id="privacy-read"
                  checked={hasReadPrivacy}
                  onCheckedChange={(checked) => setHasReadPrivacy(checked === true)}
                />
                <div className="flex-1">
                  <label htmlFor="privacy-read" className="text-xs font-medium cursor-pointer">
                    I have read and understand the updated Privacy Policy ({currentPrivacy.version})
                  </label>
                  <div className="mt-1">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600"
                      onClick={() => {
                        // Open in new window using absolute URL
                        const newWindow = window.open(window.location.origin + '/privacy', '_blank', 'noopener,noreferrer');
                        if (!newWindow) {
                          // Fallback if popup blocked - navigate in same tab temporarily
                          window.location.href = '/privacy';
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Privacy Policy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Reminder - Condensed */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ⚠️ COMPLIANCE REMINDER
            </h4>
            <p className="text-xs font-medium text-gray-800 mb-1">
              You are responsible for ensuring all claims are accurate and compliant.
            </p>
            <p className="text-xs font-medium text-red-700 mb-2">
              False advertising can result in £5,000+ fines and legal action.
            </p>
            <ul className="text-xs text-gray-700 space-y-0.5">
              <li>• Only claim services you're qualified to provide</li>
              <li>• "24/7 service" must be actually available 24/7</li>
              <li>• Gas work requires valid Gas Safe registration</li>
              <li>• Electrical work requires Part P certification</li>
            </ul>
          </div>

          {/* Legal Consequences - Condensed */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
            <h4 className="font-medium text-gray-900 mb-1 text-sm">Legal Responsibility</h4>
            <ul className="text-xs text-gray-700 space-y-0.5">
              <li>• You confirm legal responsibility for all advertising compliance</li>
              <li>• You confirm you have required certifications for advertised services</li>
              <li>• You acknowledge TradeBoost AI provides tools only, not legal advice</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1"
              disabled={isSubmitting}
            >
              Decline & Sign Out
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!canAccept || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Accepting...
                </>
              ) : (
                'Accept Terms & Continue'
              )}
            </Button>
          </div>

          {/* Cannot proceed notice */}
          {!canAccept && (
            <p className="text-xs text-gray-500 text-center">
              You must read and confirm both documents to continue using TradeBoost AI
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
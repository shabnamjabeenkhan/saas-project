import { useState, useCallback, useEffect } from 'react';
import { scanContentForCompliance, type ViolationResult } from './aiSafety';
import { useComplianceLogging } from './complianceContext';

interface ContentValidationState {
  isValid: boolean;
  isScanning: boolean;
  violations: ViolationResult[];
  hasScanned: boolean;
  hasBlockingViolations: boolean;
}

interface UseContentValidationOptions {
  blockOnHighSeverity?: boolean;
  autoScan?: boolean;
  logViolations?: boolean;
}

export const useContentValidation = (options: UseContentValidationOptions = {}) => {
  const {
    blockOnHighSeverity = true,
    autoScan = false,
    logViolations = true
  } = options;

  const [state, setState] = useState<ContentValidationState>({
    isValid: false,
    isScanning: false,
    violations: [],
    hasScanned: false,
    hasBlockingViolations: false
  });

  const { logViolationDetected } = useComplianceLogging();

  const validateContent = useCallback(async (content: string): Promise<boolean> => {
    if (!content.trim()) {
      setState({
        isValid: true,
        isScanning: false,
        violations: [],
        hasScanned: true,
        hasBlockingViolations: false
      });
      return true;
    }

    setState(prev => ({ ...prev, isScanning: true }));

    try {
      const scanResult = await scanContentForCompliance(content);
      const blockingViolations = blockOnHighSeverity
        ? scanResult.violations.filter(v => v.severity === 'critical' || v.severity === 'high')
        : [];

      const hasBlockingViolations = blockingViolations.length > 0;
      const isValid = scanResult.violations.length === 0 || !hasBlockingViolations;

      // Log violations for legal evidence
      if (logViolations) {
        for (const violation of scanResult.violations) {
          if (violation.severity === 'high' || violation.severity === 'critical') {
            await logViolationDetected(
              violation.type,
              violation.phrase || content.substring(0, 100),
              violation.severity
            );
          }
        }
      }

      setState({
        isValid,
        isScanning: false,
        violations: scanResult.violations,
        hasScanned: true,
        hasBlockingViolations
      });

      return isValid;
    } catch (error) {
      console.error('Content validation failed:', error);

      // On error, be permissive but log the issue
      setState({
        isValid: true,
        isScanning: false,
        violations: [],
        hasScanned: true,
        hasBlockingViolations: false
      });

      return true;
    }
  }, [blockOnHighSeverity, logViolations, logViolationDetected]);

  const clearValidation = useCallback(() => {
    setState({
      isValid: false,
      isScanning: false,
      violations: [],
      hasScanned: false,
      hasBlockingViolations: false
    });
  }, []);

  const canPublish = state.hasScanned && state.isValid && !state.hasBlockingViolations;

  const getValidationSummary = () => {
    if (state.isScanning) return { message: 'Scanning content...', type: 'info' as const };
    if (!state.hasScanned) return { message: 'Content not scanned', type: 'warning' as const };
    if (state.hasBlockingViolations) return { message: 'Content blocked due to violations', type: 'error' as const };
    if (state.violations.length > 0) return { message: 'Content has warnings', type: 'warning' as const };
    if (state.isValid) return { message: 'Content is compliant', type: 'success' as const };
    return { message: 'Validation status unknown', type: 'warning' as const };
  };

  return {
    ...state,
    validateContent,
    clearValidation,
    canPublish,
    getValidationSummary
  };
};

// Hook for blocking form submission based on content validation
export const useContentGate = (content: string, options: UseContentValidationOptions = {}) => {
  const validation = useContentValidation(options);

  // Auto-validate when content changes if autoScan is enabled
  useEffect(() => {
    if (options.autoScan && content) {
      validation.validateContent(content);
    }
  }, [content, options.autoScan, validation.validateContent]);

  const validateAndProceed = async (onSuccess: () => void | Promise<void>) => {
    const isValid = await validation.validateContent(content);

    if (isValid && validation.canPublish) {
      await onSuccess();
    } else {
      console.warn('Content validation failed, blocking action');
    }
  };

  return {
    ...validation,
    validateAndProceed
  };
};
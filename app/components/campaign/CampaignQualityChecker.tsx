import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Shield,
  Lightbulb,
  TrendingUp,
  Calendar,
  MapPin,
  Award
} from "lucide-react";
import { useState } from "react";
import type { ComplianceCheck } from "~/lib/ukComplianceRules";

interface CampaignQualityCheckerProps {
  complianceChecks: ComplianceCheck[];
  optimizationSuggestions: string[];
  seasonalRecommendations: string[];
  onRegenerate?: () => void;
}

export function CampaignQualityChecker({
  complianceChecks = [],
  optimizationSuggestions = [],
  seasonalRecommendations = [],
  onRegenerate,
}: CampaignQualityCheckerProps) {
  const [activeTab, setActiveTab] = useState<'compliance' | 'optimization'>('compliance');

  // Calculate compliance summary
  const errors = complianceChecks.filter(c => !c.passed && c.rule.severity === 'error');
  const warnings = complianceChecks.filter(c => !c.passed && c.rule.severity === 'warning');
  const infos = complianceChecks.filter(c => !c.passed && c.rule.severity === 'info');
  const passed = complianceChecks.filter(c => c.passed);

  const overallScore = complianceChecks.length > 0 ? Math.round((passed.length / complianceChecks.length) * 100) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 95) return { text: 'Excellent', color: 'bg-green-600' };
    if (score >= 85) return { text: 'Good', color: 'bg-blue-600' };
    if (score >= 70) return { text: 'Fair', color: 'bg-yellow-600' };
    return { text: 'Needs Work', color: 'bg-red-600' };
  };

  const scoreBadge = getScoreBadge(overallScore);

  return (
    <Card className="bg-[#1a1a1a] border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Campaign Quality Check
            </CardTitle>
            <CardDescription>
              Compliance validation and optimization recommendations
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </div>
              <Badge className={`${scoreBadge.color} text-white`}>
                {scoreBadge.text}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{passed.length}</div>
            <p className="text-sm text-muted-foreground">Passed</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{errors.length}</div>
            <p className="text-sm text-muted-foreground">Errors</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{warnings.length}</div>
            <p className="text-sm text-muted-foreground">Warnings</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{infos.length}</div>
            <p className="text-sm text-muted-foreground">Info</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'compliance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('compliance')}
            className={activeTab === 'compliance' ? '' : 'text-white border-gray-700 hover:bg-gray-800'}
          >
            <Shield className="w-4 h-4 mr-2" />
            Compliance ({complianceChecks.length})
          </Button>
          <Button
            variant={activeTab === 'optimization' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('optimization')}
            className={activeTab === 'optimization' ? '' : 'text-white border-gray-700 hover:bg-gray-800'}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Optimization ({optimizationSuggestions.length})
          </Button>
        </div>

        {/* Content Area */}
        <div className="min-h-[300px]">
          {activeTab === 'compliance' && (
            <div className="space-y-4">
              {complianceChecks.map((check, index) => (
                <ComplianceCheckItem key={index} check={check} />
              ))}
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="font-medium text-white">Campaign Optimization Suggestions</h3>
              </div>
              {optimizationSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-[#0A0A0A] border border-gray-700 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                      <p className="text-sm text-white">{suggestion}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No optimization suggestions available.</p>
              )}
            </div>
          )}

        </div>

        {/* Action Buttons */}
        {onRegenerate && (
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={onRegenerate}
              className="text-white border-gray-700 hover:bg-gray-800"
            >
              Regenerate Campaign
            </Button>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">
                {errors.length} compliance error{errors.length !== 1 ? 's' : ''} found.
                Please review and regenerate campaign if needed.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ComplianceCheckItem({ check }: { check: ComplianceCheck }) {
  const getIcon = (severity: string, passed: boolean) => {
    if (passed) return <CheckCircle className="w-4 h-4 text-green-400" />;

    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getBorderColor = (severity: string, passed: boolean) => {
    if (passed) return 'border-green-700';

    switch (severity) {
      case 'error':
        return 'border-red-700';
      case 'warning':
        return 'border-yellow-700';
      default:
        return 'border-blue-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'legal':
        return <Shield className="w-3 h-3" />;
      case 'safety':
        return <Award className="w-3 h-3" />;
      case 'location':
        return <MapPin className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  return (
    <div className={`p-4 border ${getBorderColor(check.rule.severity, check.passed)} rounded-lg bg-[#0A0A0A]`}>
      <div className="flex items-start gap-3">
        {getIcon(check.rule.severity, check.passed)}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-white">{check.rule.title}</h4>
            <Badge variant="outline" className="text-xs">
              <span className="flex items-center gap-1">
                {getCategoryIcon(check.rule.category)}
                {check.rule.category}
              </span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{check.rule.description}</p>
          <p className="text-sm text-white">{check.message}</p>

          {check.suggestions && check.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-yellow-400 mb-2">Suggestions:</p>
              <ul className="space-y-1">
                {check.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
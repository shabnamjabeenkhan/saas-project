import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  MapPin,
  Phone,
  DollarSign,
  Copy,
  Download,
  Zap,
  TrendingUp,
  Clock,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { CampaignApprovalModal } from "./CampaignApprovalModal";
import type { MockCampaignData } from "~/lib/mockCampaignData";

interface CampaignPreviewCardProps {
  campaign: MockCampaignData;
  onApprove: (campaignId: string) => void;
  onReject: (campaignId: string, reason: string) => void;
  onRequestChanges: (campaignId: string, changes: string) => void;
  isLoading?: boolean;
}

export function CampaignPreviewCard({
  campaign,
  onApprove,
  onReject,
  onRequestChanges,
  isLoading = false
}: CampaignPreviewCardProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAdGroup, setSelectedAdGroup] = useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-blue-600 text-white';
      case 'approved': return 'bg-green-600 text-white';
      case 'rejected': return 'bg-red-600 text-white';
      case 'pending_changes': return 'bg-yellow-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getComplianceIcon = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'low': return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getComplianceLevel = (campaign: MockCampaignData): 'high' | 'medium' | 'low' => {
    // Determine compliance level based on campaign status and quality score
    if (campaign.status === 'rejected' || (campaign.qualityScore && campaign.qualityScore < 50)) {
      return 'low';
    }
    if (campaign.status === 'approved' && (campaign.qualityScore && campaign.qualityScore > 80)) {
      return 'high';
    }
    return 'medium';
  };

  const getComplianceIssues = (campaign: MockCampaignData): string[] => {
    // Extract issues from compliance notes that start with warning emoji
    return campaign.complianceNotes.filter(note => note.startsWith('⚠️'));
  };

  const handleCopyAdText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Ad text copied to clipboard");
  };

  const currentAdGroup = campaign.adGroups[selectedAdGroup];
  const budgetPerDay = campaign.dailyBudget || 0;

  return (
    <>
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-white">{campaign.name}</CardTitle>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {campaign.businessInfo.businessName}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {campaign.targetLocation}
                </span>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApprovalModal(true)}
                className="text-white border-gray-700 hover:bg-gray-800"
              >
                <Eye className="w-4 h-4 mr-2" />
                Review
              </Button>
              {campaign.status === 'draft' && (
                <Button
                  onClick={() => onApprove(campaign.id)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Quick Approve
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Campaign Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
              <div className="text-lg font-semibold text-white">£{budgetPerDay}</div>
              <p className="text-sm text-gray-400">Daily Budget</p>
            </div>
            <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
              <div className="text-lg font-semibold text-white">{campaign.adGroups.length}</div>
              <p className="text-sm text-gray-400">Ad Groups</p>
            </div>
            <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
              <div className="text-lg font-semibold text-white">
                {campaign.adGroups.reduce((sum, ag) => sum + ag.keywords.length, 0)}
              </div>
              <p className="text-sm text-gray-400">Keywords</p>
            </div>
            <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
              <div className="text-lg font-semibold text-white">
                {campaign.estimatedPerformance?.expectedClicks || 0}
              </div>
              <p className="text-sm text-gray-400">Est. Daily Clicks</p>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
            <div className="flex items-center gap-2">
              {getComplianceIcon(getComplianceLevel(campaign))}
              <span className="text-white font-medium">Compliance Status</span>
            </div>
            <div className="text-right">
              <div className="text-white">{getComplianceLevel(campaign).toUpperCase()}</div>
              {getComplianceIssues(campaign).length > 0 && (
                <p className="text-xs text-yellow-400">
                  {getComplianceIssues(campaign).length} issue(s) detected
                </p>
              )}
            </div>
          </div>

          {/* Ad Groups Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">Ad Groups Preview</h4>
              <div className="flex gap-1">
                {campaign.adGroups.map((_, index) => (
                  <Button
                    key={index}
                    variant={selectedAdGroup === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedAdGroup(index)}
                    className={selectedAdGroup === index
                      ? "bg-primary"
                      : "text-white border-gray-700 hover:bg-gray-800"
                    }
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 p-4 bg-[#0A0A0A] rounded-lg border border-gray-700">
              <div>
                <h5 className="font-medium text-white mb-2">{currentAdGroup.name}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ad Preview */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-300 mb-2">Ad Preview</h6>
                    <div className="p-3 bg-gray-800 rounded border-l-4 border-blue-500">
                      <div className="text-blue-400 text-sm font-medium">
                        {currentAdGroup.adCopy.headlines[0]}
                      </div>
                      <div className="text-green-400 text-xs">
                        {currentAdGroup.adCopy.finalUrl}
                      </div>
                      <div className="text-gray-300 text-sm mt-1">
                        {currentAdGroup.adCopy.descriptions[0]}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyAdText(
                          `${currentAdGroup.adCopy.headlines[0]}\n${currentAdGroup.adCopy.descriptions[0]}`
                        )}
                        className="mt-2 text-xs text-gray-400 hover:text-white"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-300 mb-2">Top Keywords</h6>
                    <div className="space-y-1">
                      {currentAdGroup.keywords.slice(0, 5).map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{keyword}</span>
                          <Badge
                            variant="outline"
                            className="text-xs border-blue-500 text-blue-400"
                          >
                            broad
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-lg font-semibold text-white">
                  £{campaign.estimatedPerformance?.expectedCost || 0}
                </span>
              </div>
              <p className="text-sm text-gray-400">Estimated Monthly ROI</p>
            </div>
            <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Phone className="w-4 h-4 text-blue-400" />
                <span className="text-lg font-semibold text-white">
                  {Math.round((campaign.estimatedPerformance?.expectedConversions || 0) * 2)}
                </span>
              </div>
              <p className="text-sm text-gray-400">Expected Monthly Calls</p>
            </div>
            <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-lg font-semibold text-white">
                  {campaign.estimatedPerformance?.expectedConversions || 0}
                </span>
              </div>
              <p className="text-sm text-gray-400">Expected Conversions</p>
            </div>
          </div>

          {/* Compliance Reminder */}
          {campaign.status === 'draft' && (
            <div className="text-xs text-gray-400 mb-3 p-2 bg-gray-800/30 rounded">
              <span>Reminder: You are responsible for the accuracy of all claims. See </span>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Terms
              </a>
              <span>.</span>
            </div>
          )}

          {/* Action Buttons */}
          {campaign.status === 'draft' && (
            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <Button
                onClick={() => onApprove(campaign.id)}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Push to Google Ads
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowApprovalModal(true)}
                className="text-white border-gray-700 hover:bg-gray-800"
              >
                <Edit className="w-4 h-4 mr-2" />
                Review & Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => onReject(campaign.id, "Campaign rejected by user")}
                disabled={isLoading}
                className="text-red-400 border-red-700 hover:bg-red-900/20"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <CampaignApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        campaign={campaign}
        onApprove={(notes?: string) => onApprove(campaign.id)}
        onReject={(reason: string) => onReject(campaign.id, reason)}
        onRequestChanges={(changes: string) => onRequestChanges(campaign.id, changes)}
      />
    </>
  );
}
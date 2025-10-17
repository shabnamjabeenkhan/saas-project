import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { Badge } from "~/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, FileText, Clock, Target } from "lucide-react";
import { toast } from "sonner";
import type { MockCampaignData } from "~/lib/mockCampaignData";

interface CampaignApprovalModalProps {
  campaign: MockCampaignData | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (notes?: string) => void;
  onReject: (reason: string) => void;
  onRequestChanges: (changes: string) => void;
}

export function CampaignApprovalModal({
  campaign,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRequestChanges
}: CampaignApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const [notes, setNotes] = useState('');

  if (!campaign) return null;

  const handleSubmit = () => {
    if (!action) return;

    switch (action) {
      case 'approve':
        onApprove(notes || undefined);
        toast.success('Campaign approved successfully!');
        break;
      case 'reject':
        if (!notes.trim()) {
          toast.error('Please provide a reason for rejection');
          return;
        }
        onReject(notes);
        toast.success('Campaign rejected with feedback');
        break;
      case 'changes':
        if (!notes.trim()) {
          toast.error('Please specify what changes are needed');
          return;
        }
        onRequestChanges(notes);
        toast.success('Change requests sent');
        break;
    }

    setAction(null);
    setNotes('');
    onClose();
  };

  const getActionColor = () => {
    switch (action) {
      case 'approve': return 'bg-green-600 hover:bg-green-700';
      case 'reject': return 'bg-red-600 hover:bg-red-700';
      case 'changes': return 'bg-yellow-600 hover:bg-yellow-700';
      default: return 'bg-gray-600';
    }
  };

  const getActionText = () => {
    switch (action) {
      case 'approve': return 'Approve Campaign';
      case 'reject': return 'Reject Campaign';
      case 'changes': return 'Request Changes';
      default: return 'Select Action';
    }
  };

  const qualityScore = campaign.qualityScore || 0;
  const performanceData = campaign.estimatedPerformance;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#1a1a1a] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Campaign Approval Review
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Review and approve the campaign "{campaign.campaignName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0A0A0A] rounded-lg border border-gray-700">
            <div className="text-center">
              <div className={`text-2xl font-bold ${qualityScore >= 80 ? 'text-green-400' : qualityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                {qualityScore}%
              </div>
              <p className="text-sm text-gray-400">Quality Score</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                £{campaign.dailyBudget}
              </div>
              <p className="text-sm text-gray-400">Daily Budget</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {campaign.adGroups.length}
              </div>
              <p className="text-sm text-gray-400">Ad Groups</p>
            </div>
          </div>

          {/* Performance Prediction */}
          {performanceData && (
            <div className="p-4 bg-[#0A0A0A] rounded-lg border border-gray-700">
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Estimated Performance (Monthly)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Expected Clicks</p>
                  <p className="font-semibold text-white">{performanceData.expectedClicks * 30}</p>
                </div>
                <div>
                  <p className="text-gray-400">Expected Cost</p>
                  <p className="font-semibold text-white">£{performanceData.expectedCost * 30}</p>
                </div>
                <div>
                  <p className="text-gray-400">Expected Conversions</p>
                  <p className="font-semibold text-white">{performanceData.expectedConversions * 30}</p>
                </div>
                <div>
                  <p className="text-gray-400">Competition</p>
                  <Badge variant="outline" className={
                    performanceData.competitionLevel === 'low' ? 'text-green-400 border-green-400' :
                    performanceData.competitionLevel === 'medium' ? 'text-yellow-400 border-yellow-400' :
                    'text-red-400 border-red-400'
                  }>
                    {performanceData.competitionLevel}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Compliance Summary */}
          <div className="p-4 bg-[#0A0A0A] rounded-lg border border-gray-700">
            <h3 className="font-medium text-white mb-3">Compliance Status</h3>
            <div className="space-y-2">
              {campaign.complianceNotes.map((note, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {note.includes('⚠️') ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={note.includes('⚠️') ? 'text-yellow-300' : 'text-gray-300'}>
                    {note.replace('⚠️ ', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-4">
            <h3 className="font-medium text-white">Choose Action</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant={action === 'approve' ? 'default' : 'outline'}
                onClick={() => setAction('approve')}
                className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
                disabled={qualityScore < 70}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant={action === 'changes' ? 'default' : 'outline'}
                onClick={() => setAction('changes')}
                className={action === 'changes' ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
              >
                <Clock className="w-4 h-4 mr-2" />
                Request Changes
              </Button>
              <Button
                variant={action === 'reject' ? 'default' : 'outline'}
                onClick={() => setAction('reject')}
                className={action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>

            {qualityScore < 70 && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-300">
                  Campaign quality score is below approval threshold (70%). Please request changes or reject.
                </p>
              </div>
            )}
          </div>

          {/* Notes/Feedback */}
          {action && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                {action === 'approve' ? 'Approval Notes (Optional)' :
                 action === 'reject' ? 'Rejection Reason (Required)' :
                 'Required Changes (Required)'}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  action === 'approve' ? 'Any additional notes for the approval...' :
                  action === 'reject' ? 'Please explain why this campaign is being rejected...' :
                  'Please specify what changes need to be made...'
                }
                className="bg-[#0A0A0A] border-gray-700 text-white resize-none"
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!action || (action !== 'approve' && !notes.trim())}
            className={`${getActionColor()} text-white`}
          >
            {getActionText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
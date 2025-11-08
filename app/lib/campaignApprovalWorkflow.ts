// Campaign approval workflow management
import type { MockCampaignData } from "./mockCampaignData";

export interface CampaignApprovalAction {
  id: string;
  campaignId: string;
  action: 'approve' | 'reject' | 'request_changes' | 'revise';
  userId: string;
  timestamp: Date;
  reason?: string;
  changes?: string;
  metadata?: Record<string, any>;
}

export interface CampaignApprovalStatus {
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'pending_changes' | 'pending_review' | 'live';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  changesRequested?: string;
  revisionCount: number;
  lastModified: Date;
  approvalHistory: CampaignApprovalAction[];
}

export interface CampaignWithApproval extends MockCampaignData {
  approval: CampaignApprovalStatus;
}

export class CampaignApprovalWorkflow {
  private approvalHistory: Map<string, CampaignApprovalAction[]> = new Map();

  // Initialize campaign approval status
  initializeCampaign(campaign: MockCampaignData): CampaignWithApproval {
    return {
      ...campaign,
      approval: {
        status: 'draft',
        revisionCount: 0,
        lastModified: new Date(),
        approvalHistory: []
      }
    };
  }

  // Approve campaign
  approveCampaign(
    campaign: CampaignWithApproval,
    userId: string,
    options: { pushToGoogleAds?: boolean; notes?: string } = {}
  ): CampaignWithApproval {
    const action: CampaignApprovalAction = {
      id: `action_${Date.now()}`,
      campaignId: campaign.id,
      action: 'approve',
      userId,
      timestamp: new Date(),
      metadata: options
    };

    const updatedCampaign: CampaignWithApproval = {
      ...campaign,
      status: options.pushToGoogleAds ? 'live' : 'approved',
      approval: {
        ...campaign.approval,
        status: options.pushToGoogleAds ? 'live' : 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        lastModified: new Date(),
        approvalHistory: [...campaign.approval.approvalHistory, action]
      }
    };

    this.logAction(action);
    return updatedCampaign;
  }

  // Reject campaign
  rejectCampaign(
    campaign: CampaignWithApproval,
    userId: string,
    reason: string
  ): CampaignWithApproval {
    const action: CampaignApprovalAction = {
      id: `action_${Date.now()}`,
      campaignId: campaign.id,
      action: 'reject',
      userId,
      timestamp: new Date(),
      reason
    };

    const updatedCampaign: CampaignWithApproval = {
      ...campaign,
      status: 'rejected',
      approval: {
        ...campaign.approval,
        status: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        lastModified: new Date(),
        approvalHistory: [...campaign.approval.approvalHistory, action]
      }
    };

    this.logAction(action);
    return updatedCampaign;
  }

  // Request changes to campaign
  requestChanges(
    campaign: CampaignWithApproval,
    userId: string,
    changes: string
  ): CampaignWithApproval {
    const action: CampaignApprovalAction = {
      id: `action_${Date.now()}`,
      campaignId: campaign.id,
      action: 'request_changes',
      userId,
      timestamp: new Date(),
      changes
    };

    const updatedCampaign: CampaignWithApproval = {
      ...campaign,
      status: 'pending_changes',
      approval: {
        ...campaign.approval,
        status: 'pending_changes',
        changesRequested: changes,
        lastModified: new Date(),
        approvalHistory: [...campaign.approval.approvalHistory, action]
      }
    };

    this.logAction(action);
    return updatedCampaign;
  }

  // Revise campaign (after changes requested)
  reviseCampaign(
    campaign: CampaignWithApproval,
    userId: string,
    revisedCampaign: Partial<MockCampaignData>
  ): CampaignWithApproval {
    const action: CampaignApprovalAction = {
      id: `action_${Date.now()}`,
      campaignId: campaign.id,
      action: 'revise',
      userId,
      timestamp: new Date(),
      metadata: { revisedFields: Object.keys(revisedCampaign) }
    };

    const updatedCampaign: CampaignWithApproval = {
      ...campaign,
      ...revisedCampaign,
      status: 'pending_review',
      approval: {
        ...campaign.approval,
        status: 'pending_review',
        revisionCount: campaign.approval.revisionCount + 1,
        changesRequested: undefined,
        lastModified: new Date(),
        approvalHistory: [...campaign.approval.approvalHistory, action]
      }
    };

    this.logAction(action);
    return updatedCampaign;
  }

  // Get approval workflow status for display
  getWorkflowStatus(campaign: CampaignWithApproval) {
    const { approval } = campaign;
    const lastAction = approval.approvalHistory[approval.approvalHistory.length - 1];

    return {
      currentStatus: approval.status,
      canApprove: ['draft', 'pending_review'].includes(approval.status),
      canReject: ['draft', 'pending_review'].includes(approval.status),
      canRequestChanges: ['draft', 'pending_review'].includes(approval.status),
      canRevise: approval.status === 'pending_changes',
      revisionCount: approval.revisionCount,
      lastAction: lastAction ? {
        action: lastAction.action,
        timestamp: lastAction.timestamp,
        user: lastAction.userId
      } : null,
      approvalSummary: {
        approved: approval.approvedAt ? {
          by: approval.approvedBy,
          at: approval.approvedAt
        } : null,
        rejected: approval.rejectedAt ? {
          by: approval.rejectedBy,
          at: approval.rejectedAt,
          reason: approval.rejectionReason
        } : null,
        changesRequested: approval.changesRequested
      }
    };
  }

  // Get campaign approval metrics
  getApprovalMetrics(campaigns: CampaignWithApproval[]) {
    const total = campaigns.length;
    const approved = campaigns.filter(c => c.approval.status === 'approved' || c.approval.status === 'live').length;
    const rejected = campaigns.filter(c => c.approval.status === 'rejected').length;
    const pending = campaigns.filter(c => ['draft', 'pending_review', 'pending_changes'].includes(c.approval.status)).length;

    const averageApprovalTime = this.calculateAverageApprovalTime(campaigns);
    const revisionRate = campaigns.filter(c => c.approval.revisionCount > 0).length / total;

    return {
      total,
      approved,
      rejected,
      pending,
      approvalRate: total > 0 ? approved / total : 0,
      rejectionRate: total > 0 ? rejected / total : 0,
      pendingRate: total > 0 ? pending / total : 0,
      averageApprovalTime, // in hours
      revisionRate,
      topRejectionReasons: this.getTopRejectionReasons(campaigns)
    };
  }

  // Calculate average time from draft to approval
  private calculateAverageApprovalTime(campaigns: CampaignWithApproval[]): number {
    const approvedCampaigns = campaigns.filter(c => c.approval.approvedAt);

    if (approvedCampaigns.length === 0) return 0;

    const totalTime = approvedCampaigns.reduce((sum, campaign) => {
      const created = new Date(campaign.createdAt);
      const approved = campaign.approval.approvedAt!;
      return sum + (approved.getTime() - created.getTime());
    }, 0);

    return totalTime / approvedCampaigns.length / (1000 * 60 * 60); // Convert to hours
  }

  // Get most common rejection reasons
  private getTopRejectionReasons(campaigns: CampaignWithApproval[]): { reason: string; count: number }[] {
    const reasons: Record<string, number> = {};

    campaigns.forEach(campaign => {
      campaign.approval.approvalHistory.forEach(action => {
        if (action.action === 'reject' && action.reason) {
          reasons[action.reason] = (reasons[action.reason] || 0) + 1;
        }
      });
    });

    return Object.entries(reasons)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // Log action for analytics
  private logAction(action: CampaignApprovalAction): void {
    const existing = this.approvalHistory.get(action.campaignId) || [];
    this.approvalHistory.set(action.campaignId, [...existing, action]);

    // In a real implementation, this would log to analytics service
    console.log('Campaign approval action:', action);
  }

  // Validate campaign for approval
  validateForApproval(campaign: CampaignWithApproval): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check compliance
    if (campaign.compliance.level === 'low') {
      errors.push('Campaign has compliance issues that must be resolved');
    }

    // Check budget
    if (campaign.budget && campaign.budget < 100) {
      warnings.push('Budget is below recommended minimum of £100');
    } else if (campaign.dailyBudget && campaign.dailyBudget * 30 < 100) {
      warnings.push('Monthly budget is below recommended minimum of £100');
    }

    // Check ad groups
    if (campaign.adGroups.length === 0) {
      errors.push('Campaign must have at least one ad group');
    }

    // Check keywords
    const totalKeywords = campaign.adGroups.reduce((sum, ag) => sum + ag.keywords.length, 0);
    if (totalKeywords < 5) {
      warnings.push('Consider adding more keywords for better reach');
    }

    // Check ad copy
    campaign.adGroups.forEach((adGroup, index) => {
      if (!adGroup.adCopy || adGroup.adCopy.headlines.length === 0) {
        errors.push(`Ad group "${adGroup.name}" has no ad headlines`);
      }
      if (adGroup.adCopy && adGroup.adCopy.headlines.length < 3) {
        warnings.push(`Ad group ${index + 1} should have at least 3 headlines`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Singleton instance
export const campaignApprovalWorkflow = new CampaignApprovalWorkflow();
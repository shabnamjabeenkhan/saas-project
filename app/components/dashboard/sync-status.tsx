import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { googleAdsSyncSimulator, type SyncStatus, type SyncEvent } from "~/lib/googleAdsSync";

interface SyncStatusProps {
  onDataRefresh?: () => void;
}

export function SyncStatusComponent({ onDataRefresh }: SyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(googleAdsSyncSimulator.getSyncStatus());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Auto-refresh sync status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(googleAdsSyncSimulator.getSyncStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    toast.info("Starting manual sync...");

    try {
      const syncEvent = await googleAdsSyncSimulator.performSync();
      setSyncStatus(googleAdsSyncSimulator.getSyncStatus());

      if (syncEvent.status === 'success') {
        toast.success(`Sync completed! Updated ${syncEvent.recordsUpdated} records`);
        onDataRefresh?.();
      } else {
        toast.error(`Sync failed: ${syncEvent.errorMessage}`);
      }
    } catch (error) {
      toast.error("Sync failed with unexpected error");
    } finally {
      setIsManualSyncing(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getStatusIcon = (status: SyncEvent['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: SyncEvent['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600 text-white">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-600 text-white">Failed</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-600 text-white">Partial</Badge>;
    }
  };

  const syncMetrics = googleAdsSyncSimulator.calculateSyncMetrics();
  const nextSyncIn = Math.max(0, Math.floor((syncStatus.nextScheduledSync.getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <Card className="bg-[#1a1a1a] border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Google Ads Sync Status
            </CardTitle>
            <CardDescription>
              Real-time data synchronization from Google Ads API
            </CardDescription>
          </div>
          <Button
            onClick={handleManualSync}
            disabled={isManualSyncing || syncStatus.issyncing}
            variant="outline"
            size="sm"
            className="text-white border-gray-700 hover:bg-gray-800"
          >
            {(isManualSyncing || syncStatus.issyncing) ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Manual Sync
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
            <div className="text-lg font-semibold text-white">
              {formatTimeAgo(syncStatus.lastSyncTime)}
            </div>
            <p className="text-sm text-gray-400">Last Sync</p>
          </div>
          <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
            <div className="text-lg font-semibold text-white">
              {syncMetrics.successRate}%
            </div>
            <p className="text-sm text-gray-400">Success Rate</p>
          </div>
          <div className="text-center p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
            <div className="text-lg font-semibold text-white">
              {nextSyncIn}h
            </div>
            <p className="text-sm text-gray-400">Next Auto Sync</p>
          </div>
        </div>

        {/* Sync Frequency */}
        <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg border border-gray-700">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-white">Sync Frequency</span>
          </div>
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            {syncStatus.syncFrequency}
          </Badge>
        </div>

        {/* Recent Sync History */}
        <div>
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Recent Sync History
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {syncStatus.syncHistory.slice(0, 5).map((event, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded border border-gray-700">
                <div className="flex items-center gap-3">
                  {getStatusIcon(event.status)}
                  <div>
                    <div className="text-sm text-white">
                      {formatTimeAgo(event.timestamp)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {event.recordsUpdated} records • {Math.round(event.duration / 1000)}s
                    </div>
                  </div>
                </div>
                {getStatusBadge(event.status)}
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{syncMetrics.totalRecordsLast10Syncs}</div>
            <p className="text-xs text-gray-400">Records Updated (Last 10 Syncs)</p>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{Math.round(syncMetrics.averageDuration / 1000)}s</div>
            <p className="text-xs text-gray-400">Average Sync Duration</p>
          </div>
        </div>

        {/* Error Message */}
        {syncMetrics.lastErrorMessage && (
          <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-300">Last Error: {syncMetrics.lastErrorMessage}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
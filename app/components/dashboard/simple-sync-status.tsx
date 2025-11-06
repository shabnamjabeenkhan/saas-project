import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { googleAdsSyncSimulator, type SyncStatus } from "~/lib/googleAdsSync";
import { Badge } from "~/components/ui/badge";

export function SimpleSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(googleAdsSyncSimulator.getSyncStatus());

  // Auto-refresh sync status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(googleAdsSyncSimulator.getSyncStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getLastError = () => {
    const lastEvent = syncStatus.syncHistory[0]; // Most recent event
    return lastEvent?.status === 'error' ? lastEvent.errorMessage : null;
  };

  const getStatusIcon = () => {
    const lastError = getLastError();
    if (lastError) {
      return <XCircle className="w-3 h-3 text-red-400" />;
    }
    return <CheckCircle className="w-3 h-3 text-green-400" />;
  };

  const getStatusText = () => {
    const lastError = getLastError();
    if (lastError) {
      return "Failed";
    }
    return "OK";
  };

  const getStatusColor = () => {
    const lastError = getLastError();
    if (lastError) {
      return "text-red-400";
    }
    return "text-green-400";
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = Date.now();
    const diff = now - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "Just now";
    }
  };

  const isStale = () => {
    const now = Date.now();
    const diff = now - syncStatus.lastSyncTime.getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours > 25; // Alert if more than 25 hours old
  };

  return (
    <div className="space-y-3">
      {/* Compact status line */}
      <div className="flex items-center gap-2 text-sm">
        {getStatusIcon()}
        <span className="text-gray-300">Last sync {formatTimeAgo(syncStatus.lastSyncTime)}</span>
        <span className="text-gray-500">•</span>
        <span className={getStatusColor()}>Status {getStatusText()}</span>
      </div>

      {/* Alert for stale or failed syncs */}
      {(isStale() || getLastError()) && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            {getLastError() ? (
              <div>
                <p className="text-yellow-300 font-medium">Sync Failed</p>
                <p className="text-yellow-200 text-xs mt-1">{getLastError()}</p>
              </div>
            ) : (
              <div>
                <p className="text-yellow-300 font-medium">Data May Be Stale</p>
                <p className="text-yellow-200 text-xs mt-1">Last sync was {formatTimeAgo(syncStatus.lastSyncTime)}. Consider checking Google Ads Settings.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
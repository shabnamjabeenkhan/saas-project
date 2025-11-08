import { SyncStatusComponent } from "~/components/dashboard/sync-status";
import { GoogleAdsConnectionComponent } from "~/components/dashboard/google-ads-connection";

export default function GoogleAdsSettings() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Google Ads Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your Google Ads integration and data sync settings</p>
        </div>

        {/* Detailed Sync Telemetry */}
        <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Sync Status & Telemetry</h2>
          <SyncStatusComponent />
        </div>

        {/* Connection Settings */}
        <div className="bg-white/5 border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Connection Settings</h2>
          <GoogleAdsConnectionComponent />
        </div>
      </div>
    </div>
  );
}
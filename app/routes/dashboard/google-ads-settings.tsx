import { SyncStatusComponent } from "~/components/dashboard/sync-status";

export default function GoogleAdsSettings() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 pt-0 bg-[#0A0A0A] text-white min-h-0">
      <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="px-1 text-center">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Google Ads Settings</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            View your Google Ads data sync status and telemetry
          </p>
        </div>

        {/* Detailed Sync Telemetry */}
        <div className="bg-white/5 border border-gray-800/50 rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 text-center">
            Sync Status & Telemetry
          </h2>
          <div className="overflow-x-auto">
            <SyncStatusComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
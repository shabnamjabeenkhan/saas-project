import { useEffect } from "react";
import { useCompliance, ComplianceProvider } from "~/lib/complianceContext";

function CampaignGeneratorContent() {
  const { logComplianceEvent } = useCompliance();

  // Log that user viewed compliance warning
  useEffect(() => {
    const logPageView = async () => {
      try {
        await logComplianceEvent('warning_shown', {
          warningType: 'campaign_generator_compliance',
          warningContent: 'Compliance reminder about accurate advertising and trade requirements',
          pageContext: 'campaign_generator',
          shownAt: Date.now(),
        });
        console.log("Compliance warning viewed on campaign generator");
      } catch (error) {
        console.error("Failed to log compliance warning view:", error);
      }
    };

    logPageView();
  }, [logComplianceEvent]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Campaign Generator</h1>
          <p className="text-muted-foreground mt-2">AI-powered campaign generation interface coming soon...</p>
        </div>

        {/* Compliance Warning - Always Visible */}
        <div className="bg-yellow-950/30 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500 rounded-full p-1 mt-0.5">
              <span className="text-black text-xs font-bold">!</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-yellow-200">⚠️ COMPLIANCE REMINDER</h3>
              <div className="text-sm text-yellow-100 space-y-1">
                <p><strong>You are responsible for ensuring all claims are accurate and compliant.</strong></p>
                <p><strong>False advertising can result in £5,000+ fines and legal action.</strong></p>
              </div>
              <div className="text-xs text-yellow-200 grid grid-cols-1 md:grid-cols-2 gap-1 mt-3">
                <p>• Only claim services you're qualified to provide</p>
                <p>• "24/7 service" must be actually available 24/7</p>
                <p>• Gas work requires valid Gas Safe registration</p>
                <p>• Electrical work requires Part P certification</p>
                <p>• Insurance claims must be accurate (£1M+ required)</p>
                <p>• Price guarantees must be deliverable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Future campaign generation interface will go here */}
        <div className="bg-gray-800/20 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">Campaign generation interface will be implemented here</p>
        </div>
      </div>
    </div>
  );
}

export default function CampaignGenerator() {
  return (
    <ComplianceProvider>
      <CampaignGeneratorContent />
    </ComplianceProvider>
  );
}





import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

export function CampaignManagement() {
  const campaigns = [
    {
      id: 1,
      name: "Emergency Plumber London",
      status: "Live",
      budget: "£45/day",
      spent: "£89.50",
      impressions: "1,247",
      clicks: "24",
      leads: "8",
      ctr: "1.92%",
      cpl: "£11.19"
    },
    {
      id: 2,
      name: "Boiler Repair Services",
      status: "Paused",
      budget: "£30/day",
      spent: "£0.00",
      impressions: "0",
      clicks: "0",
      leads: "0",
      ctr: "0.00%",
      cpl: "£0.00"
    },
    {
      id: 3,
      name: "Central Heating Installation",
      status: "Live",
      budget: "£60/day",
      spent: "£127.80",
      impressions: "2,156",
      clicks: "41",
      leads: "12",
      ctr: "1.90%",
      cpl: "£10.65"
    }
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Live":
        return "default";
      case "Paused":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🎯 Campaign Management
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Manage your Google Ads campaigns and monitor performance
          </p>
        </div>
        <Button className="text-white" style={{backgroundColor: 'oklch(0.386 0.063 188.416)'}}>
          + New Campaign
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="pb-3 font-medium text-sm text-gray-400">Campaign</th>
              <th className="pb-3 font-medium text-sm text-gray-400">Status</th>
              <th className="pb-3 font-medium text-sm text-gray-400">Budget</th>
              <th className="pb-3 font-medium text-sm text-gray-400">Spent</th>
              <th className="pb-3 font-medium text-sm text-gray-400">Impressions</th>
              <th className="pb-3 font-medium text-sm text-gray-400">Clicks</th>
              <th className="pb-3 font-medium text-sm text-gray-400">Leads</th>
              <th className="pb-3 font-medium text-sm text-gray-400">CTR</th>
              <th className="pb-3 font-medium text-sm text-gray-400">CPL</th>
              <th className="pb-3 font-medium text-sm text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="py-3">
                  <div className="font-medium text-white">{campaign.name}</div>
                </td>
                <td className="py-3">
                  <Badge
                    variant={getStatusBadgeVariant(campaign.status)}
                    className={campaign.status === "Live" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                  >
                    {campaign.status}
                  </Badge>
                </td>
                <td className="py-3 text-sm text-gray-400">{campaign.budget}</td>
                <td className="py-3 text-sm text-white">{campaign.spent}</td>
                <td className="py-3 text-sm text-white">{campaign.impressions}</td>
                <td className="py-3 text-sm text-white">{campaign.clicks}</td>
                <td className="py-3 text-sm font-medium text-white">{campaign.leads}</td>
                <td className="py-3 text-sm text-white">{campaign.ctr}</td>
                <td className="py-3 text-sm text-white">{campaign.cpl}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`border-gray-600 hover:bg-gray-700 ${
                        campaign.status === "Live" ? "text-orange-400" : "text-green-400"
                      }`}
                    >
                      {campaign.status === "Live" ? "Pause" : "Resume"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-800">
        <div className="text-sm text-gray-400">
          Total campaigns: {campaigns.length} • Active: {campaigns.filter(c => c.status === "Live").length}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">Import Campaigns</Button>
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">Export Data</Button>
        </div>
      </div>
    </div>
  );
}
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              🎯 Campaign Management
            </CardTitle>
            <CardDescription>
              Manage your Google Ads campaigns and monitor performance
            </CardDescription>
          </div>
          <Button>
            + New Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-sm">Campaign</th>
                <th className="pb-3 font-medium text-sm">Status</th>
                <th className="pb-3 font-medium text-sm">Budget</th>
                <th className="pb-3 font-medium text-sm">Spent</th>
                <th className="pb-3 font-medium text-sm">Impressions</th>
                <th className="pb-3 font-medium text-sm">Clicks</th>
                <th className="pb-3 font-medium text-sm">Leads</th>
                <th className="pb-3 font-medium text-sm">CTR</th>
                <th className="pb-3 font-medium text-sm">CPL</th>
                <th className="pb-3 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b">
                  <td className="py-3">
                    <div className="font-medium">{campaign.name}</div>
                  </td>
                  <td className="py-3">
                    <Badge variant={getStatusBadgeVariant(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">{campaign.budget}</td>
                  <td className="py-3 text-sm">{campaign.spent}</td>
                  <td className="py-3 text-sm">{campaign.impressions}</td>
                  <td className="py-3 text-sm">{campaign.clicks}</td>
                  <td className="py-3 text-sm font-medium">{campaign.leads}</td>
                  <td className="py-3 text-sm">{campaign.ctr}</td>
                  <td className="py-3 text-sm">{campaign.cpl}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={campaign.status === "Live" ? "text-orange-600" : "text-green-600"}
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

        <div className="mt-6 flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Total campaigns: {campaigns.length} • Active: {campaigns.filter(c => c.status === "Live").length}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Import Campaigns</Button>
            <Button variant="outline">Export Data</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
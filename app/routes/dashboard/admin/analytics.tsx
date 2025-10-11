import { useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { requireAdmin } from "~/utils/admin";
import type { Route } from "./+types/analytics";

export async function loader(args: Route.LoaderArgs) {
  await requireAdmin(args);

  // Mock analytics data - replace with real database queries
  const analyticsData = {
    businessMetrics: {
      totalMRR: 18420,
      growth: 15.2,
      churnRate: 3.4,
      avgRevenuePerCustomer: 127,
      customerAcquisitionCost: 89,
      lifetimeValue: 1240,
    },
    performanceMetrics: {
      totalCampaigns: 287,
      avgCTR: 2.8,
      avgConversionRate: 12.4,
      avgROAS: 4.2,
      totalAdSpend: 156800,
      totalRevenue: 658560,
    },
    industryBreakdown: [
      { industry: "Plumbing", customers: 45, avgROAS: 4.8, totalLeads: 1240 },
      { industry: "Electrical", customers: 38, avgROAS: 3.9, totalLeads: 980 },
      { industry: "HVAC", customers: 32, avgROAS: 5.1, totalLeads: 890 },
      { industry: "Roofing", customers: 24, avgROAS: 3.2, totalLeads: 654 },
      { industry: "Locksmith", customers: 17, avgROAS: 4.3, totalLeads: 456 },
    ],
    monthlyTrends: [
      { month: "Oct", customers: 142, leads: 2847, revenue: 47890 },
      { month: "Nov", customers: 156, leads: 3124, revenue: 52340 },
      { month: "Dec", customers: 163, leads: 3456, revenue: 58920 },
      { month: "Jan", customers: 171, leads: 3789, revenue: 64150 },
    ],
    topPerformers: [
      { name: "Joe's Plumbing", industry: "Plumbing", leads: 47, revenue: 8400, roas: 4.8 },
      { name: "24/7 HVAC Services", industry: "HVAC", leads: 31, revenue: 5600, roas: 5.1 },
      { name: "Fast Electric", industry: "Electrical", leads: 23, revenue: 3200, roas: 3.2 },
    ],
  };

  return analyticsData;
}

export default function AdminAnalytics() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header */}
          <div className="px-4 lg:px-6">
            <h1 className="text-2xl font-bold">📈 Analytics & Insights</h1>
            <p className="text-muted-foreground">Deep dive into platform performance and customer success</p>
          </div>

          {/* Business Metrics */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>💰 Business Metrics</CardTitle>
                <CardDescription>Key financial and growth indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${data.businessMetrics.totalMRR.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Monthly Recurring Revenue</div>
                    <div className="text-xs text-green-600">+{data.businessMetrics.growth}% growth</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">${data.businessMetrics.avgRevenuePerCustomer}</div>
                    <div className="text-sm text-muted-foreground">Avg Revenue Per Customer</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      ${data.businessMetrics.lifetimeValue.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Customer Lifetime Value</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">${data.businessMetrics.customerAcquisitionCost}</div>
                    <div className="text-sm text-muted-foreground">Customer Acquisition Cost</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{data.businessMetrics.churnRate}%</div>
                    <div className="text-sm text-muted-foreground">Monthly Churn Rate</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {(data.businessMetrics.lifetimeValue / data.businessMetrics.customerAcquisitionCost).toFixed(1)}x
                    </div>
                    <div className="text-sm text-muted-foreground">LTV/CAC Ratio</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>🎯 Campaign Performance</CardTitle>
                <CardDescription>Platform-wide advertising metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{data.performanceMetrics.totalCampaigns}</div>
                    <div className="text-sm text-muted-foreground">Active Campaigns</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{data.performanceMetrics.avgCTR}%</div>
                    <div className="text-sm text-muted-foreground">Average CTR</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{data.performanceMetrics.avgConversionRate}%</div>
                    <div className="text-sm text-muted-foreground">Avg Conversion Rate</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{data.performanceMetrics.avgROAS}x</div>
                    <div className="text-sm text-muted-foreground">Average ROAS</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold">${data.performanceMetrics.totalAdSpend.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Ad Spend</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${data.performanceMetrics.totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Customer Revenue Generated</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Industry Breakdown */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>🔧 Industry Performance</CardTitle>
                <CardDescription>Performance breakdown by trade industry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-sm">Industry</th>
                        <th className="pb-3 font-medium text-sm">Customers</th>
                        <th className="pb-3 font-medium text-sm">Total Leads</th>
                        <th className="pb-3 font-medium text-sm">Avg ROAS</th>
                        <th className="pb-3 font-medium text-sm">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.industryBreakdown.map((industry, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3">
                            <Badge variant="outline">{industry.industry}</Badge>
                          </td>
                          <td className="py-3 text-sm font-medium">{industry.customers}</td>
                          <td className="py-3 text-sm">{industry.totalLeads.toLocaleString()}</td>
                          <td className="py-3 text-sm font-medium">
                            <span className={industry.avgROAS >= 4 ? 'text-green-600' : 'text-orange-600'}>
                              {industry.avgROAS}x
                            </span>
                          </td>
                          <td className="py-3">
                            <Badge variant={industry.avgROAS >= 4 ? "default" : "secondary"}>
                              {industry.avgROAS >= 4 ? "Excellent" : "Good"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>🏆 Top Performing Customers</CardTitle>
                <CardDescription>Customers with highest lead generation this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.topPerformers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <Badge variant="outline" className="text-xs">{customer.industry}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{customer.leads} leads</div>
                        <div className="text-sm text-muted-foreground">
                          ${customer.revenue.toLocaleString()} • {customer.roas}x ROAS
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
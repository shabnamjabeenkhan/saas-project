import { useLoaderData } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { requireAdmin } from "~/utils/admin";
import type { Route } from "./+types/customers";

export async function loader(args: Route.LoaderArgs) {
  await requireAdmin(args);

  // Mock customer data - replace with real database queries
  const customers = [
    {
      id: 1,
      name: "Joe's Plumbing",
      email: "joe@joesplumbing.com",
      phone: "+1-555-0123",
      business: "Plumbing",
      location: "London, UK",
      status: "Active",
      subscription: "$99/month",
      joinDate: "2024-01-15",
      campaigns: 3,
      totalLeads: 127,
      leadsThisMonth: 47,
      totalRevenue: 18400,
      monthlyRevenue: 8400,
      avgROAS: 4.8,
      lastLogin: "2024-01-20",
    },
    {
      id: 2,
      name: "Fast Electric",
      email: "mike@fastelectric.com",
      phone: "+1-555-0124",
      business: "Electrical",
      location: "Manchester, UK",
      status: "Active",
      subscription: "$149/month",
      joinDate: "2024-02-01",
      campaigns: 2,
      totalLeads: 89,
      leadsThisMonth: 23,
      totalRevenue: 12200,
      monthlyRevenue: 3200,
      avgROAS: 3.2,
      lastLogin: "2024-01-19",
    },
    {
      id: 3,
      name: "24/7 HVAC Services",
      email: "sarah@247hvac.com",
      phone: "+1-555-0125",
      business: "HVAC",
      location: "Birmingham, UK",
      status: "Active",
      subscription: "$199/month",
      joinDate: "2024-01-28",
      campaigns: 4,
      totalLeads: 156,
      leadsThisMonth: 31,
      totalRevenue: 23600,
      monthlyRevenue: 5600,
      avgROAS: 5.1,
      lastLogin: "2024-01-21",
    },
    {
      id: 4,
      name: "City Roofing",
      email: "john@cityroofing.com",
      phone: "+1-555-0126",
      business: "Roofing",
      location: "Leeds, UK",
      status: "Cancelled",
      subscription: "Cancelled",
      joinDate: "2024-01-10",
      campaigns: 0,
      totalLeads: 12,
      leadsThisMonth: 0,
      totalRevenue: 800,
      monthlyRevenue: 0,
      avgROAS: 0.8,
      lastLogin: "2024-01-15",
    },
    {
      id: 5,
      name: "Emergency Locksmiths",
      email: "alex@emergencylock.com",
      phone: "+1-555-0127",
      business: "Locksmith",
      location: "Liverpool, UK",
      status: "Active",
      subscription: "$99/month",
      joinDate: "2024-02-05",
      campaigns: 2,
      totalLeads: 67,
      leadsThisMonth: 19,
      totalRevenue: 9400,
      monthlyRevenue: 2800,
      avgROAS: 3.9,
      lastLogin: "2024-01-20",
    },
  ];

  return { customers };
}

export default function AdminCustomers() {
  const { customers } = useLoaderData<typeof loader>();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header */}
          <div className="px-4 lg:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">👥 Customer Management</h1>
                <p className="text-muted-foreground">View and manage all TradeBoost AI customers</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Export Data</Button>
                <Button>Add Customer</Button>
              </div>
            </div>
          </div>

          {/* Customer List */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>All Customers ({customers.length})</CardTitle>
                <CardDescription>
                  Complete customer overview with performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-sm">Customer Details</th>
                        <th className="pb-3 font-medium text-sm">Business</th>
                        <th className="pb-3 font-medium text-sm">Status</th>
                        <th className="pb-3 font-medium text-sm">Campaigns</th>
                        <th className="pb-3 font-medium text-sm">Leads</th>
                        <th className="pb-3 font-medium text-sm">Revenue</th>
                        <th className="pb-3 font-medium text-sm">ROAS</th>
                        <th className="pb-3 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id} className="border-b">
                          <td className="py-4">
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">{customer.email}</div>
                              <div className="text-xs text-muted-foreground">{customer.location}</div>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge variant="outline">{customer.business}</Badge>
                          </td>
                          <td className="py-4">
                            <Badge variant={getStatusBadgeVariant(customer.status)}>
                              {customer.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {customer.subscription}
                            </div>
                          </td>
                          <td className="py-4 text-sm">
                            <div className="font-medium">{customer.campaigns} active</div>
                          </td>
                          <td className="py-4 text-sm">
                            <div className="font-medium">{customer.leadsThisMonth} this month</div>
                            <div className="text-xs text-muted-foreground">
                              {customer.totalLeads} total
                            </div>
                          </td>
                          <td className="py-4 text-sm">
                            <div className="font-medium">${customer.monthlyRevenue.toLocaleString()}/mo</div>
                            <div className="text-xs text-muted-foreground">
                              ${customer.totalRevenue.toLocaleString()} total
                            </div>
                          </td>
                          <td className="py-4 text-sm">
                            <div className={`font-medium ${customer.avgROAS >= 3 ? 'text-green-600' : 'text-red-600'}`}>
                              {customer.avgROAS}x
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                Contact
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {customers.filter(c => c.status === "Active").length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Customers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {customers.reduce((sum, c) => sum + c.leadsThisMonth, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Leads This Month</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        ${customers.reduce((sum, c) => sum + c.monthlyRevenue, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Monthly Revenue Generated</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {(customers.reduce((sum, c) => sum + c.avgROAS, 0) / customers.length).toFixed(1)}x
                      </div>
                      <div className="text-sm text-muted-foreground">Average ROAS</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
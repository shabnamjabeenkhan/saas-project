import { IconDashboard, IconSettings, IconChartBar, IconBrandGoogle, IconMail, IconUsers, IconAnalyze, IconShield } from "@tabler/icons-react";
import { Link } from "react-router";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { isAdminEmail } from "~/utils/admin";

const getNavigationData = (isAdmin: boolean) => ({
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Campaigns",
      url: "/dashboard/campaigns",
      icon: IconChartBar,
    },
    // Temporarily hidden until route discovery issue is resolved
    // {
    //   title: "Campaign Preview Demo",
    //   url: "/dashboard/campaigns",
    //   icon: IconAnalyze,
    // },
    {
      title: "Google Ads Settings",
      url: "/dashboard/google-ads-settings",
      icon: IconBrandGoogle,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconMail,
    },
    // {
    //   title: "💳 Billing",
    //   url: "/dashboard/billing",
    //   icon: IconCreditCard,
    // },
    {
      title: "Contact",
      url: "/dashboard/contact",
      icon: IconMail,
    },
  ],
  navAdmin: isAdmin ? [
    {
      title: "Admin Panel",
      url: "/dashboard/admin",
      icon: IconShield,
    },
    {
      title: "Customers",
      url: "/dashboard/admin/customers",
      icon: IconUsers,
    },
    {
      title: "Analytics",
      url: "/dashboard/admin/analytics",
      icon: IconAnalyze,
    },
  ] : [],
});

export function AppSidebar({
  variant,
  user,
}: {
  variant: "sidebar" | "floating" | "inset";
  user: any;
}) {
  // Check if user is admin
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || user?.email || "";
  const isAdmin = isAdminEmail(userEmail);
  const navigationData = getNavigationData(isAdmin);

  return (
    <Sidebar
      collapsible="offcanvas"
      variant={variant}
      className="[&_[data-slot=sidebar-inner]]:bg-[#0a0a0a] [&_[data-slot=sidebar-inner]]:text-white [&_[data-slot=sidebar-inner]]:border-r [&_[data-slot=sidebar-inner]]:border-gray-800/50"
    >
      <SidebarHeader className="border-b border-gray-800/50 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/" prefetch="viewport" className="flex items-center gap-2 p-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-lg font-semibold text-white">TradeBoost AI</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData.navMain} />
        {isAdmin && navigationData.navAdmin.length > 0 && (
          <>
            <div className="px-3 py-2 mt-6">
              <div className="text-xs font-semibold text-red-400 uppercase tracking-wider border-t border-gray-800/50 pt-4">
                Admin
              </div>
            </div>
            <NavMain items={navigationData.navAdmin} />
          </>
        )}
        <div className="mt-auto border-t border-gray-800/50 pt-4">
          <NavSecondary items={navigationData.navSecondary} />
        </div>
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}

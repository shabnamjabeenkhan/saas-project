import { IconDashboard, IconSettings, IconChartBar, IconTarget, IconBrandGoogle, IconMail, IconCreditCard, IconUsers, IconAnalyze, IconShield } from "@tabler/icons-react";
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
    {
      title: "Campaign Generator",
      url: "/dashboard/campaign-generator",
      icon: IconTarget,
    },
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
    <Sidebar collapsible="offcanvas" variant={variant}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/" prefetch="viewport">
              <span className="text-base font-semibold">TradeBoost AI</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData.navMain} />
        {isAdmin && navigationData.navAdmin.length > 0 && (
          <>
            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                Admin
              </div>
            </div>
            <NavMain items={navigationData.navAdmin} />
          </>
        )}
        <NavSecondary items={navigationData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}

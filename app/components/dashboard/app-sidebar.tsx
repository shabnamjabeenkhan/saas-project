import { IconDashboard, IconSettings, IconChartBar, IconTarget, IconBrandGoogle, IconMail, IconCreditCard } from "@tabler/icons-react";
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

const data = {
  navMain: [
    {
      title: "🏠 Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "📊 Campaigns",
      url: "/dashboard/campaigns",
      icon: IconChartBar,
    },
    {
      title: "🎯 Campaign Generator",
      url: "/dashboard/campaign-generator",
      icon: IconTarget,
    },
    {
      title: "⚙️ Google Ads Settings",
      url: "/dashboard/google-ads-settings",
      icon: IconBrandGoogle,
    },
  ],
  navSecondary: [
    {
      title: "📧 Settings",
      url: "/dashboard/settings",
      icon: IconMail,
    },
    {
      title: "💳 Billing",
      url: "/dashboard/billing",
      icon: IconCreditCard,
    },
    {
      title: "📞 Contact",
      url: "/dashboard/contact",
      icon: IconMail,
    },
  ],
};

export function AppSidebar({
  variant,
  user,
}: {
  variant: "sidebar" | "floating" | "inset";
  user: any;
}) {
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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}

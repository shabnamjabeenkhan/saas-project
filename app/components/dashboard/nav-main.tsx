import { memo, useMemo } from "react";
import { type Icon } from "@tabler/icons-react";

import { Link, useLocation } from "react-router";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";

export const NavMain = memo(({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) => {
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navItems = useMemo(() => 
    items.map((item) => ({
      ...item,
      isActive: location.pathname === item.url,
    })), 
    [items, location.pathname]
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={item.isActive}
                asChild
                className={`hover:bg-white/5 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white transition-all duration-200 ${
                  item.isActive ? 'bg-white/10 text-white font-medium' : 'text-gray-300'
                }`}
              >
                <Link
                  to={item.url}
                  prefetch="intent"
                  onClick={handleLinkClick}
                >
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

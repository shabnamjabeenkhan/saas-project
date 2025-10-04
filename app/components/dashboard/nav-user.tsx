"use client";
import { useQuery } from "convex/react";
import { Badge } from "~/components/ui/badge";
import { api } from "../../../convex/_generated/api";
import { isFeatureEnabled } from "../../../config";
import { SignOutButton } from "@clerk/react-router";
import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";
import { Loader2, SettingsIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { useClerk } from "@clerk/react-router";
import { Button } from "~/components/ui/button";
import { useNavigate } from "react-router";
import { useState } from "react";

export function NavUser({ user }: any) {
  const { isMobile } = useSidebar();
  const userFullName = user.firstName + " " + user.lastName;
  const userEmail = user.emailAddresses[0].emailAddress;
  const userInitials =
    (user?.firstName?.charAt(0) || "").toUpperCase() +
    (user?.lastName?.charAt(0) || "").toUpperCase();
  const userProfile = user.imageUrl;
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const showBillingUi = isFeatureEnabled("payments") && isFeatureEnabled("convex");

  function PlanPill() {
    const subscription = useQuery(api.subscriptions.fetchUserSubscription);
    const hasActive = subscription?.status === "active";
    if (!hasActive) return null;

    const interval = (subscription?.interval || "").replace("_", " ");
    const intervalShort = interval === "month" ? "mo" : interval === "year" ? "yr" : interval;
    const currency = subscription?.currency?.toUpperCase();
    const symbol = currency === "USD" ? "$" : "";
    const amount = typeof subscription?.amount === "number" ? (subscription.amount / 100).toFixed(0) : undefined;
    const label = amount ? `${symbol}${amount}${intervalShort ? "/" + intervalShort : ""}` : "Active";
    return (
      <div className="mb-2">
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs">
          {label}
        </Badge>
      </div>
    );
  }

  function UpgradeButton() {
    const subscription = useQuery(api.subscriptions.fetchUserSubscription);
    const hasActive = subscription?.status === "active";
    if (hasActive) return null;

    return (
      <div className="mb-2">
        <Button
          size="sm"
          className="w-full"
          disabled={isUpgrading}
          onClick={() => {
            setIsUpgrading(true);
            navigate("/pricing");
          }}
        >
          {isUpgrading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting...
            </>
          ) : (
            "Upgrade Plan"
          )}
        </Button>
      </div>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {showBillingUi && <UpgradeButton />}
        {showBillingUi && <PlanPill />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userProfile} alt={userFullName} />
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userFullName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {userEmail}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userProfile} alt={userFullName} />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userFullName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {userEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
              <IconLogout />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

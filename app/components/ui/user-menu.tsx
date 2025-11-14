"use client";
import { useUser, useClerk } from "@clerk/react-router";
import { Settings, User, LogOut } from "lucide-react";
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
import { Button } from "~/components/ui/button";

interface UserMenuProps {
  className?: string;
  variant?: "header" | "sidebar";
  user?: any; // Allow passing user data from server-side
}

export function UserMenu({ className = "", variant = "header", user: passedUser }: UserMenuProps) {
  const { user: clientUser } = useUser();
  const { signOut } = useClerk();

  // Use passed user data if available (from server-side), otherwise use client-side user
  const user = passedUser || clientUser;

  if (!user) return null;

  const userFullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  const userEmail = user.emailAddresses?.[0]?.emailAddress || "";
  const userInitials =
    ((user?.firstName?.charAt(0) || "") + (user?.lastName?.charAt(0) || "")).toUpperCase() || "U";
  const userProfile = user.imageUrl;

  const handleManageAccount = () => {
    // Open Clerk's user profile modal
    (window as any).Clerk?.openUserProfile();
  };

  if (variant === "sidebar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`h-auto p-2 ${className}`}>
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={userProfile} alt={userFullName} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userFullName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </span>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userFullName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleManageAccount}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Manage account</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ redirectUrl: window.location.origin })}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Header variant (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`relative h-8 w-8 rounded-full ${className}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile} alt={userFullName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userFullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleManageAccount}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Manage account</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ redirectUrl: window.location.origin })}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
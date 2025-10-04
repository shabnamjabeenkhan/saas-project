"use client";
import { UserButton } from "@clerk/react-router";
import { Menu, X, Loader2, Lock } from "lucide-react";
import React, { useCallback, useState } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { config, isFeatureEnabled } from "../../../config";

const getMenuItems = () => {
  const items = [
  { name: "Home", href: "#hero" },
  { name: "Features", href: "#features" },
  { name: "Changelog", href: "/changelog" },
  { name: "Documentation", href: "/docs", external: true },
  ];

  // Only show pricing if payments are enabled
  if (isFeatureEnabled('payments') && config.ui.showPricing) {
    items.push({ name: "Pricing", href: "#pricing" });
  }

  return items;
};

export const Navbar = ({
  loaderData,
}: {
  loaderData?: { isSignedIn: boolean; hasActiveSubscription: boolean };
}) => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [menuItems, setMenuItems] = React.useState(getMenuItems());

  // Update docs URL on client side
  React.useEffect(() => {
    const isDev = window.location.hostname === 'localhost';
    const docsUrl = isDev ? 'http://localhost:3000/docs' : `${window.location.origin}/docs`;
    
    setMenuItems((prevItems) => 
      prevItems.map((item) => 
        item.name === "Documentation" ? { ...item, href: docsUrl } : item
      )
    );
  }, []);

  React.useEffect(() => {
    // Use RAF for smooth scroll updates
    let rafId: number | null = null;
    
    const handleScroll = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const shouldBeScrolled = scrollY > 20;
        
        // Only update state if it actually changed
        setIsScrolled(prev => {
          if (prev !== shouldBeScrolled) {
            return shouldBeScrolled;
          }
          return prev;
        });
      });
    };
    
    // Set initial scroll state
    handleScroll();
    
    // Add single event listener with passive flag
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const handleNavClick = useCallback((href: string, external?: boolean) => {
    if (external) {
      // Open external links in new tab
      window.open(href, '_blank');
    } else if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } else {
      // For regular links, navigate using the router
      window.location.href = href;
    }
    setMenuState(false); // Close mobile menu
  }, []);

  const handleDashboardClick = useCallback(() => {
    setIsDashboardLoading(true);
  }, []);

  // Simple computations don't need useMemo
  const authEnabled = isFeatureEnabled('auth') && config.ui.showAuth;
  
  const dashboardLink = !authEnabled
    ? "/dashboard"
    : !loaderData?.isSignedIn
      ? "/sign-up"
      : "/dashboard";

  const dashboardText = "Dashboard";

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-50 w-full px-2"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 lg:px-12",
            isScrolled &&
              "bg-background/95 max-w-4xl rounded-2xl border backdrop-blur-sm lg:px-5 shadow-lg transition-[max-width,background-color,backdrop-filter] duration-150"
          )}
        >
          {/* Temporary debug indicator */}
          {/* <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs z-10">
            Debug: {isScrolled ? 'SCROLLED' : 'NOT SCROLLED'}
          </div> */}
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:flex-nowrap lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                to="/"
                aria-label="home"
                className="flex items-center space-x-2 font-semibold text-xl text-muted-foreground"
                prefetch="viewport"
              >
                <img src="/kaizen-no-bg.svg" alt="Kaizen Logo" className="w-18 h-18" />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="hidden lg:flex flex-1 items-center justify-center">
              <ul className="flex h-8 items-center gap-8 text-sm leading-none">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <div
                      onClick={() => handleNavClick(item.href, item.external)}
                      className="hover:cursor-pointer text-muted-foreground flex items-center h-8 duration-150 transition-colors"
                    >
                      <span>{item.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleNavClick(item.href, item.external)}
                        className="text-muted-foreground hover:cursor-pointer  block duration-150 transition-colors w-full text-left"
                      >
                        <span>{item.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col items-center space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">Private Repo</span>
                </div>
                {authEnabled && loaderData?.isSignedIn ? (
                  <div className="flex items-center gap-3 self-center">
                    <Button 
                      asChild 
                      size="sm" 
                      disabled={isDashboardLoading}
                      onClick={handleDashboardClick}
                      className="min-w-[90px]"
                    >
                      <Link to={dashboardLink} prefetch="viewport">
                        {isDashboardLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>{dashboardText}</span>
                        )}
                      </Link>
                    </Button>
                    <UserButton />
                  </div>
                ) : authEnabled ? (
                  <>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <Link to="/sign-in" prefetch="viewport">
                        <span>Login</span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                    >
                      <Link to="/sign-up" prefetch="viewport">
                        <span>Sign Up</span>
                      </Link>
                    </Button>
                  </>
                ) : (
                  // When auth is disabled, show a simple get started button
                  <Button
                    asChild
                    size="sm"
                    disabled={isDashboardLoading}
                    onClick={handleDashboardClick}
                    className="min-w-[90px]"
                  >
                    <Link to={dashboardLink} prefetch="viewport">
                      {isDashboardLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>{dashboardText}</span>
                      )}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

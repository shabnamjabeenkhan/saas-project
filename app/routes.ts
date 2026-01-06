import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

// Static routes configuration - no dynamic config loading during module initialization
const routes: RouteConfig = [
  // Home route is always available
  index("routes/home.tsx"),
  
  // Changelog is always available
  route("changelog", "routes/changelog.tsx"),
  
  // Authentication routes (always included, conditionally rendered)
  route("sign-in/*", "routes/sign-in.tsx"),
  route("sign-up/*", "routes/sign-up.tsx"),
  route("auth.google-ads", "routes/auth.google-ads.tsx"),

  // Onboarding route
  route("onboarding", "routes/onboarding.tsx"),
  
  // Pricing routes (always included, conditionally rendered)
  route("pricing", "routes/pricing.tsx"),
  route("success", "routes/success.tsx"),

  // Legal pages
  route("terms", "routes/terms.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("refund", "routes/refund.tsx"),
  
  // Dashboard routes (always included)
  layout("routes/dashboard/layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("dashboard/campaigns", "routes/dashboard/campaigns.tsx"),
    route("dashboard/settings", "routes/dashboard/settings.tsx"),
    route("dashboard/chat", "routes/dashboard/chat.tsx"),
    route("dashboard/contact", "routes/dashboard/contact.tsx"),

    // Admin routes (protected)
    route("dashboard/admin", "routes/dashboard/admin/index.tsx"),
    route("dashboard/admin/customers", "routes/dashboard/admin/customers.tsx"),
    route("dashboard/admin/analytics", "routes/dashboard/admin/analytics.tsx"),
  ]),
];

export default routes satisfies RouteConfig;

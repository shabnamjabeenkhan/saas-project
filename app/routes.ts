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
  
  // Pricing routes (always included, conditionally rendered)
  route("pricing", "routes/pricing.tsx"),
  route("success", "routes/success.tsx"),
  
  // Dashboard routes (always included)
  layout("routes/dashboard/layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("dashboard/settings", "routes/dashboard/settings.tsx"),
    route("dashboard/chat", "routes/dashboard/chat.tsx"),
  ]),
];

export default routes satisfies RouteConfig;

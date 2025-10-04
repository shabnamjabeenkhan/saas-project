import { CpuArchitecture } from "~/components/ui/cpu-architecture";
import { Box, Check, CreditCard, Lock, PieChart, Zap, Mail } from "lucide-react";

export default function CoreFeaturesSection() {
  const features = [
    {
      icon: <Lock className="size-5 text-primary" />,
      title: "Auth",
      description: "Clerk integration for secure user management.",
    },
    {
      icon: <CreditCard className="size-5 text-primary" />,
      title: "Payments",
      description: "Polar-powered subscriptions & billing.",
    },
    {
      icon: <Zap className="size-5 text-primary" />,
      title: "Real-Time Data",
      description: "Convex database with live queries & mutations.",
    },
    {
      icon: <Mail className="size-5 text-primary" />,
      title: "Emails",
      description: "Transactional & marketing emails with Resend.",
    },
    {
      icon: <Box className="size-5 text-primary" />,
      title: "Dockerized",
      description: "Container-ready for any platform.",
    },
    {
      icon: <Check className="size-5 text-primary" />,
      title: "Rapid Setup",
      description: "Docs & guides for fast onboarding.",
    },
  ];
  return (
    <section id="features" className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <h3 className="text-center text-xl font-medium mb-12 text-muted-foreground">
          Everything working together <em>seamlessly</em>.
        </h3>
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Graphic */}
          <div className="mx-auto w-full max-w-md">
            <CpuArchitecture
              text="改善"
              className="w-full h-auto"
            />
          </div>
          {/* Feature list */}
          <ul className="grid gap-6 sm:grid-cols-2">
            {features.map((f, idx) => (
              <li key={idx} className="flex items-start gap-3">
                {f.icon}
                <div>
                  <h3 className="font-semibold leading-none mb-1">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {f.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
} 
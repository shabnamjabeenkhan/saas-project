"use client";
import { CheckCircle2, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import * as PricingCard from "~/components/ui/pricing-card";
import { isFeatureEnabled, config } from "../../../config";

const POLAR_CHECKOUT_URL =
  "https://buy.polar.sh/polar_cl_j6BOG8r1GyWlJm5h4VoEy2oltoL0ObZNnWiVw3D3sPM";

export default function Pricing({ loaderData }: { loaderData: any }) {
  if (!isFeatureEnabled("payments") || !config.ui.showPricing) {
    return null;
  }
  void loaderData;

  const [isLoading, setIsLoading] = useState(false);

  const onBuy = () => {
    if (isLoading) return;
    setIsLoading(true);
    window.location.href = POLAR_CHECKOUT_URL;
  };

  const features = [
    "Save 40+ hours of setup and configuration",
    "Production-grade codebase with crystal-clear documentation",
    "Private Discord Community Access for support and feedback",
    "Access to custom tools to help you ship faster",
    "Updated weekly. Build Unlimited projects",
  ];

  return (
    <section id="pricing" className="py-16 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl mb-8">
          <div className="rounded-xl border bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 px-4 py-3 text-center text-sm">
            <span className="font-medium">Early-bird pricing:</span> Price increases after the first 10 purchases.
          </div>
        </div>
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            Lifetime access
          </h1>
          <p className="text-muted-foreground">for one developer</p>
        </div>

        <div className="mt-8 flex justify-center md:mt-16">
          <PricingCard.Card className="max-w-lg w-full">
            <PricingCard.Header>
              <PricingCard.Plan>
                <PricingCard.PlanName>
                  <Users aria-hidden="true" />
                  <span className="text-muted-foreground">Individual license</span>
                </PricingCard.PlanName>
                <PricingCard.Badge>One‑time purchase</PricingCard.Badge>
              </PricingCard.Plan>
              <PricingCard.Price>
                <PricingCard.MainPrice>$79.00</PricingCard.MainPrice>
                <PricingCard.Period>/ one‑time</PricingCard.Period>
                <PricingCard.OriginalPrice>$125.00</PricingCard.OriginalPrice>
              </PricingCard.Price>
              <Button
                className="w-full font-semibold text-white bg-gradient-to-b from-orange-500 to-orange-600 shadow-[0_10px_25px_rgba(255,115,0,0.3)]"
                onClick={onBuy}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redirecting…</span>
                  </>
                ) : (
                  <span>Buy Kaizen</span>
                )}
              </Button>
            </PricingCard.Header>

            <PricingCard.Body>
              <PricingCard.List>
                {features.map((item, idx) => (
                  <PricingCard.ListItem key={idx}>
                    <span className="mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </PricingCard.Body>
          </PricingCard.Card>
        </div>
      </div>
    </section>
  );
}

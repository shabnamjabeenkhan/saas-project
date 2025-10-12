"use client";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { isFeatureEnabled, config } from "../../../config";

const POLAR_CHECKOUT_URL =
  "https://buy.polar.sh/polar_cl_j6BOG8r1GyWlJm5h4VoEy2oltoL0ObZNnWiVw3D3sPM";

type ButtonVariant =
  | 'outline'
  | 'default'
  | 'link'
  | 'destructive'
  | 'secondary'
  | 'ghost';

const plans: {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonVariant: ButtonVariant;
  badge: string | null;
  isPopular?: boolean;
}[] = [
  {
    name: 'Free',
    price: '$0',
    description: 'Per developer',
    features: [
      'Basic starter template',
      'Community support',
      'Basic documentation',
    ],
    buttonVariant: 'outline',
    badge: null,
  },
  {
    name: 'Pro',
    price: '$79',
    description: 'One-time purchase',
    features: [
      'Save 40+ hours of setup and configuration',
      'Production-grade codebase with crystal-clear documentation',
      'Private Discord Community Access for support and feedback',
      'Access to custom tools to help you ship faster',
      'Updated weekly. Build Unlimited projects',
    ],
    buttonVariant: 'default',
    badge: 'Popular',
    isPopular: true,
  },
];

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

  return (
    <section id="pricing" className="not-prose relative w-full py-16 md:py-32">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/10 absolute -top-[10%] left-[50%] h-[40%] w-[60%] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            Pricing that Scales with You
          </h1>
          <p>
            Choose the perfect plan for your needs. Start free and upgrade as you grow.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-2">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative flex flex-col ${
                plan.badge ? 'border border-primary/30' : ''
              }`}
            >
              {plan.badge && (
                <span className="bg-primary absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full px-3 py-1 text-xs font-medium text-primary-foreground shadow-md">
                  {plan.badge}
                </span>
              )}

              <CardHeader>
                <CardTitle className="font-medium">{plan.name}</CardTitle>
                <span className="my-3 block text-2xl font-semibold">
                  {plan.price}
                </span>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <hr className="border-dashed" />
                <ul className="list-outside space-y-3 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="size-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto">
                <Button
                  variant={plan.buttonVariant}
                  className={`w-full ${plan.isPopular ? 'font-semibold text-white bg-gradient-to-b from-orange-500 to-orange-600 shadow-[0_10px_25px_rgba(255,115,0,0.3)]' : ''}`}
                  onClick={plan.isPopular ? onBuy : undefined}
                  disabled={isLoading && plan.isPopular}
                >
                  {isLoading && plan.isPopular ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Redirecting…</span>
                    </>
                  ) : (
                    <span>{plan.isPopular ? 'Buy Kaizen' : 'Get Started'}</span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

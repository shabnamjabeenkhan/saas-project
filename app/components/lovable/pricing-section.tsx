import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Check } from "lucide-react";

type ButtonVariant =
  | 'outline'
  | 'default'
  | 'link'
  | 'destructive'
  | 'secondary'
  | 'ghost';

export const LovablePricingSection = () => {
  const plans: {
    name: string;
    price: string;
    description: string;
    features: string[];
    buttonVariant: ButtonVariant;
    badge: string | null;
  }[] = [
    {
      name: 'Standard',
      price: '£69 / mo',
      description: 'Perfect for growing businesses',
      features: [
        'AI campaign generation',
        'Up to 3 service areas',
        'Advanced performance tracking',
        'Priority email support',
        'Monthly optimization',
        'Emergency campaign templates',
        'Basic seasonal campaigns',
        'ROI reporting',
        'Mobile app access',
        'Standard security features',
      ],
      buttonVariant: 'default',
      badge: 'Popular',
    },
    {
      name: 'Premium',
      price: '£189 / mo',
      description: 'For established operations',
      features: [
        'Everything in Standard',
        'Unlimited service areas',
        'Advanced analytics & ROI tracking',
        'Priority phone support',
        'Weekly optimization',
        'Seasonal campaigns (boiler season, etc.)',
        'Multi-trade support',
        'Custom emergency messaging',
      ],
      buttonVariant: 'outline',
      badge: null,
    },
  ];

  return (
    <section className="not-prose relative w-full py-16 md:py-32">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/10 absolute -top-[10%] left-[50%] h-[40%] w-[60%] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full blur-3xl" />
        <div className="bg-primary/5 absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h1 className="text-center text-4xl font-semibold lg:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Pay hundreds, not thousands. No contracts, cancel anytime.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative flex flex-col ${
                plan.badge ? 'border border-primary' : ''
              }`}
            >
              {plan.badge && (
                <span className="border-primary/20 bg-primary absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full px-3 py-1 text-xs font-medium text-primary-foreground ring-1 ring-white/20 ring-offset-1 ring-offset-gray-950/5 ring-inset">
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
                <Button asChild variant={plan.buttonVariant} className="w-full">
                  <Link to="">
                    Start Free Trial
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8">
          All plans include 14-day free trial · No credit card required · vs £48,000/year for agencies
        </p>
      </div>
    </section>
  );
};
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Check } from "lucide-react";

export const LovablePricingSection = () => {
  const plans = [
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
      buttonVariant: 'outline' as const,
      badge: null,
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
      buttonVariant: 'default' as const,
      badge: null,
    },
  ];

  return (
    <section className="py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-center text-4xl font-semibold lg:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground">
            Pay hundreds, not thousands. No contracts, cancel anytime.
          </p>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className="border border-border rounded-3xl flex flex-col justify-between space-y-6 shadow-sm p-6 relative"
              style={{ backgroundColor: 'rgb(33, 33, 38)', width: '360px' }}
            >
              {plan.badge && (
                <span className="absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full bg-gradient-to-br from-purple-400 to-primary px-3 py-1 text-xs font-medium text-white shadow-md">
                  {plan.badge}
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h2 className="font-medium">{plan.name}</h2>
                  <span className="my-3 block text-2xl font-semibold">
                    {plan.price}
                  </span>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <hr className="border-dashed border-t-[0.5px] border-border/30" />
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <hr className="border-dashed border-t-[0.5px] border-border/30" />
                <Button
                  asChild
                  variant={plan.buttonVariant}
                  size="sm"
                  className={`w-full bg-transparent hover:bg-white/20 transition-all duration-300 hover:scale-105 border ${
                    plan.name === 'Premium' ? 'border-white' : 'border-border'
                  }`}
                  style={{ backgroundColor: '#ffffff0d' }}
                >
                  <Link to="">
                    Get Started
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8">
          All plans include 14-day free trial · No credit card required · vs £48,000/year for agencies
        </p>
      </div>
    </section>
  );
};
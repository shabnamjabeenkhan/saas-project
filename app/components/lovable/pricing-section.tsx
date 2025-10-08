import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Check, Sparkles } from "lucide-react";

export const LovablePricingSection = () => {
  const plans = [
    {
      name: "Standard",
      price: "£69",
      description: "Perfect for growing businesses",
      features: [
        "AI campaign generation",
        "Up to 3 service areas",
        "Basic performance tracking",
        "Email support",
        "Monthly optimization",
        "Emergency campaign templates"
      ],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Premium",
      price: "£189",
      description: "For established operations",
      features: [
        "Everything in Standard",
        "Unlimited service areas",
        "Advanced analytics & ROI tracking",
        "Priority phone support",
        "Weekly optimization",
        "Seasonal campaigns (boiler season, etc.)",
        "Multi-trade support",
        "Custom emergency messaging"
      ],
      cta: "Start Free Trial",
      popular: true
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Pay hundreds, not thousands. No contracts, cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative bg-card text-card-foreground ${plan.popular ? 'border-primary shadow-lg border-2' : 'shadow-sm border-border'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="space-y-4 pt-8">
                <CardTitle className="text-2xl text-card-foreground">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    or £{parseInt(plan.price.slice(1)) * 12}/year (save 2 months)
                  </p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-card-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  vs £48,000/year for agencies
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8">
          All plans include 14-day free trial · No credit card required
        </p>
      </div>
    </section>
  );
};
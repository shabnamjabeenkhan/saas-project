import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Check, Phone } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

interface LovablePricingSectionProps {
  isSignedIn?: boolean;
}

export const LovablePricingSection = ({ isSignedIn = false }: LovablePricingSectionProps) => {
  const plans = [
    {
      name: 'Standard',
      price: '£69',
      period: 'mo',
      description: 'Perfect for growing businesses',
      features: [
        { label: '15 AI campaign generations', info: 'Generate up to 15 complete Google Ads campaigns per month.' },
        { label: 'Up to 3 service areas', info: 'Target customers in up to 3 different locations or postcodes.' },
        { label: 'Performance tracking', info: 'Monitor clicks, calls, and conversion rates from your ads.' },
        { label: 'Email support', info: 'Get help via email with priority response times.' },
        { label: 'Monthly optimization', info: 'Regular campaign reviews and improvement suggestions.' },
        { label: 'Emergency templates', info: 'Pre-built templates for urgent service campaigns.' },
        { label: 'Seasonal campaigns', info: 'Auto-adjust campaigns for peak seasons like winter heating.' },
        { label: 'ROI reporting', info: 'Track return on investment and cost per lead.' },
      ],
      buttonText: 'Get Started',
      isPopular: false,
    },
  ];

  return (
    <TooltipProvider>
      <section className="py-32 overflow-x-hidden" style={{ backgroundColor: '#18191a' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <h2 className="text-center text-4xl font-semibold lg:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              vs £48,000/year for agencies
            </p>
          </div>

          <div className="mt-20 flex justify-center max-w-5xl mx-auto px-4">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={cn(
                  "w-full max-w-[464px] mx-auto rounded-[38px] p-[23px] flex flex-col gap-6 shadow-2xl relative",
                  plan.isPopular && "border-2 border-blue-500/80"
                )}
                style={{
                  backgroundColor: 'oklch(20.5% 0 0)',
                  backdropFilter: 'blur(20px)',
                  border: plan.isPopular ? '2px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(75, 85, 99, 0.3)',
                }}
              >
                {/* Header */}
                <div className="relative">
                  {plan.isPopular && (
                    <div className="absolute inset-x-0 -top-8 mx-auto flex h-7 w-fit items-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1 text-sm font-medium text-white shadow-lg">
                      Most Popular
                    </div>
                  )}
                  <h2 className="text-2xl font-bold leading-[28px] text-white mb-2">
                    {plan.name}
                  </h2>
                  <p className="text-base text-gray-400 leading-[20px]">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div
                  className="rounded-[33px] px-[27px] py-[30px] flex flex-col gap-[20px]"
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(55, 65, 81, 0.4)',
                  }}
                >
                  {plan.features.map((f, i) => (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3 cursor-pointer select-none text-gray-300 hover:text-white transition-colors">
                          <Check className="text-green-400 w-5 h-5 flex-shrink-0" />
                          <span className="text-base leading-[20px] font-medium">{f.label}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-[280px] text-sm bg-gray-900/95 text-gray-100 border border-gray-600 rounded-xl px-3 py-2 shadow-xl backdrop-blur-sm"
                      >
                        {f.info}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-[6px] mt-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-400 font-medium">Starting from</span>
                    <span className="text-[36px] font-bold leading-[42px] text-white">{plan.price}/{plan.period}</span>
                  </div>

                  {/* Button */}
                  <Button
                    asChild
                    className={cn(
                      "flex items-center justify-center w-[200px] h-[60px] rounded-[30px] text-[18px] font-semibold text-white border-0 shadow-xl",
                      plan.isPopular
                        ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800"
                        : "bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 hover:from-gray-500 hover:via-gray-600 hover:to-gray-700",
                      "transition-all duration-300 transform hover:scale-[1.05] hover:shadow-2xl"
                    )}
                  >
                    <Link to={isSignedIn ? "/dashboard" : "/sign-up"}>
                      <span>{plan.buttonText}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-muted-foreground mt-8">
            Start your 7-day free trial today · Cancel anytime
          </p>
        </div>
      </section>
    </TooltipProvider>
  );
};
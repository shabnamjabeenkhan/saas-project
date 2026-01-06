import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Check, Phone } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  TooltipProvider,
} from "~/components/ui/tooltip";

interface LovablePricingSectionProps {
  isSignedIn?: boolean;
}

export const LovablePricingSection = ({ isSignedIn = false }: LovablePricingSectionProps) => {
  const plans = [
    {
      name: 'Standard',
      price: '$39',
      period: 'mo',
      description: 'Perfect for growing businesses',
      features: [
        { label: '3 campaign generations per month'},
        { label: 'Targeted ads per service'},
        { label: 'UK trade compliance built-in'},
        { label: 'Seasonal intelligence'},
        { label: 'Monthly optimization'},

      ],
      buttonText: 'Get Started',
      isPopular: false,
    },
  ];

  return (
    <TooltipProvider>
      <section className="py-32 overflow-x-hidden" style={{ backgroundColor: '#18191a' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-6 text-center">
            <h2 className="text-center text-4xl font-semibold lg:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              vs £48,000/year for agencies
            </p>
          </div>

          <div className="mt-12 sm:mt-16 lg:mt-20 flex justify-center max-w-5xl mx-auto px-4 sm:px-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={cn(
                  "w-full max-w-[400px] sm:max-w-[464px] mx-auto rounded-[24px] sm:rounded-[32px] lg:rounded-[38px] p-4 sm:p-5 lg:p-[23px] flex flex-col gap-4 sm:gap-5 lg:gap-6 shadow-2xl relative",
                  plan.isPopular && "border-2 border-blue-500/80"
                )}
                style={{
                  backgroundColor: 'oklch(20.5% 0 0)',
                  backdropFilter: 'blur(20px)',
                  border: plan.isPopular ? '2px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(75, 85, 99, 0.3)',
                }}
              >
                {/* Header */}
                <div className="relative text-center">
                  {plan.isPopular && (
                    <div className="absolute inset-x-0 -top-8 mx-auto flex h-7 w-fit items-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1 text-sm font-medium text-white shadow-lg">
                      Most Popular
                    </div>
                  )}
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold leading-[22px] sm:leading-[24px] lg:leading-[28px] text-white mb-2">
                    {plan.name}
                  </h2>
                  <p className="text-sm sm:text-sm lg:text-base text-gray-400 leading-[18px] sm:leading-[18px] lg:leading-[20px]">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div
                  className="rounded-[16px] sm:rounded-[24px] lg:rounded-[33px] px-4 sm:px-5 lg:px-[27px] py-5 sm:py-6 lg:py-[30px] flex flex-col gap-3 sm:gap-4 lg:gap-[20px]"
                  style={{
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(55, 65, 81, 0.4)',
                  }}
                >
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3 text-gray-300 hover:text-white transition-colors">
                      <Check className="text-green-400 w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                      <span className="text-sm sm:text-sm lg:text-base leading-[18px] sm:leading-[18px] lg:leading-[20px] font-medium">{f.label}</span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex flex-col px-[6px] mt-2 gap-4">
                  <div className="flex flex-col text-center">
                    <span className="text-xs sm:text-xs lg:text-sm text-gray-400 font-medium">Starting from</span>
                    <span className="text-[24px] sm:text-[28px] lg:text-[36px] font-bold leading-[28px] sm:leading-[34px] lg:leading-[42px] text-white">{plan.price}/{plan.period}</span>
                  </div>

                  {/* Button */}
                  <Button
                    asChild
                    className={cn(
                      "flex items-center justify-center w-full h-[45px] sm:h-[50px] lg:h-[60px] rounded-[20px] sm:rounded-[25px] lg:rounded-[30px] text-[14px] sm:text-[16px] lg:text-[18px] font-semibold text-white border-0 shadow-xl",
                      plan.isPopular
                        ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800"
                        : "bg-black hover:bg-gray-900",
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
            Start your 3-day free trial today · Cancel anytime
          </p>
        </div>
      </section>
    </TooltipProvider>
  );
};
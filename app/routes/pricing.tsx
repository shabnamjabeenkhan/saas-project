"use client";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { isFeatureEnabled, config } from "../../config";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Pricing() {
  if (!isFeatureEnabled("payments") || !config.ui.showPricing) {
    return null;
  }

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const getAvailablePlans = useAction(api.subscriptions.getAvailablePlans);
  const createCheckoutSession = useAction(api.subscriptions.createCheckoutSession);

  const onBuy = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch plans from Polar (respects POLAR_SERVER env var)
      const plans = await getAvailablePlans();
      
      // Get the first product's first price ID
      const product = plans?.items?.[0];
      const priceId = product?.prices?.[0]?.id;
      
      if (!priceId) {
        throw new Error("No price ID found. Please ensure you have a product configured in Polar.");
      }
      
      const checkoutUrl = await createCheckoutSession({ priceId });
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Failed to get checkout URL");
      }
    } catch (err) {
      console.error("Failed to create checkout:", err);
      setError(err instanceof Error ? err.message : "Failed to start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  const features = [
    "3 campaign regenerations per month",
    "Service-specific keywords",
    "Targeted ads for your services",
    "UK trade compliance built-in",
  ];

  return (
    <section className="py-32 overflow-x-hidden" style={{ backgroundColor: '#18191a' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* <div className="mx-auto max-w-2xl space-y-6 text-center">
          <h2 className="text-center text-4xl font-semibold lg:text-5xl">
            Standard
          </h2>
          <p className="text-muted-foreground text-lg">
            Perfect for growing businesses
          </p>
        </div> */}

        <div className="mt-12 sm:mt-16 lg:mt-20 flex justify-center max-w-5xl mx-auto px-4 sm:px-6">
          <div
            className="w-full max-w-[400px] sm:max-w-[464px] mx-auto rounded-[24px] sm:rounded-[32px] lg:rounded-[38px] p-4 sm:p-5 lg:p-[23px] flex flex-col gap-4 sm:gap-5 lg:gap-6 shadow-2xl relative"
            style={{
              backgroundColor: 'oklch(20.5% 0 0)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(75, 85, 99, 0.3)',
            }}
          >
            {/* Header */}
            <div className="relative text-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold leading-[22px] sm:leading-[24px] lg:leading-[28px] text-white mb-2">
                Standard
              </h2>
              <p className="text-sm sm:text-sm lg:text-base text-gray-400 leading-[18px] sm:leading-[18px] lg:leading-[20px]">
                Perfect for growing businesses
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
              {features.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 sm:gap-3 text-gray-300 hover:text-white transition-colors">
                  <CheckCircle2 className="text-green-400 w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-sm lg:text-base leading-[18px] sm:leading-[18px] lg:leading-[20px] font-medium">{item}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex flex-col px-[6px] mt-2 gap-4">
              <div className="flex flex-col text-center">
                <span className="text-xs sm:text-xs lg:text-sm text-gray-400 font-medium">Starting from</span>
                <span className="text-[24px] sm:text-[28px] lg:text-[36px] font-bold leading-[28px] sm:leading-[34px] lg:leading-[42px] text-white">$39/mo</span>
              </div>

              {/* Error message */}
              {error && (
                <div className="text-sm text-red-400 text-center px-2">
                  {error}
                </div>
              )}

              {/* Button */}
              <Button
                className="flex items-center justify-center w-full h-[45px] sm:h-[50px] lg:h-[60px] rounded-[20px] sm:rounded-[25px] lg:rounded-[30px] text-[14px] sm:text-[16px] lg:text-[18px] font-semibold text-white border-0 shadow-xl bg-black hover:bg-gray-900 transition-all duration-300 transform hover:scale-[1.05] hover:shadow-2xl"
                onClick={onBuy}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redirecting…</span>
                  </>
                ) : (
                  <span>Get Started</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

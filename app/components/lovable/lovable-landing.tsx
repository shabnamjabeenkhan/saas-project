import { LovableHeader } from "./header";
import { LovableHero } from "./hero";
import { LovableProblemSection } from "./problem-section";
import { LovableHowItWorksSection } from "./how-it-works-section";
import { LovablePricingSection } from "./pricing-section";
import { LovableBenefitsSection } from "./benefits-section";
import { LovableFAQSection } from "./faq-section";
import { LovableCTASection } from "./cta-section";

interface LovableLandingProps {
  isSignedIn?: boolean;
}

export const LovableLanding = ({ isSignedIn = false }: LovableLandingProps) => {
  return (
    <div className="min-h-screen">
      <LovableHeader isSignedIn={isSignedIn} />
      <main>
        <LovableHero />
        <LovableProblemSection />
        <div id="how-it-works">
          <LovableHowItWorksSection />
        </div>
        <div id="benefits">
          <LovableBenefitsSection />
        </div>
        <div id="pricing">
          <LovablePricingSection />
        </div>
        <div id="faq">
          <LovableFAQSection />
        </div>
        <LovableCTASection />
      </main>
    </div>
  );
};
import { LovableHeader } from "./header";
import { LovableHero } from "./hero";
import { LovableProblemSection } from "./problem-section";
import { LovableHowItWorksSection } from "./how-it-works-section";
import { LovablePricingSection } from "./pricing-section";
import { LovableBenefitsSection } from "./benefits-section";
import { LovableCTASection } from "./cta-section";

export const LovableLanding = () => {
  return (
    <div className="min-h-screen">
      <LovableHeader />
      <main>
        <LovableHero />
        <LovableProblemSection />
        <div id="how-it-works">
          <LovableHowItWorksSection />
        </div>
        <div id="pricing">
          <LovablePricingSection />
        </div>
        <div id="benefits">
          <LovableBenefitsSection />
        </div>
        <LovableCTASection />
      </main>
    </div>
  );
};
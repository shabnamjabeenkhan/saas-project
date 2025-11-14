import { LovableHeader } from "./header";
import { LovableHero } from "./hero";
import { DashboardPreview } from "./dashboard-preview";
import { LovableProblemSection } from "./problem-section";
import { LovableHowItWorksSection } from "./how-it-works-section";
import { LovablePricingSection } from "./pricing-section";
import { LovableBenefitsSection } from "./benefits-section";
import { LovableFAQSection } from "./faq-section";
import { LovableCTASection } from "./cta-section";

interface LovableLandingProps {
  isSignedIn?: boolean;
  user?: any;
}

export const LovableLanding = ({ isSignedIn = false, user }: LovableLandingProps) => {
  return (
    <div className="min-h-screen">
      <LovableHeader isSignedIn={isSignedIn} user={user} />
      <main>
        <LovableHero isSignedIn={isSignedIn} />
        <DashboardPreview />
        <LovableProblemSection />
        <div id="how-it-works">
          <LovableHowItWorksSection />
        </div>
        <div id="benefits">
          <LovableBenefitsSection />
        </div>
        <div id="pricing">
          <LovablePricingSection isSignedIn={isSignedIn} />
        </div>
        <div id="faq">
          <LovableFAQSection />
        </div>
        <LovableCTASection isSignedIn={isSignedIn} />
      </main>
    </div>
  );
};
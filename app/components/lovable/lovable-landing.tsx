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

        {/* Video Demo Section */}
        <section id="demo" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Watch TradeBoost AI In Action</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how easy it is to set up high-converting Google Ads campaigns in minutes, not hours.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-lg overflow-hidden shadow-2xl bg-black">
                <video
                  className="w-full h-auto"
                  controls
                  preload="metadata"
                  poster="/demo-thumbnail.jpg"
                >
                  <source src="/tradeboost.mp4" type="video/mp4" />
                  <source src="/tradeboost.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

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
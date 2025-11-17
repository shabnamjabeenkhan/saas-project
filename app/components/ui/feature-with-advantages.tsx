import { Check } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { HoverEffect } from "~/components/ui/hover-effect";

function Feature() {
  return (
    <div className="w-full py-20">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 flex-col items-center text-center mb-16">
          <div>
            <Badge>What You Get</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-4xl font-bold">
              Professional marketing power without the professional price tag
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Everything you need to dominate your local market
            </p>
          </div>
        </div>
        <div className="flex gap-10 pt-12 flex-col w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="flex flex-row gap-6 w-full items-start">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Predictable Lead Flow</p>
                <p className="text-muted-foreground text-sm">
                  Replace unreliable word-of-mouth with steady, qualified leads every month
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Save Massive Time</p>
                <p className="text-muted-foreground text-sm">
                  5-minute setup vs weeks learning Google Ads. Focus on actual jobs, not marketing
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Track Real Results</p>
                <p className="text-muted-foreground text-sm">
                  See exactly how many calls, jobs, and revenue your ads generate. Full ROI visibility
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 w-full items-start">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Seasonal Automation</p>
                <p className="text-muted-foreground text-sm">
                  AI automatically ramps up boiler campaigns in winter, AC in summer. No manual work
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Local Search Dominance</p>
                <p className="text-muted-foreground text-sm">
                  Appear in Google when people search 'emergency plumber near me' in your area
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">4 Targeted Ads Per Campaign</p>
                <p className="text-muted-foreground text-sm">
                  Emergency customers see emergency ads, boiler customers see boiler ads. Perfect targeting automatically
                </p>
              </div>
            </div>
            <div className="flex flex-row gap-6 items-start">
              <Check className="w-4 h-4 mt-2 text-primary" />
              <div className="flex flex-col gap-1">
                <p className="font-semibold">Cross-Sell Services</p>
                <p className="text-muted-foreground text-sm">
                  Multi-trade businesses can promote both plumbing AND electrical to the same customers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI vs Manual Comparison Section */}
        <div className="mt-20 pt-16">
          <div className="mt-16 pt-12">
            <div className="text-center mb-8">
              <h3 className="text-xl md:text-2xl font-bold mb-3">
                Why TradeBoost AI Beats Manual Ad Creation
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Stop wasting weeks learning Google Ads. Get expert-level campaigns in minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Manual Way */}
              <div className="rounded-lg p-6" style={{backgroundColor: "#3d1a1a", border: "1px solid #5a2d2d"}}>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-red-900 font-bold">✗</span>
                  </div>
                  <h4 className="font-semibold text-lg text-white">Manual Ad Creation</h4>
                </div>
                <ul className="space-y-2 text-sm text-red-100">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span><strong>6-11 hours</strong> per campaign setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span><strong>Weeks learning</strong> Google Ads complexity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span><strong>Generic keywords</strong> like "plumber london"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span><strong>Compliance guesswork</strong> - risk £5k+ fines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span><strong>Constant optimization</strong> needed manually</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span><strong>Miss seasonal opportunities</strong> (winter heating surge)</span>
                  </li>
                </ul>
              </div>

              {/* AI Way */}
              <div className="rounded-lg p-6" style={{backgroundColor: "#1a3b2e", border: "1px solid #2d5a47"}}>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-900 font-bold">✓</span>
                  </div>
                  <h4 className="font-semibold text-lg text-white">TradeBoost AI</h4>
                </div>
                <ul className="space-y-2 text-sm text-green-100">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>8 minutes</strong> total setup time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Zero learning curve</strong> - instant expert campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Intent-based keywords</strong> "emergency gas safe engineer"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Built-in compliance</strong> - Gas Safe, Part P automatic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Self-optimizing</strong> campaigns improve automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span><strong>Seasonal intelligence</strong> - auto-boost winter heating ads</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom highlight */}
            <div className="mt-8 text-center rounded-lg p-6 max-w-3xl mx-auto" style={{backgroundColor: "#0b0a15", border: "1px solid rgba(75, 85, 99, 0.3)"}}>
              <div className="font-semibold text-lg text-white mb-2">
                The Result: Expert-level ads in minutes, not weeks
              </div>
              <div className="text-sm text-gray-400">
                While competitors spend days creating basic campaigns, you're already generating leads with
                AI-optimized ads that include 30+ targeted keywords and full UK trade compliance.
              </div>
            </div>

            {/* Smart Keyword Targeting Section */}
            <div className="mt-16 pt-12 border-t border-border">
              <div className="text-center mb-10">
                <h3 className="text-xl md:text-2xl font-bold mb-3">
                  4 Targeted Ads Per Campaign = 4x More Customer Coverage
                </h3>
                <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
                  Each campaign creates 4 specialized ads targeting different customer needs. When someone searches "boiler repair near me" at 11pm, they see your boiler-focused ad. When someone searches "emergency plumber", they see your emergency-focused ad. Same business, perfect targeting.
                </p>
              </div>

              {/* 4 Ads Example */}
              <div className="mb-12 max-w-6xl mx-auto">
                <h4 className="font-semibold text-xl mb-6 text-center text-white">
                  How Your 4 Ads Target Different Customer Types
                </h4>
                <HoverEffect
                  items={[
                    {
                      title: "Emergency Customer",
                      description: "24/7 Emergency Plumber - Gas Safe Registered - No Call Out Fee",
                      icon: <span className="text-2xl">🚨</span>
                    },
                    {
                      title: "Boiler Customer",
                      description: "Boiler Repair Experts - Gas Safe Certified - Same Day Service",
                      icon: <span className="text-2xl">🔧</span>
                    },
                    {
                      title: "Leak Customer",
                      description: "Leak Detection Experts - Fast Leak Repairs - No Damage Promise",
                      icon: <span className="text-2xl">💧</span>
                    },
                    {
                      title: "Maintenance Customer",
                      description: "Plumbing Maintenance - Preventive Service - System Optimization",
                      icon: <span className="text-2xl">🔄</span>
                    }
                  ]}
                />
                <div className="text-center mt-6">
                  <div className="text-sm font-medium text-white">
                    Same Business Info + Same Phone Number + 4 Different Messages = Perfect Customer Targeting
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
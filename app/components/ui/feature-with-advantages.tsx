import { Check } from "lucide-react";
import { Badge } from "~/components/ui/badge";

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
                <p className="font-semibold">Cross-Sell Services</p>
                <p className="text-muted-foreground text-sm">
                  Multi-trade businesses can promote both plumbing AND electrical to the same customers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Generation Details Section */}
        <div className="mt-20 pt-16 border-t border-border">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              AI-Generated Campaign Structure
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Every campaign is automatically optimized with 3-4 targeted ad groups, 30+ high-intent keywords, and UK compliance built-in
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚨</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Emergency Services</h4>
              <p className="text-sm text-muted-foreground mb-3">
                24/7 urgent repairs, burst pipes, power outages
              </p>
              <div className="text-xs text-muted-foreground">
                <div className="font-medium mb-1">Keywords include:</div>
                <div>"emergency plumber", "24/7 electrician", "urgent repair", "weekend callout"</div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Installation Services</h4>
              <p className="text-sm text-muted-foreground mb-3">
                New boilers, bathroom fitting, rewiring, upgrades
              </p>
              <div className="text-xs text-muted-foreground">
                <div className="font-medium mb-1">Keywords include:</div>
                <div>"boiler installation", "bathroom fitting", "house rewiring", "new electrical"</div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Testing & Maintenance</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Safety checks, certificates, boiler servicing
              </p>
              <div className="text-xs text-muted-foreground">
                <div className="font-medium mb-1">Keywords include:</div>
                <div>"electrical testing", "boiler service", "gas safety check", "PAT testing"</div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Specialized Work</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Smart homes, solar, underfloor heating, commercial
              </p>
              <div className="text-xs text-muted-foreground">
                <div className="font-medium mb-1">Keywords include:</div>
                <div>"smart home wiring", "solar installation", "commercial plumbing", "underfloor heating"</div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-muted/50 rounded-lg p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">3-4</div>
                <div className="text-sm font-medium mb-1">Ad Groups</div>
                <div className="text-xs text-muted-foreground">Targeted themes for different services</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">30+</div>
                <div className="text-sm font-medium mb-1">Keywords</div>
                <div className="text-xs text-muted-foreground">High-intent local search terms</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm font-medium mb-1">UK Compliant</div>
                <div className="text-xs text-muted-foreground">Gas Safe, Part P, trade regulations</div>
              </div>
            </div>
          </div>

          {/* AI vs Manual Comparison Section */}
          <div className="mt-16 pt-12 border-t border-border">
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-red-600 font-bold">✗</span>
                  </div>
                  <h4 className="font-semibold text-lg text-red-800">Manual Ad Creation</h4>
                </div>
                <ul className="space-y-2 text-sm text-red-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span><strong>6-11 hours</strong> per campaign setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span><strong>Weeks learning</strong> Google Ads complexity</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span><strong>Generic keywords</strong> like "plumber london"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span><strong>Compliance guesswork</strong> - risk £5k+ fines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span><strong>Constant optimization</strong> needed manually</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span><strong>Miss seasonal opportunities</strong> (winter heating surge)</span>
                  </li>
                </ul>
              </div>

              {/* AI Way */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <h4 className="font-semibold text-lg text-green-800">TradeBoost AI</h4>
                </div>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>8 minutes</strong> total setup time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>Zero learning curve</strong> - instant expert campaigns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>Intent-based keywords</strong> "emergency gas safe engineer"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>Built-in compliance</strong> - Gas Safe, Part P automatic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>Self-optimizing</strong> campaigns improve automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span><strong>Seasonal intelligence</strong> - auto-boost winter heating ads</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom highlight */}
            <div className="mt-8 text-center bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
              <div className="font-semibold text-lg text-gray-900 mb-2">
                The Result: Expert-level ads in minutes, not weeks
              </div>
              <div className="text-sm text-gray-600">
                While competitors spend days creating basic campaigns, you're already generating leads with
                AI-optimized ads that include 30+ targeted keywords and full UK trade compliance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };
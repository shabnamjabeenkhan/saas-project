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
      </div>
    </div>
  );
}

export { Feature };
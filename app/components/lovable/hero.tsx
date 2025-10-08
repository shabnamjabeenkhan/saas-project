import { Button } from "~/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export const LovableHero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-block">
              <span className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                Save £40,000/year on marketing
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              AI-Powered Google Ads for UK{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Plumbers & Electricians
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop paying £4,000/month to marketing agencies. Answer 5 simple questions and let AI generate high-converting Google Ads campaigns in minutes.
            </p>

            <div className="space-y-3 max-w-xl mx-auto">
              <div className="flex items-center gap-3 justify-center">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">No marketing experience needed</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">5-minute setup, not weeks learning</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Predictable leads year-round</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
              <Button size="lg" className="group">
                Start Free Trial
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline">
                See How It Works
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              From £69/month · No contracts · Cancel anytime
            </p>

            <div className="relative mt-8 flex justify-center">
              <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
                <p className="text-3xl font-bold text-primary">£828/year</p>
                <p className="text-sm text-muted-foreground">vs £48,000 for agencies</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
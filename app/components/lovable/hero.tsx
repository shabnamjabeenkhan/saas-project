import { Button } from "~/components/ui/button";
import { ArrowRight, CheckCircle, Wrench } from "lucide-react";

export const LovableHero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="container mx-auto px-4 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
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

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
              Stop paying £4,000/month to marketing agencies. Answer 5 simple questions and let AI generate high-converting Google Ads campaigns in minutes.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">No marketing experience needed</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">5-minute setup, not weeks learning</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">Predictable leads year-round</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
          </div>

          <div className="relative lg:ml-8">
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <div className="w-full h-96 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Wrench className="h-16 w-16 text-primary mx-auto" />
                  <p className="text-muted-foreground">Professional tradesman at work</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-card p-6 rounded-xl shadow-lg border border-border hidden lg:block">
              <p className="text-3xl font-bold text-primary">£828/year</p>
              <p className="text-sm text-muted-foreground">vs £48,000 for agencies</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
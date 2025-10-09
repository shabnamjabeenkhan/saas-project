import { Button } from "~/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router";

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

            <h1 className="text-4xl tracking-tighter font-geist md:text-6xl leading-tight">
              Stop Wasting £4,000/Month — Let{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                AI Get You More Customers
              </span>
            </h1>

            <p className="text-lg md:text-xl font-normal text-gray-300 max-w-2xl mx-auto">
              AI builds and manages your Google Ads automatically — more leads, less spend, zero marketing experience needed.
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

            <div className="flex justify-center pt-4">
              <Button asChild size="lg" className="group">
                <Link to="/sign-up">
                  Sign Up
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              From £69/month · No contracts · Cancel anytime
            </p>

          </div>
        </div>
      </div>
    </section>
  );
};
import { Button } from "~/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export const LovableCTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
            Ready to Stop Wasting Money on Marketing?
          </h2>

          <p className="text-lg md:text-xl text-primary-foreground/90">
            Join UK tradespeople getting predictable leads for a fraction of agency costs
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" variant="secondary" className="group shadow-lg">
              Start Your Free Trial
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
              Book a Demo
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6 text-primary-foreground/90">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
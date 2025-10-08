import { Button } from "~/components/ui/button";
import { Wrench } from "lucide-react";

export const LovableHeader = () => {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Wrench className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              TradeBoost AI
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-black hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-black hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#benefits" className="text-black hover:text-primary transition-colors">
              Benefits
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Sign In
            </Button>
            <Button variant="default">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
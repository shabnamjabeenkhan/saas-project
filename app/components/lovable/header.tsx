import { Button } from "~/components/ui/button";
import { Wrench } from "lucide-react";
import { Link } from "react-router";

interface LovableHeaderProps {
  isSignedIn?: boolean;
}

export const LovableHeader = ({ isSignedIn = false }: LovableHeaderProps) => {
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
            <Link to="/" className="text-black hover:text-primary transition-colors">
              Home
            </Link>
            <a href="#how-it-works" className="text-black hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="text-black hover:text-primary transition-colors">
              Benefits
            </a>
            <a href="#pricing" className="text-black hover:text-primary transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {!isSignedIn ? (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex">
                  <Link to="/sign-in">Login</Link>
                </Button>
                <Button asChild variant="default">
                  <Link to="/sign-up">Sign Up</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="default">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
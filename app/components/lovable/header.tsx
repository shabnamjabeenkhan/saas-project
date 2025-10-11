import { Button } from "~/components/ui/button";
import { Link } from "react-router";

interface LovableHeaderProps {
  isSignedIn?: boolean;
}

export const LovableHeader = ({ isSignedIn = false }: LovableHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm shadow-card" style={{ backgroundColor: 'rgba(36, 37, 38, 0.7)' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              TradeBoost AI
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-white hover:text-primary transition-colors">
              Home
            </Link>
            <a href="#how-it-works" className="text-white hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="text-white hover:text-primary transition-colors">
              Benefits
            </a>
            <a href="#pricing" className="text-white hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-white hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {!isSignedIn ? (
              <>
                <Button asChild variant="default" className="hidden sm:inline-flex bg-blue-500 text-white hover:bg-blue-500">
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
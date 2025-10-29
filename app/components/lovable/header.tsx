import { Button } from "~/components/ui/button";
import { Link } from "react-router";

interface LovableHeaderProps {
  isSignedIn?: boolean;
}

export const LovableHeader = ({ isSignedIn = false }: LovableHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              TradeBoost AI
            </span>
          </div>

          <div className="flex items-center gap-8 ml-88">
            <nav className="hidden md:flex items-center gap-8 -ml-6">
              <Link to="/" className="text-sm text-[#a1a1aa] hover:text-primary transition-colors">
                Home
              </Link>
              <a href="#how-it-works" className="text-sm text-[#a1a1aa] hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#benefits" className="text-sm text-[#a1a1aa] hover:text-primary transition-colors">
                Benefits
              </a>
              <a href="#pricing" className="text-sm text-[#a1a1aa] hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-[#a1a1aa] hover:text-primary transition-colors">
                FAQ
              </a>
            </nav>

            <div className="flex items-center gap-3 ml-16">
            {!isSignedIn ? (
              <>
                <Button asChild variant="default" size="sm" className="hidden sm:inline-flex bg-white text-black hover:bg-gray-100">
                  <Link to="/sign-in">Login</Link>
                </Button>
                <Button asChild variant="default" size="sm" className="hover:bg-gray-800 text-white">
                  <Link to="/sign-up">Sign Up</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
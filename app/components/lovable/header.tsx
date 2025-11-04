import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface LovableHeaderProps {
  isSignedIn?: boolean;
}

export const LovableHeader = ({ isSignedIn = false }: LovableHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              TradeBoost AI
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-6 xl:gap-8 ml-8">
            <Link to="/" className="text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap">
              Home
            </Link>
            <a href="#how-it-works" className="text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap">
              How It Works
            </a>
            <a href="#benefits" className="text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap">
              Benefits
            </a>
            <a href="#pricing" className="text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap">
              Pricing
            </a>
            <a href="#faq" className="text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap">
              FAQ
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden xl:flex items-center gap-2">
            {!isSignedIn ? (
              <>
                <Button asChild variant="ghost" size="sm" className="text-sm">
                  <Link to="/sign-in">Login</Link>
                </Button>
                <Button asChild variant="default" size="sm" className="text-sm whitespace-nowrap">
                  <Link to="/sign-up">Sign Up</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="xl:hidden p-2 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-secondary/50 flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="xl:hidden absolute top-16 left-0 right-0 bg-card/98 backdrop-blur-sm border-b border-border shadow-lg z-40">
            <nav className="container mx-auto px-4 py-6">
              <div className="flex flex-col space-y-2">
                <Link
                  to="/"
                  className="text-foreground hover:text-primary transition-colors py-3 px-2 border-b border-border/50 text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <a
                  href="#how-it-works"
                  className="text-foreground hover:text-primary transition-colors py-3 px-2 border-b border-border/50 text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a
                  href="#benefits"
                  className="text-foreground hover:text-primary transition-colors py-3 px-2 border-b border-border/50 text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Benefits
                </a>
                <a
                  href="#pricing"
                  className="text-foreground hover:text-primary transition-colors py-3 px-2 border-b border-border/50 text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  className="text-foreground hover:text-primary transition-colors py-3 px-2 border-b border-border/50 text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  FAQ
                </a>
                <div className="flex flex-col gap-3 pt-6">
                  {!isSignedIn ? (
                    <>
                      <Button asChild variant="ghost" className="w-full justify-start text-base py-3">
                        <Link to="/sign-in">Login</Link>
                      </Button>
                      <Button asChild variant="default" className="w-full text-base py-3">
                        <Link to="/sign-up">Sign Up</Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild variant="default" className="w-full text-base py-3">
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                  )}
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
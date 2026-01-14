import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { UserMenu } from "~/components/ui/user-menu";

interface LovableHeaderProps {
  isSignedIn?: boolean;
  user?: any;
}

export const LovableHeader = ({ isSignedIn = false, user }: LovableHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent text-white">
              TradeBoost AI
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-6 xl:gap-8 ml-8">
            <Link to="/" className="text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap">
              Home
            </Link>
            <a href="#demo" className="text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap">
              Demo
            </a>
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
          <div className="hidden xl:flex items-center gap-3">
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
              <>
                <Button asChild variant="default" size="sm" className="text-sm whitespace-nowrap">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <UserMenu user={user} />
              </>
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
          <div className="xl:hidden fixed inset-0 z-50" style={{ backgroundColor: '#18191a' }}>
            <nav className="flex flex-col h-full">
              {/* Close button */}
              <div className="flex justify-end p-6">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:text-primary transition-colors p-2"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 space-y-8">
                <Link
                  to="/"
                  className="text-white hover:text-primary transition-colors text-2xl font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <a
                  href="#demo"
                  className="text-white hover:text-primary transition-colors text-2xl font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Demo
                </a>
                <a
                  href="#how-it-works"
                  className="text-white hover:text-primary transition-colors text-2xl font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a
                  href="#benefits"
                  className="text-white hover:text-primary transition-colors text-2xl font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Benefits
                </a>
                <a
                  href="#pricing"
                  className="text-white hover:text-primary transition-colors text-2xl font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a
                  href="#faq"
                  className="text-white hover:text-primary transition-colors text-2xl font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  FAQ
                </a>
              </div>
              <div className="px-8 pb-12 space-y-4">
                {!isSignedIn ? (
                  <>
                    <Button asChild className="w-full bg-white text-black hover:bg-gray-100 text-lg py-6 h-auto font-medium">
                      <Link to="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                    </Button>
                    <Button asChild className="w-full bg-primary text-white hover:bg-primary/90 text-lg py-6 h-auto font-medium">
                      <Link to="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild className="w-full bg-primary text-white hover:bg-primary/90 text-lg py-6 h-auto font-medium">
                      <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                    </Button>
                    <div className="flex justify-center pt-4">
                      <UserMenu variant="sidebar" user={user} />
                    </div>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
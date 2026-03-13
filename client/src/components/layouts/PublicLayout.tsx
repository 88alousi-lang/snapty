import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * PublicLayout - Layout for public pages (no authentication required)
 * 
 * Features:
 * - Simple header with logo and navigation
 * - Links to login and signup
 * - Mobile-friendly hamburger menu
 * - No user context required
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div
            className="text-2xl font-bold text-primary cursor-pointer"
            onClick={() => setLocation("/")}
          >
            Snapty
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setLocation("/for-clients")}
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              For Clients
            </button>
            <button
              onClick={() => setLocation("/for-photographers")}
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              For Photographers
            </button>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/login")}
            >
              Login
            </Button>
            <Button
              onClick={() => setLocation("/signup")}
            >
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <button
                onClick={() => {
                  setLocation("/for-clients");
                  setMobileMenuOpen(false);
                }}
                className="text-foreground/70 hover:text-foreground transition-colors text-left"
              >
                For Clients
              </button>
              <button
                onClick={() => {
                  setLocation("/for-photographers");
                  setMobileMenuOpen(false);
                }}
                className="text-foreground/70 hover:text-foreground transition-colors text-left"
              >
                For Photographers
              </button>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setLocation("/login");
                    setMobileMenuOpen(false);
                  }}
                >
                  Login
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    setLocation("/signup");
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Up
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-foreground/60 text-sm">
          <p>&copy; 2026 Snapty. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

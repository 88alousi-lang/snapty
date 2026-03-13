import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Home,
  Calendar,
  ShoppingCart,
  DollarSign,
  CreditCard,
  BookOpen,
  User,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";
import { useState } from "react";

interface PhotographerLayoutProps {
  children: ReactNode;
}

/**
 * PhotographerLayout - Layout for photographer pages
 * 
 * Features:
 * - Sidebar navigation with photographer menu items
 * - Mobile-friendly hamburger menu
 * - Active route highlighting
 * - User profile dropdown
 * - Logout functionality
 */
export function PhotographerLayout({ children }: PhotographerLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { label: "Dashboard", icon: Home, path: "/photographer/dashboard" },
    { label: "Calendar", icon: Calendar, path: "/photographer/calendar" },
    { label: "Bookings", icon: ShoppingCart, path: "/photographer/bookings" },
    { label: "Earnings", icon: DollarSign, path: "/photographer/earnings" },
    { label: "Payouts", icon: CreditCard, path: "/photographer/payouts" },
    { label: "Guidelines", icon: BookOpen, path: "/photographer/guidelines" },
    { label: "Profile", icon: User, path: "/photographer/profile" },
    { label: "Settings", icon: Settings, path: "/photographer/settings" },
    { label: "Notifications", icon: Bell, path: "/photographer/notifications" },
  ];

  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-background/50">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <h1
            className="text-2xl font-bold text-primary cursor-pointer"
            onClick={() => setLocation("/photographer/dashboard")}
          >
            Snapty
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-background hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-foreground/60">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-foreground/70 hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between border-b border-border bg-background/95 p-4 sticky top-0 z-50">
        <h1
          className="text-xl font-bold text-primary cursor-pointer"
          onClick={() => setLocation("/photographer/dashboard")}
        >
          Snapty
        </h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 p-4 space-y-2 max-h-[calc(100vh-60px)] overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  setLocation(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-background hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-foreground/70 hover:text-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

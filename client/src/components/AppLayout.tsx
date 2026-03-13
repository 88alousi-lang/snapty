import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Home, Calendar, User, Inbox, DollarSign, ArrowLeft, MapPin } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  showHeader?: boolean;
  headerTitle?: string;
  headerAction?: ReactNode;
  onHeaderBack?: () => void;
}

/**
 * App-style layout with bottom tab navigation for mobile
 * Similar to Uber/Airbnb mobile apps
 */
export default function AppLayout({
  children,
  showBottomNav = true,
  showHeader = true,
  headerTitle,
  headerAction,
  onHeaderBack,
}: AppLayoutProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  // Determine if user is photographer based on role
  const isPhotographer = user?.role === "photographer";

  // Client navigation tabs
  const clientTabs = [
    { label: "Home", icon: Home, path: "/client/home" },
    { label: "Bookings", icon: Calendar, path: "/client/bookings" },
    { label: "Map", icon: MapPin, path: "/client/map" },
    { label: "Profile", icon: User, path: "/client/profile" },
  ];

  // Photographer navigation tabs
  const photographerTabs = [
    { label: "Dashboard", icon: Home, path: "/photographer" },
    { label: "Requests", icon: Inbox, path: "/photographer/requests" },
    { label: "Earnings", icon: DollarSign, path: "/photographer/earnings" },
    { label: "Profile", icon: User, path: "/photographer/profile" },
  ];

  const tabs = isPhotographer ? photographerTabs : clientTabs;

  const isActive = (path: string) => {
    if (path === "/photographer") return location === "/photographer";
    if (path === "/client/home") return location === "/client/home";
    return location.startsWith(path);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      {showHeader && (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {onHeaderBack && (
                <button
                  onClick={onHeaderBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              {headerTitle ? (
                <h1 className="text-lg font-semibold text-gray-900">
                  {headerTitle}
                </h1>
              ) : (
                <span className="text-lg font-bold text-blue-600">Snapty</span>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="flex justify-around items-center h-16 max-w-md mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                    active
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("w-6 h-6", active && "fill-blue-100")} />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

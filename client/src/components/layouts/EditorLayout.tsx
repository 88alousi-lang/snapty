import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Menu, X, Home, FolderOpen, CheckCircle2, Bell, LogOut, Palette,
} from "lucide-react";

interface EditorLayoutProps {
  children: ReactNode;
}

export function EditorLayout({ children }: EditorLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { label: "Dashboard", icon: Home, path: "/editor/dashboard" },
    { label: "My Projects", icon: FolderOpen, path: "/editor/projects" },
    { label: "Completed", icon: CheckCircle2, path: "/editor/completed" },
    { label: "Notifications", icon: Bell, path: "/editor/notifications" },
  ];

  const isActive = (path: string) => location.startsWith(path);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-background/50">
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          <h1
            className="text-2xl font-bold text-primary cursor-pointer"
            onClick={() => setLocation("/editor/dashboard")}
          >
            Snapty Editor
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
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
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-border p-4 space-y-3">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-foreground/60">{user?.email}</p>
            <span className="inline-block mt-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Editor
            </span>
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
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-primary cursor-pointer" onClick={() => setLocation("/editor/dashboard")}>
            Snapty Editor
          </h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background/95 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => { setLocation(item.path); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="border-t border-border pt-4 mt-4">
            <Button variant="ghost" className="w-full justify-start gap-2 text-foreground/70" onClick={handleLogout}>
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

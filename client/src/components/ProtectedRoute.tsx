import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export type UserRole = "admin" | "photographer" | "editor" | "user" | null;

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredRoles?: UserRole[];
  fallbackPath?: string;
}

/**
 * ProtectedRoute component for role-based access control
 * 
 * Usage:
 * <Route path="/admin" component={(props) => <ProtectedRoute component={AdminDashboard} requiredRoles={["admin"]} {...props} />} />
 * 
 * Features:
 * - Checks user authentication
 * - Verifies user has required role
 * - Redirects unauthorized users to /login
 * - Redirects wrong roles to appropriate dashboard
 */
export function ProtectedRoute({
  component: Component,
  requiredRoles = [],
  fallbackPath = "/login",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // If no user, redirect to login
    if (!user) {
      setLocation(fallbackPath);
      return;
    }

    // If roles are specified, check if user has required role
    if (requiredRoles.length > 0) {
      const userRole = user.role as UserRole;
      
      if (!requiredRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        switch (userRole) {
          case "admin":
            setLocation("/admin");
            break;
          case "photographer":
            setLocation("/photographer/dashboard");
            break;
          case "editor":
            setLocation("/editor/dashboard");
            break;
          case "user":
            setLocation("/client");
            break;
          default:
            setLocation(fallbackPath);
        }
        return;
      }
    }
  }, [user, loading, requiredRoles, setLocation, fallbackPath]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  // If not authenticated, show nothing (will redirect)
  if (!user) {
    return null;
  }

  // If roles are specified and user doesn't have required role, show nothing (will redirect)
  if (requiredRoles.length > 0) {
    const userRole = user.role as UserRole;
    if (!requiredRoles.includes(userRole)) {
      return null;
    }
  }

  // User is authenticated and has required role, render component
  return <Component />;
}

/**
 * Helper function to wrap a component with role protection
 * 
 * Usage:
 * <Route path="/admin" component={withRoleProtection(AdminDashboard, ["admin"])} />
 */
export function withRoleProtection(
  Component: React.ComponentType<any>,
  requiredRoles: UserRole[] = [],
  fallbackPath: string = "/login"
) {
  return () => (
    <ProtectedRoute
      component={Component}
      requiredRoles={requiredRoles}
      fallbackPath={fallbackPath}
    />
  );
}

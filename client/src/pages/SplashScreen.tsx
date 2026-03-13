import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Camera } from "lucide-react";

/**
 * Splash screen shown on app launch
 * Redirects to appropriate screen based on auth state and user role
 * Also handles role intent from onboarding (stored in localStorage)
 */
export default function SplashScreen() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const setRoleMutation = trpc.auth.setRole.useMutation({
    onSuccess: async (data) => {
      await utils.auth.me.invalidate();
      if (data.role === "photographer") {
        navigate("/photographer/onboarding");
      } else {
        navigate("/client/home");
      }
    },
    onError: () => {
      if (user?.role === "photographer") {
        navigate("/photographer");
      } else if (user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/client/home");
      }
    },
  });

  useEffect(() => {
    if (loading) return;
    if (setRoleMutation.isPending) return;

    if (!user) {
      navigate("/onboarding");
      return;
    }

    // Check if there's a role intent from onboarding
    const roleIntent = localStorage.getItem("snapty_role_intent") as "user" | "photographer" | null;

    if (roleIntent && user.role !== roleIntent && user.role !== "admin") {
      localStorage.removeItem("snapty_role_intent");
      setRoleMutation.mutate({ role: roleIntent });
      return;
    }

    // Clear any stale role intent
    localStorage.removeItem("snapty_role_intent");

    // Navigate based on existing role
    if (user.role === "photographer") {
      navigate("/photographer");
    } else if (user.role === "editor") {
      navigate("/editor/dashboard");
    } else if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/client/home");
    }
  }, [loading, user, navigate, setRoleMutation.isPending]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-600 to-blue-700">
      <div className="text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-white rounded-full p-6 shadow-2xl">
            <Camera className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* App Name */}
        <div>
          <h1 className="text-4xl font-bold text-white">Snapty</h1>
          <p className="text-blue-100 text-sm mt-2">
            Professional Photography On Demand
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </div>
  );
}

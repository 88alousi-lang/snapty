import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Loader2 } from "lucide-react";
import { PublicLayout } from "@/components/layouts/PublicLayout";

/**
 * Login page that redirects to OAuth portal
 * Handles query parameters like ?from_webdev=1
 */
export default function Login() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to OAuth login URL
    window.location.href = getLoginUrl();
  }, []);

  return (
    <PublicLayout>
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="animate-spin text-primary w-8 h-8 mx-auto" />
        <p className="text-lg text-foreground">Redirecting to login...</p>
      </div>
    </div>
    </PublicLayout>
  );
}

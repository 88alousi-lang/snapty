import { useState } from "react";
import { Camera, Briefcase, ArrowRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

type OnboardingStep = "role" | "features" | "cta";

/**
 * Onboarding flow for new users
 * Shows role selection (Client vs Photographer) and app features
 * Stores role intent in localStorage before redirecting to OAuth login
 */
export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>("role");
  const [roleIntent, setRoleIntent] = useState<"user" | "photographer">("user");

  const handleRoleSelect = (role: "user" | "photographer") => {
    setRoleIntent(role);
    setStep("features");
  };

  const handleClientSignup = () => {
    localStorage.setItem("snapty_role_intent", "user");
    window.location.href = getLoginUrl();
  };

  const handlePhotographerSignup = () => {
    localStorage.setItem("snapty_role_intent", "photographer");
    window.location.href = getLoginUrl();
  };

  const handleLogin = () => {
    localStorage.removeItem("snapty_role_intent");
    window.location.href = getLoginUrl();
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header with Back Button */}
      {step !== "role" && (
        <div className="flex items-center px-4 py-3 border-b border-gray-200">
          <button
            onClick={() => setStep("role")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {step === "role" && (
          <div className="w-full max-w-md space-y-6">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 rounded-full p-4">
                  <Camera className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Snapty</h1>
              <p className="text-gray-600 text-sm mt-2">
                Professional Photography On Demand
              </p>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <p className="text-center text-gray-700 font-semibold mb-6">
                What brings you here?
              </p>

              {/* Client Button */}
              <button
                onClick={() => handleRoleSelect("user")}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <Camera className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">I Need Photos</p>
                    <p className="text-sm text-gray-600">
                      Book a photographer
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
              </button>

              {/* Photographer Button */}
              <button
                onClick={() => handleRoleSelect("photographer")}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-600 hover:bg-blue-50 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">I'm a Photographer</p>
                    <p className="text-sm text-gray-600">
                      Accept bookings
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
              </button>
            </div>
          </div>
        )}

        {step === "features" && (
          <div className="w-full max-w-md space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              {roleIntent === "photographer" ? "Join as a Photographer" : "Why Snapty?"}
            </h2>

            <div className="space-y-4">
              {[
                {
                  icon: "⚡",
                  title: "Fast & Easy",
                  desc: "Book in minutes, get photos delivered fast",
                },
                {
                  icon: "⭐",
                  title: "Vetted Professionals",
                  desc: "All photographers are verified and rated",
                },
                {
                  icon: "🗺️",
                  title: "Nearby Photographers",
                  desc: "Find photographers near your property",
                },
                {
                  icon: "💳",
                  title: "Secure Payment",
                  desc: "Pay safely inside the app",
                },
              ].map((feature, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">{feature.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {feature.title}
                    </p>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep("cta")}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Continue
            </Button>
          </div>
        )}

        {step === "cta" && (
          <div className="w-full max-w-md space-y-6 text-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ready to get started?
              </h2>
              <p className="text-gray-600">
                Create your account to book photographers or accept bookings
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleClientSignup}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Sign Up as Client
              </Button>
              <Button
                onClick={handlePhotographerSignup}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Sign Up as Photographer
              </Button>
            </div>

            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button onClick={handleLogin} className="text-blue-600 font-semibold hover:underline">
                Log in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

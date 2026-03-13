import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Shield, AlertCircle, CheckCircle2, Clock, 
  Link2, CreditCard, Home, BarChart3, Bell, User,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    connected: {
      label: "Connected",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    pending_verification: {
      label: "Pending Verification",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: <Clock className="w-4 h-4" />,
    },
    not_connected: {
      label: "Not Connected",
      className: "bg-gray-50 text-gray-700 border-gray-200",
      icon: <AlertCircle className="w-4 h-4" />,
    },
  };

  const { label, className, icon } = statusMap[status] || statusMap.not_connected;

  return (
    <div className={cn("inline-flex items-center gap-1 border px-3 py-1.5 rounded-full text-xs font-semibold", className)}>
      {icon}
      {label}
    </div>
  );
}

/**
 * Main payout settings page
 */
export default function PhotographerPayoutSettings() {
  const [, navigate] = useLocation();
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data
  const statusQuery = trpc.payoutSettings.getStatus.useQuery();
  const createConnectMutation = trpc.payoutSettings.createConnectAccount.useMutation({
    onSuccess: () => {
      toast.success("Stripe Connect account created! Redirecting to onboarding...");
      setShowConnectForm(false);
      setEmail("");
      setName("");
      statusQuery.refetch();
      // In production, redirect to Stripe onboarding URL
      setTimeout(() => {
        window.open("https://connect.stripe.com/express/onboarding", "_blank");
      }, 1000);
    },
    onError: (err) => toast.error(err.message),
  });

  const status = statusQuery.data;

  const handleConnectBank = async () => {
    if (!email || !name) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createConnectMutation.mutateAsync({ email, name });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PhotographerLayout>
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/photographer/earnings")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-gray-900">Payout Settings</h1>
              <p className="text-xs text-gray-500">Manage your bank account</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/photographer/profile")}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold"
          >
            P
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-6 space-y-6 pb-20">
        {/* Connection Status Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600">Connection Status</p>
            <div className="flex items-center justify-between">
              <StatusBadge status={status?.stripeConnectStatus || "not_connected"} />
              {status?.stripeConnectStatus === "connected" && (
                <p className="text-xs text-green-700 font-semibold">✓ Ready for payouts</p>
              )}
            </div>
          </div>
        </div>

        {/* Bank Account Summary */}
        {status?.stripeConnectStatus === "connected" && status?.bankAccountName && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900">Bank Account</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <p className="text-xs text-gray-600">Bank Name</p>
                <p className="text-sm font-semibold text-gray-900">{status.bankAccountName}</p>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <p className="text-xs text-gray-600">Account Ending In</p>
                <p className="text-sm font-semibold text-gray-900">
                  {status.bankAccountLast4 ? `••••${status.bankAccountLast4}` : "N/A"}
                </p>
              </div>
              <div className="flex items-center justify-between py-2">
                <p className="text-xs text-gray-600">Payout Schedule</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">
                  {status.payoutSchedule || "Daily"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connect Bank Account Section */}
        {status?.stripeConnectStatus === "not_connected" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="space-y-2">
              <h2 className="text-sm font-extrabold text-gray-900">Connect Bank Account</h2>
              <p className="text-xs text-gray-600">
                To receive payouts, you need to connect your bank account through Stripe.
              </p>
            </div>

            {!showConnectForm ? (
              <button
                onClick={() => setShowConnectForm(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Link2 className="w-5 h-5" />
                Connect Bank Account
              </button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConnectForm(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConnectBank}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Connecting..." : "Continue"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Verification */}
        {status?.stripeConnectStatus === "pending_verification" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-2">
            <div className="flex gap-2">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-yellow-900">Verification in Progress</p>
                <p className="text-xs text-yellow-700">
                  Your bank account is being verified. This usually takes 1-2 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Change Bank Account Button */}
        {status?.stripeConnectStatus === "connected" && (
          <button className="w-full px-4 py-2.5 border border-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            Change Bank Account
          </button>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <div className="flex gap-2">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-blue-900">Secure Payouts Powered by Stripe</p>
              <p className="text-xs text-blue-700">
                Your bank account information is securely encrypted and processed by Stripe, a PCI-DSS compliant payment processor.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-2">
          <button
            onClick={() => navigate("/photographer/earnings")}
            className="w-full px-4 py-2.5 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors text-sm"
          >
            ← Back to Earnings
          </button>
          <button
            onClick={() => navigate("/photographer")}
            className="w-full px-4 py-2.5 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
    </PhotographerLayout>
  );
}

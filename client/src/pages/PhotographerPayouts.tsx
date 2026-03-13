import { useState } from "react";
import { useLocation } from "wouter";
import {
  DollarSign, TrendingUp, Clock, Bell, User, Home, Calendar,
  BarChart3, CreditCard, ArrowRight, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";

/**
 * Balance card component
 */
function BalanceCard({
  icon: Icon,
  label,
  amount,
  subtext,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  amount: string;
  subtext?: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 p-4 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <p className="text-2xl font-extrabold text-gray-900">${amount}</p>
      {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
    </div>
  );
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending: {
      label: "Pending",
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: <Clock className="w-4 h-4" />,
    },
    processing: {
      label: "Processing",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    completed: {
      label: "Completed",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: <AlertCircle className="w-4 h-4" />,
    },
  };

  const { label, className, icon } = statusMap[status] || statusMap.pending;

  return (
    <div className={cn("inline-flex items-center gap-1 border px-2 py-1 rounded-full text-xs font-semibold", className)}>
      {icon}
      {label}
    </div>
  );
}

/**
 * Bottom navigation component
 */
function BottomNav({ active }: { active: string }) {
  const [, navigate] = useLocation();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/photographer/dashboard" },
    { id: "bookings", label: "Bookings", icon: Calendar, path: "/photographer/bookings" },
    { id: "calendar", label: "Calendar", icon: Calendar, path: "/photographer/calendar" },
    { id: "earnings", label: "Earnings", icon: BarChart3, path: "/photographer/earnings" },
    { id: "payouts", label: "Payouts", icon: CreditCard, path: "/photographer/payouts" },
    { id: "profile", label: "Profile", icon: User, path: "/photographer/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 flex justify-around overflow-x-auto">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg transition-colors whitespace-nowrap text-xs",
            active === item.id
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <item.icon className="w-4 h-4" />
          <span className="font-semibold text-[10px]">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Main payouts page
 */
export default function PhotographerPayouts() {
  const [, navigate] = useLocation();
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe_connect");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const HISTORY_PAGE_SIZE = 10;

  // Fetch data
  const balancesQuery = trpc.payouts.getBalances.useQuery();
  const historyQuery = trpc.payouts.getHistory.useQuery();
  const requestPayoutMutation = trpc.payouts.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Payout request submitted successfully!");
      setShowWithdrawalForm(false);
      setWithdrawalAmount("");
      setPaymentMethod("stripe_connect");
      balancesQuery.refetch();
      historyQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const balances = balancesQuery.data;
  const allHistory = historyQuery.data ?? [];
  const history = allHistory.slice(historyPage * HISTORY_PAGE_SIZE, (historyPage + 1) * HISTORY_PAGE_SIZE);
  const historyTotalPages = Math.ceil(allHistory.length / HISTORY_PAGE_SIZE);

  const handleRequestPayout = async () => {
    if (!withdrawalAmount || !paymentMethod) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount < 50) {
      toast.error("Minimum payout amount is $50");
      return;
    }

    if (balances && amount > parseFloat(balances.availableBalance)) {
      toast.error("Payout amount exceeds available balance");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPayoutMutation.mutateAsync({
        amount,
        paymentMethod,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PhotographerLayout>
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-gray-900">Payouts</h1>
            <p className="text-xs text-gray-500">Manage your withdrawals</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate("/photographer/profile")}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold"
            >
              P
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-6 space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 gap-3">
          <BalanceCard
            icon={DollarSign}
            label="Available Balance"
            amount={balances?.availableBalance || "0.00"}
            subtext="Ready to withdraw"
          />
          <BalanceCard
            icon={Clock}
            label="Pending Balance"
            amount={balances?.pendingBalance || "0.00"}
            subtext="Processing"
          />
          <BalanceCard
            icon={TrendingUp}
            label="Lifetime Earnings"
            amount={balances?.lifetimeEarnings || "0.00"}
            subtext="All time"
          />
        </div>

        {/* Request Payout Button */}
        <button
          onClick={() => setShowWithdrawalForm(!showWithdrawalForm)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-4 rounded-2xl transition-all flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Request Payout
        </button>

        {/* Withdrawal Form */}
        {showWithdrawalForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <h2 className="text-sm font-extrabold text-gray-900">Request Payout</h2>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Payout Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-600 font-bold">$</span>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="0.00"
                  min="50"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <p className="text-xs text-gray-500">Minimum: $50 | Available: ${balances?.availableBalance || "0.00"}</p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="stripe_connect">Stripe Connect</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawalForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        )}

        {/* Payout History */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900">Payout History</h2>
          <div className="space-y-2">
            {historyQuery.isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : history.length > 0 ? (
              history.map((payout: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-900">${Number(payout.amount || 0).toFixed(2)}</p>
                      <StatusBadge status={payout.status || 'pending'} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : 'N/A'} • {payout.paymentMethod || 'N/A'}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">No payouts yet</p>
            )}
          </div>
          {/* Pagination */}
          {historyTotalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Page {historyPage + 1} of {historyTotalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryPage(p => p - 1)}
                  disabled={historyPage === 0}
                  className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setHistoryPage(p => p + 1)}
                  disabled={historyPage >= historyTotalPages - 1}
                  className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Minimum Payout Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-blue-900">Minimum Payout Amount</p>
              <p className="text-xs text-blue-700">You must have at least $50 available to request a payout.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <BottomNav active="payouts" />
    </div>
    </PhotographerLayout>
  );
}

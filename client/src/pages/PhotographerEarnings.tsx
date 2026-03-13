import { useState } from "react";
import { useLocation } from "wouter";
import {
  DollarSign, TrendingUp, CheckCircle2, Clock, Bell, User,
  Home, Calendar, BarChart3, Settings, LogOut,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";

/**
 * Summary card component
 */
function SummaryCard({
  icon: Icon,
  label,
  value,
  subtext,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtext?: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 p-4 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
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
    { id: "profile", label: "Profile", icon: User, path: "/photographer/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-around">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className={cn(
            "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
            active === item.id
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-xs font-semibold">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Main earnings dashboard page
 */
export default function PhotographerEarnings() {
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [payoutsPage, setPayoutsPage] = useState(0);
  const PAYOUTS_PAGE_SIZE = 10;

  // Redirect if not a photographer
  if (!user || user.role !== "photographer") {
    return (
    <PhotographerLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
      </PhotographerLayout>
  );
  }

  // Fetch earnings data
  const summaryQuery = trpc.earnings.getSummary.useQuery();
  const trendQuery = trpc.earnings.getMonthlyTrend.useQuery();
  const payoutsQuery = trpc.earnings.getRecentPayouts.useQuery();
  const serviceQuery = trpc.earnings.getByService.useQuery();
  const upcomingQuery = trpc.earnings.getUpcomingPayouts.useQuery();

  const summary = summaryQuery.data;
  const trend = trendQuery.data ?? [];
  const allPayouts = payoutsQuery.data ?? [];
  const payouts = allPayouts.slice(payoutsPage * PAYOUTS_PAGE_SIZE, (payoutsPage + 1) * PAYOUTS_PAGE_SIZE);
  const payoutsTotalPages = Math.ceil(allPayouts.length / PAYOUTS_PAGE_SIZE);
  const serviceBreakdown = serviceQuery.data ?? [];
  const upcoming = upcomingQuery.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-gray-900">Earnings</h1>
            <p className="text-xs text-gray-500">Track your photography income</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigate("/photographer/profile")}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold"
            >
              {user?.name?.charAt(0) || "P"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            icon={DollarSign}
            label="Total Earnings"
            value={`$${summary?.totalEarnings || "0.00"}`}
            subtext="All time"
          />
          <SummaryCard
            icon={TrendingUp}
            label="This Month"
            value={`$${summary?.monthlyEarnings || "0.00"}`}
            subtext="Current month"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Completed"
            value={String(summary?.completedBookings || "0")}
            subtext="Bookings"
          />
          <SummaryCard
            icon={Clock}
            label="Pending"
            value={String(summary?.pendingPayouts || "0")}
            subtext="Awaiting payout"
          />
        </div>

        {/* Monthly Earnings Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900">Monthly Earnings Trend</h2>
          <div className="space-y-3">
            {trend.length > 0 ? (
              trend.map((item) => {
                const maxEarnings = Math.max(...trend.map((t) => t.earnings || 0), 1);
                const percentage = ((item.earnings || 0) / maxEarnings) * 100;
                return (
                  <div key={item.month} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-600">{item.month}</p>
                      <p className="text-xs font-bold text-gray-900">${(item.earnings || 0).toFixed(2)}</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">No earnings data yet</p>
            )}
          </div>
        </div>

        {/* Recent Payouts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900">Recent Payouts</h2>
          <div className="space-y-2">
            {payoutsQuery.isLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : payouts.length > 0 ? (
              payouts.map((payout, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-900">{payout.booking?.bookingCode}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payout.transaction?.createdAt || "").toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold text-green-600">
                    +${Number(payout.transaction?.amount || 0).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">No payouts yet</p>
            )}
          </div>
          {/* Pagination */}
          {payoutsTotalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Page {payoutsPage + 1} of {payoutsTotalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPayoutsPage(p => p - 1)}
                  disabled={payoutsPage === 0}
                  className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPayoutsPage(p => p + 1)}
                  disabled={payoutsPage >= payoutsTotalPages - 1}
                  className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Earnings by Service */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900">Earnings by Service</h2>
          <div className="space-y-3">
            {serviceBreakdown.length > 0 ? (
              serviceBreakdown.map((service, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-600">{service.serviceName}</p>
                    <p className="text-xs font-bold text-gray-900">${Number(service.totalEarnings || 0).toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-gray-500">{service.bookingCount} bookings</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">No service breakdown available</p>
            )}
          </div>
        </div>

        {/* Upcoming Payouts */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <h2 className="text-sm font-extrabold text-gray-900">Upcoming Payouts</h2>
          <div className="space-y-2">
            {upcoming.length > 0 ? (
              upcoming.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-900">{item.booking?.bookingCode}</p>
                    <p className="text-xs text-gray-500">
                      Completed on {item.booking?.updatedAt ? new Date(item.booking.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">No upcoming payouts</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <BottomNav active="earnings" />
    </div>
  );
}

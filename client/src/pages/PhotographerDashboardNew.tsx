import { useState } from "react";
import { useLocation } from "wouter";
import {
  Calendar, Clock, DollarSign, Image, Plus, Star, TrendingUp, Upload, X,
  CheckCircle2, AlertCircle, MapPin, Camera, Home, Inbox, User, LogOut,
  Settings, Bell, ChevronRight, Check, XCircle, Eye, BookOpen,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";

type TabValue = "dashboard" | "bookings" | "calendar" | "earnings" | "guidelines" | "profile";

const BOTTOM_TABS: { value: TabValue; label: string; icon: React.ElementType }[] = [
  { value: "dashboard", label: "Dashboard", icon: Home },
  { value: "bookings", label: "Bookings", icon: Inbox },
  { value: "calendar", label: "Calendar", icon: Calendar },
  { value: "earnings", label: "Earnings", icon: DollarSign },
  { value: "guidelines", label: "Guidelines", icon: BookOpen },
  { value: "profile", label: "Profile", icon: User },
];

/* ─── Status badge ────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:     { label: "Pending", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    accepted:    { label: "Confirmed", cls: "bg-green-50 text-green-700 border-green-200" },
    in_progress: { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    completed:   { label: "Completed", cls: "bg-gray-50 text-gray-700 border-gray-200" },
    rejected:    { label: "Rejected", cls: "bg-red-50 text-red-700 border-red-200" },
    cancelled:   { label: "Cancelled", cls: "bg-red-50 text-red-700 border-red-200" },
  };
  const { label, cls } = map[status] || { label: status, cls: "bg-gray-50 text-gray-700 border-gray-200" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border", cls)}>
      {label}
    </span>
  );
}

/* ─── Summary card ────────────────────────────────────────────── */
function SummaryCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─── Booking request card ────────────────────────────────────── */
function BookingRequestCard({ booking, clientName, onAccept, onReject, onView }: any) {
  const totalPrice = parseFloat(String(booking.totalPrice ?? 0));
  const payout = totalPrice * 0.75; // 75% to photographer

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Booking Code</p>
          <p className="text-sm font-extrabold text-gray-900">{booking.bookingCode}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">{clientName || "Client"}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 truncate">{booking.propertyAddress}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">
            {new Date(booking.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
            {new Date(booking.scheduledDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Estimated Payout</p>
          <p className="text-lg font-extrabold text-green-600">${payout.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onReject(booking.id)}
            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => onAccept(booking.id)}
            className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onView(booking.bookingCode)}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Upcoming booking card ───────────────────────────────────── */
function UpcomingBookingCard({ booking, clientName, onView, onStart }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">Booking Code</p>
          <p className="text-sm font-extrabold text-gray-900">{booking.bookingCode}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 truncate">{booking.propertyAddress}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">
            {new Date(booking.scheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ·{" "}
            {new Date(booking.scheduledDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700 font-medium">{clientName || "Client"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onView(booking.bookingCode)}
          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>
        <button
          onClick={() => onStart(booking.id)}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <Camera className="w-4 h-4" />
          Start Job
        </button>
      </div>
    </div>
  );
}

/* ─── Main dashboard ──────────────────────────────────────────── */
export default function PhotographerDashboardNew() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState<TabValue>("dashboard");

  const profileQuery = trpc.photographers.getMyProfile.useQuery(undefined, {
    enabled: user?.role === "photographer",
    retry: false,
  });
  const bookingsQuery = trpc.bookings.getMyBookings.useQuery(undefined, {
    enabled: user?.role === "photographer",
  });
  const notificationsQuery = trpc.notifications.getUnread.useQuery(undefined, {
    enabled: user?.role === "photographer",
  });

  const updateStatusMutation = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      bookingsQuery.refetch();
      toast.success("Booking updated");
    },
    onError: (err) => toast.error(err.message),
  });

  type PhotographerBookingItem = {
    booking: {
      id: number; bookingCode: string; clientId: number; photographerId: number | null;
      propertyAddress: string; propertyType: string | null; propertySize: number | null;
      scheduledDate: Date; status: string; paymentStatus: string; totalPrice: string;
      duration: number | null; specialInstructions: string | null;
      createdAt: Date; updatedAt: Date;
    };
    clientName: string | null;
    clientEmail: string | null;
  };

  const rawBookings = (bookingsQuery.data || []) as PhotographerBookingItem[];
  const photographer = profileQuery.data?.photographer;
  const portfolio = profileQuery.data?.portfolio || [];
  const notifications = notificationsQuery.data || [];

  const pendingRequests = rawBookings.filter((b) => b.booking.status === "pending");
  const upcomingBookings = rawBookings.filter((b) => ["accepted", "in_progress"].includes(b.booking.status));
  const completedBookings = rawBookings.filter((b) => b.booking.status === "completed");

  const totalEarnings = completedBookings.reduce((sum, b) => sum + parseFloat(b.booking.totalPrice || "0"), 0) * 0.75;
  const thisMonthEarnings = completedBookings
    .filter((b) => {
      const d = new Date(b.booking.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + parseFloat(b.booking.totalPrice || "0"), 0) * 0.75;

  const handleAccept = (bookingId: number) => updateStatusMutation.mutate({ bookingId, status: "accepted" });
  const handleReject = (bookingId: number) => updateStatusMutation.mutate({ bookingId, status: "rejected" });
  const handleStart = (bookingId: number) => updateStatusMutation.mutate({ bookingId, status: "in_progress" });

  const needsSetup = user?.role === "photographer" && !profileQuery.isLoading && !photographer;

  return (
    <PhotographerLayout>
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">Photographer Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            )}
            <button
              onClick={() => logout().then(() => navigate("/"))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {needsSetup ? (
        <div className="max-w-2xl mx-auto w-full px-4 py-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center space-y-4">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
              <p className="text-gray-600 text-sm mt-1">Set up your photographer profile to start accepting bookings</p>
            </div>
            <button
              onClick={() => navigate("/photographer/onboarding")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl w-full transition-colors"
            >
              Set Up Profile
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
          {/* ── Dashboard tab ── */}
          {selectedTab === "dashboard" && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard icon={Calendar} label="Upcoming" value={upcomingBookings.length} color="bg-blue-600" />
                <SummaryCard icon={AlertCircle} label="Pending" value={pendingRequests.length} color="bg-yellow-600" />
                <SummaryCard icon={DollarSign} label="This Month" value={`$${thisMonthEarnings.toFixed(0)}`} color="bg-green-600" />
                <SummaryCard icon={Star} label="Rating" value={(photographer as any)?.rating ? (photographer as any).rating.toFixed(1) : "4.9"} color="bg-purple-600" />
              </div>

              {/* Pending requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-extrabold text-gray-900">Pending Booking Requests</h2>
                  <div className="space-y-3">
                    {pendingRequests.map((item) => (
                      <BookingRequestCard
                        key={item.booking.id}
                        booking={item.booking}
                        clientName={item.clientName}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        onView={(code: string) => navigate(`/photographer/booking/${code}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming bookings */}
              {upcomingBookings.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-extrabold text-gray-900">Upcoming Bookings</h2>
                  <div className="space-y-3">
                    {upcomingBookings.map((item) => (
                      <UpcomingBookingCard
                        key={item.booking.id}
                        booking={item.booking}
                        clientName={item.clientName}
                        onView={(code: string) => navigate(`/photographer/booking/${code}`)}
                        onStart={handleStart}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="space-y-3">
                <h2 className="text-sm font-extrabold text-gray-900">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-white hover:bg-gray-50 border border-gray-100 rounded-xl py-3 font-bold text-sm text-gray-900 transition-colors">
                    Update Profile
                  </button>
                  <button className="bg-white hover:bg-gray-50 border border-gray-100 rounded-xl py-3 font-bold text-sm text-gray-900 transition-colors">
                    Manage Services
                  </button>
                  <button className="bg-white hover:bg-gray-50 border border-gray-100 rounded-xl py-3 font-bold text-sm text-gray-900 transition-colors">
                    Upload Photos
                  </button>
                  <button className="bg-white hover:bg-gray-50 border border-gray-100 rounded-xl py-3 font-bold text-sm text-gray-900 transition-colors">
                    View Calendar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Bookings tab ── */}
          {selectedTab === "bookings" && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900">All Bookings</h2>
              {rawBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rawBookings.map((item) => (
                    <div key={item.booking.id} className="bg-white rounded-xl border border-gray-100 p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-gray-900">{item.booking.bookingCode}</p>
                        <StatusBadge status={item.booking.status} />
                      </div>
                      <p className="text-sm text-gray-600">{item.booking.propertyAddress}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Calendar tab ── */}
          {selectedTab === "calendar" && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900">Availability & Calendar</h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-4">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="text-gray-600 font-medium">Calendar view coming soon</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full transition-colors">
                  Update Availability
                </button>
              </div>
            </div>
          )}

          {/* ── Earnings tab ── */}
          {selectedTab === "earnings" && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900">Earnings</h2>
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 font-medium">Total Earnings</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">${totalEarnings.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500 font-medium">This Month</p>
                  <p className="text-2xl font-extrabold text-green-600 mt-1">${thisMonthEarnings.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Guidelines tab ── */}
          {selectedTab === "guidelines" && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900">Photography Guidelines</h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                <div>
                  <p className="text-gray-700 font-medium mb-3">Learn best practices for real estate photography</p>
                  <p className="text-sm text-gray-600 mb-4">Our comprehensive guidelines cover 20 essential topics including lighting, composition, staging, and more.</p>
                </div>
                <button
                  onClick={() => window.location.href = '/photographer/guidelines'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  View Guidelines
                </button>
              </div>
            </div>
          )}

          {/* ── Profile tab ── */}
          {selectedTab === "profile" && (
            <div className="space-y-4">
              <h2 className="text-sm font-extrabold text-gray-900">Profile</h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Name</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{user?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{user?.email || "—"}</p>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors mt-4">
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom navigation */}
      {!needsSetup && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-around">
            {BOTTOM_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSelectedTab(tab.value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors",
                    isActive
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </PhotographerLayout>
  );
}

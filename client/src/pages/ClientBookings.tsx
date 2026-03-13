import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Calendar, MapPin, Camera, Loader2, Home, ChevronRight,
  Zap, Video, Layers, Clock, User, CreditCard, ChevronLeft,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ClientLayout } from "@/components/layouts/ClientLayout";
import { Button } from "@/components/ui/button";

/* ─── Service icon ────────────────────────────────────────────── */
function ServiceIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("drone")) return <Zap className="w-3.5 h-3.5 text-violet-500" />;
  if (n.includes("video")) return <Video className="w-3.5 h-3.5 text-rose-500" />;
  if (n.includes("floor")) return <Layers className="w-3.5 h-3.5 text-amber-500" />;
  return <Camera className="w-3.5 h-3.5 text-blue-500" />;
}

/* ─── Status badge ────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:     { label: "Pending",     cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    accepted:    { label: "Confirmed",   cls: "bg-green-50  text-green-700  border-green-200"  },
    in_progress: { label: "In Progress", cls: "bg-blue-50   text-blue-700   border-blue-200"   },
    completed:   { label: "Completed",   cls: "bg-gray-50   text-gray-700   border-gray-200"   },
    cancelled:   { label: "Cancelled",   cls: "bg-red-50    text-red-700    border-red-200"     },
    rejected:    { label: "Rejected",    cls: "bg-red-50    text-red-700    border-red-200"     },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-50 text-gray-700 border-gray-200" };
  return (
    <span className={cn("text-xs font-bold border px-2.5 py-1 rounded-full capitalize", cls)}>
      {label}
    </span>
  );
}

/* ─── Booking card ────────────────────────────────────────────── */
function BookingCard({
  booking,
  services,
  onClick,
}: {
  booking: any;
  services: any[];
  onClick: () => void;
}) {
  const totalPrice = parseFloat(String(booking.totalPrice ?? 0));

  const formatDate = (d: string | Date | null) => {
    if (!d) return "TBD";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const formatTime = (d: string | Date | null) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all"
    >
      {/* Header: code + status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-0.5">Booking Code</p>
          <p className="text-sm font-extrabold text-gray-900">{booking.bookingCode}</p>
        </div>
        <StatusBadge status={booking.status ?? "pending"} />
      </div>

      {/* Photographer */}
      <div className="flex items-center gap-2 mb-2">
        <User className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-sm text-gray-600 font-medium">
          {booking.photographerName ?? "Photographer assigned"}
        </span>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {services.slice(0, 3).map((svc: any, idx: number) => {
            const name = svc.service?.name ?? svc.name ?? "Service";
            return (
              <div key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                <ServiceIcon name={name} />
                {name.split(" ")[0]}
              </div>
            );
          })}
          {services.length > 3 && (
            <span className="text-xs text-gray-400 font-medium">+{services.length - 3} more</span>
          )}
        </div>
      )}

      {/* Address */}
      <div className="flex items-start gap-2 mb-2">
        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-600 line-clamp-1">{booking.propertyAddress}</p>
      </div>

      {/* Date & time */}
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-sm text-gray-600">
          {formatDate(booking.scheduledDate)} · {formatTime(booking.scheduledDate)}
        </span>
      </div>

      {/* Footer: total + arrow */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </button>
  );
}

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

/* ─── Main page ───────────────────────────────────────────────── */
export default function ClientBookings() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);

  const bookingsQuery = trpc.bookings.getMyBookings.useQuery(
    undefined,
    { enabled: !!user }
  );

  const allBookings = bookingsQuery.data ?? [];

  // Apply status filter
  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return allBookings;
    return allBookings.filter((item: any) => item.booking?.status === statusFilter);
  }, [allBookings, statusFilter]);

  // Apply pagination
  const paginatedBookings = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredBookings.slice(start, start + PAGE_SIZE);
  }, [filteredBookings, page]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);

  const bookings = paginatedBookings;

  /* ── Split into upcoming and past ── */
  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const up: any[] = [];
    const p: any[] = [];

    for (const booking of bookings) {
      const bookingDate = booking.booking?.scheduledDate ? new Date(booking.booking.scheduledDate) : null;
      if (bookingDate && bookingDate > now) {
        up.push(booking);
      } else {
        p.push(booking);
      }
    }

    // Sort upcoming by date ascending, past by date descending
    up.sort((a, b) => {
      const aDate = new Date(a.booking?.scheduledDate ?? 0);
      const bDate = new Date(b.booking?.scheduledDate ?? 0);
      return aDate.getTime() - bDate.getTime();
    });

    p.sort((a, b) => {
      const aDate = new Date(a.booking?.scheduledDate ?? 0);
      const bDate = new Date(b.booking?.scheduledDate ?? 0);
      return bDate.getTime() - aDate.getTime();
    });

    return { upcoming: up, past: p };
  }, [bookings]);

  if (!user) {
    return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Camera className="w-14 h-14 text-gray-200" />
        <p className="text-gray-600 font-semibold text-lg">Please log in to view your bookings</p>
      </div>
      </ClientLayout>
  );
  }

  if (bookingsQuery.isLoading) {
    return (
      <ClientLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </ClientLayout>
    );
  }

  const hasBookings = upcoming.length > 0 || past.length > 0;

  return (
    <ClientLayout>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-base font-extrabold text-gray-900">My Bookings</h1>
          {/* Status filter pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(0); }}
                className={cn(
                  "flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                  statusFilter === f.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-10">
        {/* Empty state */}
        {!hasBookings && (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">No bookings yet</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Start by finding a photographer and booking a shoot.
            </p>
            <button
              onClick={() => navigate("/client/property-details")}
              className="flex items-center gap-2 text-white font-bold bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-200"
            >
              <Calendar className="w-4 h-4" />
              Book a Photographer
            </button>
          </div>
        )}

        {/* Upcoming bookings */}
        {upcoming.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-extrabold text-gray-900 mb-3">Upcoming</h2>
            <div className="space-y-3">
              {upcoming.map((item: any) => (
                <BookingCard
                  key={item.booking.id}
                  booking={item.booking}
                  services={item.services ?? []}
                  onClick={() => navigate(`/client/booking-details/${item.booking.bookingCode}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past bookings */}
        {past.length > 0 && (
          <div>
            <h2 className="text-sm font-extrabold text-gray-900 mb-3">Past</h2>
            <div className="space-y-3">
              {past.map((item: any) => (
                <BookingCard
                  key={item.booking.id}
                  booking={item.booking}
                  services={item.services ?? []}
                  onClick={() => navigate(`/client/booking-details/${item.booking.bookingCode}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="max-w-2xl mx-auto px-4 pb-6 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {page + 1} of {totalPages} · {filteredBookings.length} bookings
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-3 h-3" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </ClientLayout>
  );
}

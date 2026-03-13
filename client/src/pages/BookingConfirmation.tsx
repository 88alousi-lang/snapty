import { useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  CheckCircle2, Calendar, MapPin, Camera, Home, Loader2,
  User, CreditCard, Zap, Video, Layers, Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useBooking } from "@/contexts/BookingContext";
import { cn } from "@/lib/utils";

/* ─── Service icon ────────────────────────────────────────────── */
function ServiceIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("drone")) return <Zap className="w-4 h-4 text-violet-500" />;
  if (n.includes("video")) return <Video className="w-4 h-4 text-rose-500" />;
  if (n.includes("floor")) return <Layers className="w-4 h-4 text-amber-500" />;
  return <Camera className="w-4 h-4 text-blue-500" />;
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
    <span className={cn("text-xs font-bold border px-3 py-1.5 rounded-full capitalize", cls)}>
      {label}
    </span>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function BookingConfirmation() {
  const [, navigate] = useLocation();
  const { resetBooking } = useBooking();

  const [matchClient, paramsClient] = useRoute("/client/booking-confirmation/:bookingCode");
  const [matchLegacy, paramsLegacy] = useRoute("/booking-confirmation/:bookingCode");
  const [matchSummary, paramsSummary] = useRoute("/client/booking-summary/:bookingCode");

  const bookingCode =
    paramsClient?.bookingCode ??
    paramsLegacy?.bookingCode ??
    paramsSummary?.bookingCode ??
    null;

  const isValidCode = !!bookingCode && !bookingCode.startsWith(":") && bookingCode.length > 3;

  const bookingQuery = trpc.bookings.getByCode.useQuery(
    { code: bookingCode ?? "" },
    { enabled: isValidCode, retry: false }
  );

  const booking = bookingQuery.data?.booking;
  const services = bookingQuery.data?.services ?? [];
  const photographerName = bookingQuery.data?.photographerName ?? null;
  const photographerImage = bookingQuery.data?.photographerImage ?? null;

  const totalPrice = parseFloat(String(booking?.totalPrice ?? 0));

  const handleGoHome = useCallback(() => {
    resetBooking();
    navigate("/client/home");
  }, [resetBooking, navigate]);

  const formatDate = (d: string | Date | null) => {
    if (!d) return "TBD";
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  };

  const formatTime = (d: string | Date | null) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  if (!matchClient && !matchLegacy && !matchSummary) return null;

  /* ── No valid code ── */
  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Camera className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">No Booking Selected</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Complete the booking flow to reach this page.
        </p>
        <button
          onClick={() => navigate("/client/home")}
          className="flex items-center gap-2 text-white font-bold bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-200"
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
      </div>
    );
  }

  /* ── Loading ── */
  if (bookingQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* ── Not found / error ── */
  if (!booking || bookingQuery.isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Camera className="w-8 h-8 text-red-300" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">Booking Not Found</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          We couldn't find this booking. It may have been cancelled or the link is invalid.
        </p>
        <button
          onClick={() => navigate("/client/home")}
          className="flex items-center gap-2 text-white font-bold bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-200"
        >
          <Home className="w-4 h-4" />
          Go Home
        </button>
      </div>
    );
  }

  /* ── Success screen ── */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-base font-extrabold text-gray-900">Booking Confirmed</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-10 space-y-4">

        {/* ── Success hero ── */}
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 shadow-md shadow-green-100">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 text-center">Payment Successful!</h2>
          <p className="text-gray-500 text-sm text-center mt-2 max-w-xs">
            Your booking is confirmed. The photographer will be in touch shortly.
          </p>
        </div>

        {/* ── Booking reference card ── */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider mb-1">Booking Reference</p>
              <p className="text-2xl font-extrabold tracking-widest">{booking.bookingCode}</p>
            </div>
            <StatusBadge status={booking.status ?? "pending"} />
          </div>

          <div className="space-y-2 text-sm">
            {/* Photographer */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 opacity-70" />
              <span className="opacity-90 font-medium">
                {photographerName ?? "Photographer assigned"}
              </span>
            </div>

            {/* Address */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 opacity-70" />
              <span className="opacity-90 truncate">{booking.propertyAddress}</span>
            </div>

            {/* Date & time */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 opacity-70" />
              <span className="opacity-90">
                {formatDate(booking.scheduledDate)} · {formatTime(booking.scheduledDate)}
              </span>
            </div>

            {/* Total paid */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/20">
              <CreditCard className="w-4 h-4 opacity-70" />
              <span className="font-extrabold">${totalPrice.toFixed(2)} paid</span>
            </div>
          </div>
        </div>

        {/* ── Services ── */}
        {services.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
            <h3 className="text-sm font-extrabold text-gray-900 mb-3">Services Booked</h3>
            <div className="space-y-2">
              {services.map((svc: any) => {
                const name = svc.service?.name ?? svc.name ?? "Service";
                const price = parseFloat(String(svc.price ?? svc.service?.basePrice ?? 0));
                return (
                  <div key={svc.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ServiceIcon name={name} />
                      <span className="text-sm text-gray-700 font-medium">{name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">${price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Property details ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Property Details</h3>

          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-800">{booking.propertyAddress}</p>
              {(booking.propertyType || booking.propertySize) && (
                <p className="text-xs text-gray-400 capitalize mt-0.5">
                  {booking.propertyType}
                  {booking.propertySize ? ` · ${Number(booking.propertySize).toLocaleString()} sqft` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-800">{formatDate(booking.scheduledDate)}</p>
              <p className="text-xs text-gray-400">{formatTime(booking.scheduledDate)}</p>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <button
          onClick={() => navigate("/client/bookings")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-colors"
        >
          <Calendar className="w-5 h-5" />
          View My Bookings
        </button>

        <button
          onClick={handleGoHome}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>

        <p className="text-center text-xs text-gray-400">
          A confirmation has been recorded. The photographer will confirm your booking within 2 hours.
        </p>
      </div>
    </div>
  );
}

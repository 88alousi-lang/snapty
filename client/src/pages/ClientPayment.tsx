import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Camera, Calendar, MapPin, User, Shield, Lock,
  AlertCircle, Loader2, CreditCard, Home, Zap, Video, Layers,
  Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { loadStripe } from "@stripe/stripe-js";
import { ClientLayout } from "@/components/layouts/ClientLayout";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

/* ─── Stripe init ─────────────────────────────────────────────── */
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "");

/* ─── Service icon ────────────────────────────────────────────── */
function ServiceIcon({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  const n = name.toLowerCase();
  if (n.includes("drone")) return <Zap className={cn(cls, "text-violet-500")} />;
  if (n.includes("video")) return <Video className={cn(cls, "text-rose-500")} />;
  if (n.includes("floor")) return <Layers className={cn(cls, "text-amber-500")} />;
  return <Camera className={cn(cls, "text-blue-500")} />;
}

/* ─── Inner Stripe form ───────────────────────────────────────── */
function StripePayForm({
  bookingId,
  bookingCode,
  totalPrice,
  onSuccess,
}: {
  bookingId: number;
  bookingCode: string;
  totalPrice: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isPaying, setIsPaying] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const updatePayment = trpc.bookings.updatePaymentStatus.useMutation({
    onSuccess: () => onSuccess(),
    onError: () => onSuccess(), // payment succeeded on Stripe — still redirect
  });

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setIsPaying(true);
    setCardError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/client/booking-confirmation/${bookingCode}`,
        receipt_email: user?.email ?? undefined,
      },
      redirect: "if_required",
    });

    if (error) {
      setCardError(error.message ?? "Payment failed. Please try again.");
      setIsPaying(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      updatePayment.mutate({
        bookingId,
        paymentStatus: "completed",
        stripePaymentIntentId: paymentIntent.id,
      });
    } else {
      setCardError("Payment incomplete. Please try again.");
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
          fields: { billingDetails: { name: "auto" } },
        }}
      />

      {cardError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{cardError}</p>
        </div>
      )}

      {/* Secure message */}
      <div className="flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-400 font-medium">Secure payment powered by Stripe</span>
        <Shield className="w-3.5 h-3.5 text-gray-400" />
      </div>

      {/* Pay Now */}
      <button
        onClick={handlePay}
        disabled={isPaying || !stripe || !elements}
        className={cn(
          "w-full font-extrabold text-base py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg",
          isPaying || !stripe
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-200"
        )}
      >
        {isPaying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            Pay Now — ${totalPrice.toFixed(2)}
          </>
        )}
      </button>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function ClientPayment() {
  const [, navigate] = useLocation();
  const { booking, resetBooking } = useBooking();
  const { user } = useAuth();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  // Retrieve the booking ID + code from sessionStorage (set by PhotographerProfilePage after create)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("snapty_pending_booking");
      if (stored) {
        const parsed = JSON.parse(stored);
        setBookingId(parsed.id ?? null);
        setBookingCode(parsed.bookingCode ?? null);
      }
    } catch {}
  }, []);

  const createIntentMutation = trpc.payments.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      if (data.clientSecret) setClientSecret(data.clientSecret);
      setLoadingIntent(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initialise payment");
      setLoadingIntent(false);
    },
  });

  // Load payment intent once we have a booking ID
  useEffect(() => {
    if (!bookingId || clientSecret || loadingIntent) return;
    setLoadingIntent(true);
    createIntentMutation.mutate({ bookingId });
  }, [bookingId]);

  const totalPrice = booking.totalPrice || booking.basePrice || 0;
  const basePrice = booking.basePrice || 0;
  const addOnPrice = booking.addOnPrice || 0;

  const formatDate = (d: string) => {
    if (!d) return "TBD";
    return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  };

  const handleSuccess = () => {
    if (bookingCode) {
      // Clear pending booking from session
      try { sessionStorage.removeItem("snapty_pending_booking"); } catch {}
      navigate(`/client/booking-confirmation/${bookingCode}`);
    }
  };

  // Guard: no booking data
  if (!booking.propertyAddress && !bookingId) {
    return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Camera className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">No Booking Found</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Please complete the booking flow first to reach the payment page.
        </p>
        <button
          onClick={() => navigate("/client/home")}
          className="flex items-center gap-2 text-white font-bold bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-200"
        >
          <Home className="w-4 h-4" />
          Start Booking
        </button>
      </div>
      </ClientLayout>
  );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1 as any)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-extrabold text-gray-900">Complete Payment</h1>
            <p className="text-xs text-gray-400">Step 5 of 5</p>
          </div>
          <span className="text-sm font-extrabold text-blue-600">${totalPrice.toFixed(2)}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-blue-500 w-full" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-10 space-y-4">

        {/* ── 1. Booking Summary ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 pt-5 pb-5 space-y-0">
            <h2 className="text-sm font-extrabold text-gray-900 mb-4">Booking Summary</h2>

            {/* Photographer */}
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Photographer</p>
                <p className="text-sm font-bold text-gray-800">
                  {booking.photographerId ? "Assigned Photographer" : "Any Available Photographer"}
                </p>
              </div>
            </div>

            {/* Selected services */}
            {booking.selectedServices.length > 0 && (
              <div className="py-3 border-t border-gray-50">
                <p className="text-xs text-gray-400 font-medium mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {booking.selectedServices.map((svc) => {
                    const label = svc.charAt(0).toUpperCase() + svc.slice(1).replace(/_/g, " ");
                    return (
                      <span
                        key={svc}
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full"
                      >
                        <ServiceIcon name={svc} />
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Property address */}
            <div className="flex items-start gap-3 py-3 border-t border-gray-50">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium">Property Address</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">
                  {booking.propertyAddress || "Not specified"}
                </p>
                {(booking.propertyType || booking.propertySize) && (
                  <p className="text-xs text-gray-400 capitalize mt-0.5">
                    {booking.propertyType}
                    {booking.propertySize ? ` · ${booking.propertySize.toLocaleString()} sqft` : ""}
                    {booking.bedrooms ? ` · ${booking.bedrooms} bed` : ""}
                    {booking.bathrooms ? ` · ${booking.bathrooms} bath` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Date & time */}
            <div className="flex items-start gap-3 py-3 border-t border-gray-50">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Date & Time</p>
                <p className="text-sm font-bold text-gray-800">
                  {booking.scheduledDate ? formatDate(booking.scheduledDate) : "TBD"}
                </p>
                {booking.scheduledTime && (
                  <p className="text-xs text-gray-400">{booking.scheduledTime}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Pricing Breakdown ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
          <h2 className="text-sm font-extrabold text-gray-900 mb-4">Pricing Breakdown</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Base price</span>
              <span className="font-bold text-gray-800">${basePrice.toFixed(2)}</span>
            </div>
            {addOnPrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Add-ons</span>
                <span className="font-bold text-gray-800">+${addOnPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-base font-extrabold text-gray-900">Total</span>
              <span className="text-xl font-extrabold text-blue-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── 3. Stripe Payment Form ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
          <h2 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-500" />
            Payment Details
          </h2>

          {loadingIntent && (
            <div className="flex items-center justify-center gap-2 py-10">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-sm text-gray-500">Loading payment form…</span>
            </div>
          )}

          {!loadingIntent && !bookingId && (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">
                No booking ID found. Please go back and complete the booking first.
              </p>
              <button
                onClick={() => navigate(-1 as any)}
                className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl"
              >
                Go Back
              </button>
            </div>
          )}

          {!loadingIntent && clientSecret && bookingId && bookingCode && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#2563eb",
                    colorBackground: "#ffffff",
                    colorText: "#111827",
                    colorDanger: "#ef4444",
                    fontFamily: "Inter, system-ui, sans-serif",
                    borderRadius: "12px",
                    spacingUnit: "4px",
                  },
                  rules: {
                    ".Input": {
                      border: "1.5px solid #e5e7eb",
                      boxShadow: "none",
                      padding: "12px 14px",
                    },
                    ".Input:focus": {
                      border: "1.5px solid #2563eb",
                      boxShadow: "0 0 0 3px rgba(37,99,235,0.1)",
                    },
                    ".Label": { fontWeight: "600", fontSize: "13px", color: "#374151" },
                    ".Tab": { border: "1.5px solid #e5e7eb", borderRadius: "12px" },
                    ".Tab--selected": { border: "1.5px solid #2563eb", backgroundColor: "#eff6ff" },
                  },
                },
              }}
            >
              <StripePayForm
                bookingId={bookingId}
                bookingCode={bookingCode}
                totalPrice={totalPrice}
                onSuccess={handleSuccess}
              />
            </Elements>
          )}

          {!loadingIntent && bookingId && !clientSecret && (
            <div className="text-center py-6">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">Could not load payment form.</p>
              <button
                onClick={() => {
                  setLoadingIntent(true);
                  createIntentMutation.mutate({ bookingId });
                }}
                className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* ── 4. Cancellation Policy ── */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <button
            onClick={() => setPolicyOpen((o) => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-extrabold text-gray-900">Cancellation Policy</span>
            </div>
            {policyOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {policyOpen && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
              <div className="flex items-start gap-3 pt-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800">Free cancellation</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Free cancellation up to 24 hours before the appointment.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800">Late cancellation</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cancellations within 24 hours are charged in full.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. Secure footer ── */}
        <div className="flex items-center justify-center gap-3 py-1">
          <Shield className="w-4 h-4 text-gray-300" />
          <span className="text-xs text-gray-400">Secure payment powered by Stripe</span>
          <Lock className="w-4 h-4 text-gray-300" />
        </div>

        {/* Test card hint */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-medium">
            Test mode: use card <strong>4242 4242 4242 4242</strong>, any future expiry, any CVC.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useRoute, useLocation } from "wouter";
import {
  Calendar, MapPin, Camera, Home, Loader2, ArrowLeft,
  User, CreditCard, Zap, Video, Layers, Clock, ChevronRight,
  Star, Download, AlertCircle, CheckCircle2,
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
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending:     { label: "Pending Photographer Acceptance", cls: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock className="w-4 h-4" /> },
    accepted:    { label: "Confirmed",   cls: "bg-green-50  text-green-700  border-green-200", icon: <CheckCircle2 className="w-4 h-4" /> },
    in_progress: { label: "In Progress", cls: "bg-blue-50   text-blue-700   border-blue-200", icon: <Camera className="w-4 h-4" /> },
    photos_uploaded: { label: "Photos Uploaded", cls: "bg-purple-50 text-purple-700 border-purple-200", icon: <CheckCircle2 className="w-4 h-4" /> },
    editing:     { label: "In Editing",  cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <Camera className="w-4 h-4" /> },
    delivered:   { label: "Delivered",   cls: "bg-green-50  text-green-700  border-green-200", icon: <CheckCircle2 className="w-4 h-4" /> },
    completed:   { label: "Completed",   cls: "bg-gray-50   text-gray-700   border-gray-200", icon: <CheckCircle2 className="w-4 h-4" /> },
    cancelled:   { label: "Cancelled",   cls: "bg-red-50    text-red-700    border-red-200", icon: <AlertCircle className="w-4 h-4" /> },
    reshoot:     { label: "Reshoot Requested", cls: "bg-orange-50 text-orange-700 border-orange-200", icon: <AlertCircle className="w-4 h-4" /> },
  };
  const { label, cls, icon } = map[status] ?? { label: status, cls: "bg-gray-50 text-gray-700 border-gray-200", icon: <Clock className="w-4 h-4" /> };
  return (
    <div className={cn("inline-flex items-center gap-2 border px-4 py-2.5 rounded-full font-bold text-sm", cls)}>
      {icon}
      {label}
    </div>
  );
}

/* ─── Timeline item ───────────────────────────────────────────── */
function TimelineItem({
  label,
  completed,
  isLast,
}: {
  label: string;
  completed: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3 pb-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
          completed ? "bg-green-500 border-green-500" : "border-gray-300 bg-white"
        )}>
          {completed && <CheckCircle2 className="w-3 h-3 text-white" />}
        </div>
        {!isLast && <div className={cn("w-0.5 h-8", completed ? "bg-green-500" : "bg-gray-200")} />}
      </div>
      <div className="flex-1 pt-0.5">
        <p className={cn("text-sm font-medium", completed ? "text-gray-900" : "text-gray-500")}>
          {label}
        </p>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function BookingDetails() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/client/booking-details/:bookingCode");
  const { resetBooking } = useBooking();

  const bookingCode = params?.bookingCode ?? null;
  const isValidCode = !!bookingCode && !bookingCode.startsWith(":") && bookingCode.length > 3;

  const bookingQuery = trpc.bookings.getByCode.useQuery(
    { code: bookingCode ?? "" },
    { enabled: isValidCode, retry: false }
  );

  const bookingData = bookingQuery.data;
  const booking = bookingData?.booking;

  const photosQuery = trpc.bookings.getPhotos.useQuery(
    { bookingId: booking?.id ?? 0 },
    { enabled: !!booking?.id }
  );

  const photos = photosQuery.data ?? [];

  const confirmDeliveryMutation = trpc.bookings.confirmDelivery.useMutation({
    onSuccess: () => {
      bookingQuery.refetch();
      toast.success("Delivery confirmed! Thank you for your business.");
    },
    onError: (err) => toast.error(err.message),
  });

  const createPhotoZipMutation = trpc.bookings.createPhotoZip.useMutation({
    onSuccess: (data) => {
      downloadPhotosAsZip(data.photos);
    },
    onError: (err) => toast.error(err.message),
  });

  const downloadPhotosAsZip = async (photoList: any[]) => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      for (const photo of photoList) {
        const response = await fetch(photo.fileUrl);
        const blob = await response.blob();
        zip.file(photo.fileName, blob);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photos-${booking?.bookingCode || 'booking'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download ZIP:', err);
      toast.error('Failed to download photos as ZIP');
    }
  };

  const downloadAllPhotos = () => {
    if (!booking) return;
    createPhotoZipMutation.mutate({ bookingId: booking.id });
  };

  const [isConfirming, setIsConfirming] = useState(false);
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const createReviewMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Thank you for reviewing your photographer.");
      setReviewRating(null);
      setReviewComment("");
      bookingQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const submitReview = async () => {
    if (!booking || !reviewRating) return;
    setIsSubmittingReview(true);
    try {
      if (!booking.photographerId) {
        toast.error("Photographer not assigned to this booking");
        return;
      }
      await createReviewMutation.mutateAsync({
        bookingId: booking.id,
        photographerId: booking.photographerId,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleGoHome = useCallback(() => {
    resetBooking();
    navigate("/client/home");
  }, [resetBooking, navigate]);

  const confirmDeliveryHandler = async () => {
    if (!booking) return;
    setIsConfirming(true);
    try {
      await confirmDeliveryMutation.mutateAsync({ bookingId: booking.id });
    } finally {
      setIsConfirming(false);
    }
  };

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

  if (!match) return null;

  /* ── No valid code ── */
  if (!isValidCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Camera className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">No Booking Selected</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Go back to your bookings list to select one.
        </p>
        <button
          onClick={() => navigate("/client/bookings")}
          className="flex items-center gap-2 text-white font-bold bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-200"
        >
          <Home className="w-4 h-4" />
          Back to Bookings
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

  /* ── Not found ── */
  if (bookingQuery.isError || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">Booking Not Found</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          This booking could not be found. Please check the booking code.
        </p>
        <button
          onClick={() => navigate("/client/bookings")}
          className="flex items-center gap-2 text-white font-bold bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-200"
        >
          <Home className="w-4 h-4" />
          Back to Bookings
        </button>
      </div>
    );
  }

  const status = booking.status ?? "pending";
  const totalPrice = parseFloat(String(booking.totalPrice ?? 0));

  const timelineSteps = [
    { label: "Booking Created", completed: true },
    { label: "Payment Completed", completed: booking.paymentStatus === "completed" },
    { label: "Photographer Confirmed", completed: ["accepted", "in_progress", "photos_uploaded", "editing", "delivered", "completed"].includes(status) },
    { label: "Shoot Scheduled", completed: ["in_progress", "photos_uploaded", "editing", "delivered", "completed"].includes(status) },
    { label: "Photos Uploaded", completed: ["photos_uploaded", "editing", "delivered", "completed"].includes(status) },
    { label: "In Editing", completed: ["editing", "delivered", "completed"].includes(status) },
    { label: "Delivered", completed: ["delivered", "completed"].includes(status) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">Booking Details</h1>
          <p className="text-xs text-gray-500 mt-0.5">Code: {booking.bookingCode}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-20">
        {/* ── Photographer info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
          <h3 className="text-sm font-extrabold text-gray-900 mb-3">Photographer</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
              {bookingData?.photographerName?.[0] ?? "?"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{bookingData?.photographerName ?? "Unknown"}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-gray-600">
                  5.0 (12 reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Booking summary ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
          <h3 className="text-sm font-extrabold text-gray-900 mb-4">Booking Summary</h3>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Services</span>
              <div className="text-right space-y-1">
                {bookingData?.services?.map((svc: any) => (
                  <div key={svc.id} className="flex items-center gap-2 justify-end">
                    <ServiceIcon name={svc.name} />
                    <span className="text-sm font-medium text-gray-900">{svc.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </span>
              <span className="text-sm font-medium text-gray-900 text-right max-w-xs">{booking.propertyAddress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Property Size</span>
              <span className="text-sm font-medium text-gray-900">{booking.propertySize} sqft</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date & Time
              </span>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{formatDate(booking.scheduledDate)}</p>
                <p className="text-xs text-gray-500">{formatTime(booking.scheduledDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Pricing ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
          <h3 className="text-sm font-extrabold text-gray-900 mb-3">Pricing</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Price</span>
              <span className="font-medium text-gray-900">${parseFloat(String(booking.basePrice ?? 0)).toFixed(2)}</span>
            </div>
            {parseFloat(String(booking.addOnPrice ?? 0)) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Add-ons</span>
                <span className="font-medium text-gray-900">${parseFloat(String(booking.addOnPrice ?? 0)).toFixed(2)}</span>
              </div>
            )}
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">Total Paid</span>
              <span className="font-extrabold text-lg text-blue-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── Timeline ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
          <h3 className="text-sm font-extrabold text-gray-900 mb-4">Booking Timeline</h3>
          <div className="space-y-0">
            {timelineSteps.map((step, idx) => (
              <TimelineItem
                key={idx}
                label={step.label}
                completed={step.completed}
                isLast={idx === timelineSteps.length - 1}
              />
            ))}
          </div>
        </div>

        {/* ── Special instructions ── */}
        {booking.specialInstructions && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
            <h3 className="text-sm font-extrabold text-gray-900 mb-3">Special Instructions</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{booking.specialInstructions}</p>
          </div>
        )}

        {/* ── Delivered Photos section ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5">
          <h3 className="text-sm font-extrabold text-gray-900 mb-4">Delivered Photos</h3>
          {status === "editing" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Camera className="w-12 h-12 text-amber-200 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Photos are being edited and will be delivered soon.</p>
              <p className="text-xs text-gray-400 mt-1">Check back shortly for your final gallery.</p>
            </div>
          ) : status === "photos_uploaded" ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Camera className="w-12 h-12 text-blue-200 mb-2" />
              <p className="text-sm text-gray-600 font-medium">Photos will appear here after upload.</p>
              <p className="text-xs text-gray-400 mt-1">The photographer is processing your images.</p>
            </div>
          ) : [
            "delivered",
            "completed"
          ].includes(status) ? (
            <div className="space-y-4">
              {photos.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {photos.map((photo: any) => (
                      <div key={photo.id} className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square">
                        <img
                          src={photo.fileUrl}
                          alt={photo.fileName}
                          className="w-full h-full object-cover"
                        />
                        <button className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Download className="w-6 h-6 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={downloadAllPhotos}
                      disabled={createPhotoZipMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                      {createPhotoZipMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Download All Photos
                    </button>
                    {status === "delivered" && (
                      <button
                        onClick={confirmDeliveryHandler}
                        disabled={isConfirming}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors"
                      >
                        {isConfirming ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Camera className="w-12 h-12 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">No photos available yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Please check back later.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Camera className="w-12 h-12 text-gray-200 mb-2" />
              <p className="text-sm text-gray-500 font-medium">Photos will appear here once the photographer delivers them.</p>
              <p className="text-xs text-gray-400 mt-1">Current status: {status}</p>
            </div>
          )}
        </div>

        {/* ── Review Section ── */}
        {status === "completed" && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900">Rate Your Experience</h3>
            <div className="space-y-3">
              {/* Star Rating */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">How would you rate this photographer?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="text-2xl transition-colors"
                    >
                      {star <= (reviewRating || 0) ? "⭐" : "☆"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Your Review (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={submitReview}
                disabled={!reviewRating || isSubmittingReview}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingReview ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
                Submit Review
              </button>
            </div>
          </div>
        )}

        {/* ── CTA ── */}
        <div className="space-y-2">
          <button
            onClick={() => navigate("/client/bookings")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Back to My Bookings
          </button>
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

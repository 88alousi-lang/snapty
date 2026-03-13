import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, Calendar, Clock, MapPin, User, Phone, Mail, Camera, Upload,
  CheckCircle2, AlertCircle, Loader2, Home, FileUp, MessageCircle, Eye,
  XCircle, Download, ChevronRight,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PhotographerRawUpload } from "@/components/PhotographerRawUpload";
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";

/* ─── Status badge ────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    pending:     { label: "Pending Request", cls: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <AlertCircle className="w-4 h-4" /> },
    accepted:    { label: "Accepted", cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="w-4 h-4" /> },
    confirmed:   { label: "Confirmed", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <CheckCircle2 className="w-4 h-4" /> },
    in_progress: { label: "In Progress", cls: "bg-purple-50 text-purple-700 border-purple-200", icon: <Camera className="w-4 h-4" /> },
    uploaded:    { label: "Photos Uploaded", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <FileUp className="w-4 h-4" /> },
    editing:     { label: "In Editing", cls: "bg-orange-50 text-orange-700 border-orange-200", icon: <Camera className="w-4 h-4" /> },
    delivered:   { label: "Delivered", cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="w-4 h-4" /> },
    completed:   { label: "Completed", cls: "bg-gray-50 text-gray-700 border-gray-200", icon: <CheckCircle2 className="w-4 h-4" /> },
    cancelled:   { label: "Cancelled", cls: "bg-red-50 text-red-700 border-red-200", icon: <XCircle className="w-4 h-4" /> },
    reshoot:     { label: "Reshoot Requested", cls: "bg-orange-50 text-orange-700 border-orange-200", icon: <AlertCircle className="w-4 h-4" /> },
  };
  const { label, cls, icon } = map[status] || { label: status, cls: "bg-gray-50 text-gray-700 border-gray-200", icon: <AlertCircle className="w-4 h-4" /> };
  return (
    <div className={cn("inline-flex items-center gap-2 border px-3 py-1.5 rounded-full font-bold text-xs", cls)}>
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
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center",
          completed ? "bg-green-500 border-green-500" : "bg-gray-100 border-gray-300"
        )}>
          {completed && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
        {!isLast && (
          <div className={cn(
            "w-0.5 h-12 mt-2",
            completed ? "bg-green-500" : "bg-gray-200"
          )} />
        )}
      </div>
      <div className="pb-4">
        <p className={cn(
          "text-sm font-bold",
          completed ? "text-gray-900" : "text-gray-400"
        )}>
          {label}
        </p>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function PhotographerBookingDetails() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/photographer/booking/:bookingCode");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<any[]>([]);

  const bookingCode = params?.bookingCode ?? null;
  const isValidCode = !!bookingCode && !bookingCode.startsWith(":") && bookingCode.length > 3;

  const bookingQuery = trpc.bookings.getByCode.useQuery(
    { code: bookingCode ?? "" },
    { enabled: isValidCode, retry: false }
  );

  const booking = bookingQuery.data?.booking;
  const services = bookingQuery.data?.services ?? [];
  const clientName = (bookingQuery.data as any)?.clientName ?? null;

  const updateStatusMutation = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      bookingsQuery.refetch();
      toast.success("Booking updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const bookingsQuery = trpc.bookings.getMyBookings.useQuery(undefined, {
    enabled: false,
  });

  const photosQuery = trpc.bookings.getPhotos.useQuery(
    { bookingId: booking?.id ?? 0 },
    { enabled: !!booking?.id }
  );

  const uploadPhotoMutation = trpc.bookings.uploadPhoto.useMutation({
    onSuccess: () => {
      photosQuery.refetch();
      setUploadProgress(0);
      setIsUploading(false);
      toast.success("Photo uploaded successfully");
    },
    onError: (err) => {
      setIsUploading(false);
      toast.error(err.message);
    },
  });

  const markAsUploadedMutation = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      bookingQuery.refetch();
      setIsUpdating(false);
      toast.success("Marked as uploaded");
    },
    onError: (err) => {
      setIsUpdating(false);
      toast.error(err.message);
    },
  });

  const deletePhotoMutation = trpc.bookings.deletePhoto.useMutation({
    onSuccess: () => {
      photosQuery.refetch();
      toast.success("Photo deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const reorderPhotosMutation = trpc.bookings.reorderPhotos.useMutation({
    onSuccess: () => {
      photosQuery.refetch();
      toast.success("Photos reordered");
    },
    onError: (err) => toast.error(err.message),
  });

  const markAsDeliveredMutation = trpc.bookings.markAsDelivered.useMutation({
    onSuccess: () => {
      bookingQuery.refetch();
      setIsUpdating(false);
      toast.success("Photos marked as delivered");
    },
    onError: (err) => {
      setIsUpdating(false);
      toast.error(err.message);
    },
  });

  const deliverPhotosMutation = trpc.bookings.deliverPhotos.useMutation({
    onSuccess: () => {
      bookingQuery.refetch();
      setIsUpdating(false);
      toast.success("Photos delivered to client");
    },
    onError: (err) => {
      setIsUpdating(false);
      toast.error(err.message);
    },
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files || !booking) return;
    setIsUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mockUrl = URL.createObjectURL(file);
      const progress = Math.round(((i + 1) / files.length) * 100);
      setUploadProgress(progress);

      await uploadPhotoMutation.mutateAsync({
        bookingId: booking.id,
        fileName: file.name,
        fileUrl: mockUrl,
        fileSize: file.size,
        fileType: file.type,
      });
    }
  };

  const deletePhoto = (photoId: number) => {
    if (!booking) return;
    deletePhotoMutation.mutate({ photoId, bookingId: booking.id });
  };

  const markAsUploaded = async () => {
    if (!booking) return;
    setIsUpdating(true);
    await markAsUploadedMutation.mutateAsync({
      bookingId: booking.id,
      status: "photos_uploaded" as any,
    });
  };

  const markAsDelivered = async () => {
    if (!booking) return;
    setIsUpdating(true);
    await markAsDeliveredMutation.mutateAsync({ bookingId: booking.id });
  };

  const deliverPhotos = async () => {
    if (!booking) return;
    setIsUpdating(true);
    await deliverPhotosMutation.mutateAsync({ bookingId: booking.id });
  };

  const totalPrice = parseFloat(String(booking?.totalPrice ?? 0));
  const payout = totalPrice * 0.65; // 65% to photographer (35% platform fee)
  const status = booking?.status ?? "pending";

  const timelineSteps = [
    { label: "Booking Created", completed: true },
    { label: "Payment Completed", completed: !!booking?.paymentStatus },
    { label: "Request Sent to Photographer", completed: !!booking },
    { label: "Accepted", completed: status !== "pending" },
    { label: "Shoot Scheduled", completed: ["in_progress", "uploaded", "editing", "delivered", "completed"].includes(status) },
    { label: "In Progress", completed: ["in_progress", "uploaded", "editing", "delivered", "completed"].includes(status) },
    { label: "Photos Uploaded", completed: ["uploaded", "editing", "delivered", "completed"].includes(status) },
    { label: "Editing in Progress", completed: ["editing", "delivered", "completed"].includes(status) },
    { label: "Delivered", completed: ["delivered", "completed"].includes(status) },
  ];

  if (!match) return null;

  /* ── No valid code ── */
  if (!isValidCode) {
    return (
    <PhotographerLayout>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
          <Camera className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">No Booking Selected</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Go back to your dashboard to select a booking.
        </p>
        <button
          onClick={() => navigate("/photographer")}
          className="flex items-center gap-2 text-white font-bold bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-200"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
      </PhotographerLayout>
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
          onClick={() => navigate("/photographer")}
          className="flex items-center gap-2 text-white font-bold bg-blue-600 px-6 py-3 rounded-2xl shadow-lg shadow-blue-200"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  /* ── Details screen ── */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/photographer")}
            className="flex items-center gap-2 text-blue-600 font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-center">
            <h1 className="text-base font-extrabold text-gray-900">Booking Details</h1>
            <p className="text-xs text-gray-400 mt-0.5">{booking.bookingCode}</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-10 space-y-5">
        {/* ── Status badge ── */}
        <div className="flex justify-center">
          <StatusBadge status={status} />
        </div>

        {/* ── Client section ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Client Information</h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-gray-900 font-medium">{clientName || "Client"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Client Type</p>
                <p className="text-gray-900 font-medium">Homeowner</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-gray-900 font-medium">(555) 123-4567</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-gray-900 font-medium truncate">client@example.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Property details ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Property Details</h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-gray-900 font-medium">{booking.propertyAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-gray-900 font-medium capitalize">{booking.propertyType || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Size</p>
                <p className="text-gray-900 font-medium">{booking.propertySize ? `${Number(booking.propertySize).toLocaleString()} sqft` : "—"}</p>
              </div>
            </div>

            {booking.specialInstructions && (
              <div>
                <p className="text-xs text-gray-500">Special Instructions</p>
                <p className="text-gray-900 font-medium">{booking.specialInstructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Service details ── */}
        {services.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 space-y-3">
            <h3 className="text-sm font-extrabold text-gray-900">Services</h3>

            <div className="space-y-2">
              {services.map((svc: any, idx: number) => {
                const name = svc.service?.name ?? svc.name ?? "Service";
                const price = parseFloat(String(svc.price ?? svc.service?.basePrice ?? 0));
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">{name}</span>
                    <span className="text-gray-900 font-bold">${price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">Estimated Payout</p>
              <p className="text-lg font-extrabold text-green-600">${payout.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* ── Date and time ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Shoot Details</h3>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-gray-900 font-medium">
                  {new Date(booking.scheduledDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-gray-900 font-medium">
                  {new Date(booking.scheduledDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>

            {booking.duration && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-gray-900 font-medium">{booking.duration} hours</p>
                </div>
              </div>
            )}
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

        {/* ── Action buttons ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900 mb-2">Actions</h3>

          <div className="space-y-2">
            {status === "pending" && (
              <>
                <button
                  onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: "accepted" })}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Accept Booking
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: "rejected" })}
                  className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Booking
                </button>
              </>
            )}

            {["accepted", "confirmed"].includes(status) && (
              <button
                onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: "in_progress" })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Start Job
              </button>
            )}

            {status === "in_progress" && (
              <>
                <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Mark as Arrived
                </button>
              <button
                onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: "completed" })}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FileUp className="w-5 h-5" />
                Mark Shoot Complete
              </button>
              </>
            )}

            {["uploaded", "editing", "delivered"].includes(status) && (
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Eye className="w-5 h-5" />
                View Delivery Status
              </button>
            )}
          </div>
        </div>

        {/* ── Upload photos ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Upload Photos</h3>

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-2 hover:border-blue-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm font-bold text-gray-900">Drag and drop your photos here</p>
            <p className="text-xs text-gray-500">or click to select files</p>
            <p className="text-xs text-gray-400 mt-2">RAW, JPG, PNG supported</p>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">{uploadProgress}% uploaded</p>
            </div>
          )}
        </div>

        {/* ── Photos Upload Section ── */}
        <PhotographerRawUpload
          bookingId={booking?.id || 0}
          onSuccess={() => {
            toast.success("Photos uploaded successfully!");
          }}
        />

        {/* ── Mark as Uploaded / Deliver ── */}
        {(booking?.status === "in_progress" || booking?.status === "photos_uploaded") && (
          <div className="space-y-2">
            {booking.status === "in_progress" && uploadedPhotos.length > 0 && (
              <button
                onClick={markAsUploaded}
                disabled={isUpdating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                Mark as Uploaded
              </button>
            )}
            {booking.status === "photos_uploaded" && (
              <button
                onClick={markAsDelivered}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-extrabold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Mark as Delivered
              </button>
            )}
          </div>
        )}

        {/* ── Client communication ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-5 space-y-3">
          <h3 className="text-sm font-extrabold text-gray-900">Contact Client</h3>

          <div className="grid grid-cols-2 gap-2">
            <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" />
              Call
            </button>
            <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="space-y-2">
          <button
            onClick={() => navigate("/photographer")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
          <button
            onClick={() => navigate("/photographer/bookings")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Back to Bookings
          </button>
        </div>
      </div>
    </div>
  );
}

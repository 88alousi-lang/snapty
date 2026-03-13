import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Calendar, MapPin, User, Camera, DollarSign,
  Clock, Home, CheckCircle2, XCircle, Loader2, AlertCircle,
  Star, Mail, Phone, Package, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { trpc } from "@/lib/trpc";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "accepted", label: "Accepted", color: "bg-blue-100 text-blue-800" },
  { value: "rejected", label: "Rejected", color: "bg-gray-100 text-gray-800" },
  { value: "in_progress", label: "In Progress", color: "bg-purple-100 text-purple-800" },
  { value: "photos_uploaded", label: "Photos Uploaded", color: "bg-indigo-100 text-indigo-800" },
  { value: "editing", label: "Editing", color: "bg-orange-100 text-orange-800" },
  { value: "delivered", label: "Delivered", color: "bg-teal-100 text-teal-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
] as const;

type BookingStatus = typeof STATUS_OPTIONS[number]["value"];

const QUICK_ACTIONS: { label: string; status: BookingStatus; icon: React.ElementType; variant: string }[] = [
  { label: "Confirm", status: "accepted", icon: CheckCircle2, variant: "bg-blue-600 hover:bg-blue-700 text-white" },
  { label: "Mark In Progress", status: "in_progress", icon: RefreshCw, variant: "bg-purple-600 hover:bg-purple-700 text-white" },
  { label: "Mark Completed", status: "completed", icon: CheckCircle2, variant: "bg-green-600 hover:bg-green-700 text-white" },
  { label: "Mark Delivered", status: "delivered", icon: Package, variant: "bg-teal-600 hover:bg-teal-700 text-white" },
  { label: "Cancel", status: "cancelled", icon: XCircle, variant: "bg-red-600 hover:bg-red-700 text-white" },
];

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${opt?.color ?? "bg-gray-100 text-gray-800"}`}>
      {opt?.label ?? status.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminBookingDetail() {
  const params = useParams<{ bookingCode: string }>();
  const bookingCode = params.bookingCode ?? "";
  const [, navigate] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedEditorId, setSelectedEditorId] = useState<string>("");

  const utils = trpc.useUtils();

  const { data, isLoading, isError, error } = trpc.admin.getBookingDetail.useQuery(
    { bookingCode },
    { enabled: !!bookingCode }
  );

  // Sync selectedStatus with loaded booking status
  if (data && !selectedStatus) {
    setSelectedStatus(data.booking.status);
  }

  const updateStatusMutation = trpc.admin.updateBookingStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking status updated successfully");
      utils.admin.getBookingDetail.invalidate({ bookingCode });
      utils.admin.getBookings.invalidate();
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to update status"),
  });

  const { data: editors } = trpc.admin.getEditors.useQuery();

  const assignEditorMutation = trpc.admin.assignEditor.useMutation({
    onSuccess: () => {
      toast.success("Editor assigned successfully");
      utils.admin.getBookingDetail.invalidate({ bookingCode });
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to assign editor"),
  });

  const autoAssignMutation = trpc.admin.autoAssignEditor.useMutation({
    onSuccess: (result) => {
      toast.success(`Auto-assigned to: ${result.assignedEditor.name ?? "Editor"}`);
      utils.admin.getBookingDetail.invalidate({ bookingCode });
    },
    onError: (err: any) => toast.error(err.message ?? "No editors available"),
  });

  const handleStatusChange = (newStatus: string) => {
    if (!data) return;
    const booking = data.booking;
    if (newStatus === booking.status) return;
    updateStatusMutation.mutate({ bookingId: booking.id, status: newStatus as BookingStatus });
    setSelectedStatus(newStatus);
  };

  const handleQuickAction = (status: BookingStatus) => {
    if (!data) return;
    updateStatusMutation.mutate({ bookingId: data.booking.id, status });
    setSelectedStatus(status);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading booking details...</span>
        </div>
      </AdminLayout>
    );
  }

  if (isError || !data) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 py-8 px-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">
              {(error as any)?.message ?? "Booking not found"}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/bookings")} className="mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const { booking, clientName, clientEmail, clientPhone, photographerInfo, services } = data;
  const totalPrice = parseFloat(String(booking.totalPrice ?? 0));
  const platformCommission = totalPrice * 0.35;
  const photographerPayout = totalPrice * 0.65;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/bookings")}
                className="gap-2 text-gray-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-5 w-px bg-gray-200" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-mono">{booking.bookingCode}</h1>
                <p className="text-sm text-gray-500">Booking Detail</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <StatusBadge status={booking.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Status Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_ACTIONS.filter((a) => a.status !== booking.status).map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.status}
                      size="sm"
                      className={`gap-1.5 ${action.variant}`}
                      onClick={() => handleQuickAction(action.status)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending && updateStatusMutation.variables?.status === action.status ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 font-medium">Set custom status:</span>
                <Select
                  value={selectedStatus || booking.status}
                  onValueChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updateStatusMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editor Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>🎨</span> Editor Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.booking as any).editorId ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-600 font-bold text-sm">
                    ✓ Editor assigned (ID: {(data.booking as any).editorId})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="text-yellow-700 text-sm font-semibold">No editor assigned yet</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Select
                  value={selectedEditorId}
                  onValueChange={setSelectedEditorId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select editor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(editors ?? []).map((editor: any) => (
                      <SelectItem key={editor.id} value={String(editor.id)}>
                        {editor.name ?? editor.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  disabled={!selectedEditorId || assignEditorMutation.isPending}
                  onClick={() =>
                    assignEditorMutation.mutate({
                      bookingId: data.booking.id,
                      editorUserId: parseInt(selectedEditorId),
                    })
                  }
                >
                  {assignEditorMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  Assign
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-dashed"
                disabled={autoAssignMutation.isPending}
                onClick={() => autoAssignMutation.mutate({ bookingId: data.booking.id })}
              >
                {autoAssignMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>⚡</span>
                )}
                Auto-Assign Editor (Least Loaded)
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: booking + services */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Home className="w-4 h-4 text-blue-600" />
                    Booking Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Booking Code</p>
                      <p className="text-sm font-mono font-bold text-blue-600">{booking.bookingCode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                      <Badge variant={booking.paymentStatus === "completed" ? "default" : "secondary"}>
                        {booking.paymentStatus}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Property Type</p>
                      <p className="text-sm text-gray-900">{booking.propertyType ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Property Size</p>
                      <p className="text-sm text-gray-900">
                        {booking.propertySize ? `${booking.propertySize.toLocaleString()} sqft` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <p className="text-sm text-gray-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {booking.duration ? `${booking.duration} min` : "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Property Address</p>
                    <p className="text-sm text-gray-900 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      {booking.propertyAddress}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Scheduled Date & Time</p>
                    <p className="text-sm text-gray-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {booking.scheduledDate
                        ? new Date(booking.scheduledDate).toLocaleString()
                        : "—"}
                    </p>
                  </div>

                  {booking.specialInstructions && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Special Instructions</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {booking.specialInstructions}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    Created: {new Date(booking.createdAt).toLocaleString()} ·
                    Updated: {new Date(booking.updatedAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="w-4 h-4 text-blue-600" />
                    Services Booked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {services.length === 0 ? (
                    <p className="text-sm text-gray-500">No services attached to this booking.</p>
                  ) : (
                    <div className="space-y-2">
                      {services.map((svc: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{svc.serviceName ?? "Unknown Service"}</p>
                            <p className="text-xs text-gray-500 capitalize">{svc.serviceType ?? "—"}</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {svc.bookingService?.price ? `$${parseFloat(svc.bookingService.price).toFixed(2)}` : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column: client, photographer, financials */}
            <div className="space-y-6">
              {/* Client Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4 text-blue-600" />
                    Client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{clientName ?? "—"}</p>
                  </div>
                  {clientEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {clientEmail}
                    </div>
                  )}
                  {clientPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {clientPhone}
                    </div>
                  )}
                  {!clientEmail && !clientPhone && (
                    <p className="text-sm text-gray-400">No contact info available</p>
                  )}
                </CardContent>
              </Card>

              {/* Photographer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Camera className="w-4 h-4 text-blue-600" />
                    Photographer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {photographerInfo ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{photographerInfo.photographerName ?? "—"}</p>
                        {photographerInfo.city && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {photographerInfo.city}
                          </p>
                        )}
                      </div>
                      {photographerInfo.photographerEmail && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {photographerInfo.photographerEmail}
                        </div>
                      )}
                      {photographerInfo.averageRating && parseFloat(photographerInfo.averageRating) > 0 && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold">{parseFloat(photographerInfo.averageRating).toFixed(1)}</span>
                          <span className="text-gray-400">avg rating</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1"
                        onClick={() => navigate(`/admin/photographers/${photographerInfo.photographerId}`)}
                      >
                        View Profile
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No photographer assigned yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Financials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Financials
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Price</span>
                    <span className="font-medium">${parseFloat(String(booking.basePrice ?? 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Add-ons</span>
                    <span className="font-medium">${parseFloat(String(booking.addOnPrice ?? 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-gray-100 pt-2">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Platform Commission (35%)</span>
                      <span className="text-gray-700 font-medium">${platformCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Photographer Payout (65%)</span>
                      <span className="text-green-700 font-medium">${photographerPayout.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

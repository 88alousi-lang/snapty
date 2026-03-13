import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ClientPhotoGallery } from "@/components/ClientPhotoGallery";
import { toast } from "sonner";
import { ClientLayout } from "@/components/layouts/ClientLayout";

export default function ClientGallery() {
  const [, params] = useRoute("/client/gallery/:bookingCode");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const bookingCode = params?.bookingCode as string;

  // Queries
  const { data: booking, isLoading: bookingLoading, error: bookingError } = trpc.bookings.getByCode.useQuery(
    { code: bookingCode },
    { enabled: !!bookingCode }
  );

  // Security check: verify user is the client or admin
  useEffect(() => {
    if (booking && user && user.role !== "admin" && booking.booking?.clientId !== user.id) {
      toast.error("You don't have access to this gallery");
      navigate("/client/bookings");
    }
  }, [booking, user, navigate]);

  if (bookingLoading) {
    return (
      <ClientLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
      </ClientLayout>
    );
  }

  if (!booking?.booking || bookingError) {
    return (
      <ClientLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The booking code "{bookingCode}" could not be found or you don't have access to it.</p>
          <button
            onClick={() => navigate("/client/bookings")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>
        </div>
      </div>
      </ClientLayout>
    );
  }

  const bookingData = booking.booking;

  return (
    <ClientLayout>
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/client/bookings")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivered Photos</h1>
            <p className="text-sm text-gray-600 mt-1">Booking {bookingCode}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Booking Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Photographer</p>
              <p className="font-semibold text-gray-900">
                {bookingData.photographerId ? "Photographer" : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Property</p>
              <p className="font-semibold text-gray-900">
                {bookingData.propertyAddress}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date & Time</p>
              <p className="font-semibold text-gray-900">
                {new Date(bookingData.scheduledDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-green-600">Delivered</p>
            </div>
          </div>
        </div>

        {/* Photo Gallery */}
        <ClientPhotoGallery bookingId={bookingData.id} />
      </div>
    </div>
    </ClientLayout>
  );
}

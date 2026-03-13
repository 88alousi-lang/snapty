import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, MapPin, DollarSign, Star } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ClientLayout } from "@/components/layouts/ClientLayout";
import { useAuth } from "@/_core/hooks/useAuth";

// Type for client booking items returned by getMyBookings
type BookingItem = {
  booking: {
    id: number;
    bookingCode: string;
    clientId: number;
    photographerId: number | null;
    propertyAddress: string;
    propertyType: string | null;
    propertySize: number | null;
    city: string | null;
    state: string | null;
    scheduledDate: Date;
    status: string;
    paymentStatus: string;
    totalPrice: string;
    createdAt: Date;
    updatedAt: Date;
  };
  photographerName: string | null;
  photographerImage: string | null;
  photographerCity: string | null;
};

export default function ClientDashboard() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");

  const bookingsQuery = trpc.bookings.getMyBookings.useQuery();
  // Cast to correct type - client gets BookingItem[] with nested booking
  const bookingItems = (bookingsQuery.data ?? []) as BookingItem[];
  const createReviewMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setShowReviewDialog(false);
      setReviewRating(5);
      setReviewTitle("");
      setReviewComment("");
      setSelectedBooking(null);
      bookingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  const handleSubmitReview = () => {
    if (!selectedBooking) return;
    const item = bookingItems.find((b) => b.booking.id === selectedBooking);
    if (!item) return;
    if (item.booking.photographerId) {
      createReviewMutation.mutate({
        bookingId: selectedBooking,
        photographerId: item.booking.photographerId,
        rating: reviewRating,
        comment: reviewComment,
      });
    } else {
      toast.error("Photographer not found for this booking");
    }
  };

  if (!isAuthenticated) {
    return (
      <ClientLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Please log in to view your dashboard</p>
        </div>
      </ClientLayout>
    );
  }

  const upcomingBookings = bookingItems.filter((b) => {
    const bookingDate = new Date(b.booking.scheduledDate);
    return bookingDate > new Date() && b.booking.status !== "cancelled";
  });

  const pastBookings = bookingItems.filter((b) => {
    const bookingDate = new Date(b.booking.scheduledDate);
    return bookingDate <= new Date() || b.booking.status === "cancelled";
  });

  return (
    <ClientLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <Button onClick={() => navigate("/client/book/start")} className="bg-blue-600 hover:bg-blue-700">
              Book a Photographer
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {bookingsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
          ) : bookingItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 mb-4">You haven't made any bookings yet.</p>
                <Button onClick={() => navigate("/client/book/start")} className="bg-blue-600 hover:bg-blue-700">
                  Find a Photographer
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Upcoming Bookings */}
              {upcomingBookings.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Shoots</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {upcomingBookings.map(({ booking, photographerName }) => (
                      <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-gray-600 text-sm">Booking Code</p>
                              <p className="font-mono font-bold text-gray-900">{booking.bookingCode}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> Property
                              </p>
                              <p className="font-semibold text-gray-900 truncate">{booking.propertyAddress}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> Date & Time
                              </p>
                              <p className="font-semibold text-gray-900">{new Date(booking.scheduledDate).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm flex items-center gap-1">
                                <DollarSign className="w-4 h-4" /> Price
                              </p>
                              <p className="font-semibold text-gray-900">${booking.totalPrice}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button
                              onClick={() => navigate(`/client/booking/${booking.bookingCode}`)}
                              variant="outline"
                              size="sm"
                            >
                              View Details
                            </Button>
                            {booking.status === "confirmed" && (
                              <Button
                                onClick={() => navigate(`/client/gallery/${booking.bookingCode}`)}
                                variant="outline"
                                size="sm"
                              >
                                View Gallery
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Shoots</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {pastBookings.map(({ booking, photographerName }) => (
                      <Card key={booking.id} className="opacity-75 hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-gray-600 text-sm">Booking Code</p>
                              <p className="font-mono font-bold text-gray-900">{booking.bookingCode}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> Property
                              </p>
                              <p className="font-semibold text-gray-900 truncate">{booking.propertyAddress}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm flex items-center gap-1">
                                <Calendar className="w-4 h-4" /> Date & Time
                              </p>
                              <p className="font-semibold text-gray-900">{new Date(booking.scheduledDate).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-sm flex items-center gap-1">
                                <DollarSign className="w-4 h-4" /> Price
                              </p>
                              <p className="font-semibold text-gray-900">${booking.totalPrice}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button
                              onClick={() => navigate(`/client/booking/${booking.bookingCode}`)}
                              variant="outline"
                              size="sm"
                            >
                              View Details
                            </Button>
                            {booking.status === "completed" && (
                              <>
                                <Button
                                  onClick={() => navigate(`/client/gallery/${booking.bookingCode}`)}
                                  variant="outline"
                                  size="sm"
                                >
                                  View Gallery
                                </Button>
                                <Button
                                  onClick={() => {
                                    setSelectedBooking(booking.id);
                                    setShowReviewDialog(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  Leave Review
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rating">Rating</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onClick={() => setReviewRating(i)}
                      className={`p-2 rounded ${
                        i <= reviewRating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="title">Review Title</Label>
                <input
                  id="title"
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 mt-1"
                  placeholder="e.g., Excellent photographer"
                />
              </div>
              <div>
                <Label htmlFor="comment">Your Review</Label>
                <Textarea
                  id="comment"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full mt-1"
                  placeholder="Share your experience..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={createReviewMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  );
}

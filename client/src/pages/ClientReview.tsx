import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, CheckCircle, ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";

export default function ClientReview() {
  const [, params] = useRoute("/client/review/:bookingCode");
  const [, navigate] = useLocation();
  const bookingCode = params?.bookingCode ?? "";

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fetch booking details
  const { data: bookingData, isLoading, error } = trpc.bookings.getByCode.useQuery(
    { code: bookingCode },
    { enabled: !!bookingCode }
  );

  // Check if already reviewed
  const { data: alreadyReviewed } = trpc.reviews.hasReviewed.useQuery(
    { bookingId: bookingData?.booking.id ?? 0 },
    { enabled: !!bookingData?.booking.id }
  );

  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit review");
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (!bookingData?.booking.id || !bookingData?.booking.photographerId) {
      toast.error("Booking information missing");
      return;
    }
    createReview.mutate({
      bookingId: bookingData.booking.id,
      photographerId: bookingData.booking.photographerId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">Booking not found.</p>
            <Button variant="outline" onClick={() => navigate("/client/bookings")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const booking = bookingData.booking;

  if (booking.status !== "completed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-2">Reviews are only available after a booking is completed.</p>
            <p className="text-sm text-gray-400 mb-4">Current status: <span className="font-medium capitalize">{booking.status.replace(/_/g, " ")}</span></p>
            <Button variant="outline" onClick={() => navigate("/client/bookings")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted || alreadyReviewed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank you for your feedback.</h2>
            <p className="text-gray-500 mb-6">Your review helps other clients find great photographers.</p>
            <Button onClick={() => navigate("/client/bookings")} className="bg-blue-600 hover:bg-blue-700">
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/client/bookings")}
            className="text-gray-500 hover:text-gray-700 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900 text-center">
              Rate Your Photographer
            </CardTitle>
            <p className="text-sm text-gray-500 text-center">Booking #{booking.bookingCode}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photographer Info */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                {bookingData.photographerImage ? (
                  <img
                    src={bookingData.photographerImage}
                    alt={bookingData.photographerName ?? "Photographer"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-blue-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {bookingData.photographerName ?? "Your Photographer"}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {booking.propertyType?.replace(/_/g, " ") ?? "Real Estate Photography"}
                </p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-3">How would you rate your experience?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hovered || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave a comment <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <Textarea
                placeholder="Share your experience with this photographer..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/500</p>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || createReview.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 text-base font-medium"
            >
              {createReview.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

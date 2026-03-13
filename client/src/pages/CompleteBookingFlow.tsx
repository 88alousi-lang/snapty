import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, MapPin, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function CompleteBookingFlow() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get booking details from session/URL params if available
  const bookingDetails = {
    photographerName: "John Smith",
    photographerRating: 4.8,
    propertyAddress: "123 Main Street, Austin, TX 78701",
    scheduledDate: "2026-03-20",
    scheduledTime: "10:00 AM",
    duration: 60,
    totalPrice: 350,
    services: ["Standard Photography", "Drone Shots"],
  };

  const handleCompleteBooking = async () => {
    setIsProcessing(true);
    try {
      // Simulate booking completion
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Booking completed successfully!");
      navigate("/client/bookings");
    } catch (error) {
      toast.error("Failed to complete booking");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to complete your booking</p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Summary</h1>
          <p className="text-gray-600">Review your booking details before confirming</p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Photographer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Photographer</p>
                <p className="text-lg font-semibold text-gray-900">{bookingDetails.photographerName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Rating</p>
                <p className="text-lg font-semibold text-yellow-500">★ {bookingDetails.photographerRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-gray-900">{bookingDetails.propertyAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-gray-900 font-medium">{bookingDetails.scheduledDate}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="text-gray-900 font-medium">{bookingDetails.scheduledTime}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-gray-900 font-medium">{bookingDetails.duration} minutes</p>
            </div>
          </CardContent>
        </Card>

        {/* Services Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Services Included</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {bookingDetails.services.map((service, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {service}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Price Summary Card */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Total Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-gray-700">Total Amount</span>
              <span className="text-3xl font-bold text-blue-600">${bookingDetails.totalPrice}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Payment will be processed securely via Stripe</p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/client/bookings")}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleCompleteBooking}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? "Processing..." : "Confirm & Pay"}
          </Button>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By confirming, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

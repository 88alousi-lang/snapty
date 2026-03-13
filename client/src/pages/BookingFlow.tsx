
import { useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function BookingFlow() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/booking/:photographerId");

  const [step, setStep] = useState(1);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [propertyType, setPropertyType] = useState("");
  const [propertySize, setPropertySize] = useState(1000);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const photographerId = params?.photographerId ? parseInt(params.photographerId) : null;

  const profileQuery = trpc.photographers.getProfile.useQuery(
    { id: photographerId || 0 },
    { enabled: photographerId !== null }
  );

  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: (booking) => {
      if (booking) {
        toast.success("Booking created! Proceeding to payment...");
        navigate(`/client/booking-summary/${booking.bookingCode}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create booking");
    },
  });

  if (!match || !photographerId || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Invalid booking request</p>
      </div>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  if (profileQuery.error || !profileQuery.data?.photographer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Photographer Not Found</h2>
          <p className="text-gray-600 mb-6">The photographer you're trying to book is no longer available or the link is invalid.</p>
          <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const { photographer, services } = profileQuery.data;

  const handleAddressSearch = async () => {
    if (!propertyAddress.trim()) return;

    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: propertyAddress }, (results: any, status: any) => {
        if (status === "OK" && results?.[0]) {
          const location = results[0].geometry.location;
          const addressComponents = results[0].address_components;

          setLatitude(location.lat());
          setLongitude(location.lng());

          // Extract city, state, zip from address components
          addressComponents.forEach((component: any) => {
            if (component.types.includes("locality")) {
              setCity(component.long_name);
            }
            if (component.types.includes("administrative_area_level_1")) {
              setState(component.short_name);
            }
            if (component.types.includes("postal_code")) {
              setZipCode(component.long_name);
            }
          });

          toast.success("Address found!");
        }
      });
    } catch (error) {
      toast.error("Failed to find address");
    }
  };

  const toggleService = (serviceId: number) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateTotal = () => {
    if (!services) return 0;
    return services
      .filter((s) => selectedServices.includes(s.service.id))
      .reduce((sum, s) => sum + parseFloat((s.customPrice || s.service.basePrice).toString()), 0);
  };

  const handleSubmit = async () => {
    if (!propertyAddress || !scheduledDate || !scheduledTime || selectedServices.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (latitude === null || longitude === null) {
      toast.error("Please search and select a valid address");
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const basePrice = propertySize === 1000 ? 150 : propertySize === 2000 ? 220 : propertySize === 3000 ? 300 : 380;
    let addOnPrice = 0;
    if (selectedServices.includes(2)) addOnPrice += 80;
    if (selectedServices.includes(3)) addOnPrice += 150;
    if (selectedServices.includes(4)) addOnPrice += 90;

    createBookingMutation.mutate({
      photographerId,
      propertyAddress,
      latitude,
      longitude,
      city,
      state,
      zipCode,
      propertyType,
      propertySize,
      basePrice,
      addOnPrice: addOnPrice > 0 ? addOnPrice : undefined,
      serviceIds: selectedServices,
      scheduledDate: scheduledDateTime.toISOString(),
      duration,
      specialInstructions,
      totalPrice: calculateTotal(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Book a Photographer</h1>
          <Button variant="outline" onClick={() => navigate("/search")}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8 flex justify-between items-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > s ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Property Address */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Property Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address *</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    placeholder="Enter full property address"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                  />
                  <Button onClick={handleAddressSearch} size="sm">
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {latitude && longitude && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Address verified: {propertyAddress}
                  </p>
                  {city && (
                    <p className="text-sm text-gray-600 mt-1">
                      {city}, {state} {zipCode}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate("/search")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!latitude || !longitude}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Services & Date/Time */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Services & Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Services */}
              <div className="space-y-3">
                <Label>Services *</Label>
                <div className="grid grid-cols-1 gap-3">
                  {services?.map((service) => (
                    <label
                      key={service.service.id}
                      className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.service.id)}
                        onChange={() => toggleService(service.service.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {service.service.name}
                        </p>
                        {service.service.description && (
                          <p className="text-sm text-gray-600">
                            {service.service.description}
                          </p>
                        )}
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          ${service.customPrice || service.service.basePrice}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Shoot Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label htmlFor="time">Shoot Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="30"
                  step="30"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!scheduledDate || !scheduledTime || selectedServices.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Special Instructions */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Special Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property:</span>
                  <span className="font-semibold">{propertyAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-semibold">
                    {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Services:</span>
                  <span className="font-semibold">{selectedServices.length} selected</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-blue-600">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Any special requests or details for the photographer..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createBookingMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

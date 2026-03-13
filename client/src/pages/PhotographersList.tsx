import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Star, Search, Camera, ChevronRight, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useBooking } from "@/contexts/BookingContext";

export default function PhotographersList() {
  const [, navigate] = useLocation();
  const { updateBooking } = useBooking();
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [searchAddress, setSearchAddress] = useState("");
  const [maxDistance, setMaxDistance] = useState(50);

  // search returns { photographer, userName, userEmail, distance }[]
  const photographersQuery = trpc.photographers.search.useQuery(
    {
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      maxDistance,
    },
    { enabled: true }
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        () => {
          toast.info("Enable location to find nearby photographers");
        }
      );
    }
  }, []);

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) {
      toast.error("Please enter an address");
      return;
    }
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: searchAddress }, (results: any, status: any) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          setLatitude(loc.lat());
          setLongitude(loc.lng());
          toast.success("Location updated!");
        } else {
          toast.error("Address not found. Please try again.");
        }
      });
    } catch {
      toast.error("Error searching address");
    }
  };

  const handleSelectPhotographer = (photographerId: number) => {
    updateBooking({ photographerId });
    navigate(`/client/photographer/${photographerId}`);
  };

  const photographers = photographersQuery.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/client/map")} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Find Photographers</h1>
            <p className="text-sm text-gray-500">{photographers.length} available near you</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search by city or address..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddressSearch()}
            className="flex-1 rounded-xl border-gray-200"
          />
          <Button onClick={handleAddressSearch} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Distance slider */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex justify-between items-center mb-2">
            <Label className="text-sm font-medium text-gray-700">Distance</Label>
            <span className="text-sm font-semibold text-blue-600">{maxDistance} miles</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseInt(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        {/* List */}
        {photographersQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : photographers.length === 0 ? (
          <Card className="border-gray-100">
            <CardContent className="py-12 text-center">
              <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium mb-1">No photographers found</p>
              <p className="text-sm text-gray-400">Try increasing the distance or searching a different location</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {photographers.map((item) => {
              const p = item.photographer;
              const name = item.userName ?? `Photographer #${p.id}`;
              const rating = p.averageRating ? parseFloat(String(p.averageRating)) : null;
              const distance = item.distance;

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPhotographer(p.id)}
                  className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.profileImage ? (
                        <img src={p.profileImage} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate">{name}</p>
                        {rating && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
                            {p.totalReviews ? <span className="text-xs text-gray-400">({p.totalReviews})</span> : null}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        {(p.city || p.state) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[p.city, p.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                        {distance !== null && distance !== undefined && (
                          <span className="text-blue-500 font-medium">{distance.toFixed(1)} mi</span>
                        )}
                      </div>
                      {p.bio && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.bio}</p>
                      )}
                      {p.yearsExperience && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                            {p.yearsExperience}y exp
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

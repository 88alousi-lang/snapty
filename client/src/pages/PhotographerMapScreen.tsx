import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Camera,
  Star,
  MapPin,
  Navigation,
  ChevronRight,
  X,
  Loader2,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { MapView } from "@/components/Map";
import { useBooking } from "@/contexts/BookingContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

/* ─── Service filter config ─────────────────────────────────────── */
const SERVICE_FILTERS = [
  { key: "all", label: "All", icon: "✦" },
  { key: "photography", label: "Photography", icon: "📷" },
  { key: "drone", label: "Drone", icon: "🚁" },
  { key: "video", label: "Video", icon: "🎬" },
  { key: "floor_plans", label: "Floor Plans", icon: "📐" },
];

/* ─── Helpers ───────────────────────────────────────────────────── */
function getServiceIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("drone")) return "🚁";
  if (n.includes("video")) return "🎬";
  if (n.includes("floor")) return "📐";
  return "📷";
}

function matchesFilter(
  services: Array<{ service: { name: string; serviceType: string } }>,
  filterKey: string
) {
  if (filterKey === "all") return true;
  return services.some((s) => {
    const n = s.service.name.toLowerCase();
    if (filterKey === "photography") return n.includes("photo");
    if (filterKey === "drone") return n.includes("drone");
    if (filterKey === "video") return n.includes("video");
    if (filterKey === "floor_plans") return n.includes("floor");
    return false;
  });
}

function getMinPrice(
  services: Array<{ service: { basePrice: string | number; serviceType: string }; customPrice: string | number | null }>
) {
  const baseSvcs = services.filter((s) => s.service.serviceType === "base");
  if (baseSvcs.length === 0) return null;
  const prices = baseSvcs.map((s) =>
    parseFloat(String(s.customPrice ?? s.service.basePrice))
  );
  return Math.min(...prices);
}

/* ─── Custom pin HTML for AdvancedMarkerElement ─────────────────── */
function createPinElement(label: string, selected: boolean, rating: number | null) {
  const el = document.createElement("div");
  el.style.cssText = `
    display: flex; flex-direction: column; align-items: center;
    cursor: pointer; transition: transform 0.15s ease;
    transform: ${selected ? "scale(1.2)" : "scale(1)"};
  `;

  // Bubble (safe DOM — no innerHTML)
  const bubble = document.createElement("div");
  bubble.style.cssText = `
    background: ${selected ? "#1d4ed8" : "#2563eb"};
    color: white;
    border-radius: 20px;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 3px 10px rgba(37,99,235,0.45);
    border: 2.5px solid ${selected ? "#93c5fd" : "white"};
    letter-spacing: -0.2px;
  `;
  bubble.textContent = label;   // ← textContent, never innerHTML

  // Caret
  const caret = document.createElement("div");
  caret.style.cssText = `
    width: 0; height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid ${selected ? "#1d4ed8" : "#2563eb"};
    margin-top: -1px;
  `;

  el.appendChild(bubble);
  el.appendChild(caret);
  return el;
}

/* ─── Photographer Card (slide-up panel) ────────────────────────── */
type PhotographerResult = {
  photographer: {
    id: number;
    profileImage: string | null;
    bio: string | null;
    city: string | null;
    state: string | null;
    latitude: number | null;
    longitude: number | null;
    averageRating: string | null;
    totalReviews: number | null;
    yearsExperience: number | null;
  };
  userName: string | null;
  distance: number | null;
  services: Array<{
    service: { id: number; name: string; basePrice: string | number; serviceType: string };
    customPrice: string | number | null;
  }>;
};

function PhotographerCard({
  item,
  onClose,
  onViewProfile,
}: {
  item: PhotographerResult;
  onClose: () => void;
  onViewProfile: () => void;
}) {
  const p = item.photographer;
  const name = item.userName ?? `Photographer #${p.id}`;
  const rating = p.averageRating ? parseFloat(String(p.averageRating)) : null;
  const minPrice = getMinPrice(item.services);
  const displayServices = item.services.slice(0, 4);

  return (
    <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden">
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-gray-200 rounded-full" />
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      <div className="px-5 pb-5 pt-2">
        {/* Profile row */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            {p.profileImage ? (
              <img src={p.profileImage} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-7 h-7 text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-extrabold text-gray-900 leading-tight">{name}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {rating !== null && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-gray-800">{rating.toFixed(1)}</span>
                  {p.totalReviews ? (
                    <span className="text-xs text-gray-400">({p.totalReviews})</span>
                  ) : null}
                </div>
              )}
              {item.distance !== null && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span className="font-semibold text-blue-600">{item.distance.toFixed(1)} mi away</span>
                </div>
              )}
              {minPrice !== null && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  From ${minPrice}
                </span>
              )}
            </div>
            {(p.city || p.state) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {[p.city, p.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {p.bio && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">{p.bio}</p>
        )}

        {/* Services offered */}
        {displayServices.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Services Offered</p>
            <div className="flex flex-wrap gap-2">
              {displayServices.map((s) => (
                <span
                  key={s.service.id}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full"
                >
                  <span>{getServiceIcon(s.service.name)}</span>
                  {s.service.name}
                </span>
              ))}
              {item.services.length > 4 && (
                <span className="text-xs font-semibold text-gray-400 px-2 py-1.5">
                  +{item.services.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onViewProfile}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-base py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
        >
          View Profile & Book
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function PhotographerMapScreen() {
  const [, navigate] = useLocation();
  const { booking, updateBooking } = useBooking();

  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [noPhotographersFound, setNoPhotographersFound] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Use booking location if available, otherwise get user location
  useEffect(() => {
    if (booking.latitude && booking.longitude) {
      setUserLocation({ lat: booking.latitude, lng: booking.longitude });
      setLocationLoading(false);
      return;
    }
    
    if (!navigator.geolocation) {
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setUserLocation({ lat: 37.7749, lng: -122.4194 });
        setLocationLoading(false);
      },
      { timeout: 8000 }
    );
  }, [booking.latitude, booking.longitude]);

  // Fetch photographers with services
  const photographersQuery = trpc.photographers.searchWithServices.useQuery(
    { latitude: userLocation?.lat, longitude: userLocation?.lng, maxDistance: 25 },
    { enabled: !!userLocation }
  );

  const allPhotographers = photographersQuery.data ?? [];
  
  // Check for no photographers and get waitlist count
  useEffect(() => {
    if (!photographersQuery.isLoading && allPhotographers.length === 0 && userLocation) {
      setNoPhotographersFound(true);
      setWaitlistCount(0);
    } else {
      setNoPhotographersFound(false);
    }
  }, [allPhotographers, photographersQuery.isLoading, userLocation]);

  // Filter by active service filter
  const filteredPhotographers = useMemo(
    () => allPhotographers.filter((p) => matchesFilter(p.services, activeFilter)),
    [allPhotographers, activeFilter]
  );

  const selectedItem = filteredPhotographers.find((p) => p.photographer.id === selectedId) ?? null;

  // Center map on user
  const centerOnUser = useCallback(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(13);
    }
  }, [userLocation]);

  // Update pin styles when selection changes
  const updatePinStyles = useCallback(() => {
    markersRef.current.forEach((marker, id) => {
      const item = filteredPhotographers.find((p) => p.photographer.id === id);
      if (!item) return;
      const name = item.userName ?? `#${id}`;
      const label = item.distance !== null ? `${item.distance.toFixed(1)} mi` : name.split(" ")[0];
      const el = createPinElement(label, id === selectedId, null);
      marker.content = el;
    });
  }, [filteredPhotographers, selectedId]);

  useEffect(() => {
    updatePinStyles();
  }, [updatePinStyles]);

  // Place markers when map is ready and photographers load
  const placeMarkers = useCallback(
    (map: google.maps.Map) => {
      // Clear old markers
      markersRef.current.forEach((m) => (m.map = null));
      markersRef.current.clear();

      filteredPhotographers.forEach((item) => {
        const p = item.photographer;
        if (!p.latitude || !p.longitude) return;

        const name = item.userName ?? `#${p.id}`;
        const label = item.distance !== null ? `${item.distance.toFixed(1)} mi` : name.split(" ")[0];

        const el = createPinElement(label, p.id === selectedId, null);

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: p.latitude, lng: p.longitude },
          title: name,
          content: el,
        });

        marker.addListener("click", () => {
          setSelectedId(p.id);
          map.panTo({ lat: p.latitude!, lng: p.longitude! });
          map.setZoom(14);
        });

        markersRef.current.set(p.id, marker);
      });
    },
    [filteredPhotographers, selectedId]
  );

  // Re-place markers when filter or photographers change
  useEffect(() => {
    if (mapRef.current) {
      placeMarkers(mapRef.current);
    }
  }, [placeMarkers]);

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      // Uber-style map options
      map.setOptions({
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: false,
        gestureHandling: "greedy",
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      });

      // User location dot
      if (userLocation) {
        map.setCenter(userLocation);
        map.setZoom(13);

        const userDot = document.createElement("div");
        userDot.style.cssText = `
          width: 20px; height: 20px;
          background: #22c55e;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(34,197,94,0.6);
        `;
        userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: userLocation,
          title: "Your Location",
          content: userDot,
          zIndex: 999,
        });
      }

      placeMarkers(map);

      // Click on map background to deselect
      map.addListener("click", () => setSelectedId(null));
    },
    [userLocation, placeMarkers]
  );

  const handleViewProfile = () => {
    if (selectedItem) {
      updateBooking({ photographerId: selectedItem.photographer.id });
      navigate(`/client/photographer/${selectedItem.photographer.id}`);
    }
  };

  const isLoading = locationLoading || photographersQuery.isLoading;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      {/* ── Fullscreen Map ── */}
      {userLocation ? (
        <MapView
          className="absolute inset-0 w-full h-full"
          initialCenter={userLocation}
          initialZoom={13}
          onMapReady={handleMapReady}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Getting your location…</p>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-lg mx-auto px-4 pt-4 flex items-start gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate("/client/property-details")}
            className="pointer-events-auto w-11 h-11 flex items-center justify-center bg-white rounded-2xl shadow-lg hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Title pill */}
          <div className="pointer-events-auto flex-1 bg-white rounded-2xl shadow-lg px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-tight">Nearby Photographers</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {isLoading
                    ? "Searching…"
                    : `${filteredPhotographers.length} available${activeFilter !== "all" ? ` · ${SERVICE_FILTERS.find((f) => f.key === activeFilter)?.label}` : ""}`}
                </p>
              </div>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            </div>
          </div>
        </div>

        {/* Step progress */}
        <div className="max-w-lg mx-auto px-4 mt-2 pointer-events-none">
          <div className="flex items-center gap-1 justify-end">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={cn(
                  "rounded-full",
                  s <= 3 ? "bg-blue-600" : "bg-white/60",
                  s === 3 ? "w-5 h-1.5" : "w-1.5 h-1.5"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Service Filter Pills ── */}
      <div className="absolute top-24 left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-1 pointer-events-auto scrollbar-hide">
            {SERVICE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setActiveFilter(f.key);
                  setSelectedId(null);
                }}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold shadow-md transition-all",
                  activeFilter === f.key
                    ? "bg-blue-600 text-white shadow-blue-300"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                <span>{f.icon}</span>
                {f.label}
                {activeFilter === f.key && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── GPS Center Button ── */}
      <button
        onClick={centerOnUser}
        className="absolute right-4 z-30 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
        style={{ bottom: selectedItem ? "calc(50vh + 16px)" : "120px" }}
      >
        <Navigation className="w-5 h-5 text-blue-600" />
      </button>

      {/* ── Zoom Controls ── */}
      <div
        className="absolute right-4 z-30 flex flex-col gap-1"
        style={{ bottom: selectedItem ? "calc(50vh + 80px)" : "188px" }}
      >
        <button
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 13) + 1)}
          className="w-12 h-12 bg-white rounded-t-2xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700 font-bold text-xl"
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 13) - 1)}
          className="w-12 h-12 bg-white rounded-b-2xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-700 font-bold text-xl border-t border-gray-100"
        >
          −
        </button>
      </div>

      {/* ── Empty state (no photographers, no card) ── */}
      {!isLoading && filteredPhotographers.length === 0 && !selectedItem && (
        <div className="absolute bottom-24 left-0 right-0 z-30 px-4">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-5 text-center">
            <Camera className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700 mb-1">No photographers found</p>
            <p className="text-xs text-gray-400 mb-3">
              {activeFilter !== "all"
                ? `No ${SERVICE_FILTERS.find((f) => f.key === activeFilter)?.label} photographers nearby. Try a different filter.`
                : "No approved photographers in this area yet."}
            </p>
            {activeFilter !== "all" && (
              <button
                onClick={() => setActiveFilter("all")}
                className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl"
              >
                Show All
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Photographer count badge (when no card shown) ── */}
      {!selectedItem && !isLoading && filteredPhotographers.length > 0 && (
        <div className="absolute bottom-6 left-0 right-0 z-30 px-4 pointer-events-none">
          <div className="max-w-lg mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg px-5 py-3 flex items-center justify-between pointer-events-auto">
              <div>
                <p className="text-sm font-extrabold text-gray-900">
                  {filteredPhotographers.length} photographer{filteredPhotographers.length !== 1 ? "s" : ""} nearby
                </p>
                <p className="text-xs text-gray-400">Tap a pin to see details</p>
              </div>
              <div className="flex -space-x-2">
                {filteredPhotographers.slice(0, 3).map((item) => (
                  <div
                    key={item.photographer.id}
                    className="w-9 h-9 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center overflow-hidden flex-shrink-0"
                  >
                    {item.photographer.profileImage ? (
                      <img
                        src={item.photographer.profileImage}
                        alt={item.userName ?? ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                ))}
                {filteredPhotographers.length > 3 && (
                  <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-white">+{filteredPhotographers.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Photographer Card (slide-up) ── */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out",
          selectedItem ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="max-w-lg mx-auto relative">
          {selectedItem && (
            <PhotographerCard
              item={selectedItem}
              onClose={() => setSelectedId(null)}
              onViewProfile={handleViewProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

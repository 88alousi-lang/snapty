import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  MapPin,
  Home,
  Ruler,
  BedDouble,
  Bath,
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useBooking, calculatePriceFromRules } from "@/contexts/BookingContext";
import { cn } from "@/lib/utils";

/* ─── Constants ─────────────────────────────────────────────────── */
const PROPERTY_TYPES = [
  { id: "house", label: "House", icon: "🏠" },
  { id: "condo", label: "Condo", icon: "🏢" },
  { id: "townhouse", label: "Townhouse", icon: "🏘️" },
  { id: "commercial", label: "Commercial", icon: "🏬" },
  { id: "land", label: "Land / Lot", icon: "🌿" },
  { id: "multi_family", label: "Multi-Family", icon: "🏗️" },
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00",
];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* ─── Mini Calendar ─────────────────────────────────────────────── */
function MiniCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const selected = value ? new Date(value + "T12:00:00") : null;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d < t;
  };
  const isSelected = (day: number) =>
    !!selected &&
    selected.getFullYear() === viewYear &&
    selected.getMonth() === viewMonth &&
    selected.getDate() === day;
  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const handleDay = (day: number) => {
    if (isDisabled(day)) return;
    const d = new Date(viewYear, viewMonth, day);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    onChange(iso);
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-bold text-gray-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dis = isDisabled(day);
          const sel = isSelected(day);
          const tod = isToday(day);
          return (
            <button
              key={day}
              onClick={() => handleDay(day)}
              disabled={dis}
              className={cn(
                "w-full aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-all",
                sel && "bg-blue-600 text-white font-bold",
                !sel && tod && "bg-blue-50 text-blue-700 font-bold",
                !sel && !tod && !dis && "text-gray-700 hover:bg-gray-100",
                dis && "text-gray-300 cursor-not-allowed"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Counter ───────────────────────────────────────────────────── */
function Counter({
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all font-bold text-xl leading-none"
      >
        −
      </button>
      <span className="w-8 text-center text-xl font-extrabold text-gray-900">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all font-bold text-xl leading-none"
      >
        +
      </button>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function PropertyDetails() {
  const [, navigate] = useLocation();
  const { booking, updateBooking } = useBooking();

  const [address, setAddress] = useState(booking.propertyAddress || "");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [propertyType, setPropertyType] = useState(booking.propertyType || "house");
  const [propertySize, setPropertySize] = useState(booking.propertySize || 1000);
  const [bedrooms, setBedrooms] = useState(booking.bedrooms ?? 3);
  const [bathrooms, setBathrooms] = useState(booking.bathrooms ?? 2);
  const [instructions, setInstructions] = useState(booking.specialInstructions || "");
  const [selectedDate, setSelectedDate] = useState(booking.scheduledDate || "");
  const [selectedTime, setSelectedTime] = useState(booking.scheduledTime || "");

  // Google Maps autocomplete
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const scriptLoadingRef = useRef(false);

  const loadMapsScript = useCallback((): Promise<void> => {
    if ((window as any).google?.maps?.places) return Promise.resolve();
    const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
    const forgeBase =
      import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
      "https://forge.butterfly-effect.dev";
    const src = `${forgeBase}/v1/maps/proxy/maps/api/js?key=${apiKey}&v=weekly&libraries=marker,places,geocoding,geometry`;
    if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.crossOrigin = "anonymous";
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
  }, []);

  // Pricing from DB
  const pricingQuery = trpc.services.pricingRules.useQuery();
  const servicesQuery = trpc.services.list.useQuery();
  const pricingRules = pricingQuery.data ?? [];
  const services = servicesQuery.data ?? [];

  const sizeOptions = useMemo(() => {
    if (pricingRules.length === 0) {
      return [
        { label: "Up to 1,000 sqft", value: 1000, price: 150 },
        { label: "1,001 – 2,000 sqft", value: 2000, price: 220 },
        { label: "2,001 – 3,000 sqft", value: 3000, price: 300 },
        { label: "4,000+ sqft", value: 4000, price: 380 },
      ];
    }
    return [...pricingRules]
      .sort((a, b) => a.minSqft - b.minSqft)
      .map((rule) => ({
        label:
          rule.label ??
          `${rule.minSqft.toLocaleString()}${rule.maxSqft ? ` – ${rule.maxSqft.toLocaleString()}` : "+"} sqft`,
        value: rule.maxSqft ?? rule.minSqft,
        price: parseFloat(String(rule.price)),
      }));
  }, [pricingRules]);

  const pricing = useMemo(
    () => calculatePriceFromRules(booking.selectedServices, propertySize, pricingRules, services),
    [booking.selectedServices, propertySize, pricingRules, services]
  );

  // Init Google Maps Places Autocomplete
  useEffect(() => {
    let cancelled = false;
    const initAutocomplete = () => {
      const g = (window as any).google;
      if (!g?.maps?.places || !addressInputRef.current || autocompleteRef.current) return;
      autocompleteRef.current = new g.maps.places.Autocomplete(
        addressInputRef.current,
        { types: ["address"], fields: ["formatted_address"] }
      );
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          setAddress(place.formatted_address);
          // Extract latitude and longitude from place
          if (place?.geometry?.location) {
            setLatitude(place.geometry.location.lat());
            setLongitude(place.geometry.location.lng());
          }
        }
      });
      if (!cancelled) setMapReady(true);
    };
    loadMapsScript().then(() => {
      if (!cancelled) initAutocomplete();
    });
    const iv = setInterval(() => {
      if ((window as any).google?.maps?.places) {
        initAutocomplete();
        clearInterval(iv);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [loadMapsScript]);

  const canContinue =
    address.trim().length > 3 && selectedDate !== "" && selectedTime !== "";

  const handleContinue = () => {
    if (!canContinue) return;
    updateBooking({
      propertyAddress: address.trim(),
      propertyType,
      propertySize,
      bedrooms,
      bathrooms,
      specialInstructions: instructions.trim(),
      scheduledDate: selectedDate,
      scheduledTime: selectedTime,
      basePrice: pricing.base,
      addOnPrice: pricing.addOn,
      totalPrice: pricing.total,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
    });
    navigate("/client/photographer-map");
  };

  const formattedDate = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  const isLoading = pricingQuery.isLoading || servicesQuery.isLoading;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => navigate("/client/services")}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-extrabold text-gray-900">Property Details</h1>
            <p className="text-xs text-gray-400 font-medium">Step 2 of 5</p>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={cn(
                  "rounded-full transition-all",
                  s <= 2 ? "bg-blue-600" : "bg-gray-200",
                  s === 2 ? "w-5 h-1.5" : "w-1.5 h-1.5"
                )}
              />
            ))}
          </div>
        </div>
        <div className="h-0.5 bg-gray-100">
          <div className="h-0.5 bg-blue-600" style={{ width: "40%" }} />
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto pb-52">
        {/* Hero intro */}
        <div className="bg-gradient-to-b from-blue-50 to-gray-50 px-4 pt-6 pb-5">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-extrabold text-gray-900">
              Tell us about your property
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              We'll match you with nearby photographers and show accurate pricing.
            </p>
          </div>
        </div>

        <div className="px-4 max-w-lg mx-auto space-y-4 pt-3">

          {/* Address */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">Property Address</span>
              {!mapReady && (
                <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Autocomplete loading…
                </span>
              )}
            </div>
            <div className="px-4 pb-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={addressInputRef}
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Start typing an address…"
                  className="w-full pl-9 pr-4 py-3 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50 placeholder-gray-400"
                />
              </div>
            </div>
          </section>

          {/* Property Type */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Home className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">Property Type</span>
            </div>
            <div className="px-4 pb-4 grid grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => setPropertyType(pt.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all",
                    propertyType === pt.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200"
                  )}
                >
                  <span className="text-xl leading-none">{pt.icon}</span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold leading-tight text-center",
                      propertyType === pt.id ? "text-blue-700" : "text-gray-600"
                    )}
                  >
                    {pt.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Property Size */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Ruler className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">Property Size</span>
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400 ml-auto" />
              )}
            </div>
            <div className="px-4 pb-4 space-y-2">
              {sizeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPropertySize(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
                    propertySize === opt.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 hover:border-gray-200 bg-gray-50"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      propertySize === opt.value ? "text-blue-700" : "text-gray-700"
                    )}
                  >
                    {opt.label}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold",
                      propertySize === opt.value ? "text-blue-600" : "text-gray-500"
                    )}
                  >
                    ${opt.price}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Bedrooms & Bathrooms */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-4 pt-4 pb-4 grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <BedDouble className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Bedrooms</span>
                </div>
                <Counter value={bedrooms} onChange={setBedrooms} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <Bath className="w-4 h-4 text-cyan-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Bathrooms</span>
                </div>
                <Counter value={bathrooms} onChange={setBathrooms} />
              </div>
            </div>
          </section>

          {/* Date Picker */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">Shoot Date</span>
              {formattedDate && (
                <span className="ml-auto text-xs font-bold text-blue-600">
                  {formattedDate}
                </span>
              )}
            </div>
            <div className="px-4 pb-4">
              <MiniCalendar value={selectedDate} onChange={setSelectedDate} />
            </div>
          </section>

          {/* Time Slots */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-violet-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">Preferred Time</span>
              {selectedTime && (
                <span className="ml-auto text-xs font-bold text-blue-600">
                  {formatTime(selectedTime)}
                </span>
              )}
            </div>
            <div className="px-4 pb-4 grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={cn(
                    "py-2.5 rounded-xl border-2 text-xs font-bold transition-all",
                    selectedTime === slot
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-gray-100 text-gray-600 hover:border-gray-200 bg-gray-50"
                  )}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          </section>

          {/* Special Instructions */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-bold text-gray-900">Special Instructions</span>
              <span className="ml-auto text-[10px] text-gray-400">Optional</span>
            </div>
            <div className="px-4 pb-4">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Gate code, parking info, access notes, specific rooms to focus on…"
                rows={3}
                className="w-full text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 p-3 bg-gray-50 placeholder-gray-400 resize-none"
              />
            </div>
          </section>

        </div>
      </main>

      {/* Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Price summary */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <p className="text-xs text-gray-400 font-medium">Estimated total</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                ) : (
                  <>
                    <span className="text-2xl font-extrabold text-gray-900">
                      ${pricing.total > 0 ? pricing.total : pricing.base || "—"}
                    </span>
                    <span className="text-xs text-gray-400">starting price</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <div className="text-xs text-gray-500">
                Base:{" "}
                <strong className="text-gray-700">${pricing.base}</strong>
              </div>
              {pricing.addOn > 0 && (
                <div className="text-xs text-gray-500">
                  Add-ons:{" "}
                  <strong className="text-blue-600">+${pricing.addOn}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Validation hints */}
          {!canContinue && (
            <div className="flex flex-wrap gap-2 mb-2 px-1">
              {!address.trim() && (
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Address required
                </span>
              )}
              {!selectedDate && (
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date required
                </span>
              )}
              {!selectedTime && (
                <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time required
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={cn(
              "w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all",
              canContinue
                ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            Find Photographers
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

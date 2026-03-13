import { useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import {
  Loader2, Star, MapPin, Camera, ArrowLeft, Calendar,
  Award, Clock, CheckCircle2, ChevronLeft, ChevronRight,
  Image as ImageIcon, Zap, Video, Layers, X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PhotographerLayout } from "@/components/layouts/PhotographerLayout";

/* ─── Fallback portfolio images (CDN) ───────────────────────────── */
const FALLBACK_PORTFOLIO = [
  {
    id: "f1",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029168506/hRDTnoMUg9RrhxuCxnRSRa/interior-1_01db7dab.jpg",
    caption: "Living Room",
    tag: "Interior",
  },
  {
    id: "f2",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029168506/hRDTnoMUg9RrhxuCxnRSRa/interior-2_74efd3ec.jpg",
    caption: "Open Plan",
    tag: "Interior",
  },
  {
    id: "f3",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029168506/hRDTnoMUg9RrhxuCxnRSRa/interior-3_dc258fc4.jpg",
    caption: "Kitchen & Dining",
    tag: "Interior",
  },
  {
    id: "f4",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029168506/hRDTnoMUg9RrhxuCxnRSRa/aerial-1_25b07b05.jpg",
    caption: "Aerial Estate",
    tag: "Drone",
  },
  {
    id: "f5",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029168506/hRDTnoMUg9RrhxuCxnRSRa/aerial-2_c8bb3344.jpg",
    caption: "Aerial View",
    tag: "Drone",
  },
  {
    id: "f6",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029168506/hRDTnoMUg9RrhxuCxnRSRa/aerial-3_8a7a2c40.jpg",
    caption: "Neighborhood",
    tag: "Drone",
  },
  {
    id: "f7",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029168506/hRDTnoMUg9RrhxuCxnRSRa/exterior-1_addd419a.jpg",
    caption: "Modern Exterior",
    tag: "Exterior",
  },
  {
    id: "f8",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310419663029168506/hRDTnoMUg9RrhxuCxnRSRa/exterior-2_2c250d7b.jpg",
    caption: "Garden Exterior",
    tag: "Exterior",
  },
];

/* ─── Service config ─────────────────────────────────────────────── */
function getServiceMeta(name: string) {
  const n = name.toLowerCase();
  if (n.includes("drone"))
    return { icon: <Zap className="w-5 h-5" />, color: "bg-violet-50 text-violet-700 border-violet-100", badge: "bg-violet-100 text-violet-700" };
  if (n.includes("video"))
    return { icon: <Video className="w-5 h-5" />, color: "bg-rose-50 text-rose-700 border-rose-100", badge: "bg-rose-100 text-rose-700" };
  if (n.includes("floor"))
    return { icon: <Layers className="w-5 h-5" />, color: "bg-amber-50 text-amber-700 border-amber-100", badge: "bg-amber-100 text-amber-700" };
  return { icon: <Camera className="w-5 h-5" />, color: "bg-blue-50 text-blue-700 border-blue-100", badge: "bg-blue-100 text-blue-700" };
}

/* ─── Calendar helpers ───────────────────────────────────────────── */
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

function to24(slot: string) {
  const [time, meridiem] = slot.split(" ");
  let [h, m] = time.split(":").map(Number);
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isDayAvailable(
  date: Date,
  availability: Array<{ dayOfWeek: number | null; isAvailable: boolean | null }>
) {
  if (availability.length === 0) return true; // no restrictions = open
  const dow = date.getDay();
  const rule = availability.find((a) => a.dayOfWeek === dow);
  if (!rule) return true;
  return rule.isAvailable ?? true;
}

/* ─── Lightbox ───────────────────────────────────────────────────── */
function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: { url: string; caption?: string | null; tag?: string }[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const img = images[index];
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="max-w-3xl max-h-[80vh] mx-16" onClick={(e) => e.stopPropagation()}>
        <img
          src={img.url}
          alt={img.caption ?? "Portfolio"}
          className="max-w-full max-h-[75vh] object-contain rounded-xl"
        />
        {img.caption && (
          <p className="text-white/70 text-sm text-center mt-3">{img.caption}</p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
        {images.map((_, i) => (
          <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === index ? "bg-white" : "bg-white/30")} />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function PhotographerProfilePage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/client/photographer/:id");
  const { booking, updateBooking } = useBooking();
  const { user } = useAuth();

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(booking.scheduledDate || "");
  const [selectedTime, setSelectedTime] = useState<string>(booking.scheduledTime || "");

  const photographerId = params?.id ? parseInt(params.id) : null;

  const profileQuery = trpc.photographers.getProfile.useQuery(
    { id: photographerId ?? 0 },
    { enabled: !!photographerId }
  );

  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      updateBooking({ photographerId: photographerId ?? undefined });
      // Store booking reference so /client/payment can load the payment intent
      if (data) {
        try {
          sessionStorage.setItem(
            "snapty_pending_booking",
            JSON.stringify({ id: data.id, bookingCode: data.bookingCode })
          );
        } catch {}
      }
      navigate("/client/payment");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create booking");
    },
  });

  if (!match) return null;

  if (profileQuery.isLoading) {
    return (
    <PhotographerLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
      </PhotographerLayout>
  );
  }

  if (!profileQuery.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6">
        <Camera className="w-14 h-14 text-gray-200" />
        <p className="text-gray-600 font-semibold text-lg">Photographer not found</p>
        <button
          onClick={() => navigate("/client/photographer-map")}
          className="flex items-center gap-2 text-blue-600 font-semibold bg-blue-50 px-5 py-3 rounded-2xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to map
        </button>
      </div>
    );
  }

  const { photographer: p, userName, services, reviews, portfolio, availability } = profileQuery.data;
  const name = userName ?? `Photographer #${p.id}`;
  const rating = p.averageRating ? parseFloat(String(p.averageRating)) : null;

  /* ── Portfolio images ── */
  const portfolioImages =
    portfolio.length > 0
      ? portfolio.map((img: any) => ({ id: String(img.id), url: img.imageUrl, caption: img.caption, tag: "Portfolio" }))
      : FALLBACK_PORTFOLIO;

  /* ── Services split ── */
  const baseServices = services.filter((s: any) => s.service?.serviceType === "base");
  const addonServices = services.filter((s: any) => s.service?.serviceType === "addon");

  /* ── Min base price ── */
  const minBasePrice = baseServices.length > 0
    ? Math.min(...baseServices.map((s: any) => parseFloat(String(s.customPrice ?? s.service?.basePrice ?? 0))))
    : null;

  /* ── Calendar grid ── */
  const calDays = useMemo(() => {
    const { year, month } = calMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cells: Array<{ date: Date | null; dateStr: string; available: boolean; isPast: boolean }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, dateStr: "", available: false, isPast: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isPast = date < today;
      const available = !isPast && isDayAvailable(date, availability);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date, dateStr, available, isPast });
    }
    return cells;
  }, [calMonth, availability]);

  /* ── Book handler ── */
  const handleBook = () => {
    if (!user) {
      localStorage.setItem("snapty_role_intent", "client");
      window.location.href = getLoginUrl();
      return;
    }
    const finalDate = selectedDate || booking.scheduledDate;
    const finalTime = selectedTime || booking.scheduledTime;
    if (!booking.propertyAddress) {
      toast.error("Please fill in the property details first");
      navigate("/client/property-details");
      return;
    }
    if (!finalDate || !finalTime) {
      toast.error("Please select a date and time slot");
      return;
    }
    const allServices = services.map((s: any) => s.service?.id ?? s.serviceId).filter(Boolean);
    const scheduledDateTime = new Date(`${finalDate}T${to24(finalTime || "09:00")}`);
    updateBooking({ scheduledDate: finalDate, scheduledTime: finalTime });
    createBookingMutation.mutate({
      photographerId: photographerId ?? undefined,
      propertyAddress: booking.propertyAddress,
      propertyType: booking.propertyType,
      propertySize: booking.propertySize,
      serviceIds: allServices.length > 0 ? allServices : [1],
      scheduledDate: scheduledDateTime.toISOString(),
      specialInstructions: booking.specialInstructions,
      basePrice: booking.basePrice,
      addOnPrice: booking.addOnPrice,
      totalPrice: booking.totalPrice || booking.basePrice,
    });
  };

  const prevMonth = () =>
    setCalMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  const nextMonth = () =>
    setCalMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );

  const today = new Date();
  const isCurrentMonth =
    calMonth.year === today.getFullYear() && calMonth.month === today.getMonth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/client/photographer-map")}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-gray-900 leading-tight">{name}</p>
            <p className="text-xs text-gray-400">Step 4 of 5</p>
          </div>
          {minBasePrice !== null && (
            <span className="text-sm font-extrabold text-blue-600">From ${minBasePrice}</span>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-blue-500 transition-all" style={{ width: "80%" }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto pb-36">
        {/* ── 1. Profile Hero ── */}
        <div className="bg-white">
          {/* Cover gradient */}
          <div className="h-28 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
            />
          </div>

          <div className="px-5 pb-5">
            {/* Avatar overlapping cover */}
            <div className="flex items-end gap-4 -mt-10 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                {p.profileImage ? (
                  <img src={p.profileImage} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-blue-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 pb-1">
                {/* Verified badge */}
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500" />
                  <span className="text-xs font-bold text-blue-600">Verified Photographer</span>
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{name}</h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {rating !== null && (
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-4 h-4",
                          s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-extrabold text-gray-800">{rating.toFixed(1)}</span>
                  {p.totalReviews ? (
                    <span className="text-xs text-gray-400">({p.totalReviews} review{p.totalReviews !== 1 ? "s" : ""})</span>
                  ) : null}
                </div>
              )}
              {(p.city || p.state) && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{[p.city, p.state].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {p.yearsExperience && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Award className="w-3.5 h-3.5 text-gray-400" />
                  <span>{p.yearsExperience}y exp</span>
                </div>
              )}
            </div>

            {p.bio && (
              <p className="text-sm text-gray-600 leading-relaxed mt-3">{p.bio}</p>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xl font-extrabold text-gray-900">{p.totalReviews ?? 0}</p>
                <p className="text-xs text-gray-400 font-medium">Reviews</p>
              </div>
              <div className="text-center border-x border-gray-100">
                <p className="text-xl font-extrabold text-gray-900">{portfolioImages.length}</p>
                <p className="text-xs text-gray-400 font-medium">Photos</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-extrabold text-gray-900">{services.length}</p>
                <p className="text-xs text-gray-400 font-medium">Services</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Portfolio Gallery ── */}
        <div className="bg-white mt-3 px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              Portfolio
            </h2>
            <span className="text-xs text-gray-400 font-medium">{portfolioImages.length} photos</span>
          </div>

          {/* Hero image */}
          <button
            className="w-full aspect-video rounded-2xl overflow-hidden mb-2 relative group"
            onClick={() => setLightboxIdx(0)}
          >
            <img
              src={portfolioImages[0].url}
              alt={portfolioImages[0].caption ?? "Portfolio"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {portfolioImages[0].tag && (
              <span className="absolute top-3 left-3 text-xs font-bold bg-black/50 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                {portfolioImages[0].tag}
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Grid of remaining */}
          <div className="grid grid-cols-3 gap-2">
            {portfolioImages.slice(1, 7).map((img, i) => {
              const isLast = i === 5 && portfolioImages.length > 7;
              return (
                <button
                  key={img.id}
                  className="aspect-square rounded-xl overflow-hidden relative group"
                  onClick={() => setLightboxIdx(i + 1)}
                >
                  <img
                    src={img.url}
                    alt={img.caption ?? "Portfolio"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                      <span className="text-white font-extrabold text-lg">+{portfolioImages.length - 7}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3 & 4. Services + Pricing ── */}
        <div className="bg-white mt-3 px-5 py-5">
          <h2 className="text-base font-extrabold text-gray-900 mb-4">Services & Pricing</h2>

          {services.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No services listed yet.</p>
          ) : (
            <div className="space-y-3">
              {/* Base services */}
              {baseServices.map((svc: any) => {
                const svcName = svc.service?.name ?? "Photography";
                const meta = getServiceMeta(svcName);
                const price = parseFloat(String(svc.customPrice ?? svc.service?.basePrice ?? 0));
                const delivery = svc.service?.deliveryTime;
                const desc = svc.service?.description;
                return (
                  <div
                    key={svc.service?.id ?? svc.serviceId}
                    className={cn("flex items-start gap-4 p-4 rounded-2xl border", meta.color)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-extrabold">{svcName}</p>
                          {desc && <p className="text-xs opacity-70 mt-0.5 leading-relaxed">{desc}</p>}
                          {delivery && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Clock className="w-3 h-3 opacity-60" />
                              <span className="text-xs font-semibold opacity-70">{delivery}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-extrabold">${price}</p>
                          <p className="text-xs opacity-60">base</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add-on services */}
              {addonServices.length > 0 && (
                <>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-1">Add-ons</p>
                  {addonServices.map((svc: any) => {
                    const svcName = svc.service?.name ?? "Add-on";
                    const meta = getServiceMeta(svcName);
                    const price = parseFloat(String(svc.customPrice ?? svc.service?.basePrice ?? 0));
                    const delivery = svc.service?.deliveryTime;
                    return (
                      <div
                        key={svc.service?.id ?? svc.serviceId}
                        className={cn("flex items-center gap-4 p-4 rounded-2xl border", meta.color)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-extrabold">{svcName}</p>
                          {delivery && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 opacity-60" />
                              <span className="text-xs font-semibold opacity-70">{delivery}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-extrabold">+${price}</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Fallback if no services from DB */}
              {services.length === 0 && (
                <>
                  {[
                    { name: "Real Estate Photography", price: 150, delivery: "24–48 hrs", type: "base" },
                    { name: "Drone Photography", price: 80, delivery: "24–48 hrs", type: "addon" },
                    { name: "Video Walkthrough", price: 150, delivery: "48–72 hrs", type: "addon" },
                    { name: "Floor Plans", price: 90, delivery: "48 hrs", type: "addon" },
                  ].map((s) => {
                    const meta = getServiceMeta(s.name);
                    return (
                      <div key={s.name} className={cn("flex items-center gap-4 p-4 rounded-2xl border", meta.color)}>
                        <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                          {meta.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-extrabold">{s.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 opacity-60" />
                            <span className="text-xs font-semibold opacity-70">{s.delivery}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-extrabold">{s.type === "addon" ? `+$${s.price}` : `$${s.price}`}</p>
                          <p className="text-xs opacity-60">{s.type === "addon" ? "add-on" : "base"}</p>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── 5. Delivery Time (summary) ── */}
        <div className="bg-white mt-3 px-5 py-5">
          <h2 className="text-base font-extrabold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Delivery Timeline
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Edited Photos", time: "24–48 hrs", icon: "📸" },
              { label: "Drone Footage", time: "24–48 hrs", icon: "🚁" },
              { label: "Video Walkthrough", time: "48–72 hrs", icon: "🎬" },
              { label: "Floor Plans", time: "48 hrs", icon: "📐" },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-2xl p-3.5 flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-bold text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400 font-medium">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 6. Availability Calendar + Time Slots ── */}
        <div className="bg-white mt-3 px-5 py-5">
          <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Availability
          </h2>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              disabled={isCurrentMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <p className="text-sm font-extrabold text-gray-900">
              {MONTHS[calMonth.month]} {calMonth.year}
            </p>
            <button
              onClick={nextMonth}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((cell, i) => {
              if (!cell.date) return <div key={`empty-${i}`} />;
              const isSelected = cell.dateStr === selectedDate;
              const isToday =
                cell.date.getDate() === today.getDate() &&
                cell.date.getMonth() === today.getMonth() &&
                cell.date.getFullYear() === today.getFullYear();
              return (
                <button
                  key={cell.dateStr}
                  disabled={!cell.available}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    setSelectedTime("");
                    updateBooking({ scheduledDate: cell.dateStr, scheduledTime: "" });
                  }}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all",
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : isToday
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : cell.available
                      ? "hover:bg-blue-50 text-gray-700"
                      : "text-gray-300 cursor-not-allowed"
                  )}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="mt-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Available Times — {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedTime(slot);
                        updateBooking({ scheduledTime: slot });
                      }}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-bold text-center transition-all",
                        isSelected
                          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                          : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <div className="bg-white mt-3 px-5 py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-gray-900">Reviews</h2>
              {rating !== null && (
                <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-extrabold text-yellow-700">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review: any) => (
                <div key={review.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn("w-3.5 h-3.5", i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200")}
                        />
                      ))}
                    </div>
                    {review.createdAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  {review.title && <p className="text-sm font-bold text-gray-800 mb-0.5">{review.title}</p>}
                  {review.comment && <p className="text-sm text-gray-500 leading-relaxed">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Booking Summary ── */}
        {booking.propertyAddress && (
          <div className="mt-3 mx-5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-200">
            <p className="text-xs font-bold opacity-70 uppercase tracking-wider mb-2">Your Booking</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="opacity-80">Property</span>
                <span className="font-bold truncate ml-4 max-w-[55%] text-right">{booking.propertyAddress}</span>
              </div>
              {(selectedDate || booking.scheduledDate) && (
                <div className="flex justify-between">
                  <span className="opacity-80">Date</span>
                  <span className="font-bold">
                    {new Date((selectedDate || booking.scheduledDate) + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              {(selectedTime || booking.scheduledTime) && (
                <div className="flex justify-between">
                  <span className="opacity-80">Time</span>
                  <span className="font-bold">{selectedTime || booking.scheduledTime}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold pt-1.5 border-t border-white/20 mt-1">
                <span>Total</span>
                <span>${booking.totalPrice || booking.basePrice || "—"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 7. Fixed Book CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-4 shadow-2xl">
        <div className="max-w-2xl mx-auto">
          {(!selectedDate || !selectedTime) && booking.propertyAddress && (
            <p className="text-xs text-amber-600 font-semibold text-center mb-2">
              {!selectedDate ? "Select a date above to continue" : "Select a time slot to continue"}
            </p>
          )}
          <button
            onClick={handleBook}
            disabled={createBookingMutation.isPending}
            className={cn(
              "w-full font-extrabold text-base py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg",
              createBookingMutation.isPending
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-200"
            )}
          >
            {createBookingMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Booking…
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Book This Photographer
                {(booking.totalPrice || booking.basePrice) ? (
                  <span className="ml-1 bg-white/20 px-2.5 py-0.5 rounded-full text-sm">
                    ${booking.totalPrice || booking.basePrice}
                  </span>
                ) : null}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <Lightbox
          images={portfolioImages}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((i) => (i! - 1 + portfolioImages.length) % portfolioImages.length)}
          onNext={() => setLightboxIdx((i) => (i! + 1) % portfolioImages.length)}
        />
      )}
    </div>
  );
}

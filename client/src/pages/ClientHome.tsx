import { useState } from "react";
import { useLocation } from "wouter";
import {
  Bell,
  User,
  Camera,
  Plane,
  Video,
  FileText,
  MapPin,
  Star,
  ChevronRight,
  Search,
  ArrowRight,
  Loader2,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useBooking } from "@/contexts/BookingContext";
import { cn } from "@/lib/utils";
import { ClientLayout } from "@/components/layouts/ClientLayout";

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  camera: <Camera className="w-7 h-7" />,
  plane: <Plane className="w-7 h-7" />,
  video: <Video className="w-7 h-7" />,
  "file-text": <FileText className="w-7 h-7" />,
};

const SERVICE_STYLES = [
  {
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    icon: "text-blue-600",
    badge: "bg-blue-600 text-white",
    ring: "ring-blue-100",
  },
  {
    gradient: "from-sky-500 to-cyan-500",
    bg: "bg-sky-50",
    border: "border-sky-100",
    icon: "text-sky-600",
    badge: "bg-sky-600 text-white",
    ring: "ring-sky-100",
  },
  {
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    icon: "text-violet-600",
    badge: "bg-violet-600 text-white",
    ring: "ring-violet-100",
  },
  {
    gradient: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    icon: "text-indigo-600",
    badge: "bg-indigo-600 text-white",
    ring: "ring-indigo-100",
  },
];

const FALLBACK_SERVICES = [
  { id: 1, name: "Real Estate Photography", icon: "camera", serviceType: "base" as const, basePrice: "150", description: "Professional interior & exterior shots", deliveryTime: "24h", isActive: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
  { id: 2, name: "Drone Photography", icon: "plane", serviceType: "addon" as const, basePrice: "80", description: "Stunning aerial views of the property", deliveryTime: "24h", isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 3, name: "Video Walkthrough", icon: "video", serviceType: "addon" as const, basePrice: "150", description: "Cinematic property tour video", deliveryTime: "48h", isActive: true, sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 4, name: "Floor Plans", icon: "file-text", serviceType: "addon" as const, basePrice: "90", description: "Detailed 2D floor plan drawings", deliveryTime: "48h", isActive: true, sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
];

export default function ClientHome() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { updateBooking } = useBooking();
  const [address, setAddress] = useState("");

  const servicesQuery = trpc.services.list.useQuery();
  const pricingQuery = trpc.services.pricingRules.useQuery();
  const notificationsQuery = trpc.notifications.getUnread.useQuery();
  const photographersQuery = trpc.photographers.search.useQuery({ limit: 4 });

  const allServices = servicesQuery.data?.length ? servicesQuery.data : FALLBACK_SERVICES;
  const unreadCount = notificationsQuery.data?.length ?? 0;
  const nearbyPhotographers = photographersQuery.data ?? [];

  // Compute minimum price from pricing rules (lowest sqft tier)
  const minBasePrice = pricingQuery.data?.length
    ? Math.min(...pricingQuery.data.map((r) => parseFloat(String(r.price))))
    : 150;

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const getServiceDisplayPrice = (svc: typeof FALLBACK_SERVICES[0]) => {
    if (svc.serviceType === "base") {
      return `$${minBasePrice}`;
    }
    const price = parseFloat(String(svc.basePrice));
    return price > 0 ? `+$${price}` : "Included";
  };

  const handleStartBooking = () => {
    if (address.trim()) {
      updateBooking({ propertyAddress: address.trim() });
    }
    navigate("/client/service-selection");
  };

  const handleServiceCard = (serviceId: number) => {
    updateBooking({ selectedServices: [String(serviceId)] });
    navigate("/client/service-selection");
  };

  return (
    <ClientLayout>
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-blue-600 tracking-tight">Snapty</span>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/client/notifications")}
              className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/client/profile")}
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
              aria-label="Profile"
            >
              {user?.name ? (
                <span className="text-white text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── SCROLLABLE BODY ── */}
      <main className="flex-1 overflow-y-auto pb-24">

        {/* ── HERO ── */}
        <div
          className="relative overflow-hidden px-4 pt-8 pb-12"
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #1e40af 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute top-20 -right-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative max-w-lg mx-auto">
            <p className="text-blue-200 text-sm font-semibold mb-2 tracking-wide uppercase">
              Hello, {firstName} 👋
            </p>
            <h1 className="text-white text-[2rem] font-extrabold leading-[1.15] mb-1">
              Book Real Estate
            </h1>
            <h1 className="text-white text-[2rem] font-extrabold leading-[1.15] mb-7">
              Photographers
            </h1>

            {/* Address Input Card */}
            <div className="bg-white rounded-2xl p-4 shadow-2xl">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Property Address
              </label>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 mb-3 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartBooking()}
                  placeholder="e.g. 123 Main St, Miami, FL"
                  className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                />
                {address && (
                  <button
                    onClick={() => setAddress("")}
                    className="text-gray-400 hover:text-gray-600 text-xs w-4 h-4 flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                onClick={handleStartBooking}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <Search className="w-4 h-4" />
                Start Booking
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-5">
              {[
                { icon: <Zap className="w-3.5 h-3.5" />, text: "Fast booking" },
                { icon: <Shield className="w-3.5 h-3.5" />, text: "Secure payment" },
                { icon: <Clock className="w-3.5 h-3.5" />, text: "24h delivery" },
              ].map((badge) => (
                <div key={badge.text} className="flex items-center gap-1.5 text-blue-100">
                  {badge.icon}
                  <span className="text-xs font-medium">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SERVICES ── */}
        <div className="px-4 pt-7 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Our Services</h2>
              <p className="text-xs text-gray-500 mt-0.5">Professional real estate media</p>
            </div>
            <button
              onClick={() => navigate("/client/service-selection")}
              className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {servicesQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {allServices.slice(0, 4).map((svc, idx) => {
                const style = SERVICE_STYLES[idx % SERVICE_STYLES.length];
                const displayPrice = getServiceDisplayPrice(svc as typeof FALLBACK_SERVICES[0]);
                return (
                  <button
                    key={svc.id}
                    onClick={() => handleServiceCard(svc.id)}
                    className={cn(
                      "relative flex flex-col items-start p-4 rounded-2xl border text-left transition-all hover:shadow-lg active:scale-[0.97]",
                      style.bg,
                      style.border,
                      "ring-1",
                      style.ring
                    )}
                  >
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-white shadow-sm", style.icon)}>
                      {SERVICE_ICONS[svc.icon ?? "camera"] ?? <Camera className="w-7 h-7" />}
                    </div>
                    <p className="text-sm font-bold text-gray-900 leading-tight mb-1.5">{svc.name}</p>
                    {svc.description && (
                      <p className="text-[11px] text-gray-500 leading-tight mb-2 line-clamp-2">{svc.description}</p>
                    )}
                    <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full mt-auto", style.badge)}>
                      from {displayPrice}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── STRONG CTA BANNER ── */}
        <div className="px-4 pt-6 max-w-lg mx-auto">
          <button
            onClick={handleStartBooking}
            className="w-full rounded-2xl p-5 text-white shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-between overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a8a 100%)" }}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
            <div className="absolute right-12 bottom-0 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />
            <div className="text-left relative z-10">
              <p className="font-extrabold text-lg leading-tight">Book a Photographer</p>
              <p className="text-blue-100 text-sm mt-1">Professional photos delivered in 24 hours</p>
            </div>
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10 backdrop-blur-sm">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>

        {/* ── NEARBY PHOTOGRAPHERS ── */}
        <div className="px-4 pt-7 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Nearby Photographers</h2>
              <p className="text-xs text-gray-500 mt-0.5">Available in your area</p>
            </div>
            <button
              onClick={() => navigate("/client/map")}
              className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
            >
              View map <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {photographersQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 animate-pulse">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-200 rounded-full w-2/3" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                    <div className="h-2 bg-gray-100 rounded-full w-3/4" />
                  </div>
                  <div className="w-14 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded-full" />
                    <div className="h-2.5 bg-gray-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : nearbyPhotographers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Camera className="w-8 h-8 text-blue-300" />
              </div>
              <p className="text-sm font-bold text-gray-700">No photographers yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
                Check back soon as more photographers join the platform
              </p>
              <button
                onClick={() => navigate("/client/map")}
                className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
              >
                <MapPin className="w-3 h-3" /> Open map
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyPhotographers.map((item) => {
                const p = item.photographer;
                const name = item.userName ?? "Photographer";
                const rating = p.averageRating ? parseFloat(String(p.averageRating)).toFixed(1) : null;
                const distance = item.distance ? `${item.distance.toFixed(1)} km` : p.city ?? "Nearby";
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/client/photographer/${p.id}`)}
                    className="w-full flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left group"
                  >
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0 overflow-hidden shadow-sm">
                      {p.profileImage ? (
                        <img src={p.profileImage} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-blue-600 font-extrabold text-xl">{name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate text-sm group-hover:text-blue-700 transition-colors">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {rating && (
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-semibold text-gray-700">{rating}</span>
                            {p.totalReviews ? (
                              <span className="text-[10px] text-gray-400">({p.totalReviews})</span>
                            ) : null}
                          </div>
                        )}
                        {rating && <span className="text-gray-200 text-xs">•</span>}
                        <div className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{distance}</span>
                        </div>
                      </div>
                      {p.bio && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{p.bio}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-extrabold text-gray-900 text-sm">${minBasePrice}</p>
                      <p className="text-[10px] text-gray-400 font-medium">starting</p>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors ml-auto mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Open Map Button */}
          <button
            onClick={() => navigate("/client/map")}
            className="w-full mt-4 py-3.5 rounded-2xl border-2 border-dashed border-blue-200 text-blue-600 text-sm font-bold hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            View all photographers on map
          </button>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="px-4 pt-7 pb-4 max-w-lg mx-auto">
          <h2 className="text-xl font-extrabold text-gray-900 mb-1">How it works</h2>
          <p className="text-xs text-gray-500 mb-4">Book in 4 simple steps</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { step: "1", title: "Select Service", desc: "Choose photography type and add-ons", icon: <Camera className="w-5 h-5" />, color: "bg-blue-600" },
              { step: "2", title: "Property Details", desc: "Enter address, type, and size", icon: <MapPin className="w-5 h-5" />, color: "bg-sky-500" },
              { step: "3", title: "Pick a Photographer", desc: "Browse nearby pros on the map", icon: <Search className="w-5 h-5" />, color: "bg-violet-600" },
              { step: "4", title: "Pay & Confirm", desc: "Secure payment via Stripe", icon: <Shield className="w-5 h-5" />, color: "bg-indigo-600" },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={cn("w-7 h-7 text-white rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 shadow-sm", item.color)}>
                    {item.step}
                  </div>
                  <div className="text-gray-400">{item.icon}</div>
                </div>
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── BOTTOM NAVIGATION ── */}
      <BottomNav />
    </div>
    </ClientLayout>
  );
}

function BottomNav() {
  const [location, navigate] = useLocation();

  const tabs = [
    { label: "Home", icon: "home", path: "/client/home" },
    { label: "Bookings", icon: "calendar", path: "/client/bookings" },
    { label: "Map", icon: "map", path: "/client/map" },
    { label: "Profile", icon: "user", path: "/client/profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/client/home") return location === "/client/home";
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2 safe-area-inset-bottom">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative",
                active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
              <NavIcon name={tab.icon} active={active} />
              <span className={cn("text-[10px] font-bold", active ? "text-blue-600" : "text-gray-400")}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const cls = cn("w-5 h-5 transition-transform", active && "scale-110");
  if (name === "home") return (
    <svg className={cls} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
  if (name === "calendar") return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" fill={active ? "currentColor" : "none"} />
      <path d="M16 2v4M8 2v4M3 10h18" stroke={active ? "white" : "currentColor"} />
      {active && <path d="M8 15h.01M12 15h.01M16 15h.01" stroke="white" strokeWidth={2.5} strokeLinecap="round" />}
    </svg>
  );
  if (name === "map") return (
    <svg className={cls} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" fill={active ? "white" : "currentColor"} />
    </svg>
  );
  if (name === "user") return (
    <svg className={cls} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 2} strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
  return null;
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Camera,
  Plane,
  Video,
  FileText,
  Check,
  Loader2,
  ChevronRight,
  Info,
  Clock,
  Star,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useBooking } from "@/contexts/BookingContext";
import { cn } from "@/lib/utils";

/* ─── Icon map ─────────────────────────────────────────────────── */
const SERVICE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  camera: ({ className }) => <Camera className={className} />,
  plane: ({ className }) => <Plane className={className} />,
  video: ({ className }) => <Video className={className} />,
  "file-text": ({ className }) => <FileText className={className} />,
  filetext: ({ className }) => <FileText className={className} />,
};

/* ─── Visual styles per card index ─────────────────────────────── */
const CARD_STYLES = [
  {
    iconBg: "bg-blue-600",
    checkBg: "bg-blue-600",
    selectedBorder: "border-blue-500",
    selectedBg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    selectedBadge: "bg-blue-600 text-white",
    tag: "bg-blue-600",
  },
  {
    iconBg: "bg-sky-600",
    checkBg: "bg-sky-600",
    selectedBorder: "border-sky-500",
    selectedBg: "bg-sky-50",
    badge: "bg-sky-100 text-sky-700",
    selectedBadge: "bg-sky-600 text-white",
    tag: "bg-sky-600",
  },
  {
    iconBg: "bg-violet-600",
    checkBg: "bg-violet-600",
    selectedBorder: "border-violet-500",
    selectedBg: "bg-violet-50",
    badge: "bg-violet-100 text-violet-700",
    selectedBadge: "bg-violet-600 text-white",
    tag: "bg-violet-600",
  },
  {
    iconBg: "bg-indigo-600",
    checkBg: "bg-indigo-600",
    selectedBorder: "border-indigo-500",
    selectedBg: "bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-700",
    selectedBadge: "bg-indigo-600 text-white",
    tag: "bg-indigo-600",
  },
];

/* ─── Fallback data ─────────────────────────────────────────────── */
const FALLBACK_SERVICES = [
  {
    id: 1,
    name: "Real Estate Photography",
    description: "Professional interior & exterior shots that showcase every room and detail of the property.",
    serviceType: "base" as const,
    basePrice: "0",
    icon: "camera",
    deliveryTime: "24h",
    isActive: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: "Drone Photography",
    description: "Stunning aerial views that highlight the property's surroundings, lot size, and neighbourhood.",
    serviceType: "addon" as const,
    basePrice: "80",
    icon: "plane",
    deliveryTime: "24h",
    isActive: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    name: "Video Walkthrough",
    description: "Cinematic property tour video with smooth transitions, perfect for online listings.",
    serviceType: "addon" as const,
    basePrice: "150",
    icon: "video",
    deliveryTime: "48h",
    isActive: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    name: "Floor Plans",
    description: "Accurate 2D floor plan drawings that help buyers understand the layout at a glance.",
    serviceType: "addon" as const,
    basePrice: "90",
    icon: "file-text",
    deliveryTime: "48h",
    isActive: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function ServiceSelection() {
  const [, navigate] = useLocation();
  const { updateBooking } = useBooking();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const servicesQuery = trpc.services.list.useQuery();
  const pricingQuery = trpc.services.pricingRules.useQuery();

  const allServices = servicesQuery.data?.length ? servicesQuery.data : FALLBACK_SERVICES;
  const pricingRules = pricingQuery.data ?? [];

  // Minimum base price from pricing rules
  const minBasePrice = pricingRules.length
    ? Math.min(...pricingRules.map((r) => parseFloat(String(r.price))))
    : 150;

  // Pre-select base service on load
  useEffect(() => {
    if (allServices.length > 0 && selectedIds.length === 0) {
      const base = allServices.find((s) => s.serviceType === "base");
      if (base) setSelectedIds([base.id]);
    }
  }, [allServices.length]);

  const toggleService = (id: number, type: string) => {
    if (type === "base") return; // base is always selected
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Compute add-on total
  const selectedAddons = allServices.filter(
    (s) => s.serviceType === "addon" && selectedIds.includes(s.id)
  );
  const addonTotal = selectedAddons.reduce(
    (sum, s) => sum + parseFloat(String(s.basePrice)),
    0
  );
  const estimatedTotal = minBasePrice + addonTotal;

  const handleContinue = () => {
    const serviceNames = allServices
      .filter((s) => selectedIds.includes(s.id))
      .map((s) => s.name.toLowerCase().replace(/\s+/g, "_"));
    updateBooking({ selectedServices: serviceNames });
    navigate("/client/property-details");
  };

  const hasSelection = selectedIds.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => navigate("/client/home")}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-extrabold text-gray-900">Select Services</h1>
            <p className="text-xs text-gray-400 font-medium">Step 1 of 5</p>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={cn(
                  "rounded-full transition-all",
                  s === 1 ? "w-5 h-1.5 bg-blue-600" : "w-1.5 h-1.5 bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div className="h-0.5 bg-blue-600 transition-all" style={{ width: "20%" }} />
        </div>
      </header>

      {/* ── BODY ── */}
      <main className="flex-1 overflow-y-auto pb-48">
        {/* Hero intro */}
        <div className="px-4 pt-6 pb-6 bg-gradient-to-b from-blue-50 to-gray-50">
          <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
              What do you need?
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              Photography is always included. Add drone, video, or floor plans to complete your listing package.
            </p>
          </div>
        </div>

        <div className="px-4 max-w-lg mx-auto space-y-3 pt-2">
          {servicesQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-400">Loading services…</p>
            </div>
          ) : (
            allServices.map((service, idx) => {
              const style = CARD_STYLES[idx % CARD_STYLES.length];
              const isBase = service.serviceType === "base";
              const isSelected = selectedIds.includes(service.id);
              const price = parseFloat(String(service.basePrice));
              const IconComp =
                SERVICE_ICONS[service.icon ?? "camera"] ?? SERVICE_ICONS["camera"];

              return (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id, service.serviceType)}
                  disabled={isBase}
                  className={cn(
                    "w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 relative overflow-hidden",
                    "hover:shadow-md active:scale-[0.99]",
                    isSelected
                      ? `${style.selectedBorder} ${style.selectedBg} shadow-sm`
                      : "border-gray-100 bg-white hover:border-gray-200",
                    isBase && "cursor-default"
                  )}
                >
                  {/* Always-included ribbon */}
                  {isBase && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-green-500 text-green-500" />
                        Always included
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-all",
                        isSelected ? style.iconBg : "bg-gray-100"
                      )}
                    >
                      <IconComp
                        className={cn(
                          "w-7 h-7 transition-colors",
                          isSelected ? "text-white" : "text-gray-500"
                        )}
                      />
                    </div>

                    {/* Content */}
                    <div className={cn("flex-1 min-w-0", !isBase && "pr-8")}>
                      <p className="font-bold text-gray-900 text-base leading-tight">
                        {service.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                        {service.description}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                        {/* Price badge */}
                        <span
                          className={cn(
                            "text-xs font-bold px-2.5 py-1 rounded-full transition-all",
                            isSelected ? style.selectedBadge : style.badge
                          )}
                        >
                          {isBase
                            ? `from $${minBasePrice}`
                            : price > 0
                            ? `+$${price.toFixed(0)}`
                            : "Included"}
                        </span>

                        {/* Delivery time */}
                        {(service as typeof FALLBACK_SERVICES[0]).deliveryTime && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                            <Clock className="w-3 h-3" />
                            {(service as typeof FALLBACK_SERVICES[0]).deliveryTime} delivery
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Checkbox (addon only) */}
                  {!isBase && (
                    <div className="absolute top-4 right-4">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected
                            ? `${style.checkBg} border-transparent`
                            : "border-gray-300 bg-white"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}

          {/* Pricing info card */}
          {!servicesQuery.isLoading && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-2">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-blue-900">Pricing by property size</p>
              </div>
              {pricingQuery.isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {(pricingRules.length > 0
                    ? [...pricingRules].sort((a, b) => a.minSqft - b.minSqft)
                    : [
                        { id: 1, minSqft: 0, maxSqft: 1000, price: "150", label: "Up to 1,000 sqft" },
                        { id: 2, minSqft: 1001, maxSqft: 2000, price: "220", label: "Up to 2,000 sqft" },
                        { id: 3, minSqft: 2001, maxSqft: 3000, price: "300", label: "Up to 3,000 sqft" },
                        { id: 4, minSqft: 3001, maxSqft: null, price: "380", label: "4,000+ sqft" },
                      ]
                  ).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between">
                      <span className="text-xs text-blue-700 font-medium">
                        {rule.label ??
                          `${rule.minSqft.toLocaleString()}${
                            rule.maxSqft ? `–${rule.maxSqft.toLocaleString()}` : "+"
                          } sqft`}
                      </span>
                      <span className="text-xs font-bold text-blue-900">
                        ${parseFloat(String(rule.price)).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── STICKY BOTTOM ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Estimated price summary */}
          {hasSelection && (
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <p className="text-xs text-gray-400 font-medium">Estimated total</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-gray-900">
                    ${estimatedTotal.toFixed(0)}
                  </span>
                  <span className="text-xs text-gray-400">starting price</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium mb-1">Selected</p>
                <div className="flex items-center gap-1.5 justify-end flex-wrap max-w-[160px]">
                  {allServices
                    .filter((s) => selectedIds.includes(s.id))
                    .map((s) => {
                      const style = CARD_STYLES[allServices.indexOf(s) % CARD_STYLES.length];
                      return (
                        <span
                          key={s.id}
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full text-white",
                            style.tag
                          )}
                        >
                          {s.name.split(" ")[0]}
                        </span>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={!hasSelection}
            className={cn(
              "w-full py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 transition-all",
              hasSelection
                ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface BookingState {
  // Step 1: Services
  selectedServices: string[];
  // Step 2: Property Details
  propertyAddress: string;
  propertyType: string;
  propertySize: number;
  bedrooms: number;
  bathrooms: number;
  specialInstructions: string;
  latitude?: number;
  longitude?: number;
  // Step 3: Date & Time
  scheduledDate: string;
  scheduledTime: string;
  // Step 4: Photographer
  photographerId: number | null;
  // Pricing
  basePrice: number;
  addOnPrice: number;
  totalPrice: number;
}

const DEFAULT_STATE: BookingState = {
  selectedServices: ["photography"],
  propertyAddress: "",
  propertyType: "house",
  propertySize: 1000,
  bedrooms: 3,
  bathrooms: 2,
  specialInstructions: "",
  latitude: undefined,
  longitude: undefined,
  scheduledDate: "",
  scheduledTime: "",
  photographerId: null,
  basePrice: 0,
  addOnPrice: 0,
  totalPrice: 0,
};

const STORAGE_KEY = "snapty_booking_state";

function loadFromStorage(): BookingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_STATE;
}

export interface PricingRule {
  id: number;
  minSqft: number;
  maxSqft: number | null;
  price: string | number;
  label: string | null;
}

export interface ServiceItem {
  id: number;
  name: string;
  serviceType: string;
  basePrice: string | number;
  isActive: boolean;
}

/**
 * Calculate price from DB-sourced pricing rules and services.
 * Falls back to hardcoded defaults only if DB data is unavailable.
 */
export function calculatePriceFromRules(
  selectedServiceIds: string[],
  sqft: number,
  pricingRules: PricingRule[],
  services: ServiceItem[]
): { base: number; addOn: number; total: number } {
  // Base price: find matching pricing rule by sqft range
  let base = 0;
  if (pricingRules.length > 0) {
    const sorted = [...pricingRules].sort((a, b) => a.minSqft - b.minSqft);
    for (const rule of sorted) {
      if (sqft >= rule.minSqft && (rule.maxSqft === null || sqft <= rule.maxSqft)) {
        base = parseFloat(String(rule.price));
        break;
      }
    }
    // If no rule matched (sqft beyond max), use the last rule
    if (base === 0 && sorted.length > 0) {
      base = parseFloat(String(sorted[sorted.length - 1].price));
    }
  } else {
    // Fallback hardcoded defaults
    if (sqft >= 4000) base = 380;
    else if (sqft >= 3000) base = 300;
    else if (sqft >= 2000) base = 220;
    else base = 150;
  }

  // Add-on price: sum basePrice of all selected add-on services
  let addOn = 0;
  if (services.length > 0) {
    const addOnServices = services.filter((s) => s.serviceType === "addon" && s.isActive);
    for (const svc of addOnServices) {
      // Match by service name slug or id
      const slug = svc.name.toLowerCase().replace(/\s+/g, "_");
      if (
        selectedServiceIds.includes(String(svc.id)) ||
        selectedServiceIds.includes(slug) ||
        selectedServiceIds.includes(svc.name.toLowerCase())
      ) {
        addOn += parseFloat(String(svc.basePrice));
      }
    }
  } else {
    // Fallback hardcoded add-ons
    if (selectedServiceIds.includes("drone")) addOn += 80;
    if (selectedServiceIds.includes("video")) addOn += 150;
    if (selectedServiceIds.includes("floorplans")) addOn += 90;
  }

  return { base, addOn, total: base + addOn };
}

interface BookingContextType {
  booking: BookingState;
  updateBooking: (updates: Partial<BookingState>) => void;
  resetBooking: () => void;
  /** Legacy calculatePrice — uses hardcoded fallback. Prefer calculatePriceFromRules() in components. */
  calculatePrice: (services: string[], sqft: number) => { base: number; addOn: number; total: number };
}

const BookingContext = createContext<BookingContextType | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState>(loadFromStorage);

  const updateBooking = useCallback((updates: Partial<BookingState>) => {
    setBooking((prev) => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const resetBooking = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setBooking(DEFAULT_STATE);
  }, []);

  // Legacy fallback — components should use calculatePriceFromRules() directly
  const calculatePrice = useCallback((services: string[], sqft: number) => {
    return calculatePriceFromRules(services, sqft, [], []);
  }, []);

  return (
    <BookingContext.Provider value={{ booking, updateBooking, resetBooking, calculatePrice }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}

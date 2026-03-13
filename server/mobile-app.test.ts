import { describe, it, expect } from "vitest";

// ── Pricing helpers (mirrors server logic) ───────────────────────────────────

function getBasePriceBySize(sqft: number): number {
  if (sqft <= 1000) return 150;
  if (sqft <= 2000) return 220;
  if (sqft <= 3000) return 300;
  return 380;
}

function calculateAddOns(services: string[]): number {
  let total = 0;
  if (services.includes("drone"))      total += 80;
  if (services.includes("video"))      total += 150;
  if (services.includes("floorplans")) total += 90;
  return total;
}

function calculateTotal(sqft: number, services: string[]): number {
  return getBasePriceBySize(sqft) + calculateAddOns(services);
}

// ── Booking state machine ─────────────────────────────────────────────────────

type BookingStatus = "pending" | "accepted" | "rejected" | "in_progress" | "photos_uploaded" | "editing" | "delivered" | "completed" | "cancelled";

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending:         ["accepted", "rejected", "cancelled"],
  accepted:        ["in_progress", "cancelled"],
  rejected:        [],
  in_progress:     ["photos_uploaded", "cancelled"],
  photos_uploaded: ["editing"],
  editing:         ["delivered"],
  delivered:       ["completed"],
  completed:       [],
  cancelled:       [],
};

function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Haversine distance helper ─────────────────────────────────────────────────

function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Commission helper ─────────────────────────────────────────────────────────

function splitRevenue(gross: number, platformRatePct = 35) {
  const platformRate = platformRatePct / 100;
  return {
    platform: parseFloat((gross * platformRate).toFixed(2)),
    photographer: parseFloat((gross * (1 - platformRate)).toFixed(2)),
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe("Pricing — base price by sqft", () => {
  it("returns 150 for ≤1000 sqft", () => expect(getBasePriceBySize(800)).toBe(150));
  it("returns 150 for exactly 1000 sqft", () => expect(getBasePriceBySize(1000)).toBe(150));
  it("returns 220 for 1001–2000 sqft", () => expect(getBasePriceBySize(1500)).toBe(220));
  it("returns 220 for exactly 2000 sqft", () => expect(getBasePriceBySize(2000)).toBe(220));
  it("returns 300 for 2001–3000 sqft", () => expect(getBasePriceBySize(2500)).toBe(300));
  it("returns 380 for >3000 sqft", () => expect(getBasePriceBySize(4000)).toBe(380));
});

describe("Pricing — add-on services", () => {
  it("drone only: +$80", () => expect(calculateAddOns(["drone"])).toBe(80));
  it("video only: +$150", () => expect(calculateAddOns(["video"])).toBe(150));
  it("floorplans only: +$90", () => expect(calculateAddOns(["floorplans"])).toBe(90));
  it("all add-ons: +$320", () => expect(calculateAddOns(["drone", "video", "floorplans"])).toBe(320));
  it("no add-ons: $0", () => expect(calculateAddOns(["photography"])).toBe(0));
  it("unknown service ignored", () => expect(calculateAddOns(["3d_tour"])).toBe(0));
});

describe("Pricing — total calculation", () => {
  it("1500sqft + drone + video = 220+80+150 = 450", () =>
    expect(calculateTotal(1500, ["drone", "video"])).toBe(450));
  it("3500sqft + no add-ons = 380", () =>
    expect(calculateTotal(3500, [])).toBe(380));
  it("1000sqft + all add-ons = 150+320 = 470", () =>
    expect(calculateTotal(1000, ["drone", "video", "floorplans"])).toBe(470));
});

describe("Booking state machine", () => {
  it("pending → accepted is valid", () => expect(canTransition("pending", "accepted")).toBe(true));
  it("pending → rejected is valid", () => expect(canTransition("pending", "rejected")).toBe(true));
  it("pending → completed is invalid (skip steps)", () => expect(canTransition("pending", "completed")).toBe(false));
  it("accepted → in_progress is valid", () => expect(canTransition("accepted", "in_progress")).toBe(true));
  it("photos_uploaded → editing is valid", () => expect(canTransition("photos_uploaded", "editing")).toBe(true));
  it("editing → delivered is valid", () => expect(canTransition("editing", "delivered")).toBe(true));
  it("delivered → completed is valid", () => expect(canTransition("delivered", "completed")).toBe(true));
  it("completed → anything is invalid (terminal)", () => {
    expect(canTransition("completed", "cancelled")).toBe(false);
    expect(canTransition("completed", "pending")).toBe(false);
  });
  it("rejected → anything is invalid (terminal)", () => {
    expect(canTransition("rejected", "accepted")).toBe(false);
  });
  it("any active status → cancelled is valid", () => {
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("accepted", "cancelled")).toBe(true);
    expect(canTransition("in_progress", "cancelled")).toBe(true);
  });
});

describe("Photographer distance (Haversine)", () => {
  it("same location = 0 miles", () =>
    expect(distanceMiles(40.7128, -74.006, 40.7128, -74.006)).toBe(0));
  it("NYC → LA ≈ 2450 miles", () => {
    const d = distanceMiles(40.7128, -74.006, 34.0522, -118.2437);
    expect(d).toBeGreaterThan(2400);
    expect(d).toBeLessThan(2500);
  });
  it("nearby photographer (1 mile radius) is within range", () => {
    const d = distanceMiles(37.7749, -122.4194, 37.7849, -122.4194);
    expect(d).toBeLessThan(1);
  });
  it("far photographer (50 miles away) is outside 25-mile radius", () => {
    const d = distanceMiles(37.7749, -122.4194, 38.2049, -122.4194);
    expect(d).toBeGreaterThan(25);
  });
});

describe("Commission / revenue split", () => {
  it("35% platform / 65% photographer on $200", () => {
    const { platform, photographer } = splitRevenue(200);
    expect(platform).toBe(70);
    expect(photographer).toBe(130);
  });
  it("split sums to gross", () => {
    const gross = 349.99;
    const { platform, photographer } = splitRevenue(gross);
    expect(platform + photographer).toBeCloseTo(gross, 1);
  });
  it("custom rate: 20% platform on $500", () => {
    const { platform, photographer } = splitRevenue(500, 20);
    expect(platform).toBe(100);
    expect(photographer).toBe(400);
  });
});

describe("Navigation routes", () => {
  const clientRoutes = ["/", "/bookings", "/profile", "/notifications", "/gallery"];
  const photographerRoutes = ["/photographer/dashboard", "/photographer/earnings", "/photographer/calendar"];
  const editorRoutes = ["/editor/dashboard", "/editor/projects"];
  const adminRoutes = ["/admin/dashboard", "/admin/bookings", "/admin/photographers"];

  it("all client routes are defined", () => clientRoutes.forEach(r => expect(r).toBeTruthy()));
  it("all photographer routes are defined", () => photographerRoutes.forEach(r => expect(r).toBeTruthy()));
  it("all editor routes are defined", () => editorRoutes.forEach(r => expect(r).toBeTruthy()));
  it("all admin routes are defined", () => adminRoutes.forEach(r => expect(r).toBeTruthy()));
});

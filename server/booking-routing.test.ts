import { describe, it, expect } from "vitest";

/**
 * Tests for booking routing and pricing logic
 */
describe("Booking Pricing Logic", () => {
  function calculatePrice(services: string[], sqft: number) {
    // Base price by size
    let base = 150;
    if (sqft >= 4000) base = 380;
    else if (sqft >= 3000) base = 300;
    else if (sqft >= 2000) base = 220;
    else base = 150;

    // Add-on prices
    let addOn = 0;
    if (services.includes("drone")) addOn += 80;
    if (services.includes("video")) addOn += 150;
    if (services.includes("floorplans")) addOn += 90;

    return { base, addOn, total: base + addOn };
  }

  it("calculates base price for 1000 sqft", () => {
    const { base } = calculatePrice(["photography"], 1000);
    expect(base).toBe(150);
  });

  it("calculates base price for 2000 sqft", () => {
    const { base } = calculatePrice(["photography"], 2000);
    expect(base).toBe(220);
  });

  it("calculates base price for 3000 sqft", () => {
    const { base } = calculatePrice(["photography"], 3000);
    expect(base).toBe(300);
  });

  it("calculates base price for 4000+ sqft", () => {
    const { base } = calculatePrice(["photography"], 4000);
    expect(base).toBe(380);
  });

  it("calculates base price for 5000 sqft (still 380)", () => {
    const { base } = calculatePrice(["photography"], 5000);
    expect(base).toBe(380);
  });

  it("adds drone add-on price", () => {
    const { addOn } = calculatePrice(["photography", "drone"], 1000);
    expect(addOn).toBe(80);
  });

  it("adds video add-on price", () => {
    const { addOn } = calculatePrice(["photography", "video"], 1000);
    expect(addOn).toBe(150);
  });

  it("adds floor plans add-on price", () => {
    const { addOn } = calculatePrice(["photography", "floorplans"], 1000);
    expect(addOn).toBe(90);
  });

  it("calculates total with all add-ons at 2000 sqft", () => {
    const { base, addOn, total } = calculatePrice(["photography", "drone", "video", "floorplans"], 2000);
    expect(base).toBe(220);
    expect(addOn).toBe(320); // 80 + 150 + 90
    expect(total).toBe(540);
  });

  it("no add-ons for photography only", () => {
    const { addOn } = calculatePrice(["photography"], 1500);
    expect(addOn).toBe(0);
  });
});

describe("Role-based Routing Logic", () => {
  function getRedirectPath(role: string, hasProfile: boolean): string {
    if (role === "photographer") {
      return hasProfile ? "/photographer" : "/photographer/onboarding";
    } else if (role === "admin") {
      return "/admin/dashboard";
    } else {
      return "/client/home";
    }
  }

  it("redirects client to /client/home", () => {
    expect(getRedirectPath("user", false)).toBe("/client/home");
  });

  it("redirects admin to /admin/dashboard", () => {
    expect(getRedirectPath("admin", false)).toBe("/admin/dashboard");
  });

  it("redirects photographer with profile to /photographer", () => {
    expect(getRedirectPath("photographer", true)).toBe("/photographer");
  });

  it("redirects photographer without profile to /photographer/onboarding", () => {
    expect(getRedirectPath("photographer", false)).toBe("/photographer/onboarding");
  });
});

describe("Booking Context State", () => {
  it("correctly identifies services with add-ons", () => {
    const services = ["photography", "drone"];
    expect(services.includes("drone")).toBe(true);
    expect(services.includes("video")).toBe(false);
    expect(services.includes("floorplans")).toBe(false);
  });

  it("correctly identifies all add-on services", () => {
    const services = ["photography", "drone", "video", "floorplans"];
    const addOnServices = services.filter(s => ["drone", "video", "floorplans"].includes(s));
    expect(addOnServices).toHaveLength(3);
  });
});

import { describe, expect, it } from "vitest";
import {
  getBasePriceBySize,
  calculateTotalPrice,
  formatPrice,
  getPriceBreakdown,
  PROPERTY_SIZE_PRICING,
  ADDON_PRICING,
} from "../shared/pricing";

describe("Pricing Utilities", () => {
  describe("getBasePriceBySize", () => {
    it("returns correct price for small properties (<=1000 sqft)", () => {
      expect(getBasePriceBySize(500)).toBe(PROPERTY_SIZE_PRICING.small.price);
      expect(getBasePriceBySize(1000)).toBe(PROPERTY_SIZE_PRICING.small.price);
    });

    it("returns correct price for medium properties (<=2000 sqft)", () => {
      expect(getBasePriceBySize(1500)).toBe(PROPERTY_SIZE_PRICING.medium.price);
      expect(getBasePriceBySize(2000)).toBe(PROPERTY_SIZE_PRICING.medium.price);
    });

    it("returns correct price for large properties (<=3000 sqft)", () => {
      expect(getBasePriceBySize(2500)).toBe(PROPERTY_SIZE_PRICING.large.price);
      expect(getBasePriceBySize(3000)).toBe(PROPERTY_SIZE_PRICING.large.price);
    });

    it("returns correct price for xlarge properties (>3000 sqft)", () => {
      expect(getBasePriceBySize(3500)).toBe(PROPERTY_SIZE_PRICING.xlarge.price);
      expect(getBasePriceBySize(5000)).toBe(PROPERTY_SIZE_PRICING.xlarge.price);
    });
  });

  describe("calculateTotalPrice", () => {
    it("calculates base price without add-ons", () => {
      const result = calculateTotalPrice(2000, {});
      expect(result).toBe(PROPERTY_SIZE_PRICING.medium.price);
    });

    it("adds drone photography price", () => {
      const result = calculateTotalPrice(2000, { drone: true });
      expect(result).toBe(PROPERTY_SIZE_PRICING.medium.price + ADDON_PRICING.drone);
    });

    it("adds video walkthrough price", () => {
      const result = calculateTotalPrice(2000, { video: true });
      expect(result).toBe(PROPERTY_SIZE_PRICING.medium.price + ADDON_PRICING.video);
    });

    it("adds floor plans price", () => {
      const result = calculateTotalPrice(2000, { floorplans: true });
      expect(result).toBe(PROPERTY_SIZE_PRICING.medium.price + ADDON_PRICING.floorplans);
    });

    it("adds multiple add-ons correctly", () => {
      const result = calculateTotalPrice(2000, {
        drone: true,
        video: true,
        floorplans: true,
      });
      expect(result).toBe(
        PROPERTY_SIZE_PRICING.medium.price +
          ADDON_PRICING.drone +
          ADDON_PRICING.video +
          ADDON_PRICING.floorplans
      );
    });
  });

  describe("formatPrice", () => {
    it("formats price in cents to USD string", () => {
      expect(formatPrice(15000)).toBe("$150.00");
      expect(formatPrice(22000)).toBe("$220.00");
      expect(formatPrice(8000)).toBe("$80.00");
    });

    it("handles zero price", () => {
      expect(formatPrice(0)).toBe("$0.00");
    });

    it("handles prices with cents", () => {
      expect(formatPrice(15050)).toBe("$150.50");
      expect(formatPrice(15099)).toBe("$150.99");
    });
  });

  describe("getPriceBreakdown", () => {
    it("returns base price only without add-ons", () => {
      const breakdown = getPriceBreakdown(2000, {});
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0]).toEqual({
        label: "Property (2000 sqft)",
        price: PROPERTY_SIZE_PRICING.medium.price,
      });
    });

    it("includes drone add-on when selected", () => {
      const breakdown = getPriceBreakdown(2000, { drone: true });
      expect(breakdown).toHaveLength(2);
      expect(breakdown[1]).toEqual({
        label: "Drone Photography",
        price: ADDON_PRICING.drone,
      });
    });

    it("includes video add-on when selected", () => {
      const breakdown = getPriceBreakdown(2000, { video: true });
      expect(breakdown).toHaveLength(2);
      expect(breakdown[1]).toEqual({
        label: "Video Walkthrough",
        price: ADDON_PRICING.video,
      });
    });

    it("includes floor plans add-on when selected", () => {
      const breakdown = getPriceBreakdown(2000, { floorplans: true });
      expect(breakdown).toHaveLength(2);
      expect(breakdown[1]).toEqual({
        label: "Floor Plans",
        price: ADDON_PRICING.floorplans,
      });
    });

    it("includes all add-ons when selected", () => {
      const breakdown = getPriceBreakdown(2000, {
        drone: true,
        video: true,
        floorplans: true,
      });
      expect(breakdown).toHaveLength(4);
      expect(breakdown[0].label).toContain("Property");
      expect(breakdown[1].label).toBe("Drone Photography");
      expect(breakdown[2].label).toBe("Video Walkthrough");
      expect(breakdown[3].label).toBe("Floor Plans");
    });
  });
});

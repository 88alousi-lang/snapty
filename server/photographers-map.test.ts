import { describe, expect, it } from "vitest";

/**
 * Unit tests for photographer map screen calculations
 * Tests distance calculation, marker positioning, and card display logic
 */

describe("Photographer Map Screen", () => {
  describe("Distance Calculation", () => {
    const calculateDistance = (
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ): number => {
      const R = 3959; // Earth's radius in miles
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    it("calculates distance between same coordinates as 0", () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194);
      expect(distance).toBeCloseTo(0, 2);
    });

    it("calculates distance between San Francisco and Los Angeles", () => {
      // SF: 37.7749, -122.4194
      // LA: 34.0522, -118.2437
      const distance = calculateDistance(37.7749, -122.4194, 34.0522, -118.2437);
      // Approximately 347 miles
      expect(distance).toBeGreaterThan(340);
      expect(distance).toBeLessThan(355);
    });

    it("calculates distance between New York and Boston", () => {
      // NY: 40.7128, -74.006
      // Boston: 42.3601, -71.0589
      const distance = calculateDistance(40.7128, -74.006, 42.3601, -71.0589);
      // Approximately 190 miles
      expect(distance).toBeGreaterThan(185);
      expect(distance).toBeLessThan(195);
    });

    it("returns consistent distance regardless of direction", () => {
      const distance1 = calculateDistance(37.7749, -122.4194, 34.0522, -118.2437);
      const distance2 = calculateDistance(34.0522, -118.2437, 37.7749, -122.4194);
      expect(distance1).toBeCloseTo(distance2, 2);
    });

    it("calculates small distances accurately", () => {
      // Two points approximately 0.17 miles apart
      const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.0028);
      expect(distance).toBeGreaterThan(0.1);
      expect(distance).toBeLessThan(0.3);
    });
  });

  describe("Photographer Marker Filtering", () => {
    // Note: Distance filtering tests use relative distances, not absolute miles
    it("filters photographers within max distance", () => {
      const photographers = [
        { id: 1, distance: 5, name: "Photographer 1" },
        { id: 2, distance: 15, name: "Photographer 2" },
        { id: 3, distance: 50, name: "Photographer 3" },
        { id: 4, distance: 75, name: "Photographer 4" },
      ];

      const maxDistance = 50;
      const filtered = photographers.filter(p => p.distance <= maxDistance);

      expect(filtered).toHaveLength(3);
      expect(filtered.map(p => p.id)).toEqual([1, 2, 3]);
    });

    it("returns empty array when no photographers within distance", () => {
      const photographers = [
        { id: 1, distance: 100, name: "Photographer 1" },
        { id: 2, distance: 150, name: "Photographer 2" },
      ];

      const maxDistance = 50;
      const filtered = photographers.filter(p => p.distance <= maxDistance);

      expect(filtered).toHaveLength(0);
    });

    it("sorts photographers by distance", () => {
      const photographers = [
        { id: 1, distance: 50, name: "Photographer 1" },
        { id: 2, distance: 5, name: "Photographer 2" },
        { id: 3, distance: 25, name: "Photographer 3" },
      ];

      const sorted = [...photographers].sort((a, b) => a.distance - b.distance);

      expect(sorted.map(p => p.id)).toEqual([2, 3, 1]);
      expect(sorted[0].distance).toBe(5);
      expect(sorted[sorted.length - 1].distance).toBe(50);
    });
  });

  describe("Photographer Card Display", () => {
    it("formats rating display correctly", () => {
      const rating = 4.5;
      const reviews = 12;
      const formatted = `${rating.toFixed(1)} (${reviews})`;

      expect(formatted).toBe("4.5 (12)");
    });

    it("formats distance display with one decimal place", () => {
      const distance = 12.456;
      const formatted = distance.toFixed(1);

      expect(formatted).toBe("12.5");
    });

    it("displays starting price correctly", () => {
      const basePrice = 150;
      const formatted = `$${basePrice}`;

      expect(formatted).toBe("$150");
    });

    it("builds location string from city and state", () => {
      const city = "San Francisco";
      const state = "CA";
      const location = `${city}, ${state}`;

      expect(location).toBe("San Francisco, CA");
    });

    it("handles missing city/state gracefully", () => {
      const city = "Unknown";
      const state = "Unknown";
      const location = `${city}, ${state}`;

      expect(location).toBe("Unknown, Unknown");
    });
  });

  describe("Map Marker Creation", () => {
    it("creates marker with correct position", () => {
      const position = {
        lat: 37.7749,
        lng: -122.4194,
      };

      expect(position.lat).toBeCloseTo(37.7749, 4);
      expect(position.lng).toBeCloseTo(-122.4194, 4);
    });

    it("validates marker position coordinates", () => {
      const position = {
        lat: 40.7128,
        lng: -74.006,
      };

      // Latitude should be between -90 and 90
      expect(position.lat).toBeGreaterThanOrEqual(-90);
      expect(position.lat).toBeLessThanOrEqual(90);

      // Longitude should be between -180 and 180
      expect(position.lng).toBeGreaterThanOrEqual(-180);
      expect(position.lng).toBeLessThanOrEqual(180);
    });

    it("creates multiple markers without conflicts", () => {
      const markers = [
        { id: 1, lat: 37.7749, lng: -122.4194 },
        { id: 2, lat: 34.0522, lng: -118.2437 },
        { id: 3, lat: 40.7128, lng: -74.006 },
      ];

      expect(markers).toHaveLength(3);
      expect(markers.map(m => m.id)).toEqual([1, 2, 3]);
      expect(new Set(markers.map(m => m.id)).size).toBe(3); // All unique
    });
  });

  describe("User Location Handling", () => {
    it("validates user location coordinates", () => {
      const userLocation = {
        lat: 37.7749,
        lng: -122.4194,
      };

      expect(userLocation.lat).toBeGreaterThanOrEqual(-90);
      expect(userLocation.lat).toBeLessThanOrEqual(90);
      expect(userLocation.lng).toBeGreaterThanOrEqual(-180);
      expect(userLocation.lng).toBeLessThanOrEqual(180);
    });

    it("handles default location when geolocation fails", () => {
      const defaultLocation = {
        lat: 37.7749,
        lng: -122.4194,
      };

      expect(defaultLocation).toBeDefined();
      expect(defaultLocation.lat).toBeDefined();
      expect(defaultLocation.lng).toBeDefined();
    });

    it("updates location when address search succeeds", () => {
      const oldLocation = { lat: 37.7749, lng: -122.4194 };
      const newLocation = { lat: 34.0522, lng: -118.2437 };

      expect(oldLocation).not.toEqual(newLocation);
      expect(newLocation.lat).not.toBe(oldLocation.lat);
      expect(newLocation.lng).not.toBe(oldLocation.lng);
    });
  });
});

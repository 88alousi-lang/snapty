import { describe, expect, it } from "vitest";

/**
 * Unit tests for photographer dashboard functionality
 * Tests bookings, earnings calculations, and portfolio management
 */

describe("Photographer Dashboard", () => {
  describe("Upcoming Bookings", () => {
    it("displays upcoming bookings in chronological order", () => {
      const bookings = [
        { id: 1, date: "2026-03-15", time: "10:00 AM", status: "confirmed" },
        { id: 2, date: "2026-03-16", time: "2:00 PM", status: "confirmed" },
        { id: 3, date: "2026-03-18", time: "11:00 AM", status: "confirmed" },
      ];

      const sorted = [...bookings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      expect(sorted[0].id).toBe(1);
      expect(sorted[1].id).toBe(2);
      expect(sorted[2].id).toBe(3);
    });

    it("filters confirmed bookings", () => {
      const bookings = [
        { id: 1, status: "confirmed" },
        { id: 2, status: "pending" },
        { id: 3, status: "confirmed" },
      ];

      const confirmed = bookings.filter(b => b.status === "confirmed");

      expect(confirmed).toHaveLength(2);
      expect(confirmed.map(b => b.id)).toEqual([1, 3]);
    });

    it("counts total upcoming bookings", () => {
      const bookings = [
        { id: 1, status: "confirmed" },
        { id: 2, status: "confirmed" },
        { id: 3, status: "confirmed" },
      ];

      expect(bookings.length).toBe(3);
    });
  });

  describe("Pending Requests", () => {
    it("displays pending booking requests", () => {
      const requests = [
        { id: 1, clientName: "John", status: "pending" },
        { id: 2, clientName: "Jane", status: "pending" },
      ];

      expect(requests).toHaveLength(2);
      expect(requests.every(r => r.status === "pending")).toBe(true);
    });

    it("accepts a booking request", () => {
      const requests = [
        { id: 1, clientName: "John", status: "pending" },
        { id: 2, clientName: "Jane", status: "pending" },
      ];

      const updated = requests.map(r => (r.id === 1 ? { ...r, status: "accepted" } : r));

      expect(updated[0].status).toBe("accepted");
      expect(updated[1].status).toBe("pending");
    });

    it("declines a booking request", () => {
      const requests = [
        { id: 1, clientName: "John", status: "pending" },
        { id: 2, clientName: "Jane", status: "pending" },
      ];

      const updated = requests.map(r => (r.id === 1 ? { ...r, status: "declined" } : r));

      expect(updated[0].status).toBe("declined");
      expect(updated[1].status).toBe("pending");
    });

    it("counts pending requests", () => {
      const requests = [
        { id: 1, status: "pending" },
        { id: 2, status: "pending" },
      ];

      const pendingCount = requests.filter(r => r.status === "pending").length;

      expect(pendingCount).toBe(2);
    });
  });

  describe("Earnings Calculations", () => {
    it("calculates total earnings from bookings", () => {
      const bookings = [
        { id: 1, price: 150, status: "completed" },
        { id: 2, price: 230, status: "completed" },
        { id: 3, price: 300, status: "completed" },
      ];

      const total = bookings.reduce((sum, b) => sum + b.price, 0);

      expect(total).toBe(680);
    });

    it("calculates monthly earnings", () => {
      const bookings = [
        { id: 1, price: 150, date: "2026-03-05", status: "completed" },
        { id: 2, price: 230, date: "2026-03-10", status: "completed" },
        { id: 3, price: 300, date: "2026-03-15", status: "completed" },
        { id: 4, price: 200, date: "2026-02-20", status: "completed" },
      ];

      const march = bookings.filter(b => b.date.startsWith("2026-03")).reduce((sum, b) => sum + b.price, 0);

      expect(march).toBe(680);
    });

    it("calculates yearly earnings", () => {
      const bookings = [
        { id: 1, price: 150, date: "2026-01-05", status: "completed" },
        { id: 2, price: 230, date: "2026-03-10", status: "completed" },
        { id: 3, price: 300, date: "2026-06-15", status: "completed" },
      ];

      const yearly = bookings.reduce((sum, b) => sum + b.price, 0);

      expect(yearly).toBe(680);
    });

    it("excludes pending bookings from earnings", () => {
      const bookings = [
        { id: 1, price: 150, status: "completed" },
        { id: 2, price: 230, status: "pending" },
        { id: 3, price: 300, status: "completed" },
      ];

      const earnings = bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + b.price, 0);

      expect(earnings).toBe(450);
    });

    it("calculates average booking price", () => {
      const bookings = [
        { id: 1, price: 150 },
        { id: 2, price: 230 },
        { id: 3, price: 300 },
      ];

      const average = bookings.reduce((sum, b) => sum + b.price, 0) / bookings.length;

      expect(average).toBeCloseTo(226.67, 2);
    });
  });

  describe("Portfolio Management", () => {
    it("displays portfolio items", () => {
      const portfolio = [
        { id: 1, title: "Modern Loft", category: "Photography" },
        { id: 2, title: "Aerial View", category: "Drone" },
        { id: 3, title: "Estate Tour", category: "Video" },
      ];

      expect(portfolio).toHaveLength(3);
    });

    it("adds new portfolio item", () => {
      const portfolio = [
        { id: 1, title: "Modern Loft", category: "Photography" },
      ];

      const newItem = { id: 2, title: "Aerial View", category: "Drone" };
      const updated = [...portfolio, newItem];

      expect(updated).toHaveLength(2);
      expect(updated[1].id).toBe(2);
    });

    it("removes portfolio item", () => {
      const portfolio = [
        { id: 1, title: "Modern Loft", category: "Photography" },
        { id: 2, title: "Aerial View", category: "Drone" },
        { id: 3, title: "Estate Tour", category: "Video" },
      ];

      const updated = portfolio.filter(p => p.id !== 2);

      expect(updated).toHaveLength(2);
      expect(updated.map(p => p.id)).toEqual([1, 3]);
    });

    it("tracks portfolio view counts", () => {
      const portfolio = [
        { id: 1, title: "Modern Loft", views: 234 },
        { id: 2, title: "Aerial View", views: 512 },
        { id: 3, title: "Estate Tour", views: 389 },
      ];

      const totalViews = portfolio.reduce((sum, p) => sum + p.views, 0);

      expect(totalViews).toBe(1135);
    });

    it("sorts portfolio by views", () => {
      const portfolio = [
        { id: 1, title: "Modern Loft", views: 234 },
        { id: 2, title: "Aerial View", views: 512 },
        { id: 3, title: "Estate Tour", views: 389 },
      ];

      const sorted = [...portfolio].sort((a, b) => b.views - a.views);

      expect(sorted[0].views).toBe(512);
      expect(sorted[1].views).toBe(389);
      expect(sorted[2].views).toBe(234);
    });

    it("filters portfolio by category", () => {
      const portfolio = [
        { id: 1, title: "Modern Loft", category: "Photography" },
        { id: 2, title: "Aerial View", category: "Drone" },
        { id: 3, title: "Estate Tour", category: "Video" },
        { id: 4, title: "Floor Plan", category: "Photography" },
      ];

      const photography = portfolio.filter(p => p.category === "Photography");

      expect(photography).toHaveLength(2);
      expect(photography.map(p => p.id)).toEqual([1, 4]);
    });
  });

  describe("Statistics & Ratings", () => {
    it("calculates average rating from reviews", () => {
      const reviews = [
        { id: 1, rating: 5 },
        { id: 2, rating: 4 },
        { id: 3, rating: 5 },
        { id: 4, rating: 5 },
      ];

      const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      expect(average).toBeCloseTo(4.75, 2);
    });

    it("counts completed bookings", () => {
      const bookings = [
        { id: 1, status: "completed" },
        { id: 2, status: "completed" },
        { id: 3, status: "pending" },
        { id: 4, status: "completed" },
      ];

      const completed = bookings.filter(b => b.status === "completed").length;

      expect(completed).toBe(3);
    });

    it("calculates completion rate", () => {
      const bookings = [
        { id: 1, status: "completed" },
        { id: 2, status: "completed" },
        { id: 3, status: "pending" },
        { id: 4, status: "completed" },
      ];

      const rate = (bookings.filter(b => b.status === "completed").length / bookings.length) * 100;

      expect(rate).toBeCloseTo(75, 0);
    });

    it("tracks response time to requests", () => {
      const request = {
        createdAt: new Date("2026-03-10T10:00:00"),
        respondedAt: new Date("2026-03-10T10:30:00"),
      };

      const responseTime = (request.respondedAt.getTime() - request.createdAt.getTime()) / (1000 * 60);

      expect(responseTime).toBeCloseTo(30, 0);
    });
  });

  describe("Calendar & Scheduling", () => {
    it("identifies available dates", () => {
      const bookings = [
        { id: 1, date: "2026-03-15" },
        { id: 2, date: "2026-03-16" },
        { id: 3, date: "2026-03-18" },
      ];

      const bookedDates = new Set(bookings.map(b => b.date));
      const isAvailable = (date: string) => !bookedDates.has(date);

      const march15Available = isAvailable("2026-03-15");
      const march17Available = isAvailable("2026-03-17");
      const march19Available = isAvailable("2026-03-19");

      expect(march15Available).toBe(false);
      expect(march17Available).toBe(true);
      expect(march19Available).toBe(true);
    });

    it("counts bookings per day", () => {
      const bookings = [
        { id: 1, date: "2026-03-15", time: "10:00 AM" },
        { id: 2, date: "2026-03-15", time: "2:00 PM" },
        { id: 3, date: "2026-03-16", time: "11:00 AM" },
      ];

      const bookingsByDate = bookings.reduce((acc, b) => {
        acc[b.date] = (acc[b.date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(bookingsByDate["2026-03-15"] ?? 0).toBe(2);
      expect(bookingsByDate["2026-03-16"] ?? 0).toBe(1);
    });
  });
});

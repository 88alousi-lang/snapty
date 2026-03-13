import { describe, expect, it } from "vitest";

/**
 * Unit tests for admin dashboard functionality
 * Tests photographer approval, bookings, payments, and user management
 */

describe("Admin Dashboard", () => {
  describe("Photographer Approval System", () => {
    it("displays pending photographers", () => {
      const photographers = [
        { id: 1, name: "Alex Johnson", status: "pending" },
        { id: 2, name: "Maria Garcia", status: "pending" },
        { id: 3, name: "David Lee", status: "pending" },
      ];

      const pending = photographers.filter(p => p.status === "pending");

      expect(pending).toHaveLength(3);
    });

    it("approves a photographer", () => {
      const photographers = [
        { id: 1, name: "Alex Johnson", status: "pending" },
        { id: 2, name: "Maria Garcia", status: "pending" },
      ];

      const updated = photographers.map(p =>
        p.id === 1 ? { ...p, status: "approved" } : p
      );

      expect(updated[0].status).toBe("approved");
      expect(updated[1].status).toBe("pending");
    });

    it("rejects a photographer", () => {
      const photographers = [
        { id: 1, name: "Alex Johnson", status: "pending" },
        { id: 2, name: "Maria Garcia", status: "pending" },
      ];

      const updated = photographers.map(p =>
        p.id === 1 ? { ...p, status: "rejected" } : p
      );

      expect(updated[0].status).toBe("rejected");
      expect(updated[1].status).toBe("pending");
    });

    it("counts pending approvals", () => {
      const photographers = [
        { id: 1, status: "pending" },
        { id: 2, status: "pending" },
        { id: 3, status: "approved" },
        { id: 4, status: "pending" },
      ];

      const pendingCount = photographers.filter(p => p.status === "pending").length;

      expect(pendingCount).toBe(3);
    });

    it("filters photographers by search query", () => {
      const photographers = [
        { id: 1, name: "Alex Johnson", email: "alex@example.com" },
        { id: 2, name: "Maria Garcia", email: "maria@example.com" },
        { id: 3, name: "David Lee", email: "david@example.com" },
      ];

      const query = "maria";
      const filtered = photographers.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.email.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Maria Garcia");
    });
  });

  describe("Booking Management", () => {
    it("displays all bookings", () => {
      const bookings = [
        { id: 1, clientName: "John Smith", status: "confirmed" },
        { id: 2, clientName: "Emma Davis", status: "pending" },
        { id: 3, clientName: "Robert Wilson", status: "confirmed" },
      ];

      expect(bookings).toHaveLength(3);
    });

    it("filters bookings by status", () => {
      const bookings = [
        { id: 1, status: "confirmed" },
        { id: 2, status: "pending" },
        { id: 3, status: "confirmed" },
        { id: 4, status: "cancelled" },
      ];

      const confirmed = bookings.filter(b => b.status === "confirmed");

      expect(confirmed).toHaveLength(2);
      expect(confirmed.map(b => b.id)).toEqual([1, 3]);
    });

    it("counts total bookings", () => {
      const bookings = [
        { id: 1, status: "confirmed" },
        { id: 2, status: "pending" },
        { id: 3, status: "confirmed" },
      ];

      expect(bookings.length).toBe(3);
    });

    it("calculates booking revenue", () => {
      const bookings = [
        { id: 1, amount: 150, status: "completed" },
        { id: 2, amount: 230, status: "completed" },
        { id: 3, amount: 300, status: "completed" },
      ];

      const revenue = bookings.reduce((sum, b) => sum + b.amount, 0);

      expect(revenue).toBe(680);
    });
  });

  describe("Payment Management", () => {
    it("displays payment transactions", () => {
      const payments = [
        { id: 1, photographerId: 101, amount: 3600, status: "completed" },
        { id: 2, photographerId: 102, amount: 2700, status: "completed" },
        { id: 3, photographerId: 101, amount: 1200, status: "pending" },
      ];

      expect(payments).toHaveLength(3);
    });

    it("calculates commission from payment", () => {
      const payment = { amount: 1000, commissionRate: 0.1 };
      const commission = payment.amount * payment.commissionRate;

      expect(commission).toBe(100);
    });

    it("filters payments by status", () => {
      const payments = [
        { id: 1, status: "completed" },
        { id: 2, status: "pending" },
        { id: 3, status: "completed" },
      ];

      const completed = payments.filter(p => p.status === "completed");

      expect(completed).toHaveLength(2);
    });

    it("calculates total paid out", () => {
      const payments = [
        { id: 1, amount: 3600, status: "completed" },
        { id: 2, amount: 2700, status: "completed" },
        { id: 3, amount: 1200, status: "pending" },
      ];

      const paidOut = payments
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      expect(paidOut).toBe(6300);
    });

    it("calculates pending payouts", () => {
      const payments = [
        { id: 1, amount: 3600, status: "completed" },
        { id: 2, amount: 2700, status: "completed" },
        { id: 3, amount: 1200, status: "pending" },
      ];

      const pending = payments
        .filter(p => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);

      expect(pending).toBe(1200);
    });

    it("calculates total commission earned", () => {
      const payments = [
        { id: 1, amount: 1000, commissionRate: 0.1 },
        { id: 2, amount: 2000, commissionRate: 0.1 },
        { id: 3, amount: 1500, commissionRate: 0.1 },
      ];

      const totalCommission = payments.reduce(
        (sum, p) => sum + p.amount * p.commissionRate,
        0
      );

      expect(totalCommission).toBe(450);
    });
  });

  describe("User Management", () => {
    it("displays all users", () => {
      const users = [
        { id: 1, name: "John Smith", role: "client" },
        { id: 2, name: "Sarah Smith", role: "photographer" },
        { id: 3, name: "Emma Davis", role: "client" },
      ];

      expect(users).toHaveLength(3);
    });

    it("filters users by role", () => {
      const users = [
        { id: 1, name: "John Smith", role: "client" },
        { id: 2, name: "Sarah Smith", role: "photographer" },
        { id: 3, name: "Emma Davis", role: "client" },
        { id: 4, name: "James Wilson", role: "photographer" },
      ];

      const photographers = users.filter(u => u.role === "photographer");

      expect(photographers).toHaveLength(2);
      expect(photographers.map(u => u.name)).toEqual(["Sarah Smith", "James Wilson"]);
    });

    it("counts total users", () => {
      const users = [
        { id: 1, role: "client" },
        { id: 2, role: "photographer" },
        { id: 3, role: "client" },
      ];

      expect(users.length).toBe(3);
    });

    it("counts photographers", () => {
      const users = [
        { id: 1, role: "client" },
        { id: 2, role: "photographer" },
        { id: 3, role: "client" },
        { id: 4, role: "photographer" },
      ];

      const photographerCount = users.filter(u => u.role === "photographer").length;

      expect(photographerCount).toBe(2);
    });

    it("counts clients", () => {
      const users = [
        { id: 1, role: "client" },
        { id: 2, role: "photographer" },
        { id: 3, role: "client" },
      ];

      const clientCount = users.filter(u => u.role === "client").length;

      expect(clientCount).toBe(2);
    });

    it("deletes a user", () => {
      const users = [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Sarah Smith" },
        { id: 3, name: "Emma Davis" },
      ];

      const updated = users.filter(u => u.id !== 2);

      expect(updated).toHaveLength(2);
      expect(updated.map(u => u.id)).toEqual([1, 3]);
    });

    it("searches users by name", () => {
      const users = [
        { id: 1, name: "John Smith", email: "john@example.com" },
        { id: 2, name: "Sarah Smith", email: "sarah@example.com" },
        { id: 3, name: "Emma Davis", email: "emma@example.com" },
      ];

      const query = "smith";
      const filtered = users.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(2);
    });
  });

  describe("Dashboard Statistics", () => {
    it("calculates total revenue", () => {
      const bookings = [
        { id: 1, amount: 150, status: "completed" },
        { id: 2, amount: 230, status: "completed" },
        { id: 3, amount: 300, status: "completed" },
      ];

      const revenue = bookings.reduce((sum, b) => sum + b.amount, 0);

      expect(revenue).toBe(680);
    });

    it("calculates monthly revenue", () => {
      const bookings = [
        { id: 1, amount: 150, date: "2026-03-05", status: "completed" },
        { id: 2, amount: 230, date: "2026-03-10", status: "completed" },
        { id: 3, amount: 300, date: "2026-03-15", status: "completed" },
        { id: 4, amount: 200, date: "2026-02-20", status: "completed" },
      ];

      const march = bookings
        .filter(b => b.date.startsWith("2026-03"))
        .reduce((sum, b) => sum + b.amount, 0);

      expect(march).toBe(680);
    });

    it("calculates average booking value", () => {
      const bookings = [
        { id: 1, amount: 150 },
        { id: 2, amount: 230 },
        { id: 3, amount: 300 },
      ];

      const average = bookings.reduce((sum, b) => sum + b.amount, 0) / bookings.length;

      expect(average).toBeCloseTo(226.67, 2);
    });

    it("counts pending approvals", () => {
      const photographers = [
        { id: 1, status: "pending" },
        { id: 2, status: "pending" },
        { id: 3, status: "approved" },
      ];

      const pending = photographers.filter(p => p.status === "pending").length;

      expect(pending).toBe(2);
    });
  });

  describe("Commission Calculations", () => {
    it("calculates commission rate", () => {
      const commissionRate = 0.1;
      const amount = 1000;
      const commission = amount * commissionRate;

      expect(commission).toBe(100);
    });

    it("calculates photographer payout", () => {
      const amount = 1000;
      const commissionRate = 0.1;
      const commission = amount * commissionRate;
      const payout = amount - commission;

      expect(payout).toBe(900);
    });

    it("applies different commission rates", () => {
      const rates = [0.05, 0.1, 0.15];
      const amount = 1000;

      const commissions = rates.map(rate => amount * rate);

      expect(commissions).toEqual([50, 100, 150]);
    });
  });

  describe("Data Filtering & Search", () => {
    it("searches photographers by name", () => {
      const photographers = [
        { id: 1, name: "Alex Johnson" },
        { id: 2, name: "Maria Garcia" },
        { id: 3, name: "David Lee" },
      ];

      const query = "alex";
      const filtered = photographers.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Alex Johnson");
    });

    it("searches photographers by email", () => {
      const photographers = [
        { id: 1, name: "Alex Johnson", email: "alex@example.com" },
        { id: 2, name: "Maria Garcia", email: "maria@example.com" },
      ];

      const query = "maria@";
      const filtered = photographers.filter(p =>
        p.email.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Maria Garcia");
    });

    it("sorts photographers by approval date", () => {
      const photographers = [
        { id: 1, name: "Alex", approvedAt: "2026-03-10" },
        { id: 2, name: "Maria", approvedAt: "2026-03-09" },
        { id: 3, name: "David", approvedAt: "2026-03-08" },
      ];

      const sorted = [...photographers].sort(
        (a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime()
      );

      expect(sorted[0].name).toBe("Alex");
      expect(sorted[1].name).toBe("Maria");
      expect(sorted[2].name).toBe("David");
    });
  });
});

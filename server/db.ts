import { eq, and, gte, lte, inArray, desc, asc, isNull, or, sql, count, sum, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  photographers,
  services,
  pricingRules,
  photographerServices,
  bookings,
  reviews,
  availability,
  portfolioImages,
  notifications,
  transactions,
  bookingServices,
  bookingPhotos,
  photographerApplications,
  photographerPortfolios,
  waitlist,
  editorRatings,
  photographerDocuments,
  photographerAgreements,
  photographerCompliance,
  payouts,
  InsertPayout,
  userSettings,
  systemSettings,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { encrypt, decrypt, encryptIfNeeded } from "./_core/encryption";
import Stripe from "stripe";

// Stripe client (lazy — only used when needed)
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key);
}


let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPhotographerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(photographers)
    .where(eq(photographers.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getPhotographerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(photographers)
    .where(eq(photographers.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(services)
    .where(eq(services.isActive, true))
    .orderBy(asc(services.sortOrder));
}

export async function getAllPricingRules() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(pricingRules)
    .where(eq(pricingRules.isActive, true))
    .orderBy(asc(pricingRules.minSqft));
}

export async function calculatePriceForSqft(sqft: number): Promise<number> {
  const rules = await getAllPricingRules();
  if (rules.length === 0) {
    // Fallback to hardcoded pricing
    if (sqft >= 3001) return 380;
    if (sqft >= 2001) return 300;
    if (sqft >= 1001) return 220;
    return 150;
  }

  for (const rule of rules) {
    const max = rule.maxSqft;
    if (sqft >= rule.minSqft && (max === null || sqft <= max)) {
      return parseFloat(rule.price);
    }
  }

  // Fallback to last rule
  const lastRule = rules[rules.length - 1];
  return parseFloat(lastRule.price);
}

export async function getPhotographerServices(photographerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      service: services,
      customPrice: photographerServices.customPrice,
    })
    .from(photographerServices)
    .innerJoin(services, eq(photographerServices.serviceId, services.id))
    .where(eq(photographerServices.photographerId, photographerId));

  return result;
}

export async function searchPhotographers(
  latitude?: number,
  longitude?: number,
  maxDistance?: number,
  serviceIds?: number[],
  limit: number = 20,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [
    eq(photographers.isActive, true),
    eq(photographers.isApproved, true),
  ];

  if (serviceIds && serviceIds.length > 0) {
    const photographerIdsWithServices = await db
      .selectDistinct({ photographerId: photographerServices.photographerId })
      .from(photographerServices)
      .where(inArray(photographerServices.serviceId, serviceIds));

    const ids = photographerIdsWithServices.map((p) => p.photographerId);
    if (ids.length === 0) return [];
    conditions.push(inArray(photographers.id, ids));
  }

  const results = await db
    .select({
      photographer: photographers,
      userName: users.name,
      userEmail: users.email,
    })
    .from(photographers)
    .innerJoin(users, eq(photographers.userId, users.id))
    .where(and(...conditions))
    .limit(limit)
    .offset(offset);

  // Client-side distance filtering if coordinates provided
  if (latitude && longitude) {
    return results
      .map((r) => {
        const distance =
          r.photographer.latitude && r.photographer.longitude
            ? calculateDistance(
                latitude,
                longitude,
                r.photographer.latitude,
                r.photographer.longitude
              )
            : null;
        return { ...r, distance };
      })
      .filter((r) => !maxDistance || r.distance === null || r.distance <= maxDistance)
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }

  return results.map((r) => ({ ...r, distance: null }));
}

/**
 * Like searchPhotographers but also attaches the services list for each result.
 * Used by the map screen to show service badges on photographer cards.
 */
export async function searchPhotographersWithServices(
  latitude?: number,
  longitude?: number,
  maxDistance?: number,
  serviceIds?: number[],
  limit: number = 20,
  offset: number = 0
) {
  const base = await searchPhotographers(latitude, longitude, maxDistance, serviceIds, limit, offset);
  const enriched = await Promise.all(
    base.map(async (r) => {
      const svcList = await getPhotographerServices(r.photographer.id);
      return { ...r, services: svcList };
    })
  );
  return enriched;
}

export async function getPhotographerReviews(photographerId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      review: reviews,
      clientName: users.name,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.clientId, users.id))
    .where(eq(reviews.photographerId, photographerId))
    .orderBy(desc(reviews.createdAt));

  return result;
}

export async function getPhotographerPortfolio(photographerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(portfolioImages)
    .where(eq(portfolioImages.photographerId, photographerId))
    .orderBy(desc(portfolioImages.createdAt));
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.bookingCode, code))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingByCodeWithPhotographer(code: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      booking: bookings,
      photographerName: users.name,
      photographerImage: photographers.profileImage,
    })
    .from(bookings)
    .leftJoin(photographers, eq(bookings.photographerId, photographers.id))
    .leftJoin(users, eq(photographers.userId, users.id))
    .where(eq(bookings.bookingCode, code))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getClientBookings(clientId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      booking: bookings,
      photographerName: users.name,
      photographerImage: photographers.profileImage,
      photographerCity: photographers.city,
    })
    .from(bookings)
    .leftJoin(photographers, eq(bookings.photographerId, photographers.id))
    .leftJoin(users, eq(photographers.userId, users.id))
    .where(eq(bookings.clientId, clientId))
    .orderBy(desc(bookings.createdAt));

  return result;
}

export async function getPhotographerBookings(photographerId: number) {
  const db = await getDb();
  if (!db) return [];

  const clientAlias = users;

  const result = await db
    .select({
      booking: bookings,
      clientName: users.name,
      clientEmail: users.email,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.clientId, users.id))
    .where(eq(bookings.photographerId, photographerId))
    .orderBy(desc(bookings.createdAt));

  return result;
}

export async function getPhotographerAvailability(photographerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(availability)
    .where(eq(availability.photographerId, photographerId));
}

export async function getUserNotifications(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  let conditions = [eq(notifications.userId, userId)];

  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  return await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function getTransactionsByBookingId(bookingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.bookingId, bookingId))
    .orderBy(desc(transactions.createdAt));
}

export async function getBookingServices(bookingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      bookingService: bookingServices,
      service: services,
    })
    .from(bookingServices)
    .innerJoin(services, eq(bookingServices.serviceId, services.id))
    .where(eq(bookingServices.bookingId, bookingId));
}

// ─── Admin Queries ────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalUsersResult] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.role, "user"));

  const [totalPhotographersResult] = await db
    .select({ count: count() })
    .from(photographers);

  const [pendingApprovalResult] = await db
    .select({ count: count() })
    .from(photographers)
    .where(eq(photographers.isApproved, false));

  // Onboarding completion stats
  // "Completed" = onboardingStep >= 3 (all 4 steps done: 0,1,2,3)
  const [completedOnboardingResult] = await db
    .select({ count: count() })
    .from(photographers)
    .where(gte(photographers.onboardingStep, 3));

  const [incompleteOnboardingResult] = await db
    .select({ count: count() })
    .from(photographers)
    .where(lte(photographers.onboardingStep, 2));

  const [totalBookingsResult] = await db
    .select({ count: count() })
    .from(bookings);

  const [revenueResult] = await db
    .select({ total: sum(bookings.totalPrice) })
    .from(bookings)
    .where(eq(bookings.paymentStatus, "completed"));

  // Monthly revenue (current month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [monthlyRevenueResult] = await db
    .select({ total: sum(bookings.totalPrice) })
    .from(bookings)
    .where(
      and(
        eq(bookings.paymentStatus, "completed"),
        gte(bookings.createdAt, startOfMonth)
      )
    );

  return {
    totalUsers: totalUsersResult.count,
    totalPhotographers: totalPhotographersResult.count,
    pendingApprovals: pendingApprovalResult.count,
    completedOnboarding: completedOnboardingResult.count,
    incompleteOnboarding: incompleteOnboardingResult.count,
    totalBookings: totalBookingsResult.count,
    totalRevenue: parseFloat(revenueResult.total ?? "0"),
    monthlyRevenue: parseFloat(monthlyRevenueResult.total ?? "0"),
  };
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return { rows: [] as any[], total: 0 };

  const [rows, totalResult] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(users),
  ]);
  return { rows, total: Number(totalResult[0]?.count ?? 0) };
}

export async function getAllPhotographersAdmin(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return { rows: [] as any[], total: 0 };

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        photographer: photographers,
        userName: users.name,
        userEmail: users.email,
      })
      .from(photographers)
      .innerJoin(users, eq(photographers.userId, users.id))
      .orderBy(desc(photographers.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(photographers),
  ]);

  // Enrich each photographer with portfolio images and services for admin review
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const portfolio = await getPhotographerPortfolio(row.photographer.id);
      const svcList = await getPhotographerServices(row.photographer.id);
      return { ...row, portfolio, services: svcList };
    })
  );

  return { rows: enriched, total: Number(totalResult[0]?.count ?? 0) };
}

export async function getPhotographerDetailAdmin(photographerId: number) {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select({
      photographer: photographers,
      userName: users.name,
      userEmail: users.email,
    })
    .from(photographers)
    .innerJoin(users, eq(photographers.userId, users.id))
    .where(eq(photographers.id, photographerId))
    .limit(1);

  if (rows.length === 0) return null;
  const row = rows[0];

  const portfolio = await getPhotographerPortfolio(photographerId);
  const svcList = await getPhotographerServices(photographerId);
  const reviewList = await getPhotographerReviews(photographerId);
  const avail = await getPhotographerAvailability(photographerId);

  return { ...row, portfolio, services: svcList, reviews: reviewList, availability: avail };
}

export async function getAllBookingsAdmin(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return { rows: [] as any[], total: 0 };

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        booking: bookings,
        clientName: users.name,
        clientEmail: users.email,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.clientId, users.id))
      .orderBy(desc(bookings.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(bookings),
  ]);

  // Enrich with photographer name
  const enriched = await Promise.all(
    rows.map(async (row) => {
      let photographerName: string | null = null;
      if (row.booking.photographerId) {
        const ph = await getPhotographerById(row.booking.photographerId);
        if (ph) {
          const phUserRows = await db!.select({ name: users.name }).from(users).where(eq(users.id, ph.userId)).limit(1);
          photographerName = phUserRows[0]?.name ?? null;
        }
      }
      return { ...row, photographerName };
    })
  );
  return { rows: enriched, total: Number(totalResult[0]?.count ?? 0) };
}

export async function getBookingDetailAdmin(bookingCode: string) {
  const db = await getDb();
  if (!db) return null;

  // Fetch booking with client info
  const bookingRows = await db
    .select({
      booking: bookings,
      clientName: users.name,
      clientEmail: users.email,
      clientPhone: users.phone,
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.clientId, users.id))
    .where(eq(bookings.bookingCode, bookingCode))
    .limit(1);

  if (bookingRows.length === 0) return null;
  const row = bookingRows[0];

  // Fetch photographer info if assigned
  let photographerInfo: {
    photographerId: number;
    photographerName: string | null;
    photographerEmail: string | null;
    averageRating: string | null;
    city: string | null;
    profileImage: string | null;
  } | null = null;

  if (row.booking.photographerId) {
    const phRows = await db
      .select({
        photographerId: photographers.id,
        photographerName: users.name,
        photographerEmail: users.email,
        averageRating: photographers.averageRating,
        city: photographers.city,
        profileImage: photographers.profileImage,
      })
      .from(photographers)
      .innerJoin(users, eq(photographers.userId, users.id))
      .where(eq(photographers.id, row.booking.photographerId))
      .limit(1);
    if (phRows.length > 0) photographerInfo = phRows[0];
  }

  // Fetch booked services
  const bookedServices = await db
    .select({
      bookingService: bookingServices,
      serviceName: services.name,
      serviceType: services.serviceType,
    })
    .from(bookingServices)
    .leftJoin(services, eq(bookingServices.serviceId, services.id))
    .where(eq(bookingServices.bookingId, row.booking.id));

  return {
    ...row,
    photographerInfo,
    services: bookedServices,
  };
}

export async function getAllTransactionsAdmin(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      transaction: transactions,
      bookingCode: bookings.bookingCode,
      clientName: users.name,
    })
    .from(transactions)
    .leftJoin(bookings, eq(transactions.bookingId, bookings.id))
    .leftJoin(users, eq(bookings.clientId, users.id))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);
}

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


/**
 * Get available time slots for a photographer on a specific date
 * Returns array of available time slot strings (e.g., ["09:00", "11:00", "13:00"])
 */
export async function getAvailableTimeSlots(
  photographerId: number,
  targetDate: Date
): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = targetDate.getDay();
  const dateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

  // Check for specific date blocks (exceptions)
  const specificDateBlocks = await db
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.photographerId, photographerId),
        eq(sql`DATE(${availability.specificDate})`, dateStr),
        eq(availability.isAvailable, false)
      )
    );

  // If entire day is blocked, return empty
  if (specificDateBlocks.length > 0 && specificDateBlocks.some(a => !a.dayOfWeek)) {
    return [];
  }

  // Get recurring availability for this day of week
  const recurringAvail = await db
    .select()
    .from(availability)
    .where(
      and(
        eq(availability.photographerId, photographerId),
        eq(availability.dayOfWeek, dayOfWeek),
        isNotNull(availability.startTime),
        isNotNull(availability.endTime)
      )
    );

  if (recurringAvail.length === 0) {
    return []; // No availability set for this day
  }

  // Generate time slots from start to end time (assuming 2-hour slots)
  const slots: string[] = [];
  const avail = recurringAvail[0];
  if (!avail.startTime || !avail.endTime) return [];

  const [startHour, startMin] = avail.startTime.split(":").map(Number);
  const [endHour, endMin] = avail.endTime.split(":").map(Number);

  let current = new Date();
  current.setHours(startHour, startMin, 0, 0);
  const end = new Date();
  end.setHours(endHour, endMin, 0, 0);

  while (current < end) {
    const hours = String(current.getHours()).padStart(2, "0");
    const mins = String(current.getMinutes()).padStart(2, "0");
    slots.push(`${hours}:${mins}`);
    current.setHours(current.getHours() + 2); // 2-hour slots
  }

  // Filter out booked slots
  const bookedSlots = await db
    .select({ scheduledDate: bookings.scheduledDate })
    .from(bookings)
    .where(
      and(
        eq(bookings.photographerId, photographerId),
        eq(sql`DATE(${bookings.scheduledDate})`, dateStr),
        inArray(bookings.status, ["accepted", "in_progress", "completed"])
      )
    );

  const bookedTimes = bookedSlots.map(b => {
    const d = new Date(b.scheduledDate);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  return slots.filter(slot => !bookedTimes.includes(slot));
}

/**
 * Block a time slot for a photographer (called when booking is confirmed)
 */
export async function blockPhotographerTimeSlot(
  photographerId: number,
  date: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(availability).values({
    photographerId,
    specificDate: date,
    isAvailable: false,
  });
}

/**
 * Get photographers available for a specific date and time
 */
export async function getAvailablePhotographers(
  targetDate: Date,
  targetTime: string
): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const dayOfWeek = targetDate.getDay();
  const dateStr = targetDate.toISOString().split("T")[0];

  // Get all active photographers
  const allPhotographers = await db
    .select({ id: photographers.id })
    .from(photographers)
    .where(eq(photographers.isActive, true));

  const availableIds: number[] = [];

  for (const ph of allPhotographers) {
    // Check for day blocks
    const dayBlocks = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.photographerId, ph.id),
          eq(sql`DATE(${availability.specificDate})`, dateStr),
          eq(availability.isAvailable, false)
        )
      );

    if (dayBlocks.length > 0) continue;

    // Check recurring availability
    const recurringAvail = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.photographerId, ph.id),
          eq(availability.dayOfWeek, dayOfWeek)
        )
      );

    if (recurringAvail.length === 0) continue;

    const avail = recurringAvail[0];
    if (!avail.startTime || !avail.endTime) continue;

    // Check if target time falls within working hours
    const [targetHour, targetMin] = targetTime.split(":").map(Number);
    const [startHour, startMin] = avail.startTime.split(":").map(Number);
    const [endHour, endMin] = avail.endTime.split(":").map(Number);

    const targetMins = targetHour * 60 + targetMin;
    const startMins = startHour * 60 + startMin;
    const endMins = endHour * 60 + endMin;

    if (targetMins < startMins || targetMins >= endMins) continue;

    // Check for existing bookings at this time
    const existingBooking = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.photographerId, ph.id),
          eq(sql`DATE(${bookings.scheduledDate})`, dateStr),
          inArray(bookings.status, ["accepted", "in_progress", "completed"])
        )
      )
      .limit(1);

    if (existingBooking.length === 0) {
      availableIds.push(ph.id);
    }
  }

  return availableIds;
}


/**
 * Upload a photo for a booking
 */
export async function uploadBookingPhoto(
  bookingId: number,
  fileName: string,
  fileUrl: string,
  fileSize: number,
  fileType: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const lastPhoto = await db
    .select({ maxOrder: sql`MAX(${bookingPhotos.displayOrder})` })
    .from(bookingPhotos)
    .where(eq(bookingPhotos.bookingId, bookingId))
    .then((r) => r[0]);

  const nextOrder = ((lastPhoto?.maxOrder as number) || 0) + 1;

  await db.insert(bookingPhotos).values({
    bookingId,
    fileName,
    fileUrl,
    fileSize,
    fileType,
    displayOrder: nextOrder,
  });
}

/**
 * Get all photos for a booking (excluding soft-deleted ones)
 */
export async function getBookingPhotos(bookingId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(bookingPhotos)
    .where(and(eq(bookingPhotos.bookingId, bookingId), eq(bookingPhotos.isDeleted, false)))
    .orderBy(asc(bookingPhotos.displayOrder));
}

/**
 * Soft delete a photo from a booking
 */
export async function deleteBookingPhoto(photoId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(bookingPhotos)
    .set({ isDeleted: true })
    .where(eq(bookingPhotos.id, photoId));
}

/**
 * Reorder photos for a booking
 */
export async function reorderBookingPhotos(
  bookingId: number,
  photoIds: number[]
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (let i = 0; i < photoIds.length; i++) {
    await db
      .update(bookingPhotos)
      .set({ displayOrder: i + 1 })
      .where(eq(bookingPhotos.id, photoIds[i]));
  }
}


/**
 * Create a review for a booking
 */
export async function createReview(
  bookingId: number,
  photographerId: number,
  clientId: number,
  rating: number,
  comment?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(reviews).values({
    bookingId,
    photographerId,
    clientId,
    rating,
    comment,
  });
}



/**
 * Calculate average rating for a photographer
 */
export async function calculatePhotographerAverageRating(
  photographerId: number
): Promise<{ averageRating: number; reviewCount: number }> {
  const db = await getDb();
  if (!db) return { averageRating: 0, reviewCount: 0 };

  const result = await db
    .select({
      avgRating: sql<number>`AVG(${reviews.rating})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(reviews)
    .where(eq(reviews.photographerId, photographerId))
    .then((r) => r[0]);

  return {
    averageRating: result?.avgRating ? Math.round(result.avgRating * 10) / 10 : 0,
    reviewCount: result?.count ? Number(result.count) : 0,
  };
}

/**
 * Check if a client has already reviewed a booking
 */
export async function hasClientReviewedBooking(bookingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(reviews)
    .where(eq(reviews.bookingId, bookingId))
    .limit(1);
  return result.length > 0;
}


/**
 * Calculate total earnings for a photographer
 */
export async function getPhotographerTotalEarnings(photographerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { photographerRate } = await getCommissionRates();

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(COALESCE(CAST(${transactions.photographerShare} AS DECIMAL(10,2)), CAST(${transactions.amount} AS DECIMAL(10,2)) * ${photographerRate})), 0)`,
    })
    .from(transactions)
    .innerJoin(bookings, eq(transactions.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.photographerId, photographerId),
        eq(transactions.status, "completed")
      )
    )
    .then((r) => r[0]);

  return result?.total ? Number(result.total) : 0;
}

/**
 * Calculate monthly earnings for a photographer (current month)
 */
export async function getPhotographerMonthlyEarnings(photographerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const { photographerRate } = await getCommissionRates();

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(COALESCE(CAST(${transactions.photographerShare} AS DECIMAL(10,2)), CAST(${transactions.amount} AS DECIMAL(10,2)) * ${photographerRate})), 0)`,
    })
    .from(transactions)
    .innerJoin(bookings, eq(transactions.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.photographerId, photographerId),
        eq(transactions.status, "completed"),
        sql`DATE(${transactions.createdAt}) >= ${startOfMonth.toISOString().split("T")[0]}`
      )
    )
    .then((r) => r[0]);

  return result?.total ? Number(result.total) : 0;
}

/**
 * Get monthly earnings trend (last 12 months)
 */
export async function getPhotographerMonthlyTrend(
  photographerId: number
): Promise<Array<{ month: string; earnings: number }>> {
  const db = await getDb();
  if (!db) return [];

  const { photographerRate } = await getCommissionRates();

  const result = await db
    .select({
      month: sql<string>`DATE_FORMAT(${transactions.createdAt}, '%Y-%m')`,
      earnings: sql<number>`COALESCE(SUM(COALESCE(CAST(${transactions.photographerShare} AS DECIMAL(10,2)), CAST(${transactions.amount} AS DECIMAL(10,2)) * ${photographerRate})), 0)`,
    })
    .from(transactions)
    .innerJoin(bookings, eq(transactions.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.photographerId, photographerId),
        eq(transactions.status, "completed"),
        sql`${transactions.createdAt} >= DATE_SUB(NOW(), INTERVAL 12 MONTH)`
      )
    )
    .groupBy(sql`DATE_FORMAT(${transactions.createdAt}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${transactions.createdAt}, '%Y-%m')`);

  return result.map((r) => ({
    month: r.month || "",
    earnings: Number(r.earnings || 0),
  }));
}

/**
 * Get recent payouts (completed transactions)
 */
export async function getPhotographerRecentPayouts(
  photographerId: number,
  limit: number = 10
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      transaction: transactions,
      booking: bookings,
      services: bookingServices,
    })
    .from(transactions)
    .innerJoin(bookings, eq(transactions.bookingId, bookings.id))
    .leftJoin(bookingServices, eq(bookings.id, bookingServices.bookingId))
    .where(
      and(
        eq(bookings.photographerId, photographerId),
        eq(transactions.status, "completed")
      )
    )
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

/**
 * Get earnings breakdown by service type
 */
export async function getPhotographerEarningsByService(photographerId: number) {
  const db = await getDb();
  if (!db) return [];

  const { photographerRate } = await getCommissionRates();

  return await db
    .select({
      serviceName: services.name,
      totalEarnings: sql<number>`COALESCE(SUM(COALESCE(CAST(${transactions.photographerShare} AS DECIMAL(10,2)), CAST(${transactions.amount} AS DECIMAL(10,2)) * ${photographerRate})), 0)`,
      bookingCount: sql<number>`COUNT(DISTINCT ${bookings.id})`,
    })
    .from(transactions)
    .innerJoin(bookings, eq(transactions.bookingId, bookings.id))
    .innerJoin(bookingServices, eq(bookings.id, bookingServices.bookingId))
    .innerJoin(services, eq(bookingServices.serviceId, services.id))
    .where(
      and(
        eq(bookings.photographerId, photographerId),
        eq(transactions.status, "completed")
      )
    )
    .groupBy(services.id)
    .orderBy(desc(sql`SUM(COALESCE(CAST(${transactions.photographerShare} AS DECIMAL(10,2)), CAST(${transactions.amount} AS DECIMAL(10,2)) * ${photographerRate}))`));
}

/**
 * Get upcoming payouts (completed bookings not yet paid)
 */
export async function getPhotographerUpcomingPayouts(photographerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      booking: bookings,
      services: bookingServices,
    })
    .from(bookings)
    .leftJoin(bookingServices, eq(bookings.id, bookingServices.bookingId))
    .where(
      and(
        eq(bookings.photographerId, photographerId),
        eq(bookings.status, "delivered"),
        sql`NOT EXISTS (
          SELECT 1 FROM ${transactions}
          WHERE ${transactions.bookingId} = ${bookings.id}
          AND ${transactions.status} = 'completed'
        )`
      )
    )
    .orderBy(desc(bookings.updatedAt));
}


/**
 * Calculate photographer's available balance (completed transactions - payouts)
 */
export async function getPhotographerAvailableBalance(photographerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Get total completed earnings
  const earningsResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(10,2))), 0)`,
    })
    .from(transactions)
    .innerJoin(bookings, eq(transactions.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.photographerId, photographerId),
        eq(transactions.status, "completed")
      )
    )
    .then((r) => r[0]);

  const totalEarnings = earningsResult?.total ? Number(earningsResult.total) : 0;

  // Get total completed payouts from payouts table
  const payoutsResult = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${payouts.amount} AS DECIMAL(10,2))), 0)`,
    })
    .from(payouts)
    .where(
      and(
        eq(payouts.photographerId, photographerId),
        inArray(payouts.status, ["completed", "processing"])
      )
    )
    .then((r) => r[0]);

  const totalPayouts = payoutsResult?.total ? Number(payoutsResult.total) : 0;
  return Math.max(0, totalEarnings - totalPayouts);
}

/**
 * Calculate photographer's pending balance (pending payouts)
 */
export async function getPhotographerPendingBalance(photographerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(CAST(${payouts.amount} AS DECIMAL(10,2))), 0)` })
    .from(payouts)
    .where(and(eq(payouts.photographerId, photographerId), eq(payouts.status, "pending")))
    .then((r) => r[0]);
  return result?.total ? Number(result.total) : 0;
}

/**
 * Get payout history for a photographer
 */
export async function getPhotographerPayoutHistory(photographerId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(payouts)
    .where(eq(payouts.photographerId, photographerId))
    .orderBy(desc(payouts.createdAt))
    .limit(limit);
}

/**
 * Create a new payout request
 */
export async function createPayoutRequest(
  photographerId: number,
  amount: number,
  paymentMethod: string
): Promise<{ id: number; stripeTransferId: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (amount < 50) throw new Error("Minimum payout amount is $50");

  // Check available balance
  const availableBalance = await getPhotographerAvailableBalance(photographerId);
  if (amount > availableBalance) throw new Error("Payout amount exceeds available balance");

  // Get photographer's Stripe Connect ID
  const connectStatus = await getStripeConnectStatus(photographerId);
  if (!connectStatus?.stripeConnectId) {
    throw new Error("Stripe Connect account not set up. Please complete onboarding first.");
  }
  if (connectStatus.stripeConnectStatus !== "connected") {
    throw new Error("Stripe Connect account is not fully verified yet. Please complete Stripe onboarding.");
  }

  const stripe = getStripe();
  const amountCents = Math.round(amount * 100);

  // Create Stripe Transfer to the photographer's Connect account
  const transfer = await stripe.transfers.create({
    amount: amountCents,
    currency: "usd",
    destination: connectStatus.stripeConnectId,
    metadata: { photographerId: photographerId.toString() },
  });

  // Save payout record in DB
  const result = await db.insert(payouts).values({
    photographerId,
    amount: amount.toFixed(2),
    currency: "USD",
    status: "completed",
    paymentMethod,
    stripePayoutId: transfer.id,
  });

  const insertId = (result as any).insertId ?? 0;
  return { id: insertId, stripeTransferId: transfer.id };
}

/**
 * Get total lifetime earnings for a photographer
 */
export async function getPhotographerLifetimeEarnings(photographerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { photographerRate } = await getCommissionRates();

  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(COALESCE(CAST(${transactions.photographerShare} AS DECIMAL(10,2)), CAST(${transactions.amount} AS DECIMAL(10,2)) * ${photographerRate})), 0)`,
    })
    .from(transactions)
    .innerJoin(bookings, eq(transactions.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.photographerId, photographerId),
        eq(transactions.status, "completed")
      )
    )
    .then((r) => r[0]);

  return result?.total ? Number(result.total) : 0;
}


/**
 * Get Stripe Connect status for a photographer
 */
export async function getStripeConnectStatus(photographerId: number) {
  const db = await getDb();
  if (!db) return null;

  const photographer = await db
    .select({
      stripeConnectId: photographers.stripeConnectId,
      stripeConnectStatus: photographers.stripeConnectStatus,
      bankAccountLast4: photographers.bankAccountLast4,
      bankAccountName: photographers.bankAccountName,
      payoutSchedule: photographers.payoutSchedule,
    })
    .from(photographers)
    .where(eq(photographers.id, photographerId))
    .then((r) => r[0]);

  return photographer || null;
}

/**
 * Update Stripe Connect status for a photographer
 */
export async function updateStripeConnectStatus(
  photographerId: number,
  data: {
    stripeConnectId?: string;
    stripeConnectStatus?: "not_connected" | "pending_verification" | "connected";
    bankAccountLast4?: string;
    bankAccountName?: string;
    payoutSchedule?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(photographers)
    .set(data)
    .where(eq(photographers.id, photographerId));
}

/**
 * Create Stripe Connect Express account for a photographer.
 * Returns the new Stripe account ID (acct_...) and onboarding URL.
 */
export async function createStripeConnectAccount(
  photographerId: number,
  email: string,
  name: string
): Promise<{ stripeConnectId: string; onboardingUrl: string }> {
  const stripe = getStripe();

  // Create Stripe Express account
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    business_type: "individual",
    individual: { email, first_name: name.split(" ")[0], last_name: name.split(" ").slice(1).join(" ") || name },
    metadata: { photographerId: photographerId.toString() },
  });

  await updateStripeConnectStatus(photographerId, {
    stripeConnectId: account.id,
    stripeConnectStatus: "pending_verification",
  });

  // Generate onboarding link
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${baseUrl}/photographer/payout-settings?reauth=1`,
    return_url: `${baseUrl}/photographer/payout-settings?setup=complete`,
    type: "account_onboarding",
  });

  return { stripeConnectId: account.id, onboardingUrl: accountLink.url };
}


/**
 * Photographer Applications
 */
export async function submitPhotographerApplication(userId: number, data: {
  fullName: string;
  email: string;
  phoneNumber: string;
  city: string;
  yearsExperience?: number;
  equipmentUsed?: string;
  governmentIdUrl: string;
  governmentIdType: string;
  independentContractorAgreed: boolean;
  termsOfServiceAgreed: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(photographerApplications).values({
    userId,
    fullName: data.fullName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    city: data.city,
    yearsExperience: data.yearsExperience,
    equipmentUsed: data.equipmentUsed,
    governmentIdUrl: data.governmentIdUrl,
    governmentIdType: data.governmentIdType,
    independentContractorAgreed: data.independentContractorAgreed,
    termsOfServiceAgreed: data.termsOfServiceAgreed,
    status: "pending",
  });
  
  return result;
}

export async function getPhotographerApplication(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(photographerApplications).where(eq(photographerApplications.userId, userId)).limit(1);
  
  return result[0];
}

export async function submitPortfolioPhotos(applicationId: number, photos: Array<{
  url: string;
  description?: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const portfolioRecords = photos.map((photo, index) => ({
    applicationId,
    photoUrl: photo.url,
    photoDescription: photo.description || null,
    displayOrder: index,
  }));
  
  return db.insert(photographerPortfolios).values(portfolioRecords);
}

export async function getApplicationPortfolios(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(photographerPortfolios).where(eq(photographerPortfolios.applicationId, applicationId)).orderBy(asc(photographerPortfolios.displayOrder));
}

export async function updateApplicationStatus(applicationId: number, status: string, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(photographerApplications)
    .set({
      status: status as any,
      adminNotes: notes,
      updatedAt: new Date(),
    })
    .where(eq(photographerApplications.id, applicationId));
}



/**
 * Search for photographers by location with filters
 * Returns photographers within radius who are approved, Stripe connected, and available
 */
export async function searchPhotographersByLocation(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25,
  date?: Date,
  timeSlot?: string
) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get all approved photographers with Stripe connected
    const allPhotographers = await db
      .select()
      .from(photographers)
      .where(
        and(
          eq(photographers.isApproved, true),
          eq(photographers.stripeConnectStatus, "connected"),
          eq(photographers.isActive, true)
        )
      );

    // Filter by distance and availability
    const nearby = allPhotographers.filter((p) => {
      if (!p.latitude || !p.longitude) return false;
      const distance = calculateDistance(latitude, longitude, p.latitude, p.longitude);
      return distance <= radiusMiles;
    });

    // If date and timeSlot provided, check availability
    if (date && timeSlot) {
      const availablePhotographers = [];
      for (const p of nearby) {
        const isAvailable = await checkPhotographerAvailability(p.id, date, timeSlot);
        if (isAvailable) {
          availablePhotographers.push(p);
        }
      }
      return availablePhotographers;
    }

    return nearby;
  } catch (error) {
    console.error("[Database] Error searching photographers by location:", error);
    return [];
  }
}

/**
 * Check if photographer is available on specific date and time
 */
export async function checkPhotographerAvailability(
  photographerId: number,
  date: Date,
  timeSlot: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split("T")[0];

    // Check for specific date exceptions first
    const specificAvailability = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.photographerId, photographerId),
          sql`DATE(${availability.specificDate}) = ${dateStr}`
        )
      );

    if (specificAvailability.length > 0) {
      return specificAvailability[0].isAvailable || false;
    }

    // Check recurring availability by day of week
    const recurringAvailability = await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.photographerId, photographerId),
          eq(availability.dayOfWeek, dayOfWeek)
        )
      );

    if (recurringAvailability.length > 0) {
      const av = recurringAvailability[0];
      if (!(av.isAvailable ?? true)) return false;

      // Check if timeSlot falls within working hours
      if (av.startTime && av.endTime) {
        const [slotHour] = timeSlot.split(":").map(Number);
        const [startHour] = av.startTime.split(":").map(Number);
        const [endHour] = av.endTime.split(":").map(Number);
        return slotHour >= startHour && slotHour < endHour;
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("[Database] Error checking photographer availability:", error);
    return false;
  }
}

/**
 * Add email to waitlist for area
 */
export async function addToWaitlist(email: string, city: string, state: string, zipCode?: string, latitude?: number, longitude?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    return await db.insert(waitlist).values({
      email,
      city,
      state,
      zipCode: zipCode || null,
      latitude: latitude || null,
      longitude: longitude || null,
    });
  } catch (error) {
    console.error("[Database] Error adding to waitlist:", error);
    throw error;
  }
}

/**
 * Get waitlist count for a specific area
 */
export async function getWaitlistCount(city: string, state: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ count: count() })
      .from(waitlist)
      .where(
        and(
          eq(waitlist.city, city),
          eq(waitlist.state, state)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Error getting waitlist count:", error);
    return 0;
  }
}



/**
 * Submit or update an editor rating for a booking
 */
export async function submitEditorRating(
  bookingCode: string,
  bookingId: number,
  photographerId: number,
  editorId: number,
  rating: {
    overallRating: number;
    photoQualityRating: number;
    fileOrganizationRating: number;
    instructionRating: number;
    editingEaseRating: number;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Check if rating already exists
    const existing = await db
      .select()
      .from(editorRatings)
      .where(
        and(
          eq(editorRatings.bookingCode, bookingCode),
          eq(editorRatings.editorId, editorId)
        )
      );

    if (existing.length > 0) {
      // Update existing rating
      return await db
        .update(editorRatings)
        .set({
          overallRating: rating.overallRating,
          photoQualityRating: rating.photoQualityRating,
          fileOrganizationRating: rating.fileOrganizationRating,
          instructionRating: rating.instructionRating,
          editingEaseRating: rating.editingEaseRating,
          notes: rating.notes || null,
          updatedAt: new Date(),
        })
        .where(eq(editorRatings.id, existing[0].id));
    }

    // Create new rating
    return await db.insert(editorRatings).values({
      bookingCode,
      bookingId,
      photographerId,
      editorId,
      overallRating: rating.overallRating,
      photoQualityRating: rating.photoQualityRating,
      fileOrganizationRating: rating.fileOrganizationRating,
      instructionRating: rating.instructionRating,
      editingEaseRating: rating.editingEaseRating,
      notes: rating.notes || null,
    });
  } catch (error) {
    console.error("[Database] Error submitting editor rating:", error);
    throw error;
  }
}

/**
 * Get editor rating for a specific booking
 */
export async function getEditorRating(bookingCode: string, editorId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(editorRatings)
      .where(
        and(
          eq(editorRatings.bookingCode, bookingCode),
          eq(editorRatings.editorId, editorId)
        )
      );

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Error getting editor rating:", error);
    return null;
  }
}

/**
 * Get all internal ratings for a photographer
 */
export async function getPhotographerInternalRatings(photographerId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(editorRatings)
      .where(eq(editorRatings.photographerId, photographerId))
      .orderBy(desc(editorRatings.createdAt));
  } catch (error) {
    console.error("[Database] Error getting photographer internal ratings:", error);
    return [];
  }
}

/**
 * Get internal rating summary for a photographer
 */
export async function getPhotographerInternalRatingSummary(photographerId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const ratings = await db
      .select()
      .from(editorRatings)
      .where(eq(editorRatings.photographerId, photographerId));

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        recentNotes: [],
      };
    }

    const averageOverall = ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length;
    const recentNotes = ratings
      .filter((r) => r.notes && r.notes.trim().length > 0)
      .slice(0, 5)
      .map((r) => ({
        date: r.createdAt,
        notes: r.notes,
      }));

    return {
      averageRating: Math.round(averageOverall * 10) / 10,
      totalReviews: ratings.length,
      recentNotes,
    };
  } catch (error) {
    console.error("[Database] Error getting photographer internal rating summary:", error);
    return null;
  }
}




// ============ PHOTOGRAPHER COMPLIANCE HELPERS ============

export async function uploadPhotographerDocument(
  photographerId: number,
  documentType: "government_id" | "driver_license" | "passport" | "w9_form" | "faa_license" | "insurance_certificate",
  fileUrl: string,
  fileKey: string,
  expiresAt?: Date
) {
  const db = await getDb();
  if (!db) return undefined;
  
  return await db.insert(photographerDocuments).values({
    photographerId,
    documentType,
    fileUrl,
    fileKey,
    verificationStatus: "pending",
    expiresAt,
  });
}

export async function getPhotographerDocuments(photographerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(photographerDocuments)
    .where(eq(photographerDocuments.photographerId, photographerId));
}

export async function getPhotographerDocument(
  photographerId: number,
  documentType: string
) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(photographerDocuments)
    .where(and(
      eq(photographerDocuments.photographerId, photographerId),
      eq(photographerDocuments.documentType, documentType as any)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function recordAgreementAcceptance(
  photographerId: number,
  agreementType: string,
  version: string
) {
  const db = await getDb();
  if (!db) return undefined;
  
  return await db.insert(photographerAgreements).values({
    photographerId,
    agreementType: agreementType as any,
    agreementVersion: version,
  });
}

export async function getPhotographerAgreements(photographerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(photographerAgreements)
    .where(eq(photographerAgreements.photographerId, photographerId));
}

export async function getPhotographerCompliance(photographerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(photographerCompliance)
    .where(eq(photographerCompliance.photographerId, photographerId))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function recordCancellation(photographerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const compliance = await getPhotographerCompliance(photographerId);
  const newCount = (compliance?.cancellationCount || 0) + 1;
  
  let newStatus: "compliant" | "warning" | "suspended" | "banned" = "compliant";
  if (newCount >= 6) {
    newStatus = "suspended";
  } else if (newCount >= 3) {
    newStatus = "warning";
  }
  
  if (compliance) {
    return await db.update(photographerCompliance)
      .set({
        cancellationCount: newCount,
        complianceStatus: newStatus,
        lastViolationAt: new Date(),
      })
      .where(eq(photographerCompliance.photographerId, photographerId));
  } else {
    return await db.insert(photographerCompliance).values({
      photographerId,
      cancellationCount: newCount,
      complianceStatus: newStatus,
    });
  }
}

export async function checkFAALicenseExpiry(photographerId: number) {
  const photographer = await getPhotographerById(photographerId);
  
  if (!photographer || !photographer.faaLicenseExpiresAt) {
    return { isValid: false, daysUntilExpiry: 0 };
  }
  
  const now = new Date();
  const expiryDate = new Date(photographer.faaLicenseExpiresAt);
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    isValid: daysUntilExpiry > 0,
    daysUntilExpiry,
    expiryDate: expiryDate.toISOString(),
  };
}


// ─── User Settings ─────────────────────────────────────────────────────────────

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertUserSettings(userId: number, data: Partial<{
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  bookingAlerts: boolean;
  weeklyDigest: boolean;
  language: string;
  timezone: string;
  dataCollection: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select({ id: userSettings.id }).from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

  if (existing.length > 0) {
    await db.update(userSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ userId, ...data });
  }
}

// ─── System Settings ───────────────────────────────────────────────────────────

export async function getSystemSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ value: systemSettings.value })
    .from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return result[0]?.value ?? null;
}

export async function setSystemSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.execute(
    sql`INSERT INTO system_settings (${sql.raw('`key`')}, ${sql.raw('`value`')}) VALUES (${key}, ${value}) ON DUPLICATE KEY UPDATE ${sql.raw('`value`')} = ${value}, updatedAt = NOW()`
  );
}


// ─── Secure Tax / Identity Info (AES-256-GCM encrypted) ──────────────────────

/**
 * Save sensitive tax identity fields — SSN, EIN, DOB — encrypted at rest.
 * These are NEVER returned to clients; only used for Stripe identity verification.
 */
export async function updatePhotographerTaxInfo(
  photographerId: number,
  data: {
    ssn?: string | null;
    ein?: string | null;
    dateOfBirth?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (data.ssn !== undefined) updateData.ssn = encryptIfNeeded(data.ssn);
  if (data.ein !== undefined) updateData.ein = encryptIfNeeded(data.ein);
  if (data.dateOfBirth !== undefined) updateData.dateOfBirth = encryptIfNeeded(data.dateOfBirth);

  await db.update(photographers).set(updateData).where(eq(photographers.id, photographerId));
}

/**
 * Read and decrypt sensitive tax fields — admin/internal use only.
 * NEVER expose the return value to client responses.
 */
export async function getPhotographerTaxInfo(photographerId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({ ssn: photographers.ssn, ein: photographers.ein, dateOfBirth: photographers.dateOfBirth })
    .from(photographers).where(eq(photographers.id, photographerId)).limit(1);
  if (!result[0]) return null;
  return {
    ssn: decrypt(result[0].ssn),
    ein: decrypt(result[0].ein),
    dateOfBirth: decrypt(result[0].dateOfBirth),
  };
}

// ─── Commission Rate Helper ──────────────────────────────────────────────────

/**
 * Returns { photographerRate, platformRate } from system_settings.
 * Falls back to 0.65/0.35 if not set.
 */
export async function getCommissionRates(): Promise<{ photographerRate: number; platformRate: number }> {
  const stored = await getSystemSetting("commissionRate");
  const platformRate = stored ? parseFloat(stored) / 100 : 0.35;
  const photographerRate = 1 - platformRate;
  return { photographerRate, platformRate };
}

// ─── Admin Monthly Stats ─────────────────────────────────────────────────────

export async function getAdminMonthlyStats(months: number = 6) {
  const db = await getDb();
  if (!db) return [];

  const results = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const [rev] = await db
      .select({ total: sum(bookings.totalPrice) })
      .from(bookings)
      .where(and(eq(bookings.paymentStatus, "completed"), gte(bookings.createdAt, start), lte(bookings.createdAt, end)));

    const [bk] = await db
      .select({ cnt: count() })
      .from(bookings)
      .where(and(gte(bookings.createdAt, start), lte(bookings.createdAt, end)));

    const [ph] = await db
      .select({ cnt: count() })
      .from(photographers)
      .where(and(gte(photographers.createdAt, start), lte(photographers.createdAt, end)));

    results.push({
      month: d.toLocaleString("en-US", { month: "long" }),
      year: d.getFullYear(),
      revenue: parseFloat(rev?.total ?? "0"),
      bookings: Number(bk?.cnt ?? 0),
      newPhotographers: Number(ph?.cnt ?? 0),
    });
  }

  return results;
}

/**
 * Returns MoM (month-over-month) % change for key metrics.
 * Compares current month vs previous month.
 */
export async function getAdminStatChanges() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const curStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [curRev] = await db.select({ t: sum(bookings.totalPrice) }).from(bookings)
    .where(and(eq(bookings.paymentStatus, "completed"), gte(bookings.createdAt, curStart)));
  const [prevRev] = await db.select({ t: sum(bookings.totalPrice) }).from(bookings)
    .where(and(eq(bookings.paymentStatus, "completed"), gte(bookings.createdAt, prevStart), lte(bookings.createdAt, prevEnd)));

  const [curBk] = await db.select({ c: count() }).from(bookings).where(gte(bookings.createdAt, curStart));
  const [prevBk] = await db.select({ c: count() }).from(bookings).where(and(gte(bookings.createdAt, prevStart), lte(bookings.createdAt, prevEnd)));

  const [curPh] = await db.select({ c: count() }).from(photographers).where(gte(photographers.createdAt, curStart));
  const [prevPh] = await db.select({ c: count() }).from(photographers).where(and(gte(photographers.createdAt, prevStart), lte(photographers.createdAt, prevEnd)));

  const [curUs] = await db.select({ c: count() }).from(users).where(and(eq(users.role, "user"), gte(users.createdAt, curStart)));
  const [prevUs] = await db.select({ c: count() }).from(users).where(and(eq(users.role, "user"), gte(users.createdAt, prevStart), lte(users.createdAt, prevEnd)));

  function pct(cur: number, prev: number) {
    if (prev === 0) return cur > 0 ? "+100%" : "0%";
    const diff = Math.round(((cur - prev) / prev) * 100);
    return diff >= 0 ? `+${diff}%` : `${diff}%`;
  }

  return {
    revenueChange: pct(parseFloat(curRev?.t ?? "0"), parseFloat(prevRev?.t ?? "0")),
    bookingsChange: pct(Number(curBk?.c ?? 0), Number(prevBk?.c ?? 0)),
    photographersChange: pct(Number(curPh?.c ?? 0), Number(prevPh?.c ?? 0)),
    usersChange: pct(Number(curUs?.c ?? 0), Number(prevUs?.c ?? 0)),
  };
}

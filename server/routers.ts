import type { User } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  uploadRawPhoto,
  uploadEditedPhoto,
  getClientGallery,
  getEditorRawPhotos,
  getPhotographerRawPhotos,
  getAdminBookingFiles,
  deleteFile,
  checkPhotographerOwnership,
  checkEditorAssignment,
  checkClientOwnership,
} from "./s3-storage";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { checkRateLimit, checkRateLimitDB } from "./_core/rateLimiter";
import { z } from "zod";
import {
  getDb,
  getUserById,
  getPhotographerByUserId,
  getPhotographerById,
  getAllServices,
  getAllPricingRules,
  calculatePriceForSqft,
  getPhotographerServices,
  searchPhotographers,
  searchPhotographersWithServices,
  getPhotographerReviews,
  getPhotographerPortfolio,
  getBookingById,
  getBookingByCode,
  getBookingByCodeWithPhotographer,
  getClientBookings,
  getPhotographerBookings,
  getPhotographerAvailability,
  getUserNotifications,
  getTransactionsByBookingId,
  getBookingServices,
  getAdminStats,
  getAllUsers,
  getAllPhotographersAdmin,
  getPhotographerDetailAdmin,
  getAllBookingsAdmin,
  getBookingDetailAdmin,
  getAllTransactionsAdmin,
  getAvailableTimeSlots,
  getAvailablePhotographers,
  blockPhotographerTimeSlot,
  uploadBookingPhoto,
  getBookingPhotos,
  deleteBookingPhoto,
  reorderBookingPhotos,
  createReview,
  calculatePhotographerAverageRating,
  hasClientReviewedBooking,
  getPhotographerTotalEarnings,
  getPhotographerMonthlyEarnings,
  getPhotographerMonthlyTrend,
  getPhotographerRecentPayouts,
  getPhotographerEarningsByService,
  getPhotographerUpcomingPayouts,
  getPhotographerAvailableBalance,
  getPhotographerPendingBalance,
  getPhotographerPayoutHistory,
  createPayoutRequest,
  getPhotographerLifetimeEarnings,
  getStripeConnectStatus,
  updateStripeConnectStatus,
  createStripeConnectAccount,
  searchPhotographersByLocation,
  addToWaitlist,
  getWaitlistCount,
  submitEditorRating,
  getEditorRating,
  getPhotographerInternalRatings,
  getPhotographerInternalRatingSummary,
} from "./db";
import {
  photographers,
  bookings,
  reviews,
  portfolioImages,
  notifications,
  transactions,
  photographerServices,
  bookingServices,
  users,
  services,
  pricingRules,
  availability,
} from "../drizzle/schema";
import { eq, desc, and, inArray, isNotNull, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { paymentsRouter } from "./routers/payments";
import { COOKIE_NAME as SESSION_COOKIE_NAME } from "@shared/const";

// Use shared COOKIE_NAME

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Photographer guard middleware (allows admins to also pass through)
const photographerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "photographer" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Photographer access required" });
  }
  return next({ ctx });
});

// Editor guard middleware (allows admins to also pass through)
const editorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "editor" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Editor access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(SESSION_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    setRole: protectedProcedure
      .input(z.object({ role: z.enum(["user", "photographer"]) }))
      // Users can only switch between "user" and "photographer".
      // "editor" and "admin" roles can only be granted by an admin.
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.update(users).set({ role: input.role, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
        return { success: true, role: input.role };
      }),

    updateUserProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.update(users).set({
          name: input.name,
          email: input.email,
          phone: input.phone,
          updatedAt: new Date(),
        }).where(eq(users.id, ctx.user.id));
        return { success: true, user: await getUserById(ctx.user.id) };
      }),

    getUserSettings: protectedProcedure
      .query(async ({ ctx }) => {
        const user = await getUserById(ctx.user.id);
        return {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          bookingAlerts: true,
          weeklyDigest: false,
          language: "en",
          timezone: "America/New_York",
          dataCollection: true,
          name: user?.name,
          email: user?.email,
        };
      }),

    updateUserSettings: protectedProcedure
      .input(z.object({
        emailNotifications: z.boolean().optional(),
        smsNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        bookingAlerts: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        language: z.string().optional(),
        timezone: z.string().optional(),
        dataCollection: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertUserSettings(ctx.user.id, input);
        return { success: true };
      }),

    getUserSettings: protectedProcedure
      .query(async ({ ctx }) => {
        return await getUserSettings(ctx.user.id);
      }),
  }),

  // Services router
  services: router({
    list: publicProcedure.query(async () => {
      return await getAllServices();
    }),
    pricingRules: publicProcedure.query(async () => {
      return await getAllPricingRules();
    }),
    calculatePrice: publicProcedure
      .input(z.object({ sqft: z.number(), addonServiceIds: z.array(z.number()).optional() }))
      .query(async ({ input }) => {
        const basePrice = await calculatePriceForSqft(input.sqft);
        let addOnPrice = 0;
        if (input.addonServiceIds && input.addonServiceIds.length > 0) {
          const allServices = await getAllServices();
          for (const svc of allServices) {
            if (input.addonServiceIds.includes(svc.id) && svc.serviceType === "addon") {
              addOnPrice += parseFloat(svc.basePrice);
            }
          }
        }
        return { basePrice, addOnPrice, totalPrice: basePrice + addOnPrice };
      }),
  }),

  // Photographers router
  photographers: router({
    search: publicProcedure
      .input(
        z.object({
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          maxDistance: z.number().optional(),
          serviceIds: z.array(z.number()).optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await searchPhotographers(
          input.latitude,
          input.longitude,
          input.maxDistance,
          input.serviceIds,
          input.limit,
          input.offset
        );
      }),
    searchWithServices: publicProcedure
      .input(
        z.object({
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          maxDistance: z.number().optional(),
          serviceIds: z.array(z.number()).optional(),
          limit: z.number().default(30),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await searchPhotographersWithServices(
          input.latitude,
          input.longitude,
          input.maxDistance,
          input.serviceIds,
          input.limit,
          input.offset
        );
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const photographer = await getPhotographerById(input.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND", message: "Photographer not found" });
        return photographer;
      }),

    getProfile: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const photographer = await getPhotographerById(input.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND", message: "Photographer not found" });

        const db = await getDb();
        let userName = null;
        if (db) {
          const userResult = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, photographer.userId)).limit(1);
          userName = userResult[0]?.name ?? null;
        }

        const svcList = await getPhotographerServices(input.id);
        const reviewList = await getPhotographerReviews(input.id);
        const portfolio = await getPhotographerPortfolio(input.id);
        const avail = await getPhotographerAvailability(input.id);

        // Explicitly strip sensitive fields before returning to client
        const { ssn: _ssn, ein: _ein, dateOfBirth: _dob, ...safePhotographer } = photographer as any;
        return { photographer: safePhotographer, userName, services: svcList, reviews: reviewList, portfolio, availability: avail };
      }),

    createProfile: photographerProcedure
      .input(
        z.object({
          bio: z.string().optional(),
          yearsExperience: z.number().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Check if profile already exists
        const existing = await getPhotographerByUserId(ctx.user.id);
        if (existing) {
          // Update instead
          await db.update(photographers).set({ ...input, updatedAt: new Date() }).where(eq(photographers.id, existing.id));
          return { success: true, photographerId: existing.id };
        }

        const result = await db.insert(photographers).values({
          userId: ctx.user.id,
          bio: input.bio,
          yearsExperience: input.yearsExperience,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
          latitude: input.latitude,
          longitude: input.longitude,
          isActive: true,
          isApproved: false,
        });

        return { success: true, photographerId: Number(result[0].insertId) };
      }),

    addService: photographerProcedure
      .input(z.object({ serviceId: z.number(), customPrice: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND", message: "Photographer profile not found" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Check if already added
        const existing = await db.select().from(photographerServices)
          .where(and(eq(photographerServices.photographerId, photographer.id), eq(photographerServices.serviceId, input.serviceId)))
          .limit(1);

        if (existing.length > 0) {
          const updateData: any = {};
          if (input.customPrice !== undefined) {
            updateData.customPrice = input.customPrice.toString();
          }
          if (Object.keys(updateData).length > 0) {
            await db.update(photographerServices).set(updateData)
              .where(and(eq(photographerServices.photographerId, photographer.id), eq(photographerServices.serviceId, input.serviceId)));
          }
        } else {
          await db.insert(photographerServices).values({
            photographerId: photographer.id,
            serviceId: input.serviceId,
            customPrice: input.customPrice?.toString(),
          });
        }
        return { success: true };
      }),

    removeService: photographerProcedure
      .input(z.object({ serviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(photographerServices)
          .where(and(eq(photographerServices.photographerId, photographer.id), eq(photographerServices.serviceId, input.serviceId)));
        return { success: true };
      }),

    getMyProfile: photographerProcedure.query(async ({ ctx }) => {
      const photographer = await getPhotographerByUserId(ctx.user.id);
      if (!photographer) return null;

      const svcList = await getPhotographerServices(photographer.id);
      const reviewList = await getPhotographerReviews(photographer.id);
      const portfolio = await getPhotographerPortfolio(photographer.id);
      const avail = await getPhotographerAvailability(photographer.id);

      return { photographer, services: svcList, reviews: reviewList, portfolio, availability: avail };
    }),

    updateProfile: photographerProcedure
      .input(
        z.object({
          bio: z.string().optional(),
          profileImage: z.string().optional(),
          yearsExperience: z.number().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(photographers).set({ ...input, updatedAt: new Date() }).where(eq(photographers.id, photographer.id));
        return { success: true };
      }),

    updatePhotographerSettings: photographerProcedure
      .input(z.object({
        availabilityToggle: z.boolean().optional(),
        bio: z.string().optional(),
        profileImage: z.string().optional(),
        name: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND", message: "Photographer profile not found" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const photographerUpdate: any = { updatedAt: new Date() };
        if (input.availabilityToggle !== undefined) photographerUpdate.isAvailable = input.availabilityToggle;
        if (input.bio !== undefined) photographerUpdate.bio = input.bio;
        if (input.profileImage !== undefined) photographerUpdate.profileImage = input.profileImage;
        await db.update(photographers).set(photographerUpdate).where(eq(photographers.id, photographer.id));

        // Update user name/phone if provided
        if (input.name !== undefined || input.phone !== undefined) {
          const userUpdate: any = { updatedAt: new Date() };
          if (input.name !== undefined) userUpdate.name = input.name;
          if (input.phone !== undefined) userUpdate.phone = input.phone;
          await db.update(users).set(userUpdate).where(eq(users.id, ctx.user.id));
        }

        return { success: true };
      }),

    setAvailability: photographerProcedure
      .input(
        z.object({
          slots: z.array(z.object({
            dayOfWeek: z.number().min(0).max(6).optional(),
            startTime: z.string().optional(),
            endTime: z.string().optional(),
            specificDate: z.string().optional(),
            isAvailable: z.boolean().default(true),
          }))
        })
      )
      .mutation(async ({ ctx, input }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Delete existing weekly availability (not specific dates)
        await db.delete(availability)
          .where(and(eq(availability.photographerId, photographer.id)));

        // Bulk insert all slots in one query (avoids N+1)
        if (input.slots.length > 0) {
          await db.insert(availability).values(
            input.slots.map((slot) => ({
              photographerId: photographer.id,
              dayOfWeek: slot.dayOfWeek ?? null,
              startTime: slot.startTime ?? null,
              endTime: slot.endTime ?? null,
              specificDate: slot.specificDate ? new Date(slot.specificDate) : null,
              isAvailable: slot.isAvailable,
            }))
          );
        }
        return { success: true };
      }),

    // Track which onboarding step was completed
    // step: 0=profile, 1=services, 2=availability, 3=portfolio (fully complete)
    updateOnboardingStep: photographerProcedure
      .input(z.object({ step: z.number().min(0).max(3) }))
      .mutation(async ({ ctx, input }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND", message: "Photographer profile not found" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Only advance — never go backwards
        if (input.step <= photographer.onboardingStep) {
          return { success: true, onboardingStep: photographer.onboardingStep };
        }

        const updateData: Record<string, unknown> = {
          onboardingStep: input.step,
          updatedAt: new Date(),
        };

        // Mark completion timestamp when all 4 steps are done
        if (input.step >= 3 && !photographer.onboardingCompletedAt) {
          updateData.onboardingCompletedAt = new Date();
        }

        await db.update(photographers)
          .set(updateData)
          .where(eq(photographers.id, photographer.id));

        return { success: true, onboardingStep: input.step };
      }),

    getAvailableTimeSlots: publicProcedure
      .input(
        z.object({
          photographerId: z.number(),
          date: z.string(),
        })
      )
      .query(async ({ input }) => {
        const date = new Date(input.date);
        return await getAvailableTimeSlots(input.photographerId, date);
      }),

    getAvailablePhotographers: publicProcedure
      .input(
        z.object({
          date: z.string(),
          time: z.string(),
        })
      )
      .query(async ({ input }) => {
        const date = new Date(input.date);
        return await getAvailablePhotographers(date, input.time);
      }),

    submitApplication: photographerProcedure
      .input(
        z.object({
          fullName: z.string().min(2),
          email: z.string().email(),
          phone: z.string().min(7),
          city: z.string().min(2),
          governmentIdUrl: z.string().optional(),
          governmentIdType: z.string().optional(),
          yearsExperience: z.number().optional(),
          equipment: z.string().optional(),
          independentContractorAgreed: z.boolean().optional(),
          termsOfServiceAgreed: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Check for existing application
        const existing = await getPhotographerApplication(ctx.user.id);
        if (existing) {
          return { success: true, applicationId: existing.id, alreadySubmitted: true };
        }

        const result = await submitPhotographerApplication(ctx.user.id, {
          fullName: input.fullName,
          email: input.email,
          phoneNumber: input.phone,
          city: input.city,
          yearsExperience: input.yearsExperience,
          equipmentUsed: input.equipment,
          governmentIdUrl: input.governmentIdUrl || "",
          governmentIdType: input.governmentIdType || "id",
          independentContractorAgreed: input.independentContractorAgreed ?? false,
          termsOfServiceAgreed: input.termsOfServiceAgreed ?? false,
        });

        const insertId = (result as any).insertId ?? 0;
        return { success: true, applicationId: insertId };
      }),

    submitPortfolioOnboarding: photographerProcedure
      .input(
        z.object({
          portfolioImages: z.array(z.object({
            url: z.string(),
            title: z.string().optional(),
          })),
          legalAgreements: z.object({
            independentContractor: z.boolean(),
            termsOfService: z.boolean(),
          }),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Get or find the photographer's application
        const application = await getPhotographerApplication(ctx.user.id);

        if (application && input.portfolioImages.length > 0) {
          await submitPortfolioPhotos(
            application.id,
            input.portfolioImages.map((img) => ({ url: img.url, description: img.title }))
          );
        }

        // Update legal agreement acceptance on the application
        if (application) {
          const db = await getDb();
          if (db) {
            await db.update(photographerApplications)
              .set({
                independentContractorAgreed: input.legalAgreements.independentContractor,
                termsOfServiceAgreed: input.legalAgreements.termsOfService,
                updatedAt: new Date(),
              })
              .where(eq(photographerApplications.userId, ctx.user.id));
          }
        }

        return { success: true, portfolioCount: input.portfolioImages.length };
      }),

    getApplicationStatus: photographerProcedure
      .query(async ({ ctx }) => {
        const application = await getPhotographerApplication(ctx.user.id);
        if (!application) {
          return { status: "not_submitted", message: "No application found" };
        }
        const messages: Record<string, string> = {
          pending: "Your application is under review",
          approved: "Your application has been approved!",
          rejected: "Your application was not approved",
          under_review: "Your application is being reviewed",
        };
        return {
          status: application.status,
          message: messages[application.status] ?? "Application submitted",
          applicationId: application.id,
          submittedAt: application.createdAt,
          adminNotes: application.adminNotes ?? null,
        };
      }),

    searchByLocation: publicProcedure
      .input(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
          radiusMiles: z.number().default(25),
          date: z.string().optional(),
          timeSlot: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const date = input.date ? new Date(input.date) : undefined;
        return await searchPhotographersByLocation(
          input.latitude,
          input.longitude,
          input.radiusMiles,
          date,
          input.timeSlot
        );
      }),

    getInternalRatingSummary: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND", message: "Photographer profile not found" });
        return await getPhotographerInternalRatingSummary(photographer.id);
      }),

    getInternalRatings: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND", message: "Photographer profile not found" });
        return await getPhotographerInternalRatings(photographer.id);
      }),
  }),

  waitlist: router({
    addToWaitlist: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await addToWaitlist(
          input.email,
          input.city,
          input.state,
          input.zipCode,
          input.latitude,
          input.longitude
        );
        return { success: true, message: "Added to waitlist" };
      }),

    getWaitlistCount: publicProcedure
      .input(
        z.object({
          city: z.string(),
          state: z.string(),
        })
      )
      .query(async ({ input }) => {
        const count = await getWaitlistCount(input.city, input.state);
        return { count };
      }),
  }),

  // Bookings router
  bookings: router({
    create: protectedProcedure
      .input(
        z.object({
          photographerId: z.number().optional(),
          propertyAddress: z.string(),
          propertyType: z.string().optional(),
          propertySize: z.number().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          serviceIds: z.array(z.number()),
          scheduledDate: z.string(),
          duration: z.number().default(120),
          specialInstructions: z.string().optional(),
          basePrice: z.number(),
          addOnPrice: z.number().default(0),
          totalPrice: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const bookingCode = `BK-${nanoid(8).toUpperCase()}`;

        const result = await db.insert(bookings).values({
          bookingCode,
          clientId: ctx.user.id,
          photographerId: input.photographerId ?? null,
          propertyAddress: input.propertyAddress,
          propertyType: input.propertyType,
          propertySize: input.propertySize,
          latitude: input.latitude,
          longitude: input.longitude,
          city: input.city ?? null,
          state: input.state ?? null,
          zipCode: input.zipCode ?? null,
          scheduledDate: new Date(input.scheduledDate),
          duration: input.duration,
          specialInstructions: input.specialInstructions,
          basePrice: input.basePrice.toString(),
          addOnPrice: input.addOnPrice.toString(),
          totalPrice: input.totalPrice.toString(),
          status: "pending",
          paymentStatus: "pending",
        });

        const bookingId = Number(result[0].insertId);

        // Create booking services entries
        if (input.serviceIds.length > 0) {
          for (const serviceId of input.serviceIds) {
            await db.insert(bookingServices).values({ bookingId, serviceId });
          }
        }

        // Notify photographer if assigned
        if (input.photographerId) {
          const photographer = await getPhotographerById(input.photographerId);
          if (photographer) {
            await db.insert(notifications).values({
              userId: photographer.userId,
              type: "new_booking_request",
              title: "New Booking Request",
              message: `You have a new booking request for ${input.propertyAddress}`,
              relatedBookingId: bookingId,
              isRead: false,
            });
          }
        }

        return await getBookingById(bookingId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await getBookingById(input.id);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        // Allow client, photographer, or admin
        const photographer = ctx.user.role === "photographer" ? await getPhotographerByUserId(ctx.user.id) : null;
        if (ctx.user.role !== "admin" && booking.clientId !== ctx.user.id && photographer?.id !== booking.photographerId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const bookingSvcs = await getBookingServices(input.id);
        return { booking, services: bookingSvcs };
      }),

    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const result = await getBookingByCodeWithPhotographer(input.code);
        if (!result) throw new TRPCError({ code: "NOT_FOUND" });
        const bookingSvcs = await getBookingServices(result.booking.id);
        return {
          booking: result.booking,
          photographerName: result.photographerName ?? null,
          photographerImage: result.photographerImage ?? null,
          services: bookingSvcs,
        };
      }),

    getMyBookings: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "photographer") {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) return [];
        return await getPhotographerBookings(photographer.id);
      }
      return await getClientBookings(ctx.user.id);
    }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          bookingId: z.number(),
          status: z.enum(["pending", "accepted", "rejected", "in_progress", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

        const photographer = ctx.user.role === "photographer" ? await getPhotographerByUserId(ctx.user.id) : null;
        if (ctx.user.role !== "admin" && ctx.user.id !== booking.clientId && photographer?.id !== booking.photographerId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.update(bookings).set({ status: input.status, updatedAt: new Date() }).where(eq(bookings.id, input.bookingId));

        // Notify client when photographer accepts/rejects
        if (input.status === "accepted" || input.status === "rejected") {
          await db.insert(notifications).values({
            userId: booking.clientId,
            type: input.status === "accepted" ? "booking_accepted" : "booking_rejected",
            title: input.status === "accepted" ? "Booking Accepted!" : "Booking Rejected",
            message: input.status === "accepted"
              ? `Your booking ${booking.bookingCode} has been accepted by the photographer.`
              : `Your booking ${booking.bookingCode} was rejected. Please choose another photographer.`,
            relatedBookingId: input.bookingId,
            isRead: false,
          });
        }

        return { success: true };
      }),

    updatePaymentStatus: protectedProcedure
      .input(
        z.object({
          bookingId: z.number(),
          paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]),
          stripePaymentIntentId: z.string().optional(),
          stripeSessionId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.id !== booking.clientId && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

        await db.update(bookings).set({
          paymentStatus: input.paymentStatus,
          stripePaymentIntentId: input.stripePaymentIntentId,
          stripeSessionId: input.stripeSessionId,
          updatedAt: new Date(),
        }).where(eq(bookings.id, input.bookingId));

        if (input.paymentStatus === "completed") {
          // Create transaction record using dynamic commission from system_settings
          const gross = parseFloat(String(booking.totalPrice));
          const { photographerRate, platformRate } = await getCommissionRates();
          const photographerShare = parseFloat((gross * photographerRate).toFixed(2));
          const platformFee = parseFloat((gross * platformRate).toFixed(2));
          await db.insert(transactions).values({
            bookingId: input.bookingId,
            amount: String(gross),
            grossAmount: String(gross),
            photographerShare: String(photographerShare),
            platformFee: String(platformFee),
            currency: "USD",
            status: "completed",
            stripeTransactionId: input.stripePaymentIntentId,
          });

          // Notify client
          await db.insert(notifications).values({
            userId: booking.clientId,
            type: "payment_confirmation",
            title: "Payment Confirmed",
            message: `Payment for booking ${booking.bookingCode} has been confirmed.`,
            relatedBookingId: input.bookingId,
            isRead: false,
          });
        }

         return { success: true };
      }),

    uploadPhoto: photographerProcedure
      .input(
        z.object({
          bookingId: z.number(),
          fileName: z.string(),
          fileUrl: z.string(),
          fileSize: z.number(),
          fileType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        // Fix: compare against photographer profile id, not user id
        const photographerProfile = await getPhotographerByUserId(ctx.user.id);
        if (ctx.user.role !== "admin" && (!photographerProfile || booking.photographerId !== photographerProfile.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not the assigned photographer for this booking" });
        }

        await uploadBookingPhoto(
          input.bookingId,
          input.fileName,
          input.fileUrl,
          input.fileSize,
          input.fileType
        );

        // Update booking status to photos_uploaded if not already
        if (booking.status === "in_progress") {
          await db.update(bookings).set({
            status: "photos_uploaded",
            updatedAt: new Date(),
          }).where(eq(bookings.id, input.bookingId));
        }

        return { success: true };
      }),

    getPhotos: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        const photographerProfile = ctx.user.role === "photographer" ? await getPhotographerByUserId(ctx.user.id) : null;
        const isClient = booking.clientId === ctx.user.id;
        const isPhotographer = photographerProfile && booking.photographerId === photographerProfile.id;
        const isEditorAssigned = ctx.user.role === "editor" && (booking as any).editorId === ctx.user.id;
        const isAdmin = ctx.user.role === "admin";
        if (!isClient && !isPhotographer && !isEditorAssigned && !isAdmin) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await getBookingPhotos(input.bookingId);
      }),

    deliverPhotos: photographerProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin") {
          const photographer = booking.photographerId ? await getPhotographerById(booking.photographerId) : null;
          if (!photographer || photographer.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }

        await db.update(bookings).set({
          status: "delivered",
          updatedAt: new Date(),
        }).where(eq(bookings.id, input.bookingId));

        // Notify client that photos are ready
        await db.insert(notifications).values({
          userId: booking.clientId,
          type: "photos_delivered",
          title: "Your Photos Are Ready!",
          message: `Your photos for booking ${booking.bookingCode} have been delivered. View and download them now.`,
          relatedBookingId: input.bookingId,
          isRead: false,
        });

        return { success: true };
      }),

    deletePhoto: photographerProcedure
      .input(z.object({ photoId: z.number(), bookingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin") {
          const photographer = booking.photographerId ? await getPhotographerById(booking.photographerId) : null;
          if (!photographer || photographer.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }

        if (["delivered", "completed"].includes(booking.status)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete photos after delivery" });
        }

        await deleteBookingPhoto(input.photoId);
        return { success: true };
      }),

    reorderPhotos: photographerProcedure
      .input(z.object({ bookingId: z.number(), photoIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin") {
          const photographer = booking.photographerId ? await getPhotographerById(booking.photographerId) : null;
          if (!photographer || photographer.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }

        if (["delivered", "completed"].includes(booking.status)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot reorder photos after delivery" });
        }

        await reorderBookingPhotos(input.bookingId, input.photoIds);
        return { success: true };
      }),

    markAsDelivered: photographerProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin") {
          const photographer = booking.photographerId ? await getPhotographerById(booking.photographerId) : null;
          if (!photographer || photographer.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
        }

        if (booking.status !== "photos_uploaded") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Photos must be uploaded before delivery" });
        }

        await db.update(bookings).set({
          status: "delivered",
          updatedAt: new Date(),
        }).where(eq(bookings.id, input.bookingId));

        // Notify client that photos are ready
        await db.insert(notifications).values({
          userId: booking.clientId,
          type: "photos_delivered",
          title: "Your Photos Are Ready!",
          message: `Your photos for booking ${booking.bookingCode} have been delivered. View and download them now.`,
          relatedBookingId: input.bookingId,
          isRead: false,
        });

        return { success: true };
      }),

    confirmDelivery: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (booking.clientId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        if (booking.status !== "delivered") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Booking must be delivered before confirmation" });
        }

        await db.update(bookings).set({
          status: "completed",
          updatedAt: new Date(),
        }).where(eq(bookings.id, input.bookingId));

        return { success: true };
      }),

    getSignedPhotoUrl: protectedProcedure
      .input(z.object({ photoId: z.number(), bookingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (booking.photographerId !== ctx.user.id && booking.clientId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const photos = await getBookingPhotos(input.bookingId);
        const photo = photos.find(p => p.id === input.photoId);
        if (!photo) throw new TRPCError({ code: "NOT_FOUND" });

        return { url: photo.fileUrl, expiresIn: 86400 };
      }),

    createPhotoZip: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (booking.clientId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const photos = await getBookingPhotos(input.bookingId);
        if (photos.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No photos available to download" });
        }

        return { photos: photos.map(p => ({ id: p.id, fileName: p.fileName, fileUrl: p.fileUrl })), count: photos.length };
      }),
  }),
  // Reviews router
  reviews: router({
    create: protectedProcedure
      .input(
        z.object({
          bookingId: z.number(),
          photographerId: z.number(),
          rating: z.number().min(1).max(5),
          comment: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const booking = await getBookingById(input.bookingId);
        if (!booking || booking.clientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        if (booking.status !== "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Booking must be completed before review" });
        }

        // Check if already reviewed
        const alreadyReviewed = await hasClientReviewedBooking(input.bookingId);
        if (alreadyReviewed) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You have already reviewed this booking" });
        }

        await createReview(
          input.bookingId,
          input.photographerId,
          ctx.user.id,
          input.rating,
          input.comment
        );

        return { success: true };
      }),

    getAverageRating: publicProcedure
      .input(z.object({ photographerId: z.number() }))
      .query(async ({ input }) => {
        return await calculatePhotographerAverageRating(input.photographerId);
      }),

    getForPhotographer: publicProcedure
      .input(z.object({ photographerId: z.number() }))
      .query(async ({ input }) => {
        return await getPhotographerReviews(input.photographerId);
      }),

    hasReviewed: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        return await hasClientReviewedBooking(input.bookingId);
      }),
  }),

  // Earnings router
  earnings: router({
    getSummary: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });

        const totalEarnings = await getPhotographerTotalEarnings(photographer.id);
        const monthlyEarnings = await getPhotographerMonthlyEarnings(photographer.id);
        const completedBookings = await getPhotographerBookings(photographer.id);
        const completedCount = completedBookings.filter(b => (b as any).status === "completed" || (b as any).booking?.status === "completed").length;
        const pendingPayouts = await getPhotographerUpcomingPayouts(photographer.id);

        return {
          totalEarnings: totalEarnings.toFixed(2),
          monthlyEarnings: monthlyEarnings.toFixed(2),
          completedBookings: completedCount,
          pendingPayouts: pendingPayouts.length,
        };
      }),

    getMonthlyTrend: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        return await getPhotographerMonthlyTrend(photographer.id);
      }),

    getRecentPayouts: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        return await getPhotographerRecentPayouts(photographer.id);
      }),

    getByService: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        return await getPhotographerEarningsByService(photographer.id);
      }),

    getUpcomingPayouts: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        return await getPhotographerUpcomingPayouts(photographer.id);
      }),
  }),

  // Payouts router
  payouts: router({
    getBalances: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });

        const availableBalance = await getPhotographerAvailableBalance(photographer.id);
        const pendingBalance = await getPhotographerPendingBalance(photographer.id);
        const lifetimeEarnings = await getPhotographerLifetimeEarnings(photographer.id);

        return {
          availableBalance: availableBalance.toFixed(2),
          pendingBalance: pendingBalance.toFixed(2),
          lifetimeEarnings: lifetimeEarnings.toFixed(2),
        };
      }),

    getHistory: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        return await getPhotographerPayoutHistory(photographer.id);
      }),

    requestPayout: photographerProcedure
      .input(
        z.object({
          amount: z.number().min(50, "Minimum payout is $50"),
          paymentMethod: z.string().min(1, "Payment method required"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Rate limit: max 3 payout requests per user per 10 minutes
        await checkRateLimitDB(ctx.user.id, "requestPayout", 3, 10 * 60_000);
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });

        try {
          await createPayoutRequest(photographer.id, input.amount, input.paymentMethod);
          return { success: true, message: "Payout request created successfully" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "Failed to create payout request",
          });
        }
      }),
  }),

  // Payout Settings router (Stripe Connect)
  // ─── Tax Identity (SSN/EIN) — encrypted, never returned to client ──────────
  taxInfo: router({
    update: photographerProcedure
      .input(z.object({
        ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/).optional(),
        ein: z.string().regex(/^\d{2}-?\d{7}$/).optional(),
        dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        await updatePhotographerTaxInfo(photographer.id, input);
        // Return only a masked confirmation — never the raw values
        return {
          success: true,
          ssnProvided: !!input.ssn,
          einProvided: !!input.ein,
          dobProvided: !!input.dateOfBirth,
        };
      }),

    // Check what fields have been provided (masked, no raw data)
    getStatus: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const row = await db
          .select({ ssn: photographers.ssn, ein: photographers.ein, dateOfBirth: photographers.dateOfBirth })
          .from(photographers).where(eq(photographers.id, photographer.id)).limit(1);
        return {
          ssnOnFile: !!row[0]?.ssn,
          einOnFile: !!row[0]?.ein,
          dobOnFile: !!row[0]?.dateOfBirth,
        };
      }),
  }),

  payoutSettings: router({
    getStatus: photographerProcedure
      .query(async ({ ctx }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        return await getStripeConnectStatus(photographer.id);
      }),

    createConnectAccount: photographerProcedure
      .input(
        z.object({
          email: z.string().email(),
          name: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });

        try {
          const result = await createStripeConnectAccount(
            photographer.id,
            input.email,
            input.name
          );
          return { success: true, stripeConnectId: result.stripeConnectId, onboardingUrl: result.onboardingUrl };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "Failed to create Stripe Connect account",
          });
        }
      }),
  }),

  // Portfolio router
  portfolio: router({
    addImage: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          isAiGenerated: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const photographer = await getPhotographerByUserId(ctx.user.id);
        if (!photographer) throw new TRPCError({ code: "NOT_FOUND" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db.insert(portfolioImages).values({
          photographerId: photographer.id,
          imageUrl: input.imageUrl,
          description: input.description || input.title,
          isAiGenerated: input.isAiGenerated || false,
        });
        return { success: true };
      }),

    deleteImage: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Ownership check: only the owning photographer (or admin) may delete
        if (ctx.user.role !== "admin") {
          const photographer = await getPhotographerByUserId(ctx.user.id);
          if (!photographer) throw new TRPCError({ code: "FORBIDDEN" });
          const image = await db.select().from(portfolioImages)
            .where(and(eq(portfolioImages.id, input.imageId), eq(portfolioImages.photographerId, photographer.id)))
            .limit(1);
          if (image.length === 0) throw new TRPCError({ code: "FORBIDDEN", message: "Image not found or not yours" });
        }
        await db.delete(portfolioImages).where(eq(portfolioImages.id, input.imageId));
        return { success: true };
      }),

    uploadImage: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        contentType: z.string(),
        base64Data: z.string(), // base64-encoded file content
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        const key = `portfolio/${ctx.user.id}/${nanoid(8)}-${input.fileName}`;
        // Decode base64 and upload to S3
        const buffer = Buffer.from(input.base64Data, "base64");
        const { url } = await storagePut(key, buffer, input.contentType);
        return { key, url };
      }),
  }),

  // Notifications router
  notifications: router({
    getUnread: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNotifications(ctx.user.id, true);
    }),
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNotifications(ctx.user.id, false);
    }),
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Ownership check: only mark your own notification as read
        await db.update(notifications).set({ isRead: true })
          .where(and(eq(notifications.id, input.notificationId), eq(notifications.userId, ctx.user.id)));
        return { success: true };
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, ctx.user.id));
      return { success: true };
    }),
  }),

  // Transactions router
  transactions: router({
    getByBookingId: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        const photographerProfile = ctx.user.role === "photographer" ? await getPhotographerByUserId(ctx.user.id) : null;
        const isClient = booking.clientId === ctx.user.id;
        const isPhotographer = photographerProfile && booking.photographerId === photographerProfile.id;
        const isAdmin = ctx.user.role === "admin";
        if (!isClient && !isPhotographer && !isAdmin) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to transaction data" });
        }
        return await getTransactionsByBookingId(input.bookingId);
      }),
  }),

  // Admin router
  admin: router({
    login: publicProcedure
      .input(z.object({ email: z.string(), password: z.string() }))
      .mutation(async ({ input }) => {
        // Admin login is handled via OAuth flow. 
        // This endpoint is deprecated — admin access is granted by role="admin" on the user record.
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Please use the main login to access admin panel." });
      }),

    getStats: adminProcedure.query(async () => {
      return await getAdminStats();
    }),

    getStatChanges: adminProcedure.query(async () => {
      return await getAdminStatChanges();
    }),

    getMonthlyStats: adminProcedure
      .input(z.object({ months: z.number().min(1).max(24).default(6) }))
      .query(async ({ input }) => {
        return await getAdminMonthlyStats(input.months);
      }),

    getUsers: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getAllUsers(input.limit, input.offset);
      }),

    getPhotographers: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getAllPhotographersAdmin(input.limit, input.offset);
      }),

    getPhotographerDetail: adminProcedure
      .input(z.object({ photographerId: z.number() }))
      .query(async ({ input }) => {
        return await getPhotographerDetailAdmin(input.photographerId);
      }),

    getBookings: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getAllBookingsAdmin(input.limit, input.offset);
      }),

    getTransactions: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        return await getAllTransactionsAdmin(input.limit, input.offset);
      }),

    approvePhotographer: adminProcedure
      .input(z.object({ photographerId: z.number(), approve: z.boolean() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(photographers).set({
          isApproved: input.approve,
          isVerified: input.approve,
          updatedAt: new Date(),
        }).where(eq(photographers.id, input.photographerId));

        // Notify photographer
        const photographer = await getPhotographerById(input.photographerId);
        if (photographer) {
          await db.insert(notifications).values({
            userId: photographer.userId,
            type: "photographer_approved",
            title: input.approve ? "Profile Approved!" : "Profile Rejected",
            message: input.approve
              ? "Your photographer profile has been approved. You can now receive bookings!"
              : "Your photographer profile was not approved. Please contact support.",
            isRead: false,
          });
        }

        return { success: true };
      }),

    updateUserRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "photographer", "admin"]) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(users).set({ role: input.role, updatedAt: new Date() }).where(eq(users.id, input.userId));
        return { success: true };
      }),

    deactivateUser: adminProcedure
      .input(z.object({ userId: z.number(), active: z.boolean() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(users).set({ isActive: input.active, updatedAt: new Date() }).where(eq(users.id, input.userId));
        return { success: true };
      }),

    getBookingDetail: adminProcedure
      .input(z.object({ bookingCode: z.string() }))
      .query(async ({ input }) => {
        const detail = await getBookingDetailAdmin(input.bookingCode);
        if (!detail) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        return detail;
      }),

    updateBookingStatus: adminProcedure
      .input(z.object({
        bookingId: z.number(),
        status: z.enum(["pending", "accepted", "rejected", "in_progress", "photos_uploaded", "editing", "delivered", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(bookings).set({ status: input.status, updatedAt: new Date() }).where(eq(bookings.id, input.bookingId));
        return { success: true };
      }),

    // Services & Pricing management
    updatePricingRule: adminProcedure
      .input(z.object({
        id: z.number(),
        price: z.number().optional(),
        label: z.string().optional(),
        minSqft: z.number().optional(),
        maxSqft: z.number().nullable().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...updates } = input;
        const updateData: Record<string, unknown> = {};
        if (updates.price !== undefined) updateData.price = updates.price.toString();
        if (updates.label !== undefined) updateData.label = updates.label;
        if (updates.minSqft !== undefined) updateData.minSqft = updates.minSqft;
        if (updates.maxSqft !== undefined) updateData.maxSqft = updates.maxSqft;
        if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
        updateData.updatedAt = new Date();
        await db.update(pricingRules).set(updateData).where(eq(pricingRules.id, id));
        return { success: true };
      }),

    createPricingRule: adminProcedure
      .input(z.object({
        minSqft: z.number(),
        maxSqft: z.number().nullable().optional(),
        price: z.number(),
        label: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(pricingRules).values({
          minSqft: input.minSqft,
          maxSqft: input.maxSqft ?? null,
          price: input.price.toString(),
          label: input.label,
          isActive: true,
        });
        return { success: true };
      }),

    deletePricingRule: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.delete(pricingRules).where(eq(pricingRules.id, input.id));
        return { success: true };
      }),

    createService: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        serviceType: z.enum(["base", "addon"]),
        basePrice: z.number(),
        deliveryTime: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.insert(services).values({
          name: input.name,
          description: input.description,
          serviceType: input.serviceType,
          basePrice: input.basePrice.toString(),
          deliveryTime: input.deliveryTime,
          icon: input.icon,
          isActive: true,
        });
        return { success: true };
      }),

    deleteService: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Soft-delete by deactivating instead of hard delete to preserve booking history
        await db.update(services).set({ isActive: false, updatedAt: new Date() }).where(eq(services.id, input.id));
        return { success: true };
      }),

    deleteBooking: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Soft-delete by cancelling
        await db.update(bookings).set({ status: "cancelled", updatedAt: new Date() }).where(eq(bookings.id, input.id));
        return { success: true };
      }),

    deleteUser: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Soft-delete by deactivating
        await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, input.id));
        return { success: true };
      }),

    updateService: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        basePrice: z.number().optional(),
        serviceType: z.enum(["base", "addon"]).optional(),
        deliveryTime: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { id, ...updates } = input;
        const updateData: Record<string, unknown> = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.basePrice !== undefined) updateData.basePrice = updates.basePrice.toString();
        if (updates.serviceType !== undefined) updateData.serviceType = updates.serviceType;
        if (updates.deliveryTime !== undefined) updateData.deliveryTime = updates.deliveryTime;
        if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
        updateData.updatedAt = new Date();
        await db.update(services).set(updateData).where(eq(services.id, id));
        return { success: true };
      }),

    getPhotographerInternalRatings: adminProcedure
      .input(z.object({ photographerId: z.number() }))
      .query(async ({ input }) => {
        return await getPhotographerInternalRatings(input.photographerId);
      }),

    getPhotographerInternalRatingSummary: adminProcedure
      .input(z.object({ photographerId: z.number() }))
      .query(async ({ input }) => {
        return await getPhotographerInternalRatingSummary(input.photographerId);
      }),

    getAllReviews: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const [rows, countResult] = await Promise.all([
          db.select().from(reviews)
            .orderBy(desc(reviews.createdAt))
            .limit(input.limit)
            .offset(input.offset),
          db.select({ count: count() }).from(reviews),
        ]);
        return { rows: rows ?? [], total: Number(countResult[0]?.count ?? 0) };
      }),

    getSystemSettings: adminProcedure
      .query(async () => {
        return {
          platformName: "Snapty",
          platformEmail: "support@snapty.com",
          supportPhone: "+1 (555) 123-4567",
          commissionRate: "35",
          minBookingAmount: "99",
          maxBookingAmount: "5000",
          enableNotifications: true,
          enableEmails: true,
          maintenanceMode: false,
        };
      }),

    // Assign editor to a booking manually
    assignEditor: adminProcedure
      .input(z.object({
        bookingId: z.number(),
        editorUserId: z.number(), // users.id of the editor
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Validate the user is actually an editor
        const editorUser = await getUserById(input.editorUserId);
        if (!editorUser || editorUser.role !== "editor") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Selected user is not an editor" });
        }

        await db.update(bookings)
          .set({ editorId: input.editorUserId, status: "editing", updatedAt: new Date() } as any)
          .where(eq(bookings.id, input.bookingId));

        // Notify the editor
        const booking = await getBookingById(input.bookingId);
        if (booking) {
          await db.insert(notifications).values({
            userId: input.editorUserId,
            type: "new_booking_request",
            title: "New Editing Assignment",
            message: `Booking ${booking.bookingCode} has been assigned to you for editing.`,
            relatedBookingId: input.bookingId,
            isRead: false,
          });
        }

        return { success: true };
      }),

    // Auto-assign editor: pick editor with fewest active assignments
    autoAssignEditor: adminProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get all active editors
        const editors = await db.select().from(users)
          .where(and(eq(users.role, "editor"), eq(users.isActive, true)));

        if (editors.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No active editors available" });
        }

        // Count active assignments per editor
        const assignmentCounts = await Promise.all(
          editors.map(async (editor) => {
            const activeBookings = await db.select({ count: count() }).from(bookings)
              .where(and(
                eq((bookings as any).editorId, editor.id),
                inArray(bookings.status, ["editing", "photos_uploaded"])
              ));
            return { editor, activeCount: Number(activeBookings[0]?.count ?? 0) };
          })
        );

        // Pick the editor with fewest active assignments
        const least = assignmentCounts.sort((a, b) => a.activeCount - b.activeCount)[0];

        await db.update(bookings)
          .set({ editorId: least.editor.id, status: "editing", updatedAt: new Date() } as any)
          .where(eq(bookings.id, input.bookingId));

        // Notify the auto-assigned editor
        const booking = await getBookingById(input.bookingId);
        if (booking) {
          await db.insert(notifications).values({
            userId: least.editor.id,
            type: "new_booking_request",
            title: "New Editing Assignment",
            message: `Booking ${booking.bookingCode} has been auto-assigned to you for editing.`,
            relatedBookingId: input.bookingId,
            isRead: false,
          });
        }

        return { success: true, assignedEditor: { id: least.editor.id, name: least.editor.name } };
      }),

    // Get all editors (for the assign-editor dropdown)
    getEditors: adminProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return await db.select({ id: users.id, name: users.name, email: users.email, isActive: users.isActive })
          .from(users)
          .where(and(eq(users.role, "editor"), eq(users.isActive, true)));
      }),

    updateSystemSettings: adminProcedure
      .input(z.object({
        platformName: z.string().optional(),
        platformEmail: z.string().optional(),
        supportPhone: z.string().optional(),
        commissionRate: z.string().optional(),
        minBookingAmount: z.string().optional(),
        maxBookingAmount: z.string().optional(),
        enableNotifications: z.boolean().optional(),
        enableEmails: z.boolean().optional(),
        maintenanceMode: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const entries = Object.entries(input).filter(([, v]) => v !== undefined);
        await Promise.all(
          entries.map(([key, value]) => setSystemSetting(key, String(value)))
        );
        return { success: true };
      }),

    getSystemSettings: adminProcedure
      .query(async () => {
        const keys = [
          "platformName","platformEmail","supportPhone","commissionRate",
          "minBookingAmount","maxBookingAmount","enableNotifications","enableEmails","maintenanceMode",
        ];
        const results = await Promise.all(keys.map(async (k) => [k, await getSystemSetting(k)]));
        return Object.fromEntries(results);
      }),
  }),

  // Payments router (Stripe integration)
  payments: paymentsRouter,

  // Editor ratings router
  editor: router({
    submitRating: protectedProcedure
      .input(
        z.object({
          bookingCode: z.string(),
          bookingId: z.number(),
          photographerId: z.number(),
          overallRating: z.number().min(1).max(5),
          photoQualityRating: z.number().min(1).max(5),
          fileOrganizationRating: z.number().min(1).max(5),
          instructionRating: z.number().min(1).max(5),
          editingEaseRating: z.number().min(1).max(5),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "editor" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only editors can submit ratings" });
        }

        await submitEditorRating(
          input.bookingCode,
          input.bookingId,
          input.photographerId,
          ctx.user.id,
          {
            overallRating: input.overallRating,
            photoQualityRating: input.photoQualityRating,
            fileOrganizationRating: input.fileOrganizationRating,
            instructionRating: input.instructionRating,
            editingEaseRating: input.editingEaseRating,
            notes: input.notes,
          }
        );

        return { success: true, message: "Rating submitted successfully" };
      }),

    getRating: publicProcedure
      .input(z.object({ bookingCode: z.string(), editorId: z.number() }))
      .query(async ({ input }) => {
        return await getEditorRating(input.bookingCode, input.editorId);
      }),
  }),

  // S3 Storage router — role-based, per-user folder structure
  storage: router({

    // Photographer: Upload RAW photos to their own folder
    // Path: bookings/{bookingId}/raw/photographer_{userId}/{filename}
    uploadRaw: photographerProcedure
      .input(z.object({
        bookingId: z.number(),
        filename: z.string(),
        fileBase64: z.string(), // base64-encoded file data
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

        // Real ownership check
        const photographerProfile = await getPhotographerByUserId(ctx.user.id);
        if (ctx.user.role !== "admin" && !checkPhotographerOwnership(booking.photographerId, photographerProfile?.id ?? -1)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not the assigned photographer for this booking" });
        }

        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        const result = await uploadRawPhoto(input.bookingId, ctx.user.id, input.filename, fileBuffer, input.contentType);
        return { success: true, ...result };
      }),

    // Editor: Upload edited photos to their own folder
    // Path: bookings/{bookingId}/edited/editor_{userId}/{filename}
    uploadEdited: editorProcedure
      .input(z.object({
        bookingId: z.number(),
        filename: z.string(),
        fileBase64: z.string(), // base64-encoded file data
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

        // Real editor assignment check
        if (ctx.user.role !== "admin" && !checkEditorAssignment((booking as any).editorId, ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not assigned as editor for this booking" });
        }

        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        const result = await uploadEditedPhoto(input.bookingId, ctx.user.id, input.filename, fileBuffer, input.contentType);

        // Update booking status to editing if not already further along
        const db = await getDb();
        if (db && booking.status === "photos_uploaded") {
          await db.update(bookings).set({ status: "editing", updatedAt: new Date() }).where(eq(bookings.id, input.bookingId));
        }

        return { success: true, ...result };
      }),

    // Editor: Get ALL raw photos for a booking (from all photographers)
    getRawPhotos: editorProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

        if (ctx.user.role !== "admin" && !checkEditorAssignment((booking as any).editorId, ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You are not assigned to this booking" });
        }

        return await getEditorRawPhotos(input.bookingId);
      }),

    // Photographer: Get their own uploaded RAW photos
    getMyRawPhotos: photographerProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        const photographerProfile = await getPhotographerByUserId(ctx.user.id);
        if (ctx.user.role !== "admin" && !checkPhotographerOwnership(booking.photographerId, photographerProfile?.id ?? -1)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return await getPhotographerRawPhotos(input.bookingId, ctx.user.id);
      }),

    // Client: Get edited gallery for their booking
    // Only sees files from their booking's assigned editor
    getGallery: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

        const isAdmin = ctx.user.role === "admin";
        const isClient = checkClientOwnership(booking.clientId, ctx.user.id);
        if (!isClient && !isAdmin) {
          throw new TRPCError({ code: "FORBIDDEN", message: "This gallery belongs to another client" });
        }

        const editorId = (booking as any).editorId;
        if (!editorId) return []; // no editor assigned yet

        return await getClientGallery(input.bookingId, editorId);
      }),

    // Admin: Get ALL files for a booking
    getAdminFiles: adminProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ input }) => {
        return await getAdminBookingFiles(input.bookingId);
      }),

    // Admin: Delete any file
    deleteFile: adminProcedure
      .input(z.object({ key: z.string() }))
      .mutation(async ({ input }) => {
        await deleteFile(input.key);
        return { success: true };
      }),
  }),

  // Editor router — editor dashboard and workflow
  editorWorkflow: router({

    // Get all bookings assigned to this editor
    getMyBookings: editorProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rows = await db
          .select()
          .from(bookings)
          .where(eq((bookings as any).editorId, ctx.user.id))
          .orderBy(desc(bookings.updatedAt));
        return rows;
      }),

    // Get single booking details for editor
    getBookingDetail: editorProcedure
      .input(z.object({ bookingId: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && !checkEditorAssignment((booking as any).editorId, ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const bookingSvcs = await getBookingServices(input.bookingId);
        const rawPhotos = await getEditorRawPhotos(input.bookingId);
        return { booking, services: bookingSvcs, rawPhotos };
      }),

    // Editor marks editing complete and delivers to client
    markDelivered: editorProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const booking = await getBookingById(input.bookingId);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
        if (ctx.user.role !== "admin" && !checkEditorAssignment((booking as any).editorId, ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (!["editing", "photos_uploaded"].includes(booking.status)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Booking must be in editing state before delivery" });
        }
        await db.update(bookings).set({ status: "delivered", updatedAt: new Date() }).where(eq(bookings.id, input.bookingId));
        // Notify client
        await db.insert(notifications).values({
          userId: booking.clientId,
          type: "photos_delivered",
          title: "Your Photos Are Ready!",
          message: `Your photos for booking ${booking.bookingCode} have been delivered. View and download them now.`,
          relatedBookingId: input.bookingId,
          isRead: false,
        });
        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;


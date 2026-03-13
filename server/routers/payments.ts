import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { checkRateLimitDB } from "../_core/rateLimiter";
import Stripe from "stripe";
import { getDb } from "../db";
import { bookings, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null as any;

/**
 * Payment procedures for handling Stripe checkout and payment processing
 */
export const paymentsRouter = router({
  /**
   * Create a Stripe checkout session for a booking
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        amount: z.number().positive(),
        currency: z.string().default("usd"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Rate limit: max 5 checkout attempts per user per minute (DB-backed, survives restarts)
      await checkRateLimitDB(ctx.user.id, "createCheckoutSession", 5, 60_000);
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Verify booking exists and belongs to the user
      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.bookingId))
        .limit(1);

      if (!booking || booking.length === 0) {
        throw new Error("Booking not found");
      }

      if (booking[0].clientId !== ctx.user.id) {
        throw new Error("Unauthorized: Booking does not belong to you");
      }

      // Get user email
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const userEmail = user?.[0]?.email || ctx.user.email || "customer@example.com";

      try {
        // Create Stripe customer if not exists
        let customerId = ctx.user.stripeCustomerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: userEmail,
            name: ctx.user.name || "Customer",
            metadata: {
              userId: ctx.user.id.toString(),
            },
          });

          customerId = customer.id;

          // Save customer ID to user
          await db
            .update(users)
            .set({ stripeCustomerId: customerId })
            .where(eq(users.id, ctx.user.id));
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: input.currency,
                product_data: {
                  name: `Snapty Photography Booking - ${booking[0].bookingCode}`,
                  description: `Photography services for property at ${booking[0].propertyAddress}`,
                },
                unit_amount: input.amount,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${ctx.req.headers.origin || "http://localhost:3000"}/booking-confirmation/${booking[0].bookingCode}?payment=success`,
          cancel_url: `${ctx.req.headers.origin || "http://localhost:3000"}/booking-confirmation/${booking[0].bookingCode}?payment=cancelled`,
          metadata: {
            booking_id: input.bookingId.toString(),
            user_id: ctx.user.id.toString(),
            booking_code: booking[0].bookingCode,
          },
        });

        if (!session.url) {
          throw new Error("Failed to create checkout session");
        }

        return {
          sessionId: session.id,
          checkoutUrl: session.url,
        };
      } catch (error: any) {
        console.error("[Stripe] Error creating checkout session:", error);
        throw new Error(`Failed to create checkout session: ${error.message}`);
      }
    }),

  /**
   * Get payment status for a booking
   */
  getPaymentStatus: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.bookingId))
        .limit(1);

      if (!booking || booking.length === 0) {
        throw new Error("Booking not found");
      }

      if (booking[0].clientId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return {
        bookingId: booking[0].id,
        paymentStatus: booking[0].paymentStatus,
        amount: booking[0].totalPrice,
        stripePaymentIntentId: booking[0].stripePaymentIntentId,
      };
    }),

  /**
   * Create a Stripe PaymentIntent for embedded Stripe Elements checkout
   */
  createPaymentIntent: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, input.bookingId))
        .limit(1);

      if (!booking || booking.length === 0) throw new Error("Booking not found");
      if (booking[0].clientId !== ctx.user.id) throw new Error("Unauthorized");

      const amountCents = Math.round(parseFloat(String(booking[0].totalPrice ?? 0)) * 100);
      if (amountCents < 50) throw new Error("Amount too small (minimum $0.50)");

      // Ensure Stripe customer exists
      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const userEmail = user?.[0]?.email || ctx.user.email || "customer@example.com";
      let customerId = ctx.user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          name: ctx.user.name || "Customer",
          metadata: { userId: ctx.user.id.toString() },
        });
        customerId = customer.id;
        await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, ctx.user.id));
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "usd",
        customer: customerId,
        description: `Snapty booking ${booking[0].bookingCode}`,
        metadata: {
          booking_id: input.bookingId.toString(),
          booking_code: booking[0].bookingCode,
          user_id: ctx.user.id.toString(),
        },
        automatic_payment_methods: { enabled: true },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amountCents,
      };
    }),

  /**
   * Retrieve payment intent details from Stripe
   */
  getPaymentIntentDetails: protectedProcedure
    .input(z.object({ paymentIntentId: z.string() }))
    .query(async ({ input }) => {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          input.paymentIntentId
        );

        return {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          clientSecret: paymentIntent.client_secret,
        };
      } catch (error: any) {
        console.error("[Stripe] Error retrieving payment intent:", error);
        throw new Error(`Failed to retrieve payment intent: ${error.message}`);
      }
    }),
});

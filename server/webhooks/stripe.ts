import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { bookings, payouts, photographers } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Verify Stripe webhook signature
 */
function verifyWebhookSignature(req: Request): Stripe.Event | null {
  const sig = req.headers["stripe-signature"] as string;

  if (!sig || !webhookSecret) {
    console.error("[Webhook] Missing signature or webhook secret");
    return null;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
    return event;
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return null;
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log("[Webhook] payment_intent.succeeded:", paymentIntent.id);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Extract booking ID from metadata
  const bookingId = paymentIntent.metadata?.booking_id;
  if (!bookingId) {
    console.warn("[Webhook] No booking_id in payment intent metadata");
    return;
  }

  // Update booking status to paid
  await db
    .update(bookings)
    .set({
      status: "accepted",
      paymentStatus: "completed",
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, parseInt(bookingId)));

  console.log("[Webhook] Booking", bookingId, "marked as paid");
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  console.log("[Webhook] checkout.session.completed:", session.id);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Extract booking ID from metadata
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.warn("[Webhook] No booking_id in checkout session metadata");
    return;
  }

  // Update booking status
  await db
    .update(bookings)
    .set({
      status: "accepted",
      paymentStatus: "completed",
      stripeSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, parseInt(bookingId)));

  console.log("[Webhook] Booking", bookingId, "confirmed via checkout session");
}

/**
 * Handle account.updated event (Stripe Connect)
 */
async function handleAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  console.log("[Webhook] account.updated:", account.id);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find photographer with this Stripe Connect ID
  const photographer = await db
    .select()
    .from(photographers)
    .where(eq(photographers.stripeConnectId, account.id))
    .then((r) => r[0]);

  if (!photographer) {
    console.warn("[Webhook] No photographer found for Stripe account", account.id);
    return;
  }

  // Determine connection status
  let status: "not_connected" | "pending_verification" | "connected" = "not_connected";
  if (account.charges_enabled && account.payouts_enabled) {
    status = "connected";
  } else if (account.id) {
    status = "pending_verification";
  }

  // Update photographer Stripe Connect status
  await db
    .update(photographers)
    .set({
      stripeConnectStatus: status,
      bankAccountLast4: (account.external_accounts?.data?.[0] as any)?.last4 || null,
      bankAccountName: (account.external_accounts?.data?.[0] as any)?.bank_name || null,
      updatedAt: new Date(),
    })
    .where(eq(photographers.id, photographer.id));

  console.log("[Webhook] Photographer", photographer.id, "Stripe status updated to", status);
}

/**
 * Handle payout.paid event
 */
async function handlePayoutPaid(event: Stripe.Event) {
  const payout = event.data.object as Stripe.Payout;
  console.log("[Webhook] payout.paid:", payout.id);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update payout status
  await db
    .update(payouts)
    .set({
      status: "completed",
      stripePayoutId: payout.id,
      updatedAt: new Date(),
    })
    .where(eq(payouts.stripePayoutId, payout.id));

  console.log("[Webhook] Payout", payout.id, "marked as completed");
}

/**
 * Handle payout.failed event
 */
async function handlePayoutFailed(event: Stripe.Event) {
  const payout = event.data.object as Stripe.Payout;
  console.log("[Webhook] payout.failed:", payout.id);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update payout status with failure reason
  await db
    .update(payouts)
    .set({
      status: "failed",
      failureReason: (payout as any).failure_reason || "Unknown error",
      stripePayoutId: payout.id,
      updatedAt: new Date(),
    })
    .where(eq(payouts.stripePayoutId, payout.id));

  console.log("[Webhook] Payout", payout.id, "marked as failed");
}

/**
 * Main webhook handler
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  // Verify signature
  const event = verifyWebhookSignature(req);
  if (!event) {
    console.error("[Webhook] Invalid signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Handle test events (for testing purposes)
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  try {
    // Route event to appropriate handler
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event);
        break;

      case "account.updated":
        await handleAccountUpdated(event);
        break;

      case "payout.paid":
        await handlePayoutPaid(event);
        break;

      case "payout.failed":
        await handlePayoutFailed(event);
        break;

      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }

    // Return success response
    res.json({ received: true });
  } catch (error: any) {
    console.error("[Webhook] Error processing event:", error.message);
    // Return 200 to acknowledge receipt even if processing failed
    // This prevents Stripe from retrying indefinitely
    res.json({ received: true, error: error.message });
  }
}

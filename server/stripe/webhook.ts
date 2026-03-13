import Stripe from "stripe";
import { Request, Response } from "express";
import { getDb, getCommissionRates } from "../db";
import { sql } from "drizzle-orm";
import { bookings, photographers, payouts, transactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Handle Stripe webhook events
 * This endpoint receives events from Stripe about payment status changes
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events for development/testing
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  // ── Idempotency: skip already-processed events ───────────────────────────
  try {
    const db = await getDb();
    if (db) {
      const alreadyProcessed = await db.execute(
        sql`SELECT id FROM stripe_webhook_events WHERE event_id = ${event.id} LIMIT 1`
      ) as any;
      const rows = alreadyProcessed[0];
      if (Array.isArray(rows) && rows.length > 0) {
        console.log(`[Webhook] Skipping duplicate event: \${event.id}`);
        return res.json({ received: true, skipped: true });
      }
      // Record event as processed
      await db.execute(
        sql`INSERT IGNORE INTO stripe_webhook_events (event_id, event_type, processed_at)
             VALUES (\${event.id}, \${event.type}, NOW())`
      );
    }
  } catch (err) {
    console.warn("[Webhook] Idempotency check failed, proceeding anyway:", err);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "payment_intent.succeeded": {
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      }
      case "payment_intent.payment_failed": {
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      }
      case "account.updated": {
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      }
      case "payout.paid": {
        await handlePayoutPaid(event.data.object as Stripe.Payout);
        break;
      }
      case "payout.failed": {
        await handlePayoutFailed(event.data.object as Stripe.Payout);
        break;
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Ensure a transaction row exists for a booking (idempotent safety net).
 * Called from both checkout.session.completed and payment_intent.succeeded.
 */
/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Webhook] Checkout session completed: ${session.id}`);

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available");
    return;
  }

  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    console.warn("[Webhook] No booking_id in session metadata");
    return;
  }

  const bookingIdInt = parseInt(bookingId);

  // ── Atomic: booking update + transaction creation in one DB transaction ──
  try {
    await db.transaction(async (tx) => {
      // 1. Update booking payment status
      await tx
        .update(bookings)
        .set({
          paymentStatus: "completed",
          stripePaymentIntentId: session.payment_intent as string,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingIdInt));

      // 2. Create transaction record only if it doesn't exist (idempotent)
      const existing = await tx
        .select({ id: transactions.id })
        .from(transactions)
        .where(eq(transactions.bookingId, bookingIdInt))
        .limit(1);

      if (existing.length === 0) {
        const amountTotal = (session.amount_total ?? 0) / 100;
        const grossAmt = amountTotal.toFixed(2);
        const { photographerRate, platformRate } = await getCommissionRates();
        const photographerShareAmt = (amountTotal * photographerRate).toFixed(2);
        const platformFeeAmt = (amountTotal * platformRate).toFixed(2);

        await tx.insert(transactions).values({
          bookingId: bookingIdInt,
          amount: photographerShareAmt,
          grossAmount: grossAmt,
          photographerShare: photographerShareAmt,
          platformFee: platformFeeAmt,
          currency: ((session.currency?.toUpperCase() ?? "USD") as "USD"),
          status: "completed",
          stripeTransactionId: session.payment_intent as string,
        });

        console.log(`[Webhook] Created transaction for booking ${bookingId}`);
      }
    });

    console.log(`[Webhook] Atomically updated booking ${bookingId} payment status`);
  } catch (error) {
    console.error("[Webhook] Error in atomic booking update:", error);
    throw error;
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment intent succeeded: ${paymentIntent.id}`);

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available");
    return;
  }

  try {
    const bookingId = paymentIntent.metadata?.booking_id;
    if (!bookingId) {
      console.warn("[Webhook] No booking_id in payment intent metadata");
      return;
    }

    const bookingIdInt = parseInt(bookingId);

    // Update booking payment status
    await db
      .update(bookings)
      .set({
        paymentStatus: "completed",
        stripePaymentIntentId: paymentIntent.id,
      })
      .where(eq(bookings.id, bookingIdInt));

    console.log(`[Webhook] Updated booking ${bookingId} payment status to completed`);

    // Safety net: create transaction row if it doesn't already exist
    await ensureTransactionExists(
      db,
      bookingIdInt,
      paymentIntent.amount ?? 0,
      paymentIntent.currency ?? "usd",
      paymentIntent.id
    );
  } catch (error) {
    console.error("[Webhook] Error updating booking:", error);
    throw error;
  }
}

/**
 * Handle Stripe Connect account.updated event
 * Updates photographer's Stripe Connect status in the database
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`[Webhook] Account updated: ${account.id}`);

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available");
    return;
  }

  try {
    // Determine new status based on account capabilities
    let newStatus: "not_connected" | "pending_verification" | "connected" = "pending_verification";
    if (account.charges_enabled && account.payouts_enabled) {
      newStatus = "connected";
    } else if (!account.details_submitted) {
      newStatus = "not_connected";
    }

    await db
      .update(photographers)
      .set({ stripeConnectStatus: newStatus })
      .where(eq(photographers.stripeConnectId, account.id));

    console.log(`[Webhook] Updated photographer Stripe Connect status to ${newStatus} for account ${account.id}`);
  } catch (error) {
    console.error("[Webhook] Error updating photographer Stripe Connect status:", error);
    throw error;
  }
}

/**
 * Handle payout.paid event — mark payout as completed in DB
 */
async function handlePayoutPaid(payout: Stripe.Payout) {
  console.log(`[Webhook] Payout paid: ${payout.id}`);

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available");
    return;
  }

  try {
    await db
      .update(payouts)
      .set({ status: "completed" })
      .where(eq(payouts.stripePayoutId, payout.id));

    console.log(`[Webhook] Marked payout ${payout.id} as completed`);
  } catch (error) {
    console.error("[Webhook] Error updating payout status:", error);
    throw error;
  }
}

/**
 * Handle payout.failed event — mark payout as failed with reason
 */
async function handlePayoutFailed(payout: Stripe.Payout) {
  console.log(`[Webhook] Payout failed: ${payout.id}`);

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available");
    return;
  }

  try {
    await db
      .update(payouts)
      .set({
        status: "failed",
        failureReason: payout.failure_message ?? "Unknown failure",
      })
      .where(eq(payouts.stripePayoutId, payout.id));

    console.log(`[Webhook] Marked payout ${payout.id} as failed`);
  } catch (error) {
    console.error("[Webhook] Error updating payout failure:", error);
    throw error;
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Webhook] Payment intent failed: ${paymentIntent.id}`);

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database not available");
    return;
  }

  try {
    const bookingId = paymentIntent.metadata?.booking_id;
    if (!bookingId) {
      console.warn("[Webhook] No booking_id in payment intent metadata");
      return;
    }

    // Update booking payment status to failed
    await db
      .update(bookings)
      .set({
        paymentStatus: "failed",
        stripePaymentIntentId: paymentIntent.id,
      })
      .where(eq(bookings.id, parseInt(bookingId)));

    console.log(`[Webhook] Updated booking ${bookingId} payment status to failed`);
  } catch (error) {
    console.error("[Webhook] Error updating booking:", error);
    throw error;
  }
}

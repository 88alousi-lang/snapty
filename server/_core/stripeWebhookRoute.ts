import { Router, Request, Response } from "express";
import { handleStripeWebhook } from "../stripe/webhook";

/**
 * Create Stripe webhook route
 * Must be registered BEFORE express.json() middleware to access raw body
 */
export function createStripeWebhookRoute(): Router {
  const router = Router();

  router.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      await handleStripeWebhook(req, res);
    } catch (error) {
      console.error("[Stripe Webhook Route] Error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  return router;
}

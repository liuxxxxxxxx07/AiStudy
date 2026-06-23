import { Router, Request, Response } from "express";
import Stripe from "stripe";

const router = Router();

router.get("/stripe", async (req: Request, res: Response) => {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !key.startsWith("sk_")) {
      res.json({ provider: "stripe", available: false, subscribed: false, tier: "free" });
      return;
    }

    const stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: "all",
    });

    const userSub = subscriptions.data.find((sub) => sub.metadata?.userId === userId);

    if (userSub && (userSub.status === "active" || userSub.status === "trialing")) {
      const tier = userSub.metadata?.tier || "free";
      const customerId = userSub.customer as string;
      res.json({
        provider: "stripe",
        available: true,
        subscribed: true,
        tier,
        status: userSub.status,
        subscriptionId: userSub.id,
        customerId,
        currentPeriodEnd: userSub.current_period_end,
        cancelAtPeriodEnd: userSub.cancel_at_period_end,
      });
    } else if (userSub) {
      res.json({
        provider: "stripe",
        available: true,
        subscribed: false,
        tier: "free",
        status: userSub.status,
        subscriptionId: userSub.id,
      });
    } else {
      res.json({ provider: "stripe", available: true, subscribed: false, tier: "free" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[subscription-status] stripe error:", message);
    res.status(500).json({ error: message });
  }
});

router.get("/all", async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  // Try Stripe first
  const key = process.env.STRIPE_SECRET_KEY;
  if (key && key.startsWith("sk_")) {
    try {
      const stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
      const subscriptions = await stripe.subscriptions.list({ limit: 100, status: "all" });
      const userSub = subscriptions.data.find((sub) => sub.metadata?.userId === userId);
      if (userSub && (userSub.status === "active" || userSub.status === "trialing")) {
        const tier = userSub.metadata?.tier || "free";
        res.json({
          subscribed: true,
          tier,
          provider: "stripe",
          status: userSub.status,
          subscriptionId: userSub.id,
          customerId: userSub.customer as string,
          currentPeriodEnd: userSub.current_period_end,
        });
        return;
      }
    } catch {
      // fall through to check other providers
    }
  }

  // No active subscription found
  res.json({ subscribed: false, tier: "free", provider: null });
});

export { router as subscriptionRouter };
import { Router, Request, Response } from "express";
import Stripe from "stripe";

const router = Router();

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !key.startsWith("sk_")) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

interface PriceConfig {
  plus: string;
  pro: string;
  "pro+": string;
}

function getPrices(): PriceConfig {
  return {
    plus: process.env.STRIPE_PRICE_PLUS || "",
    pro: process.env.STRIPE_PRICE_PRO || "",
    "pro+": process.env.STRIPE_PRICE_PRO_PLUS || "",
  };
}

router.post("/create-checkout-session", async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const { tier, userId, userEmail, userName } = req.body as {
      tier: string;
      userId: string;
      userEmail?: string;
      userName?: string;
    };

    const PRICES = getPrices();
    const priceId = PRICES[tier as keyof PriceConfig];
    if (!priceId) {
      res.status(400).json({ error: `No price configured for tier: ${tier}` });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      client_reference_id: userId,
      metadata: { userId, tier },
      subscription_data: {
        metadata: { userId, tier },
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe] create-checkout-session error:", message);
    res.status(500).json({ error: message });
  }
});

router.post("/create-portal-session", async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const { customerId } = req.body as { customerId: string };
    if (!customerId) {
      res.status(400).json({ error: "customerId is required" });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.FRONTEND_URL}/plans`,
    });

    res.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe] create-portal-session error:", message);
    res.status(500).json({ error: message });
  }
});

router.get("/prices", (_req: Request, res: Response) => {
  const PRICES = getPrices();
  const configured = Object.values(PRICES).some(Boolean);
  if (!configured) {
    res.json({
      available: false,
      message: "Stripe prices not configured. Set STRIPE_PRICE_PLUS, STRIPE_PRICE_PRO, STRIPE_PRICE_PRO_PLUS in .env",
    });
    return;
  }
  res.json({ available: true, prices: PRICES });
});

const webhookRouter = Router();
webhookRouter.post("/webhook", async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe] webhook signature verification failed:", message);
    res.status(400).json({ error: `Webhook Error: ${message}` });
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const tier = session.metadata?.tier;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      console.log(`[stripe] subscription created: userId=${userId}, tier=${tier}, subscription=${subscriptionId}, customer=${customerId}`);

      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const subUserId = subscription.metadata?.userId;
      const subTier = subscription.metadata?.tier;
      const status = subscription.status;

      console.log(`[stripe] subscription ${event.type}: userId=${subUserId}, tier=${subTier}, status=${status}`);

      if (status === "active" || status === "trialing") {
        // Tier remains active — the frontend checks subscription-status endpoint
      } else {
        // Subscription canceled or past_due — tier should be downgraded
        console.log(`[stripe] subscription non-active: downgrading userId=${subUserId}`);
      }

      break;
    }

    default:
      console.log(`[stripe] unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

router.use(webhookRouter);

export { router as stripeRouter };
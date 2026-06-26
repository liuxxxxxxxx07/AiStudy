import { Router, Request, Response } from "express";
import { Environment, Paddle as PaddleClient } from "@paddle/paddle-node-sdk";

const router = Router();

function getPaddle(): PaddleClient | null {
  const key = process.env.PADDLE_API_KEY;
  if (!key) return null;
  const env = process.env.PADDLE_ENV === "production"
    ? Environment.production
    : Environment.sandbox;
  return new PaddleClient(key, { environment: env });
}

const PRICE_IDS: Record<string, string> = {
  plus: process.env.PADDLE_PRICE_PLUS || "",
  pro: process.env.PADDLE_PRICE_PRO || "",
  "pro+": process.env.PADDLE_PRICE_PRO_PLUS || "",
};

router.post("/create-checkout", async (req: Request, res: Response) => {
  try {
    const paddle = getPaddle();
    if (!paddle) {
      res.status(503).json({ error: "Paddle not configured" });
      return;
    }

    const { tier, userId, userEmail } = req.body as {
      tier: string;
      userId: string;
      userEmail?: string;
    };

    const priceId = PRICE_IDS[tier];
    if (!priceId) {
      res.status(400).json({ error: `No price configured for tier: ${tier}` });
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || "https://stem-aistudy.com";

    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { userId, tier } as Record<string, string>,
      checkout: {
        url: `${frontendUrl}/payment/success?tier=${encodeURIComponent(tier)}`,
      },
    });

    const transactionId = transaction?.id;
    if (!transactionId) {
      res.status(500).json({ error: "Failed to create transaction" });
      return;
    }

    const paddleEnv = process.env.PADDLE_ENV === "production" ? "" : "sandbox-";
    const checkoutUrl = `https://${paddleEnv}checkout.paddle.com/checkout/${transactionId}`;

    res.json({
      url: checkoutUrl,
      transactionId: transaction.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[paddle] create-checkout error:", message);
    res.status(500).json({ error: message });
  }
});

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const paddle = getPaddle();
    if (!paddle) {
      res.status(503).json({ error: "Paddle not configured" });
      return;
    }

    const signature = req.headers["paddle-signature"] as string;
    const secret = process.env.PADDLE_WEBHOOK_SECRET || "";

    let event;
    try {
      event = await paddle.webhooks.unmarshal(JSON.stringify(req.body), secret, signature);
    } catch (err) {
      console.error("[paddle] webhook verification failed:", err);
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }

    console.log(`[paddle] webhook received: ${event.eventType}`);

    switch (event.eventType) {
      case "transaction.completed":
      case "transaction.paid": {
        const txData = event.data;
        const raw = txData?.customData as Record<string, string> | undefined;
        console.log(`[paddle] transaction ${event.eventType}: userId=${raw?.userId}, tier=${raw?.tier}`);
        break;
      }
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated": {
        const subData = event.data;
        const raw = subData?.customData as Record<string, string> | undefined;
        console.log(`[paddle] ${event.eventType}: userId=${raw?.userId}, tier=${raw?.tier}`);
        break;
      }
      case "subscription.canceled": {
        const cancelData = event.data;
        const raw = cancelData?.customData as Record<string, string> | undefined;
        console.log(`[paddle] subscription canceled: userId=${raw?.userId}`);
        break;
      }
      default:
        console.log(`[paddle] unhandled event: ${event.eventType}`);
    }

    res.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[paddle] webhook error:", message);
    res.status(500).json({ error: message });
  }
});

router.get("/config", (_req: Request, res: Response) => {
  const configured = Object.values(PRICE_IDS).some(Boolean);
  res.json({
    available: configured,
    prices: PRICE_IDS,
    message: configured ? undefined : "Configure PADDLE_PRICE_PLUS, PADDLE_PRICE_PRO, PADDLE_PRICE_PRO_PLUS in .env",
  });
});

router.post("/cancel-subscription", async (req: Request, res: Response) => {
  try {
    const paddle = getPaddle();
    if (!paddle) {
      res.status(503).json({ error: "Paddle not configured" });
      return;
    }

    const { subscriptionId } = req.body as { subscriptionId: string };
    if (!subscriptionId) {
      res.status(400).json({ error: "subscriptionId is required" });
      return;
    }

    await paddle.subscriptions.cancel(subscriptionId);
    res.json({ cancelled: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[paddle] cancel-subscription error:", message);
    res.status(500).json({ error: message });
  }
});

export { router as paddleRouter };
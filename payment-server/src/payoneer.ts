import { Router, Request, Response } from "express";

const router = Router();

const PAYONEER_CONFIG = {
  clientId: process.env.PAYONEER_CLIENT_ID || "",
  clientSecret: process.env.PAYONEER_CLIENT_SECRET || "",
  apiUrl: process.env.PAYONEER_ENV === "production"
    ? "https://api.payoneer.com/v2"
    : "https://api.sandbox.payoneer.com/v2",
};

const PAYONEER_PRICING: Record<string, { amount: number; currency: string; description: string }> = {
  plus: {
    amount: 14.99,
    currency: "USD",
    description: "AI Study Plus - Monthly",
  },
  pro: {
    amount: 29.99,
    currency: "USD",
    description: "AI Study Pro - Monthly",
  },
  "pro+": {
    amount: 99.99,
    currency: "USD",
    description: "AI Study Pro+ - Monthly",
  },
};

async function getPayoneerToken(): Promise<string | null> {
  if (!PAYONEER_CONFIG.clientId || !PAYONEER_CONFIG.clientSecret) return null;

  try {
    const res = await fetch(`${PAYONEER_CONFIG.apiUrl}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: PAYONEER_CONFIG.clientId,
        client_secret: PAYONEER_CONFIG.clientSecret,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json() as { access_token?: string };
    return data.access_token || null;
  } catch {
    return null;
  }
}

router.post("/create-checkout", async (req: Request, res: Response) => {
  try {
    const token = await getPayoneerToken();
    if (!token) {
      res.status(503).json({ error: "Payoneer not configured or auth failed" });
      return;
    }

    const { tier, userId, userEmail } = req.body as {
      tier: string;
      userId: string;
      userEmail?: string;
    };

    const pricing = PAYONEER_PRICING[tier];
    if (!pricing) {
      res.status(400).json({ error: `No pricing configured for tier: ${tier}` });
      return;
    }

    const payload: Record<string, unknown> = {
      amount: pricing.amount,
      currency: pricing.currency,
      description: pricing.description,
      reference: `ai-study-${tier}-${userId}-${Date.now()}`,
      customData: { userId, tier },
      successUrl: `${process.env.FRONTEND_URL}/payment/success?provider=payoneer&tier=${tier}`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
    };

    if (userEmail) payload.payerEmail = userEmail;

    const checkoutRes = await fetch(`${PAYONEER_CONFIG.apiUrl}/checkout/charges`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!checkoutRes.ok) {
      const errorBody = await checkoutRes.text();
      console.error("[payoneer] create-checkout failed:", checkoutRes.status, errorBody);
      res.status(checkoutRes.status).json({ error: `Payoneer error: ${errorBody}` });
      return;
    }

    const data = await checkoutRes.json() as { checkoutUrl?: string; chargeId?: string };
    res.json({
      url: data.checkoutUrl,
      chargeId: data.chargeId,
      provider: "payoneer",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[payoneer] create-checkout error:", message);
    res.status(500).json({ error: message });
  }
});

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const event = req.body;
    console.log(`[payoneer] webhook received: ${event?.type || "unknown"}`);

    if (event?.type === "charge.completed") {
      const charge = event.data;
      const userId = charge?.customData?.userId;
      const tier = charge?.customData?.tier;
      console.log(`[payoneer] charge completed: userId=${userId}, tier=${tier}, charge=${charge?.id}`);
    }

    res.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[payoneer] webhook error:", message);
    res.status(500).json({ error: message });
  }
});

router.get("/config", (_req: Request, res: Response) => {
  const available = Boolean(PAYONEER_CONFIG.clientId && PAYONEER_CONFIG.clientSecret);
  res.json({
    available,
    pricing: available ? Object.fromEntries(
      Object.entries(PAYONEER_PRICING).map(([tier, p]) => [tier, { amount: p.amount, currency: p.currency }])
    ) : undefined,
    message: available ? undefined : "Configure PAYONEER_CLIENT_ID and PAYONEER_CLIENT_SECRET in .env",
  });
});

export { router as payoneerRouter };
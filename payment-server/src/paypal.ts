import { Router, Request, Response } from "express";

const router = Router();

const TIER_PLAN_IDS: Record<string, string> = {
  plus: process.env.PAYPAL_PLAN_PLUS || "",
  pro: process.env.PAYPAL_PLAN_PRO || "",
  "pro+": process.env.PAYPAL_PLAN_PRO_PLUS || "",
};

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("PayPal not configured");

  const base64 = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

router.post("/create-subscription", async (req: Request, res: Response) => {
  try {
    const token = await getPayPalAccessToken();
    const { tier, userId } = req.body as { tier: string; userId: string };
    const planId = TIER_PLAN_IDS[tier];

    if (!planId) {
      res.status(400).json({ error: `No PayPal plan configured for tier: ${tier}` });
      return;
    }

    const response = await fetch("https://api-m.paypal.com/v1/billing/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: userId,
        application_context: {
          brand_name: "AI Study",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${process.env.FRONTEND_URL}/payment/success?provider=paypal&tier=${tier}`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`PayPal create subscription failed: ${errBody}`);
    }

    const data = await response.json() as { id: string; links: Array<{ rel: string; href: string }> };
    const approveLink = data.links.find((l) => l.rel === "approve");

    res.json({ subscriptionId: data.id, url: approveLink?.href });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[paypal] create-subscription error:", message);
    res.status(500).json({ error: message });
  }
});

router.get("/status", async (req: Request, res: Response) => {
  try {
    const token = await getPayPalAccessToken();
    const subscriptionId = req.query.subscription_id as string;

    if (!subscriptionId) {
      res.status(400).json({ error: "subscription_id is required" });
      return;
    }

    const response = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      res.status(502).json({ error: "Failed to fetch PayPal subscription" });
      return;
    }

    const data = (await response.json()) as { status: string; custom_id?: string; plan_id?: string };
    res.json({ status: data.status, userId: data.custom_id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[paypal] status error:", message);
    res.status(500).json({ error: message });
  }
});

router.get("/config", (_req: Request, res: Response) => {
  const configured = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  res.json({
    available: configured,
    clientId: configured ? process.env.PAYPAL_CLIENT_ID : null,
    plans: configured ? TIER_PLAN_IDS : null,
  });
});

export { router as paypalRouter };
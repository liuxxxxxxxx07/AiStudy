import { Router, Request, Response } from "express";

const router = Router();

const BASE_URL = "https://api.lemonsqueezy.com/v1";

const TIER_VARIANT_IDS: Record<string, string> = {
  plus: process.env.LEMONSQUEEZY_VARIANT_PLUS || "",
  pro: process.env.LEMONSQUEEZY_VARIANT_PRO || "",
  "pro+": process.env.LEMONSQUEEZY_VARIANT_PRO_PLUS || "",
};

function getApiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error("LemonSqueezy not configured");
  return key;
}

async function lsApi(path: string, options?: RequestInit) {
  const key = getApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LemonSqueezy API error ${res.status}: ${body}`);
  }
  return res.json();
}

router.post("/create-checkout", async (req: Request, res: Response) => {
  try {
    const { tier, userId, userEmail } = req.body as {
      tier: string;
      userId: string;
      userEmail?: string;
    };

    const variantId = TIER_VARIANT_IDS[tier];
    if (!variantId) {
      res.status(400).json({ error: `No LemonSqueezy variant configured for tier: ${tier}` });
      return;
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId) {
      res.status(400).json({ error: "LEMONSQUEEZY_STORE_ID not configured" });
      return;
    }

    const body = {
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: { userId, tier },
            email: userEmail,
          },
          product_options: {
            enabled_variants: [parseInt(variantId, 10)],
          },
          checkout_options: {
            embed: false,
          },
          expires_at: null,
          preview: {
            enabled: false,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    } as Record<string, unknown>;

    const result = await lsApi("/checkouts", { method: "POST", body: JSON.stringify(body) }) as {
      data?: { attributes?: { url?: string } };
    };

    const url = result?.data?.attributes?.url;
    if (!url) {
      throw new Error("No checkout URL returned from LemonSqueezy");
    }

    res.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[lemonsqueezy] create-checkout error:", message);
    res.status(500).json({ error: message });
  }
});

router.get("/config", (_req: Request, res: Response) => {
  const configured = !!(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID);
  res.json({
    available: configured,
    storeId: configured ? process.env.LEMONSQUEEZY_STORE_ID : null,
    variants: configured ? TIER_VARIANT_IDS : null,
  });
});

router.post("/webhook", async (req: Request, res: Response) => {
  const eventName = req.headers["x-event-name"] as string;
  const body = req.body as Record<string, unknown>;

  console.log(`[lemonsqueezy] webhook received: ${eventName}`);

  switch (eventName) {
    case "order_created": {
      const attributes = (body as { data?: { attributes?: Record<string, unknown> } })?.data?.attributes || {};
      const userId = (attributes.custom as Record<string, unknown> || {}).userId as string;
      const tier = (attributes.custom as Record<string, unknown> || {}).tier as string;
      const orderStatus = attributes.status as string;

      if (orderStatus === "paid" || orderStatus === "successful") {
        console.log(`[lemonsqueezy] order paid: userId=${userId}, tier=${tier}`);
      }
      break;
    }
    case "subscription_created":
    case "subscription_updated":
    case "subscription_cancelled": {
      const subAttrs = (body as { data?: { attributes?: Record<string, unknown> } })?.data?.attributes || {};
      const subUserId = (subAttrs.custom as Record<string, unknown> || {}).userId as string;
      const subTier = (subAttrs.custom as Record<string, unknown> || {}).tier as string;

      console.log(`[lemonsqueezy] ${eventName}: userId=${subUserId}, tier=${subTier}`);
      break;
    }
    default:
      console.log(`[lemonsqueezy] unhandled event: ${eventName}`);
  }

  res.json({ received: true });
});

export { router as lemonSqueezyRouter };
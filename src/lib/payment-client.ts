"use client";

const PAYMENT_SERVER_URL =
  process.env.NEXT_PUBLIC_PAYMENT_SERVER_URL || "http://localhost:3001";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${PAYMENT_SERVER_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Payment server error (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function getHealth(): Promise<{ status: string; providers: string[] }> {
  return apiFetch("/api/health");
}

export async function createCheckoutSession(params: {
  tier: string;
  userId: string;
  userEmail?: string;
  provider?: "stripe" | "paypal" | "lemonsqueezy" | "paddle" | "payoneer";
}): Promise<{ url: string; sessionId?: string; transactionId?: string; chargeId?: string }> {
  const { tier, userId, userEmail, provider = "paddle" } = params;

  const endpointMap: Record<string, string> = {
    stripe: "/api/stripe/create-checkout-session",
    paypal: "/api/paypal/create-subscription",
    lemonsqueezy: "/api/lemonsqueezy/create-checkout",
    paddle: "/api/paddle/create-checkout",
    payoneer: "/api/payoneer/create-checkout",
  };

  const path = endpointMap[provider];
  if (!path) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  return apiFetch<{ url: string; sessionId?: string; transactionId?: string; chargeId?: string }>(
    path,
    {
      method: "POST",
      body: JSON.stringify({ tier, userId, userEmail }),
    }
  );
}

export async function getProviderConfig(provider: "paddle" | "payoneer"): Promise<{
  available: boolean;
  prices?: Record<string, string>;
  message?: string;
}> {
  return apiFetch(`/api/${provider}/config`);
}

export { PAYMENT_SERVER_URL };
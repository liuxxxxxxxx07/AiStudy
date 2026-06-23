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

export { PAYMENT_SERVER_URL };
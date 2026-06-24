import { type NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const CREDIT_COST: Record<string, number> = {
  auto: 2,
  easy: 3,
  medium: 8,
  hard: 60,
  extreme: 1400,
};

const MONTHLY_FREE_LIMIT = 5;

const serverBalances = new Map<string, { balance: number; month: string }>();

function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getServerBalance(userId: string): number {
  const month = getMonthKey();
  const entry = serverBalances.get(userId);
  if (!entry || entry.month !== month) {
    serverBalances.set(userId, { balance: MONTHLY_FREE_LIMIT, month });
    return MONTHLY_FREE_LIMIT;
  }
  return entry.balance;
}

function deductServerCredits(userId: string, amount: number): boolean {
  const month = getMonthKey();
  const entry = serverBalances.get(userId);
  const balance = entry && entry.month === month ? entry.balance : MONTHLY_FREE_LIMIT;

  if (balance < amount) return false;

  serverBalances.set(userId, { balance: balance - amount, month });
  return true;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const ipLimit = checkRateLimit(`ip:${ip}`, 30, 60_000);
  if (!ipLimit.allowed) {
    return Response.json(
      { error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(ipLimit.resetIn / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const userLimit = checkRateLimit(`user:${userId}`, 60, 60_000);
  if (!userLimit.allowed) {
    return Response.json(
      { error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(userLimit.resetIn / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const API_KEY = process.env.OPENROUTER_API_KEY;

  if (!API_KEY) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const { model, messages, stream } = await request.json();

  let cost = 0;
  for (const key of Object.keys(CREDIT_COST)) {
    if (model.includes(key)) {
      cost = CREDIT_COST[key];
      break;
    }
  }
  if (cost === 0) cost = 2;

  if (!deductServerCredits(userId, cost)) {
    return Response.json({
      error: "Insufficient credits",
      quota: { balance: getServerBalance(userId), limit: MONTHLY_FREE_LIMIT },
    }, { status: 403 });
  }

  const referer = request.headers.get("referer") || new URL(request.url).origin;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": referer,
      "X-Title": "AI Study",
    },
    body: JSON.stringify({ model, messages, stream }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return Response.json(
      { error: `API error ${response.status}: ${errText}` },
      { status: response.status }
    );
  }

  if (stream) {
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const json = await response.json();
  return Response.json(json);
}
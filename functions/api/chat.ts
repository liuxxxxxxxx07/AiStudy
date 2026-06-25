const ALLOWED_ORIGINS = [
  "https://stem-aistudy.com",
  "https://ai-study.pages.dev",
  "http://localhost:3000",
];

function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ||
         request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         "unknown";
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, resetIn: windowMs };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, resetIn: entry.resetAt - now };
  }
  entry.count++;
  return { allowed: true, resetIn: entry.resetAt - now };
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : "https://stem-aistudy.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-user-id",
  };
}

export async function onRequest(context: { request: Request; env: Record<string, string> }) {
  const { request, env } = context;

  const origin = request.headers.get("origin") || "";
  const cors = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const ip = getClientIp(request);
  const ipLimit = checkRateLimit(`ip:${ip}`, 30, 60_000);
  if (!ipLimit.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...cors, "Retry-After": String(Math.ceil(ipLimit.resetIn / 1000)) },
    });
  }

  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: cors,
    });
  }

  const API_KEY = env.OPENROUTER_API_KEY;
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: cors,
    });
  }

  let body: { model?: string; messages?: unknown[]; stream?: boolean };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: cors,
    });
  }

  const { model = "deepseek/deepseek-v4-pro", messages = [], stream = false } = body;

  const referer = request.headers.get("referer") || "https://stem-aistudy.com";

  const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": referer,
      "X-Title": "AI Study",
    },
    body: JSON.stringify({ model, messages, stream }),
  });

  if (!openrouterResponse.ok) {
    const errText = await openrouterResponse.text();
    return new Response(JSON.stringify({ error: `API error ${openrouterResponse.status}: ${errText}` }), {
      status: openrouterResponse.status,
      headers: cors,
    });
  }

  if (stream) {
    return new Response(openrouterResponse.body, {
      headers: { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  const json = await openrouterResponse.json();
  return new Response(JSON.stringify(json), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
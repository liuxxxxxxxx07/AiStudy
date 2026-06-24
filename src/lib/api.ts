"use client";

const API_BASE = "https://openrouter.ai/api/v1";
const API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface ChatOptions {
  model: string;
  signal?: AbortSignal;
}

interface StreamChunk {
  text?: string;
  reasoning?: string;
}

async function request(messages: ChatMessage[], options: ChatOptions & { stream: boolean }): Promise<Response> {
  const body = {
    model: options.model,
    messages,
    stream: options.stream,
  };

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "AI Study",
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  return response;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions
): Promise<string> {
  const response = await request(messages, { ...options, stream: false });
  const json = await response.json();
  return json.choices?.[0]?.message?.content || "";
}

export async function* streamCompletion(
  messages: ChatMessage[],
  options: ChatOptions
): AsyncGenerator<StreamChunk> {
  const response = await request(messages, { ...options, stream: true });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta;
        const chunk: StreamChunk = {};
        if (delta?.content) chunk.text = delta.content;
        if (delta?.reasoning) chunk.reasoning = delta.reasoning;
        if (chunk.text || chunk.reasoning) yield chunk;
      } catch {}
    }
  }
}

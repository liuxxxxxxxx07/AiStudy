const API_ENDPOINT = "/api/chat";

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

async function request(messages: ChatMessage[], options: ChatOptions & { stream: boolean }, userId?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["x-user-id"] = userId;

  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: options.model,
      messages,
      stream: options.stream,
    }),
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
  options: ChatOptions,
  userId?: string
): Promise<string> {
  const response = await request(messages, { ...options, stream: false }, userId);
  const json = await response.json();
  return json.choices?.[0]?.message?.content || "";
}

export async function* streamCompletion(
  messages: ChatMessage[],
  options: ChatOptions,
  userId?: string
): AsyncGenerator<StreamChunk> {
  const response = await request(messages, { ...options, stream: true }, userId);

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
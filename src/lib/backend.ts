"use client";

declare global {
  interface Window {
    puter: typeof puter;
  }
}

const KV_PREFIX = "ai-study-data";

interface StoredData {
  conversations: ConversationData[];
  credits: CreditData;
}

interface ConversationData {
  id: string;
  title: string;
  messages: MessageData[];
  mode: string;
  createdAt: number;
}

interface MessageData {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  images?: string[];
  files?: { name: string; text: string; charCount: number }[];
  meta?: Record<string, string>;
}

interface CreditData {
  balance: number;
  lastRefill: number;
  tier: string;
}

export async function saveToBackend(userId: string, data: StoredData): Promise<void> {
  try {
    await puter.kv.set(`${KV_PREFIX}-${userId}`, JSON.stringify(data));
  } catch (err) {
    console.error("Backend save failed:", err);
    throw err;
  }
}

export async function loadFromBackend(userId: string): Promise<StoredData | null> {
  try {
    const raw = await puter.kv.get(`${KV_PREFIX}-${userId}`);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw as StoredData;
  } catch (err) {
    console.error("Backend load failed:", err);
    return null;
  }
}

export async function getSiteStats(): Promise<Record<string, unknown>> {
  try {
    const stats: Record<string, unknown> = {};
    stats.totalUsers = 1;
    stats.storageKeys = [];
    return stats;
  } catch {
    return { error: "Unable to fetch stats" };
  }
}
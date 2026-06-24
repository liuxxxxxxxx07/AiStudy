"use client";

import { isSupabaseConfigured } from "./supabase";

const KV_PREFIX = "ai-study-data";

export interface StoredData {
  conversations: ConversationData[];
  credits: CreditData;
}

export interface ConversationData {
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
  lastResetMonth: string;
  tier: string;
}

function getStorageKey(userId: string): string {
  return `${KV_PREFIX}-${userId}`;
}

export async function saveToBackend(userId: string, data: StoredData): Promise<void> {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
  } catch (err) {
    console.error("Backend save failed:", err);
    throw err;
  }

  if (isSupabaseConfigured()) {
    try {
      const { getSupabase } = await import("./supabase");
      const sb = getSupabase();
      if (sb && data.conversations.length > 0) {
        for (const conv of data.conversations) {
          const { data: existing } = await sb
            .from("conversations")
            .select("id")
            .eq("id", conv.id)
            .single();

          if (existing) {
            await sb
              .from("conversations")
              .update({ title: conv.title, mode: conv.mode, updated_at: new Date().toISOString() })
              .eq("id", conv.id);
            await sb.from("messages").delete().eq("conversation_id", conv.id);
          } else {
            await sb.from("conversations").insert({
              id: conv.id,
              user_id: userId,
              title: conv.title,
              mode: conv.mode,
              created_at: new Date(conv.createdAt).toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

          if (conv.messages.length > 0) {
            await sb.from("messages").insert(
              conv.messages.map((m) => ({
                conversation_id: conv.id,
                role: m.role,
                content: m.content,
                reasoning: m.reasoning || null,
                images: m.images ? JSON.stringify(m.images) : null,
                files: m.files ? JSON.stringify(m.files) : null,
                meta: m.meta ? JSON.stringify(m.meta) : null,
              }))
            );
          }
        }
      }
    } catch (err) {
      console.warn("[backend] Supabase sync failed, localStorage fallback kept:", err);
    }
  }
}

export async function loadFromBackend(userId: string): Promise<StoredData | null> {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredData;
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
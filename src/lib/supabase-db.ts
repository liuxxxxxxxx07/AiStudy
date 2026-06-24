"use client";

import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { Question, ExamResult, ExamQuestion } from "./examEngine";
import type { KnowledgeEntry } from "./knowledgeBase";
import type { WikiEntry, WikiLink } from "./wikiEngine";
import type { StoredData } from "./backend";
import type { CreditData } from "./credits";

// ============================================================
// Helpers
// ============================================================

async function callDB<T>(
  fn: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  if (isSupabaseConfigured()) {
    try {
      return await fn();
    } catch (err) {
      console.warn("[supabase-db] DB call failed, falling back to localStorage:", err);
      return fallback();
    }
  }
  return fallback();
}

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("dev_auth_session");
    if (raw) {
      const session = JSON.parse(raw);
      return session?.user?.id || null;
    }
  } catch {
    // ignore
  }
  return null;
}

// ============================================================
// Profiles
// ============================================================

export async function getProfile(userId: string) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return null;
      const { data } = await sb.from("profiles").select("*").eq("id", userId).single();
      return data;
    },
    () => null
  );
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from("profiles").update(updates).eq("id", userId);
    },
    () => {}
  );
}

// ============================================================
// Credits
// ============================================================

export async function getCredits(userId: string): Promise<CreditData | null> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return getLocalCredits(userId);
      const { data } = await sb.from("credits").select("*").eq("user_id", userId).single();
      if (data) {
        return { balance: data.balance, lastResetMonth: "", tier: data.tier };
      }
      return getLocalCredits(userId);
    },
    () => getLocalCredits(userId)
  );
}

export async function saveCredits(userId: string, creditData: CreditData) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from("credits").upsert({
        user_id: userId,
        balance: creditData.balance,
        tier: creditData.tier,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    },
    () => {}
  );
}

function getLocalCredits(userId: string): CreditData | null {
  const raw = localStorage.getItem(`ai-study-credits-${userId}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

// ============================================================
// Conversations
// ============================================================

export async function getConversations(userId: string): Promise<StoredData | null> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return getLocalConversations(userId);

      const { data: convs } = await sb
        .from("conversations")
        .select("*, messages(*)")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (!convs || convs.length === 0) return getLocalConversations(userId);

      return {
        conversations: convs.map((c: any) => ({
          id: c.id,
          title: c.title,
          messages: (c.messages || []).map((m: any) => ({
            role: m.role,
            content: m.content,
            reasoning: m.reasoning || undefined,
            images: m.images?.length ? m.images : undefined,
            files: m.files?.length ? m.files : undefined,
            meta: m.meta || undefined,
          })),
          mode: c.mode,
          createdAt: new Date(c.created_at).getTime(),
        })),
        credits: { balance: 0, lastResetMonth: "", tier: "free" },
      };
    },
    () => getLocalConversations(userId)
  );
}

export async function saveConversations(userId: string, data: StoredData) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;

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
    },
    () => {}
  );
}

function getLocalConversations(userId: string): StoredData | null {
  const raw = localStorage.getItem(`ai-study-data-${userId}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

// ============================================================
// Questions (Question Bank)
// ============================================================

export async function getQuestions(): Promise<Question[]> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return getLocalQuestions();
      const { data } = await sb.from("questions").select("*").order("created_at", { ascending: false });
      if (!data || data.length === 0) return getLocalQuestions();
      return data.map(mapQuestion);
    },
    () => getLocalQuestions()
  );
}

export async function addQuestion(q: Omit<Question, "id" | "createdAt" | "reviewCount" | "lastReviewed">): Promise<Question | null> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return null;
      const { data } = await sb.from("questions").insert({
        user_id: getUserId(),
        content: q.content,
        answer: q.answer || null,
        subject: q.subject || null,
        course: q.course || null,
        tags: q.tags,
        difficulty: q.difficulty,
        source_mode: q.mode || null,
        source: q.source,
      }).select().single();
      return data ? mapQuestion(data) : null;
    },
    () => null
  );
}

export async function removeQuestion(id: string) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from("questions").delete().eq("id", id);
    },
    () => {}
  );
}

export async function searchQuestions(query: string): Promise<Question[]> {
  const all = await getQuestions();
  const lower = query.toLowerCase();
  return all.filter(
    (q) =>
      q.content.toLowerCase().includes(lower) ||
      q.answer?.toLowerCase().includes(lower) ||
      q.course?.toLowerCase().includes(lower) ||
      q.subject?.toLowerCase().includes(lower) ||
      q.tags.some((t) => t.toLowerCase().includes(lower))
  );
}

function getLocalQuestions(): Question[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ai-study-question-bank");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function mapQuestion(d: any): Question {
  return {
    id: d.id,
    content: d.content,
    answer: d.answer || undefined,
    subject: d.subject || undefined,
    course: d.course || undefined,
    tags: d.tags || [],
    difficulty: d.difficulty,
    mode: d.source_mode || "chat",
    source: d.source || "manual",
    createdAt: new Date(d.created_at).getTime(),
    reviewCount: d.review_count || 0,
    lastReviewed: d.last_reviewed ? new Date(d.last_reviewed).getTime() : undefined,
  };
}

// ============================================================
// Exam Results
// ============================================================

export async function getExamResults(): Promise<ExamResult[]> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return getLocalExamResults();
      const { data } = await sb.from("exam_results").select("*").order("created_at", { ascending: false }).limit(50);
      if (!data || data.length === 0) return getLocalExamResults();
      return data.map((r: any) => ({
        questions: r.questions as ExamQuestion[],
        score: r.score,
        total: r.total,
        percentage: r.percentage,
        startTime: r.started_at ? new Date(r.started_at).getTime() : 0,
        endTime: new Date(r.created_at).getTime(),
        timeSpent: r.time_spent,
      }));
    },
    () => getLocalExamResults()
  );
}

export async function saveExamResult(result: ExamResult) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from("exam_results").insert({
        user_id: getUserId(),
        score: result.score,
        total: result.total,
        percentage: result.percentage,
        time_spent: result.timeSpent,
        questions: JSON.stringify(result.questions),
        started_at: new Date(result.startTime).toISOString(),
      });
    },
    () => {}
  );
}

function getLocalExamResults(): ExamResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ai-study-exam-results");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ============================================================
// Knowledge Base
// ============================================================

export async function getKnowledgeBase(): Promise<KnowledgeEntry[]> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return getLocalKnowledgeBase();
      const { data } = await sb.from("knowledge_entries").select("*").order("updated_at", { ascending: false });
      if (!data || data.length === 0) return getLocalKnowledgeBase();
      return data.map(mapKnowledgeEntry);
    },
    () => getLocalKnowledgeBase()
  );
}

export async function addKnowledgeEntry(entry: Omit<KnowledgeEntry, "id" | "createdAt" | "updatedAt">): Promise<KnowledgeEntry | null> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return null;
      const { data } = await sb.from("knowledge_entries").insert({
        user_id: getUserId(),
        title: entry.title,
        content: entry.content,
        entry_type: entry.type,
        tags: entry.tags,
        course: entry.course || null,
        subject: entry.subject || null,
        source_mode: entry.sourceMode || null,
      }).select().single();
      return data ? mapKnowledgeEntry(data) : null;
    },
    () => null
  );
}

export async function removeKnowledgeEntry(id: string) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from("knowledge_entries").delete().eq("id", id);
    },
    () => {}
  );
}

export async function updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.type !== undefined) dbUpdates.entry_type = updates.type;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.course !== undefined) dbUpdates.course = updates.course;
      if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
      await sb.from("knowledge_entries").update(dbUpdates).eq("id", id);
    },
    () => {}
  );
}

export async function searchKnowledgeBase(query: string): Promise<KnowledgeEntry[]> {
  const all = await getKnowledgeBase();
  const lower = query.toLowerCase();
  return all.filter(
    (e) =>
      e.title.toLowerCase().includes(lower) ||
      e.content.toLowerCase().includes(lower) ||
      e.tags.some((t) => t.toLowerCase().includes(lower)) ||
      e.course?.toLowerCase().includes(lower)
  );
}

function getLocalKnowledgeBase(): KnowledgeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ai-study-knowledge-base");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function mapKnowledgeEntry(d: any): KnowledgeEntry {
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    type: d.entry_type,
    tags: d.tags || [],
    course: d.course || undefined,
    subject: d.subject || undefined,
    sourceMode: d.source_mode || undefined,
    createdAt: new Date(d.created_at).getTime(),
    updatedAt: new Date(d.updated_at).getTime(),
  };
}

// ============================================================
// Wiki
// ============================================================

export async function getWikiEntries(): Promise<WikiEntry[]> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return getLocalWikiEntries();
      const { data } = await sb.from("wiki_entries").select("*").order("updated_at", { ascending: false });
      if (!data || data.length === 0) return getLocalWikiEntries();
      return data.map(mapWikiEntry);
    },
    () => getLocalWikiEntries()
  );
}

export async function addWikiEntry(entry: Omit<WikiEntry, "id" | "createdAt" | "updatedAt">): Promise<WikiEntry | null> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return null;
      const { data } = await sb.from("wiki_entries").insert({
        user_id: getUserId(),
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
        category: entry.category,
        source: entry.source || null,
      }).select().single();
      return data ? mapWikiEntry(data) : null;
    },
    () => null
  );
}

export async function updateWikiEntry(id: string, updates: Partial<WikiEntry>) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.source !== undefined) dbUpdates.source = updates.source;
      await sb.from("wiki_entries").update(dbUpdates).eq("id", id);
    },
    () => {}
  );
}

export async function deleteWikiEntry(id: string) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from("wiki_entries").delete().eq("id", id);
      await sb.from("wiki_links").delete().or(`source_id.eq.${id},target_id.eq.${id}`);
    },
    () => {}
  );
}

export async function searchWiki(query: string): Promise<WikiEntry[]> {
  const all = await getWikiEntries();
  const lower = query.toLowerCase();
  return all.filter(
    (e) =>
      e.title.toLowerCase().includes(lower) ||
      e.content.toLowerCase().includes(lower) ||
      e.tags.some((t) => t.toLowerCase().includes(lower))
  );
}

export async function getWikiLinks(): Promise<WikiLink[]> {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return [];
      const { data } = await sb.from("wiki_links").select("*");
      return (data || []).map((l: any) => ({
        source: l.source_id,
        target: l.target_id,
        label: l.label || undefined,
      }));
    },
    () => []
  );
}

export async function addWikiLink(sourceId: string, targetId: string, label?: string) {
  return callDB(
    async () => {
      const sb = getSupabase();
      if (!sb) return;
      await sb.from("wiki_links").insert({
        source_id: sourceId,
        target_id: targetId,
        label: label || null,
      });
    },
    () => {}
  );
}

function getLocalWikiEntries(): WikiEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ai-study-wiki");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function mapWikiEntry(d: any): WikiEntry {
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    tags: d.tags || [],
    category: d.category,
    source: d.source || undefined,
    relatedIds: [],
    createdAt: new Date(d.created_at).getTime(),
    updatedAt: new Date(d.updated_at).getTime(),
  };
}
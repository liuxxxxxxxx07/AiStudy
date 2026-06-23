export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  type: "mermaid" | "note" | "summary" | "visualization" | "file";
  tags: string[];
  course?: string;
  subject?: string;
  sourceMode?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "ai-study-knowledge-base";

export function getKnowledgeBase(): KnowledgeEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveKnowledgeBase(entries: KnowledgeEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function addKnowledgeEntry(entry: Omit<KnowledgeEntry, "id" | "createdAt" | "updatedAt">): KnowledgeEntry {
  const entries = getKnowledgeBase();
  const newEntry: KnowledgeEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  entries.push(newEntry);
  saveKnowledgeBase(entries);
  return newEntry;
}

export function removeKnowledgeEntry(id: string): void {
  const entries = getKnowledgeBase().filter((e) => e.id !== id);
  saveKnowledgeBase(entries);
}

export function updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>): void {
  const entries = getKnowledgeBase();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx !== -1) {
    entries[idx] = { ...entries[idx], ...updates, updatedAt: Date.now() };
    saveKnowledgeBase(entries);
  }
}

export function searchKnowledgeBase(query: string): KnowledgeEntry[] {
  const entries = getKnowledgeBase();
  const lower = query.toLowerCase();
  return entries.filter(
    (e) =>
      e.title.toLowerCase().includes(lower) ||
      e.content.toLowerCase().includes(lower) ||
      e.tags.some((t) => t.toLowerCase().includes(lower)) ||
      e.course?.toLowerCase().includes(lower)
  );
}

export function filterBySubject(subject: string): KnowledgeEntry[] {
  return getKnowledgeBase().filter((e) => e.subject === subject);
}

export function filterByTag(tag: string): KnowledgeEntry[] {
  return getKnowledgeBase().filter((e) => e.tags.includes(tag));
}
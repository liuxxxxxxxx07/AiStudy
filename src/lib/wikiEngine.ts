export interface WikiEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: "theorem" | "definition" | "formula" | "note" | "concept";
  source?: string;
  relatedIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface WikiLink {
  source: string;
  target: string;
  label?: string;
}

const STORAGE_KEY = "ai-study-wiki";

export function getWikiEntries(): WikiEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWikiEntries(entries: WikiEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

export function addWikiEntry(entry: Omit<WikiEntry, "id" | "createdAt" | "updatedAt">): WikiEntry {
  const entries = getWikiEntries();
  const newEntry: WikiEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  entries.push(newEntry);
  saveWikiEntries(entries);
  return newEntry;
}

export function updateWikiEntry(id: string, updates: Partial<WikiEntry>): void {
  const entries = getWikiEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx !== -1) {
    entries[idx] = { ...entries[idx], ...updates, updatedAt: Date.now() };
    saveWikiEntries(entries);
  }
}

export function deleteWikiEntry(id: string): void {
  let entries = getWikiEntries();
  entries = entries.filter((e) => e.id !== id);
  entries = entries.map((e) => ({
    ...e,
    relatedIds: e.relatedIds.filter((rid) => rid !== id),
  }));
  saveWikiEntries(entries);
}

export function getWikiEntry(id: string): WikiEntry | undefined {
  return getWikiEntries().find((e) => e.id === id);
}

export function searchWiki(query: string): WikiEntry[] {
  const entries = getWikiEntries();
  const lower = query.toLowerCase();
  return entries.filter(
    (e) =>
      e.title.toLowerCase().includes(lower) ||
      e.content.toLowerCase().includes(lower) ||
      e.tags.some((t) => t.toLowerCase().includes(lower))
  );
}

export function getEntriesByCategory(category: string): WikiEntry[] {
  return getWikiEntries().filter((e) => e.category === category);
}

export function getWikiGraph(): { nodes: WikiEntry[]; links: WikiLink[] } {
  const nodes = getWikiEntries();
  const links: WikiLink[] = [];
  for (const node of nodes) {
    for (const relatedId of node.relatedIds) {
      if (nodes.find((n) => n.id === relatedId)) {
        const exists = links.some(
          (l) =>
            (l.source === node.id && l.target === relatedId) ||
            (l.source === relatedId && l.target === node.id)
        );
        if (!exists) {
          links.push({ source: node.id, target: relatedId });
        }
      }
    }
  }
  return { nodes, links };
}

export function getCategories(): string[] {
  const entries = getWikiEntries();
  return Array.from(new Set(entries.map((e) => e.category)));
}

// Auto-link entries based on shared tags
export function autoLinkEntries(): void {
  const entries = getWikiEntries();
  for (const entry of entries) {
    const related = entries.filter(
      (other) =>
        other.id !== entry.id &&
        other.tags.some((t) => entry.tags.includes(t)) &&
        !entry.relatedIds.includes(other.id)
    );
    for (const rel of related) {
      entry.relatedIds.push(rel.id);
    }
  }
  saveWikiEntries(entries);
}
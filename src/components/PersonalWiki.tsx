"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen, GitBranch, Plus, Search, X, Edit3, Trash2, Save, ArrowLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import WikiNodeGraph from "./WikiNodeGraph";
import {
  WikiEntry, getWikiEntries, addWikiEntry, updateWikiEntry,
  deleteWikiEntry, getWikiGraph, searchWiki, autoLinkEntries,
} from "@/lib/wikiEngine";

interface PersonalWikiProps {
  initialEntries?: WikiEntry[];
  onClose: () => void;
}

type ViewTab = "List" | "Graph" | "Edit";

const CATEGORIES = ["theorem", "definition", "formula", "note", "concept"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  theorem: "text-blue-500 bg-blue-500/10",
  definition: "text-green-500 bg-green-500/10",
  formula: "text-purple-500 bg-purple-500/10",
  note: "text-yellow-500 bg-yellow-500/10",
  concept: "text-gray-500 bg-gray-500/10",
};

const ALL_CATEGORY = "All" as const;

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function stripMarkdown(md: string): string {
  return md.replace(/[#*_~`\[\]()>|!-]/g, "").replace(/\s+/g, " ").trim();
}

export default function PersonalWiki({ initialEntries, onClose }: PersonalWikiProps) {
  const [entries, setEntries] = useState<WikiEntry[]>(initialEntries ?? []);
  const [view, setView] = useState<ViewTab>("List");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORY);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<WikiEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setEntries(getWikiEntries());
  }, []);

  const filtered = useMemo(() => {
    let result = entries;
    if (query.trim()) {
      const lower = query.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(lower) ||
          e.content.toLowerCase().includes(lower) ||
          e.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }
    if (categoryFilter !== ALL_CATEGORY) {
      result = result.filter((e) => e.category === categoryFilter);
    }
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [entries, query, categoryFilter]);

  const selectedEntry = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId]
  );

  const relatedEntries = useMemo(() => {
    if (!selectedEntry) return [];
    return selectedEntry.relatedIds
      .map((id) => entries.find((e) => e.id === id))
      .filter((e): e is WikiEntry => e !== undefined);
  }, [selectedEntry, entries]);

  const handleDelete = useCallback((id: string) => {
    deleteWikiEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDeleteConfirm(null);
  }, [selectedId]);

  const openNewEntry = useCallback(() => {
    setEditingEntry({
      id: "",
      title: "",
      content: "",
      tags: [],
      category: "note",
      source: "",
      relatedIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setView("Edit");
  }, []);

  const openEditEntry = useCallback((entry: WikiEntry) => {
    setEditingEntry({ ...entry });
    setView("Edit");
  }, []);

  const handleSave = useCallback(() => {
    if (!editingEntry) return;
    if (editingEntry.id) {
      updateWikiEntry(editingEntry.id, {
        title: editingEntry.title,
        content: editingEntry.content,
        tags: editingEntry.tags,
        category: editingEntry.category as Category,
        source: editingEntry.source,
        relatedIds: editingEntry.relatedIds,
      });
    } else {
      addWikiEntry({
        title: editingEntry.title,
        content: editingEntry.content,
        tags: editingEntry.tags,
        category: editingEntry.category as Category,
        source: editingEntry.source,
        relatedIds: editingEntry.relatedIds,
      });
      autoLinkEntries();
    }
    setEntries(getWikiEntries());
    setEditingEntry(null);
    setView("List");
  }, [editingEntry]);

  const handleCancelEdit = useCallback(() => {
    setEditingEntry(null);
    setView(selectedId ? "List" : "List");
  }, [selectedId]);

  const graphData = useMemo(() => getWikiGraph(), [entries]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-background border border-card-border rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4 animate-fade-in">
        <header className="flex items-center justify-between px-4 py-3 border-b border-card-border shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Personal Wiki</h2>
          </div>
          <div className="flex items-center gap-2">
            {(["List", "Graph", "Edit"] as ViewTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  view === tab
                    ? "bg-tab-active-bg text-tab-active-text"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab === "List" && <BookOpen className="w-3.5 h-3.5 inline mr-1" />}
                {tab === "Graph" && <GitBranch className="w-3.5 h-3.5 inline mr-1" />}
                {tab === "Edit" && <Edit3 className="w-3.5 h-3.5 inline mr-1" />}
                {tab}
              </button>
            ))}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-hover-bg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {view === "List" && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-4 pt-3 pb-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search entries..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-input-bg border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {[ALL_CATEGORY, ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                      categoryFilter === cat
                        ? cat === ALL_CATEGORY
                          ? "bg-foreground text-background"
                          : CATEGORY_COLORS[cat as Category]
                        : "bg-input-bg text-muted hover:text-foreground"
                    }`}
                  >
                    {cat === ALL_CATEGORY ? "All" : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {filtered.length === 0 && (
                <p className="text-sm text-muted text-center pt-8">No entries found.</p>
              )}
              {filtered.map((entry) => (
                <div key={entry.id}>
                  <button
                    onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
                    className="w-full text-left p-3 rounded-lg border border-card-border bg-input-bg hover:bg-hover-bg transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground truncate">
                            {entry.title}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                              CATEGORY_COLORS[entry.category] || "text-gray-500 bg-gray-500/10"
                            }`}
                          >
                            {entry.category}
                          </span>
                        </div>
                        {entry.tags.length > 0 && (
                          <div className="flex gap-1 mb-1 flex-wrap">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 text-muted"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[12px] text-foreground/60 leading-relaxed line-clamp-2">
                          {stripMarkdown(entry.content).slice(0, 100)}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted shrink-0">
                        {formatDate(entry.updatedAt)}
                      </span>
                    </div>
                  </button>

                  {selectedId === entry.id && (
                    <div className="mt-1 ml-3 p-3 rounded-lg border border-card-border bg-background space-y-3">
                      <div className="markdown-body text-[13px] text-foreground/80 leading-relaxed max-h-60 overflow-y-auto">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {entry.content}
                        </ReactMarkdown>
                      </div>

                      {relatedEntries.length > 0 && (
                        <div>
                          <p className="text-[11px] font-medium text-muted mb-1">Related</p>
                          <div className="flex flex-wrap gap-1">
                            {relatedEntries.map((rel) => (
                              <button
                                key={rel.id}
                                onClick={() => setSelectedId(rel.id)}
                                className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                              >
                                {rel.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => openEditEntry(entry)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-input-bg border border-input-border text-muted hover:text-foreground transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        {deleteConfirm === entry.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 rounded text-[11px] text-muted hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-input-bg border border-input-border text-muted hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-card-border shrink-0 flex justify-end">
              <button
                onClick={openNewEntry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Entry
              </button>
            </div>
          </div>
        )}

        {view === "Graph" && (
          <div className="flex-1 min-h-0 p-4">
            {graphData.nodes.length === 0 ? (
              <p className="text-sm text-muted text-center pt-8">No entries to display in graph.</p>
            ) : (
              <WikiNodeGraph
                nodes={graphData.nodes}
                links={graphData.links}
                onSelectNode={(id: string) => {
                  setSelectedId(id);
                  setView("List");
                }}
              />
            )}
          </div>
        )}

        {view === "Edit" && editingEntry && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={handleCancelEdit} className="p-1 rounded text-muted hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-medium text-foreground">
                {editingEntry.id ? "Edit Entry" : "New Entry"}
              </h3>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">Title</label>
              <input
                type="text"
                value={editingEntry.title}
                onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                placeholder="Entry title"
                className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">Content (Markdown)</label>
              <textarea
                value={editingEntry.content}
                onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                placeholder="# Heading\n\nWrite your content here..."
                rows={8}
                className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors resize-none font-mono"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted block mb-1">Category</label>
                <select
                  value={editingEntry.category}
                  onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value as Category })}
                  className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-[13px] outline-none focus:border-foreground/30 transition-colors"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="text-[11px] font-medium text-muted block mb-1">Source file (optional)</label>
                <input
                  type="text"
                  value={editingEntry.source ?? ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, source: e.target.value })}
                  placeholder="e.g. chapter3.md"
                  className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={editingEntry.tags.join(", ")}
                onChange={(e) =>
                  setEditingEntry({
                    ...editingEntry,
                    tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="linear-algebra, vectors, proof"
                className="w-full px-3 py-2 rounded-lg bg-input-bg border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
              />
              {editingEntry.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {editingEntry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted block mb-1">Related entries</label>
              <div className="max-h-32 overflow-y-auto space-y-1 border border-input-border rounded-lg p-2 bg-input-bg">
                {entries
                  .filter((e) => e.id !== editingEntry.id)
                  .map((entry) => {
                    const isSelected = editingEntry.relatedIds.includes(entry.id);
                    return (
                      <button
                        key={entry.id}
                        onClick={() =>
                          setEditingEntry({
                            ...editingEntry,
                            relatedIds: isSelected
                              ? editingEntry.relatedIds.filter((id) => id !== entry.id)
                              : [...editingEntry.relatedIds, entry.id],
                          })
                        }
                        className={`w-full text-left px-2 py-1 rounded text-[12px] transition-colors ${
                          isSelected
                            ? "bg-blue-500/20 text-blue-400"
                            : "text-muted hover:text-foreground hover:bg-hover-bg"
                        }`}
                      >
                        {entry.title}
                      </button>
                    );
                  })}
                {entries.filter((e) => e.id !== editingEntry.id).length === 0 && (
                  <p className="text-[12px] text-muted text-center py-2">No other entries available.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 pb-1">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!editingEntry.title.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
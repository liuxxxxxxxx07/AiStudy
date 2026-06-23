"use client";

import { useState, useMemo } from "react";
import { Search, Filter, X, RefreshCw, Calendar, Tag } from "lucide-react";
import {
  searchQuestions,
  getQuestionBank,
  getQuestionsByTimeRange,
} from "@/lib/examEngine";
import type { Question as EngineQuestion } from "@/lib/examEngine";

type Question = Pick<EngineQuestion, "id" | "content" | "answer" | "subject" | "tags" | "difficulty" | "createdAt">;

interface SearchPanelProps {
  onClose: () => void;
  onSelectQuestion: (question: Question) => void;
}

type TimeRange = "today" | "week" | "month" | "all";

function getRelativeDate(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function getTimeRangeBounds(range: TimeRange): [number, number] | null {
  if (range === "all") return null;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (range === "today") return [startOfDay, Date.now()];
  if (range === "week") {
    const dayOfWeek = now.getDay();
    const startOfWeek = startOfDay - dayOfWeek * 86400000;
    return [startOfWeek, Date.now()];
  }
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return [startOfMonth, Date.now()];
}

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "all", label: "All Time" },
];

export default function SearchPanel({ onClose, onSelectQuestion }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const allQuestions = useMemo(() => getQuestionBank() as Question[], [refreshKey]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => { if (q.subject) set.add(q.subject); });
    return Array.from(set).sort();
  }, [allQuestions]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    allQuestions.forEach((q) => q.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allQuestions]);

  const filtered = useMemo(() => {
    let result = allQuestions;

    if (searchQuery.trim()) {
      result = searchQuestions(searchQuery.trim()) as Question[];
    }

    if (selectedSubjects.size > 0) {
      result = result.filter((q) => q.subject && selectedSubjects.has(q.subject));
    }

    if (selectedDifficulties.size > 0) {
      result = result.filter((q) => selectedDifficulties.has(q.difficulty));
    }

    if (selectedTags.size > 0) {
      result = result.filter((q) => q.tags.some((t) => selectedTags.has(t)));
    }

    const bounds = getTimeRangeBounds(timeRange);
    if (bounds) {
      const [start, end] = bounds;
      const timeFiltered = getQuestionsByTimeRange(start, end) as Question[];
      if (searchQuery.trim() || selectedSubjects.size > 0 || selectedDifficulties.size > 0 || selectedTags.size > 0) {
        const ids = new Set(timeFiltered.map((q) => q.id));
        result = result.filter((q) => ids.has(q.id));
      } else {
        result = timeFiltered;
      }
    }

    return result;
  }, [allQuestions, searchQuery, selectedSubjects, selectedDifficulties, selectedTags, timeRange]);

  const toggleSubject = (s: string) => {
    setSelectedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const toggleDifficulty = (d: string) => {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const clearAll = () => {
    setSearchQuery("");
    setSelectedSubjects(new Set());
    setSelectedDifficulties(new Set());
    setSelectedTags(new Set());
    setTimeRange("all");
  };

  const hasActiveFilters = searchQuery.trim() || selectedSubjects.size > 0 || selectedDifficulties.size > 0 || selectedTags.size > 0 || timeRange !== "all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-card-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Search Questions</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-hover-bg transition-colors text-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-divider space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-input-bg border border-input-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Filter className="w-3.5 h-3.5 text-muted" />
              <span className="text-xs text-muted font-medium">Filters</span>
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="ml-auto text-[11px] text-accent hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-2">
              {subjects.length > 0 && (
                <div>
                  <span className="text-[11px] text-muted block mb-1">Subject</span>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map((s) => (
                      <label
                        key={s}
                        className="flex items-center gap-1 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjects.has(s)}
                          onChange={() => toggleSubject(s)}
                          className="accent-accent"
                        />
                        <span className="text-xs text-foreground/80">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[11px] text-muted block mb-1">Difficulty</span>
                <div className="flex flex-wrap gap-1.5">
                  {DIFFICULTIES.map((d) => (
                    <label
                      key={d}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDifficulties.has(d)}
                        onChange={() => toggleDifficulty(d)}
                        className="accent-accent"
                      />
                      <span
                        className={`text-xs capitalize ${
                          d === "easy"
                            ? "text-green-500"
                            : d === "hard"
                              ? "text-red-500"
                              : "text-yellow-500"
                        }`}
                      >
                        {d}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-muted block mb-1">Time Range</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted" />
                  {TIME_RANGES.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setTimeRange(r.key)}
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                        timeRange === r.key
                          ? "bg-accent text-white"
                          : "text-muted hover:text-foreground hover:bg-hover-bg"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {allTags.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Tag className="w-3 h-3 text-muted" />
                    <span className="text-[11px] text-muted">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((t) => {
                      const active = selectedTags.has(t);
                      return (
                        <button
                          key={t}
                          onClick={() => toggleTag(t)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                            active
                              ? "bg-accent/10 border-accent text-accent"
                              : "border-card-border text-muted hover:border-muted hover:text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">{filtered.length} question{filtered.length !== 1 ? "s" : ""}</span>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center text-muted text-sm py-12">No questions found</div>
          ) : (
            filtered.map((q) => (
              <div
                key={q.id}
                className="border border-card-border rounded-lg p-3 group hover:bg-hover-bg transition-colors"
              >
                <p className="text-[13px] leading-relaxed mb-2 text-foreground/90">
                  {q.content.length > 150
                    ? q.content.slice(0, 150) + "..."
                    : q.content}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                  {q.subject && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">
                      {q.subject}
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      q.difficulty === "easy"
                        ? "bg-green-500/10 text-green-500"
                        : q.difficulty === "hard"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </div>
                {q.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {q.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-hover-bg text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted">
                    {q.createdAt ? getRelativeDate(q.createdAt) : ""}
                  </span>
                  <button
                    onClick={() => onSelectQuestion(q)}
                    className="text-[11px] px-2.5 py-1 rounded bg-accent text-white hover:opacity-90 transition-opacity"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
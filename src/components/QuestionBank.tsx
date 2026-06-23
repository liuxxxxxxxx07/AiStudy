"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Bookmark, Trash2, X, Copy, Check, Search, RefreshCw,
  Layers, GraduationCap, Tag, Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import FlashCard from "./FlashCard";
import SearchPanel from "./SearchPanel";
import { Question, searchQuestions, removeQuestion, incrementReviewCount, getQuestionBank } from "@/lib/examEngine";

export function useQuestionBank() {
  const saveQuestion = (
    question: string,
    answer: string,
    subject?: string,
    course?: string,
    tags?: string[],
    difficulty?: string,
    mode?: string
  ) => {
    const bank = getQuestionBank();
    const newQ: Question = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      content: question,
      answer,
      subject,
      course,
      tags: tags || [],
      difficulty: (difficulty as "easy" | "medium" | "hard") || "medium",
      mode: mode || "chat",
      source: "user",
      createdAt: Date.now(),
      reviewCount: 0,
    };
    bank.unshift(newQ);
    try { localStorage.setItem("ai-study-question-bank", JSON.stringify(bank)); } catch {}
  };

  return { saveQuestion };
}

export default function QuestionBank({
  open, onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<Question[]>([]);
  const [query, setQuery] = useState("");
  const [flashMode, setFlashMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) setItems(getQuestionBank());
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    return searchQuestions(query);
  }, [items, query]);

  const handleDelete = (id: string) => {
    removeQuestion(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const allSubjects = useMemo(() => {
    const set = new Set(items.map((i) => i.subject).filter(Boolean));
    return Array.from(set);
  }, [items]);

  if (!open) return null;

  if (flashMode) {
    return (
      <FlashCard
        questions={items}
        onClose={() => setFlashMode(false)}
      />
    );
  }

  if (searchMode) {
    return (
      <SearchPanel
        onClose={() => setSearchMode(false)}
        onSelectQuestion={(q) => {
          setQuery(q.content.slice(0, 100));
          setSearchMode(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-card-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            <span className="text-sm font-medium">Question Bank</span>
            <span className="text-[11px] text-muted">({items.length})</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchMode(true)}
              className="p-1.5 rounded hover:bg-hover-bg text-muted transition-colors"
              title="Advanced Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            {items.length > 0 && (
              <button
                onClick={() => setFlashMode(true)}
                className="p-1.5 rounded hover:bg-hover-bg text-muted transition-colors"
                title="Flashcard Review"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => { setItems(getQuestionBank()); }}
              className="p-1.5 rounded hover:bg-hover-bg text-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-hover-bg transition-colors text-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pt-3 pb-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full bg-input-bg border border-input-border rounded-lg pl-8 pr-3 py-1.5 text-[13px] outline-none focus:border-foreground/30 transition-colors"
            />
          </div>
          {allSubjects.length > 0 && !query && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {allSubjects.map((s) => (
                <span
                  key={s}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center text-muted text-sm py-12">
              {query ? "No matching questions" : "Empty — save questions from AI responses"}
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="border border-card-border rounded-lg p-3 group hover:border-foreground/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-[13px] font-medium leading-relaxed flex-1">
                    {item.content.length > 200 ? item.content.slice(0, 200) + "..." : item.content}
                  </p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.difficulty && (
                      <span className={`text-[9px] px-1 py-0.5 rounded-full font-medium ${
                        item.difficulty === "easy" ? "bg-green-500/10 text-green-500"
                        : item.difficulty === "hard" ? "bg-red-500/10 text-red-500"
                        : "bg-yellow-500/10 text-yellow-500"
                      }`}>
                        {item.difficulty}
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(item.id, item.answer || "")}
                      className="p-1 rounded hover:bg-hover-bg text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded hover:bg-hover-bg text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {item.subject && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted">
                      <Layers className="w-2.5 h-2.5" />
                      {item.subject}
                    </span>
                  )}
                  {item.course && (
                    <span className="flex items-center gap-0.5 text-[10px] text-muted">
                      <GraduationCap className="w-2.5 h-2.5" />
                      {item.course}
                    </span>
                  )}
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded-full bg-accent-light text-muted"
                    >
                      <Tag className="w-2 h-2" />
                      {tag}
                    </span>
                  ))}
                  <span className="text-[9px] text-muted ml-auto">
                    {new Date(item.createdAt).toLocaleDateString()}
                    {item.reviewCount > 0 && ` · reviewed ${item.reviewCount}x`}
                  </span>
                </div>

                {item.answer && (
                  <div className="markdown-body text-[12px] text-foreground/70 max-h-32 overflow-y-auto border-t border-divider pt-2">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {item.answer.length > 300 ? item.answer.slice(0, 300) + "..." : item.answer}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

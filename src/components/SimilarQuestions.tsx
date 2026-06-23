"use client";

import { useState, useEffect, useCallback } from "react";
import { Lightbulb, RefreshCw, MessageSquare, X } from "lucide-react";
import { generateSimilarQuestions, type SimilarQuestion } from "@/lib/questionAnalyzer";

interface SimilarQuestionsProps {
  question: string;
  answer: string;
  onSelect: (q: string, a: string) => void;
  onClose: () => void;
}

export default function SimilarQuestions({
  question,
  answer,
  onSelect,
  onClose,
}: SimilarQuestionsProps) {
  const [questions, setQuestions] = useState<SimilarQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const fetchQuestions = useCallback(async () => {
    setGenerating(true);
    setExpanded(null);
    try {
      const result = await generateSimilarQuestions(question, answer, 3);
      setQuestions(result);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, [question, answer]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const toggleExpand = (index: number) => {
    setExpanded((prev) => (prev === index ? null : index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-background border border-input-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-divider">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">举一反三</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-hover-bg text-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-muted animate-spin" />
            </div>
          ) : questions.length === 0 ? (
            <p className="text-center text-muted py-12">No similar questions generated.</p>
          ) : (
            questions.map((item, index) => (
              <div
                key={index}
                className="border border-input-border rounded-lg overflow-hidden bg-input-bg"
              >
                <button
                  onClick={() => toggleExpand(index)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-hover-bg transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground leading-relaxed flex-1">
                    {item.question}
                  </span>
                </button>

                {expanded === index && (
                  <div className="border-t border-divider px-4 py-3 space-y-3">
                    <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
                      {item.answer}
                    </p>
                    <button
                      onClick={() => onSelect(item.question, item.answer)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
                    >
                      <MessageSquare className="w-3 h-3" />
                      Ask This
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t border-divider">
          <button
            onClick={fetchQuestions}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-input-border bg-input-bg text-foreground hover:bg-hover-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Generating..." : "Regenerate"}
          </button>
        </div>
      </div>
    </div>
  );
}

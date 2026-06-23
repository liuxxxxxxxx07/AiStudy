"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Check } from "lucide-react";
import { incrementReviewCount } from "@/lib/examEngine";

interface FlashCardProps {
  questions: Array<{
    id: string;
    content: string;
    answer?: string;
    subject?: string;
    tags: string[];
    difficulty: string;
    reviewCount: number;
  }>;
  onClose: () => void;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function FlashCard({ questions, onClose }: FlashCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const current = questions[currentIndex];
  const total = questions.length;

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    }
  }, [currentIndex, total]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const toggleFlip = useCallback(() => {
    setFlipped((f) => !f);
  }, []);

  const handleMarkReviewed = useCallback(() => {
    if (!current) return;
    incrementReviewCount(current.id);
    setReviewed((prev) => new Set(prev).add(current.id));
  }, [current]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleFlip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goPrev, goNext, toggleFlip]);

  if (total === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background border border-card-border rounded-xl w-full max-w-lg mx-4 p-12 text-center">
          <RotateCcw className="w-10 h-10 mx-auto mb-4 text-muted" />
          <p className="text-muted text-sm">No questions to review</p>
          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-card-border rounded-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted">
            {currentIndex + 1} / {total}
          </span>
          <div className="flex items-center gap-2">
            {current.subject && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {current.subject}
              </span>
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                difficultyColors[current.difficulty] || difficultyColors.medium
              }`}
            >
              {current.difficulty}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-hover-bg transition-colors text-muted"
          >
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>
        </div>

        <div
          className="relative cursor-pointer mb-6"
          style={{ perspective: "1000px" }}
          onClick={toggleFlip}
        >
          <div
            className={`transition-transform duration-500 w-full min-h-[200px]`}
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div
              className="border border-card-border rounded-xl p-6 flex items-center justify-center"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-sm text-foreground leading-relaxed text-center">
                {current.content}
              </p>
            </div>
            <div
              className="absolute inset-0 border border-card-border rounded-xl p-6 flex items-center justify-center"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <p className="text-sm text-foreground leading-relaxed text-center">
                {current.answer || "No answer provided"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg border border-card-border hover:bg-hover-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleMarkReviewed}
            disabled={reviewed.has(current.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-card-border hover:bg-hover-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {reviewed.has(current.id) ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {reviewed.has(current.id) ? "Reviewed" : "Mark as Reviewed"}
          </button>

          <button
            onClick={goNext}
            disabled={currentIndex === total - 1}
            className="p-2 rounded-lg border border-card-border hover:bg-hover-bg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
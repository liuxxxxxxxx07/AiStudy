"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, CheckCircle, XCircle, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import {
  generateExam,
  calculateExamResult,
  saveExamResult,
  getQuestionBank,
  incrementReviewCount,
} from "@/lib/examEngine";
import type { ExamConfig, ExamQuestion, ExamResult } from "@/lib/examEngine";

interface MockExamProps {
  onClose: () => void;
}

type Phase = "config" | "exam" | "result" | "review";

const DIFFICULTIES = ["easy", "medium", "hard", "mixed"] as const;

export default function MockExam({ onClose }: MockExamProps) {
  const [phase, setPhase] = useState<Phase>("config");
  const [difficulty, setDifficulty] = useState<ExamConfig["difficulty"]>("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const bank = getQuestionBank();
    const uniqueSubjects = [...new Set(bank.map((q) => q.subject).filter(Boolean))] as string[];
    setSubjects(uniqueSubjects);
  }, []);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const startExam = () => {
    const config: ExamConfig = { difficulty, questionCount, subjects: selectedSubjects, timeLimit };
    const generated = generateExam(config);
    if (generated.length === 0) return;
    setQuestions(generated);
    setUserAnswers(new Array(generated.length).fill(""));
    setCurrentIndex(0);
    setTimeRemaining(timeLimit * 60);
    setStartTime(Date.now());
    setPhase("exam");
  };

  const updateAnswer = (value: string) => {
    const updated = [...userAnswers];
    updated[currentIndex] = value;
    setUserAnswers(updated);
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const submitExam = () => {
    const graded = questions.map((q, i) => ({
      ...q,
      userAnswer: userAnswers[i],
    }));
    const examResult = calculateExamResult(graded, startTime);
    setResult(examResult);
    saveExamResult(examResult);
    setPhase("result");
    setShowConfirmSubmit(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentIndex < questions.length - 1) {
        goNext();
      }
    }
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setShowConfirmSubmit(true);
    }
  };

  useEffect(() => {
    if (phase !== "exam") return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          const graded = questions.map((q, i) => ({
            ...q,
            userAnswer: userAnswers[i],
          }));
          const examResult = calculateExamResult(graded, startTime);
          setResult(examResult);
          saveExamResult(examResult);
          setPhase("result");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, questions, startTime, userAnswers]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [currentIndex]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const scoreColor = (pct: number) => {
    if (pct >= 80) return { stroke: "#22c55e", bg: "bg-green-500/10", text: "text-green-500" };
    if (pct >= 50) return { stroke: "#eab308", bg: "bg-yellow-500/10", text: "text-yellow-500" };
    return { stroke: "#ef4444", bg: "bg-red-500/10", text: "text-red-500" };
  };

  const reviewWrongAnswers = () => {
    if (!result) return;
    const wrong = result.questions.filter((q) => !q.isCorrect);
    if (wrong.length === 0) return;
    setQuestions(wrong);
    setUserAnswers(wrong.map((q) => q.userAnswer));
    setReviewIndex(0);
    setPhase("review");
  };

  if (phase === "config") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background border border-card-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col mx-4 animate-fade-in">
          <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
            <span className="text-sm font-medium">Mock Exam</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-hover-bg text-muted transition-colors">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <label className="text-xs text-muted mb-2 block">Difficulty</label>
              <div className="flex gap-2 flex-wrap">
                {DIFFICULTIES.map((d) => (
                  <label
                    key={d}
                    className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                      difficulty === d
                        ? "border-foreground bg-foreground text-background"
                        : "border-input-border bg-input-bg text-foreground hover:border-foreground/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={d}
                      checked={difficulty === d}
                      onChange={() => setDifficulty(d)}
                      className="sr-only"
                    />
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted mb-2 block">Question Count ({questionCount})</label>
              <input
                type="range"
                min={5}
                max={30}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-foreground"
              />
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>5</span>
                <span>30</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted mb-2 block">Time Limit ({timeLimit} min)</label>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full accent-foreground"
              />
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>5</span>
                <span>120</span>
              </div>
            </div>

            {subjects.length > 0 && (
              <div>
                <label className="text-xs text-muted mb-2 block">Subjects</label>
                <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
                  {subjects.map((subject) => (
                    <label
                      key={subject}
                      className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                        selectedSubjects.includes(subject)
                          ? "border-foreground bg-foreground text-background"
                          : "border-input-border bg-input-bg text-foreground hover:border-foreground/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubjects.includes(subject)}
                        onChange={() => toggleSubject(subject)}
                        className="sr-only"
                      />
                      {subject}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={startExam}
              disabled={getQuestionBank().length === 0}
              className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Start Exam
            </button>

            {getQuestionBank().length === 0 && (
              <p className="text-[11px] text-muted text-center">No questions in the bank. Add some first.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "exam") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background border border-card-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4 animate-fade-in">
          <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Mock Exam</span>
              <span className="text-[11px] text-muted">
                Question {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Timer className="w-3.5 h-3.5 text-muted" />
              <span className={`font-mono ${timeRemaining <= 60 ? "text-red-500" : "text-muted"}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {questions[currentIndex]?.content}
            </div>

            <textarea
              ref={textareaRef}
              value={userAnswers[currentIndex] || ""}
              onChange={(e) => updateAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here..."
              className="w-full h-32 px-3 py-2 rounded-lg border border-input-border bg-input-bg text-foreground text-sm resize-none focus:outline-none focus:border-foreground transition-colors placeholder:text-muted"
            />

            <div className="flex items-center justify-between pt-2 border-t border-divider">
              <div className="flex gap-2">
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="px-3 py-1.5 rounded-lg border border-input-border bg-input-bg text-xs text-foreground hover:bg-hover-bg transition-colors disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={goNext}
                  disabled={currentIndex === questions.length - 1}
                  className="px-3 py-1.5 rounded-lg border border-input-border bg-input-bg text-xs text-foreground hover:bg-hover-bg transition-colors disabled:opacity-40"
                >
                  Next
                </button>
              </div>
              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="px-4 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>

        {showConfirmSubmit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setShowConfirmSubmit(false)}>
            <div className="bg-background border border-card-border rounded-xl p-6 mx-4 max-w-sm w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <p className="text-sm font-medium mb-2">Submit Exam?</p>
              <p className="text-xs text-muted mb-4">
                {questions.length - userAnswers.filter((a) => a.trim()).length} questions unanswered. This cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-3 py-1.5 rounded-lg border border-input-border bg-input-bg text-xs text-foreground hover:bg-hover-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitExam}
                  className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === "result" && result) {
    const sc = scoreColor(result.percentage);
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (result.percentage / 100) * circumference;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background border border-card-border rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col mx-4 animate-fade-in">
          <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
            <span className="text-sm font-medium">Exam Results</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-hover-bg text-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-center gap-5">
              <svg width="100" height="100" className="flex-shrink-0">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--input-border)" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={sc.stroke}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-700"
                />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="text-lg font-bold" fill="currentColor">
                  {result.percentage}%
                </text>
              </svg>
              <div>
                <p className="text-lg font-bold">
                  {result.score} / {result.total}
                </p>
                <p className="text-[11px] text-muted mt-1">
                  Time: {Math.floor(result.timeSpent / 60000)}m {Math.floor((result.timeSpent % 60000) / 1000)}s
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {result.questions.map((q, i) => (
                <div key={q.id}>
                  <button
                    onClick={() => setExpandedResult(expandedResult === i ? null : i)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-card-border bg-input-bg hover:bg-hover-bg transition-colors text-left"
                  >
                    {q.isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="flex-1 text-xs truncate">{q.content}</span>
                    {expandedResult === i ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted flex-shrink-0" />
                    )}
                  </button>
                  {expandedResult === i && (
                    <div className="ml-8 mt-1 p-3 rounded-lg bg-input-bg border border-card-border space-y-2 text-xs">
                      <div>
                        <span className="text-muted">Your answer: </span>
                        <span className={q.isCorrect ? "text-green-500" : "text-red-500"}>
                          {q.userAnswer || "(empty)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted">Correct answer: </span>
                        <span className="text-green-500">{q.correctAnswer}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-divider">
              <button
                onClick={reviewWrongAnswers}
                className="flex-1 py-2 rounded-lg border border-input-border bg-input-bg text-xs text-foreground hover:bg-hover-bg transition-colors"
              >
                Review Wrong Answers
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "review" && questions.length > 0) {
    const q = questions[reviewIndex];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-background border border-card-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col mx-4 animate-fade-in">
          <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
            <span className="text-sm font-medium">Wrong Answers Review</span>
            <span className="text-[11px] text-muted">
              {reviewIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{q.content}</div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                <span className="text-muted block mb-1">Your answer:</span>
                <span className="text-red-500">{q.userAnswer || "(empty)"}</span>
              </div>
              <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                <span className="text-muted block mb-1">Correct answer:</span>
                <span className="text-green-500">{q.correctAnswer}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-divider">
            <button
              onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
              disabled={reviewIndex === 0}
              className="px-3 py-1.5 rounded-lg border border-input-border bg-input-bg text-xs text-foreground hover:bg-hover-bg transition-colors disabled:opacity-40"
            >
              Previous
            </button>
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-foreground transition-colors">
              Close
            </button>
            <button
              onClick={() => setReviewIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={reviewIndex === questions.length - 1}
              className="px-3 py-1.5 rounded-lg border border-input-border bg-input-bg text-xs text-foreground hover:bg-hover-bg transition-colors disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
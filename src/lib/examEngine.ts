export interface Question {
  id: string;
  content: string;
  answer?: string;
  subject?: string;
  course?: string;
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  mode: string;
  source: string;
  createdAt: number;
  reviewCount: number;
  lastReviewed?: number;
}

export interface ExamConfig {
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionCount: number;
  subjects: string[];
  timeLimit: number;
}

export interface ExamQuestion {
  id: string;
  content: string;
  userAnswer: string;
  correctAnswer: string;
  subject?: string;
  difficulty: string;
  isCorrect: boolean | null;
}

export interface ExamResult {
  questions: ExamQuestion[];
  score: number;
  total: number;
  percentage: number;
  startTime: number;
  endTime: number;
  timeSpent: number;
}

const STORAGE_KEY = "ai-study-question-bank";
const EXAM_RESULTS_KEY = "ai-study-exam-results";

export function getQuestionBank(): Question[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuestionBank(questions: Question[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
  } catch {}
}

export function addQuestion(q: Omit<Question, "id" | "createdAt" | "reviewCount" | "lastReviewed">): Question {
  const bank = getQuestionBank();
  const newQ: Question = {
    ...q,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: Date.now(),
    reviewCount: 0,
    lastReviewed: undefined,
  };
  bank.push(newQ);
  saveQuestionBank(bank);
  return newQ;
}

export function removeQuestion(id: string): void {
  const bank = getQuestionBank().filter((q) => q.id !== id);
  saveQuestionBank(bank);
}

export function getQuestionsBySubject(subject: string): Question[] {
  return getQuestionBank().filter((q) => q.subject === subject);
}

export function getQuestionsByTag(tag: string): Question[] {
  return getQuestionBank().filter((q) => q.tags.includes(tag));
}

export function getQuestionsByTimeRange(start: number, end: number): Question[] {
  return getQuestionBank().filter((q) => q.createdAt >= start && q.createdAt <= end);
}

export function searchQuestions(query: string): Question[] {
  const bank = getQuestionBank();
  const lower = query.toLowerCase();
  return bank.filter(
    (q) =>
      q.content.toLowerCase().includes(lower) ||
      q.answer?.toLowerCase().includes(lower) ||
      q.course?.toLowerCase().includes(lower) ||
      q.subject?.toLowerCase().includes(lower) ||
      q.tags.some((t) => t.toLowerCase().includes(lower))
  );
}

export function generateExam(config: ExamConfig): ExamQuestion[] {
  let pool = getQuestionBank();

  if (config.subjects.length > 0) {
    pool = pool.filter((q) => config.subjects.includes(q.subject || ""));
  }

  if (config.difficulty !== "mixed") {
    pool = pool.filter((q) => q.difficulty === config.difficulty);
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, config.questionCount);

  return selected.map((q) => ({
    id: q.id,
    content: q.content,
    userAnswer: "",
    correctAnswer: q.answer || "",
    subject: q.subject,
    difficulty: q.difficulty,
    isCorrect: null,
  }));
}

export function calculateExamResult(
  questions: ExamQuestion[],
  startTime: number
): ExamResult {
  let correct = 0;
  const graded = questions.map((q) => {
    const isCorrect = q.userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    if (isCorrect) correct++;
    return { ...q, isCorrect };
  });

  return {
    questions: graded,
    score: correct,
    total: questions.length,
    percentage: Math.round((correct / questions.length) * 100),
    startTime,
    endTime: Date.now(),
    timeSpent: Date.now() - startTime,
  };
}

export function saveExamResult(result: ExamResult): void {
  try {
    const results = getExamResults();
    results.unshift(result);
    localStorage.setItem(EXAM_RESULTS_KEY, JSON.stringify(results.slice(0, 50)));
  } catch {}
}

export function getExamResults(): ExamResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EXAM_RESULTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function incrementReviewCount(id: string): void {
  const bank = getQuestionBank();
  const q = bank.find((item) => item.id === id);
  if (q) {
    q.reviewCount++;
    q.lastReviewed = Date.now();
    saveQuestionBank(bank);
  }
}
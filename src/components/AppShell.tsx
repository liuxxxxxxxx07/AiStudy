"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, StopCircle, PanelLeft, Coins, X, Sparkles } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { useRouter } from "next/navigation";
import MessageBubble, { Message } from "./MessageBubble";
import Sidebar, { AppMode } from "./Sidebar";
import ImageUploader from "./ImageUploader";
import FileUploader, { ParsedFile } from "./FileUploader";
import QuestionBank from "./QuestionBank";
import KnowledgeBasePage from "./KnowledgeBasePage";
import MockExam from "./MockExam";
import SearchPanel from "./SearchPanel";
import FlashCard from "./FlashCard";
import PersonalWiki from "./PersonalWiki";
import IntensitySelector from "./IntensitySelector";
import UpgradeModal from "./UpgradeModal";
import ProfileSettings from "./ProfileSettings";
import { SYSTEM_PROMPTS } from "@/lib/prompts";
import { INTENSITY_MODELS, VISION_MODEL, MODE_COST, MODEL_CREDIT_COST, MEDIUM_MODELS, HARD_MODELS, EXTREME_MERGE_MODEL, CROSS_VALIDATION_MODELS, TIER_ACCESS } from "@/lib/puter";
import { addQuestion, getQuestionBank, Question } from "@/lib/examEngine";
import { getCreditData, getAvailableCredits, deductCredits, hasEnoughCredits } from "@/lib/credits";
import { createCheckoutSession } from "@/lib/payment-client";
import { analyzeQuestion } from "@/lib/questionAnalyzer";
import { addKnowledgeEntry } from "@/lib/knowledgeBase";
import { saveToBackend, loadFromBackend } from "@/lib/backend";
import { chatCompletion, streamCompletion } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  mode: AppMode;
  createdAt: number;
}

const MODE_PROMPTS: Record<AppMode, string> = {
  solver: SYSTEM_PROMPTS.solver,
  visualizer: SYSTEM_PROMPTS.visualizer,
  chat: SYSTEM_PROMPTS.chat,
};

const TIER_NAMES: Record<string, string> = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
  "pro+": "Pro+",
};

const tModeLabel: Record<string, string> = {
  solver: "Solver",
  visualizer: "Visualizer",
  chat: "Chat",
};

export default function AppShell({ user, onLogout }: { user: Record<string, unknown> | null; onLogout: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const userId = (user?.id as string) || (user?.username as string) || "anonymous";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<AppMode>("chat");
  const [intensity, setIntensity] = useState("auto");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [wikiOpen, setWikiOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const [creditTier, setCreditTier] = useState("free");
  const [dbLoaded, setDbLoaded] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentConv = conversations.find((c) => c.id === currentId);
  const messages = currentConv?.messages || [];
  const activeMode = currentConv?.mode || mode;
  const isPaidTier = creditTier !== "free";
  const userName = (user?.username as string) || "User";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const refreshCredits = useCallback(() => {
    setCredits(getAvailableCredits(userId));
    setCreditTier(getCreditData(userId).tier);
  }, [userId]);

  const persistState = useCallback(async (convs: Conversation[], cId: string | null, m: AppMode) => {
    try {
      await saveToBackend(userId, {
        conversations: convs.map(c => ({
          id: c.id,
          title: c.title,
          messages: c.messages,
          mode: c.mode,
          createdAt: c.createdAt,
        })),
        credits: getCreditData(userId),
      });
    } catch {}
  }, [userId]);

  const debouncedPersist = useCallback((convs: Conversation[], cId: string | null, m: AppMode) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persistState(convs, cId, m), 2000);
  }, [persistState]);

  useEffect(() => {
    if (!dbLoaded) return;
    debouncedPersist(conversations, currentId, mode);
  }, [conversations, currentId, mode, dbLoaded, debouncedPersist]);

  useEffect(() => {
    const load = async () => {
      refreshCredits();
      if (userId !== "anonymous") {
        try {
          const data = await loadFromBackend(userId);
          if (data && data.conversations) {
            setConversations(data.conversations as Conversation[]);
            if (data.conversations.length > 0) {
              setCurrentId(data.conversations[0].id);
            }
          }
        } catch {}
      }
      setDbLoaded(true);
      setShowCreditPopup(true);
      setTimeout(() => setShowCreditPopup(false), 5000);
    };
    load();
  }, [userId, refreshCredits]);

  const switchMode = useCallback((targetMode: AppMode) => {
    if (currentId) {
      setConversations((prev) => prev.map((c) => c.id === currentId ? { ...c, mode: targetMode } : c));
    }
    setMode(targetMode);
  }, [currentId]);

  const createConversation = useCallback((targetMode: AppMode) => {
    const id = Date.now().toString();
    setConversations((prev) => [
      { id, title: "新对话", messages: [], mode: targetMode, createdAt: Date.now() },
      ...prev,
    ]);
    setCurrentId(id);
    setMode(targetMode);
    setInput("");
    setImages([]);
    setFiles([]);
    setClearTrigger((t) => t + 1);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentId === id) {
      setCurrentId(conversations.find((c) => c.id !== id)?.id || null);
    }
  }, [currentId, conversations]);

  const selectConversation = useCallback((id: string) => {
    setCurrentId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv) setMode(conv.mode);
  }, [conversations]);

  const handleSaveToBank = useCallback(async (q: string, a: string) => {
    refreshCredits();
    const analysis = await analyzeQuestion(q);
    addQuestion({
      content: q, answer: a, subject: analysis.subject, course: analysis.course,
      tags: analysis.tags, difficulty: analysis.difficulty, mode: activeMode, source: "user",
    });
  }, [activeMode, refreshCredits]);

  const handleSaveToKnowledgeBase = useCallback((title: string, content: string, type: "mermaid" | "note" | "summary" | "visualization") => {
    addKnowledgeEntry({ title, content, type, tags: [], course: "", subject: "", sourceMode: activeMode });
  }, [activeMode]);

  const getEffectiveModel = useCallback((intensityVal: string, creditTierVal: string): string => {
    if (intensityVal === "auto") {
      if (creditTierVal !== "free") return INTENSITY_MODELS.medium.id;
      return INTENSITY_MODELS.easy.id;
    }
    const allowed = TIER_ACCESS[creditTierVal] || TIER_ACCESS.free;
    if (!allowed.includes(intensityVal)) {
      return INTENSITY_MODELS.easy.id;
    }
    if (intensityVal === "medium") {
      return MEDIUM_MODELS[Math.floor(Math.random() * MEDIUM_MODELS.length)];
    }
    if (intensityVal === "hard") {
      return HARD_MODELS[Math.floor(Math.random() * HARD_MODELS.length)];
    }
    return INTENSITY_MODELS[intensityVal]?.id || INTENSITY_MODELS.easy.id;
  }, []);

  const handleImageWithVisionModel = useCallback(async (imageDataUrls: string[], userText: string): Promise<string> => {
    const parts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    if (userText) parts.push({ type: "text", text: userText });
    for (const img of imageDataUrls) {
      parts.push({ type: "image_url", image_url: { url: img } });
    }
    const response = await chatCompletion(
      [
        { role: "system", content: "Analyze the image(s) provided. If there is text, extract it. If it's a diagram or formula, describe it in detail. Respond in Chinese if the user writes in Chinese." },
        { role: "user", content: parts },
      ],
      { model: VISION_MODEL },
      userId
    );
    return response || "无法识别图片内容";
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const content = text || input.trim();
    if ((!content && images.length === 0 && files.length === 0) || isLoading) return;

    let convId = currentId;
    let convMode = mode;
    const isNewConv = !convId;

    if (!convId) {
      convId = Date.now().toString();
      convMode = mode;
      const placeholderTitle = t("chat.newConversation");
      setConversations((prev) => [
        { id: convId!, title: placeholderTitle, messages: [], mode: convMode, createdAt: Date.now() },
        ...prev,
      ]);
      setCurrentId(convId);
    }

    let processedContent = content;

    if (images.length > 0) {
      setStatusText(t("chat.recognizing"));
      try {
        const description = await handleImageWithVisionModel(images, content);
        processedContent = description;
      } catch {
        processedContent = content;
      }
    }

    let resolvedIntensity = intensity;
    if (intensity === "auto" && (processedContent || content)) {
      try {
        const analysis = await analyzeQuestion(processedContent || content);
        const allowedLevels = TIER_ACCESS[creditTier] || TIER_ACCESS.free;
        const difficultyMap: Record<string, string> = { easy: "easy", medium: "medium", hard: "hard" };
        const preferred = difficultyMap[analysis.difficulty] || "easy";
        resolvedIntensity = allowedLevels.includes(preferred) ? preferred : allowedLevels[allowedLevels.length - 1];
      } catch {}
    }

    const autoFee = intensity === "auto" ? (MODEL_CREDIT_COST["auto"] || 2) : 0;
    const cost = (MODEL_CREDIT_COST[resolvedIntensity] || 1) + autoFee + (MODE_COST[activeMode] || 1);
    refreshCredits();
    if (!hasEnoughCredits(userId, cost)) {
      setShowUpgrade(true);
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: processedContent,
      images: images.length > 0 ? [...images] : undefined,
      files: files.length > 0 ? [...files] : undefined,
    };

    setConversations((prev) =>
      prev.map((c) => c.id === convId ? { ...c, messages: [...c.messages, userMessage] } : c)
    );

    setInput("");
    setImages([]);
    setFiles([]);
    setClearTrigger((t) => t + 1);
    setIsLoading(true);
    setStatusText(t("chat.thinking"));

    setConversations((prev) =>
      prev.map((c) => c.id === convId ? { ...c, messages: [...c.messages, { role: "assistant" as const, content: "" }] } : c)
    );

    try {
      abortRef.current = new AbortController();

      const effectiveModel = getEffectiveModel(resolvedIntensity, creditTier);
      const apiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: MODE_PROMPTS[convMode] },
        { role: "user", content: processedContent || content },
      ];

      const isExtremeMode = resolvedIntensity === "extreme" && isPaidTier;
      let finalContent = "";

      if (isExtremeMode) {
        const models = CROSS_VALIDATION_MODELS;
        const responses: string[] = [];

        for (let i = 0; i < models.length; i++) {
          setStatusText(t("chat.crossValidating", { n: i + 1, total: models.length }));
          if (abortRef.current?.signal.aborted) break;
          const text = await chatCompletion(apiMessages, { model: models[i], signal: abortRef.current?.signal }, userId);
          responses.push(text || "");
        }

        setStatusText(t("chat.merging"));
        const responseList = responses.map((r, i) => `Response ${i + 1} (${models[i]}):\n${r}`).join("\n\n");
        const mergeStream = streamCompletion(
          [
            { role: "system", content: "You are a result merger. Combine the following AI responses into one comprehensive, coherent answer. Remove duplicates, highlight consensus, and note any differences." },
            { role: "user", content: `${responseList}\n\nCombine these into one answer:` },
          ],
          { model: EXTREME_MERGE_MODEL, signal: abortRef.current?.signal },
          userId
        );
        for await (const part of mergeStream) {
          if (abortRef.current?.signal.aborted) break;
          if (part.text) finalContent += part.text;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, messages: [...c.messages.slice(0, -1), { role: "assistant" as const, content: finalContent, meta: { intensity: resolvedIntensity, model: "cross-validation" } }] }
: c
            )
          );
        }
      } else if (resolvedIntensity === "hard" && isPaidTier) {
        setStatusText(t("chat.aiResponding"));
        const stream = streamCompletion(apiMessages, { model: effectiveModel, signal: abortRef.current?.signal }, userId);
        let accumulated = "";
        let reasoningAccumulated = "";
        for await (const part of stream) {
          if (abortRef.current?.signal.aborted) break;
          if (part.text) accumulated += part.text;
          if (part.reasoning) reasoningAccumulated += part.reasoning;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, messages: [...c.messages.slice(0, -1), { role: "assistant" as const, content: accumulated, reasoning: reasoningAccumulated || undefined, meta: { intensity: resolvedIntensity, model: effectiveModel } }] }
                : c
            )
          );
        }
        finalContent = accumulated;
      } else {
        setStatusText(t("chat.aiResponding"));
        const stream = streamCompletion(apiMessages, { model: effectiveModel, signal: abortRef.current?.signal }, userId);
        let accumulated = "";
        let reasoningAccumulated = "";
        for await (const part of stream) {
          if (abortRef.current?.signal.aborted) break;
          if (part.text) accumulated += part.text;
          if (part.reasoning) reasoningAccumulated += part.reasoning;
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, messages: [...c.messages.slice(0, -1), { role: "assistant" as const, content: accumulated, reasoning: reasoningAccumulated || undefined, meta: { intensity: resolvedIntensity, model: effectiveModel } }] }
                : c
            )
          );
        }
        finalContent = accumulated;
      }

      if (finalContent) {
        deductCredits(userId, cost);
        refreshCredits();
      }

      if (convMode === "visualizer" && finalContent.includes("```mermaid")) {
        handleSaveToKnowledgeBase(content.slice(0, 50), finalContent, "visualization");
      }

      if (isNewConv && content.length > 5) {
        try {
          const generatedTitle = await chatCompletion(
            [{ role: "user", content: `Generate a concise title (max 6 words, in Chinese if the user's message is Chinese) for this conversation based on this first user message: "${content}". Return ONLY the title, no quotes or extra text.` }],
            { model: VISION_MODEL, signal: abortRef.current?.signal },
            userId
          );
          if (generatedTitle) {
            const cleanTitle = generatedTitle.replace(/^["']|["']$/g, "").trim().slice(0, 40);
            setConversations((prev) =>
              prev.map((c) => c.id === convId ? { ...c, title: cleanTitle } : c)
            );
          }
        } catch {}
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, messages: [...c.messages.slice(0, -1), { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` }] }
            : c
        )
      );
    } finally {
      setIsLoading(false);
      setStatusText(null);
      abortRef.current = null;
    }
  }, [input, images, files, isLoading, currentId, mode, intensity, conversations, userId, activeMode, refreshCredits, getEffectiveModel, handleImageWithVisionModel, isPaidTier, creditTier, handleSaveToKnowledgeBase]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setStatusText(null);
  }, []);

  const handleSaveLast = useCallback(() => {
    if (!currentConv) return;
    const pairs: { q: string; a: string }[] = [];
    for (let i = 0; i < currentConv.messages.length - 1; i++) {
      const cur = currentConv.messages[i];
      const next = currentConv.messages[i + 1];
      if (cur.role === "user" && next.role === "assistant" && next.content) {
        pairs.push({ q: cur.content, a: next.content });
      }
    }
    const last = pairs[pairs.length - 1];
    if (last) handleSaveToBank(last.q, last.a);
  }, [currentConv, handleSaveToBank]);

  const handleUpgrade = useCallback(() => router.push("/pricing"), [router]);

  const handleUpgradeSelect = useCallback(async (tierId: string) => {
    setShowUpgrade(false);
    try {
      const checkout = await createCheckoutSession({
        tier: tierId,
        userId,
        userEmail: user?.email as string | undefined,
        provider: "paddle",
      });
      if (checkout.url) window.location.href = checkout.url;
    } catch {
      setShowUpgrade(true);
    }
  }, [userId, user?.email]);

  const allQuestions: Question[] = getQuestionBank();

  return (
    <div className="flex h-full">
      {sidebarOpen && (
        <Sidebar
          conversations={conversations}
          currentId={currentId}
          credits={credits}
          tier={creditTier}
          userName={userName}
          userId={userId}
          onSelect={selectConversation}
          onDelete={deleteConversation}
          onCollapse={() => setSidebarOpen(false)}
          onOpenBank={() => setBankOpen(true)}
          onOpenKnowledgeBase={() => setKbOpen(true)}
          onOpenMockExam={() => setExamOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenFlashCards={() => setFlashOpen(true)}
          onOpenWiki={() => setWikiOpen(true)}
          onLogout={onLogout}
          onUpgrade={handleUpgrade}
          onOpenProfile={() => setShowProfile(true)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 py-2.5 border-b border-divider bg-background">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded hover:bg-hover-bg transition-colors text-muted mr-3"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex-1 flex items-center justify-center">
            <div className="inline-flex items-center bg-input-bg border border-input-border rounded-full p-0.5">
              {(["solver", "visualizer", "chat"] as AppMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-4 py-1 rounded-full text-xs font-medium transition-all ${
                    activeMode === m ? "bg-tab-active-bg text-tab-active-text" : "text-tab-inactive-text hover:text-foreground"
                  }`}
                >
                  {m === "solver" ? t("mode.solver") : m === "visualizer" ? t("mode.visualizer") : t("mode.chat")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/pricing")}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-input-bg border border-input-border text-muted hover:text-foreground transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              {t("chat.plans")}
            </button>
            {currentConv && messages.length > 0 && (
              <button
                onClick={handleSaveLast}
                className="text-[11px] px-2 py-1 rounded-md bg-input-bg border border-input-border text-muted hover:text-foreground transition-colors"
              >
                {t("chat.saveAll")}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 animate-fade-in">
              <div className="text-center mb-8">
                <h1 className="font-serif-body text-2xl font-bold tracking-tight mb-1">AI Study</h1>
                <p className="text-muted text-[13px]">STEM Learning Engine</p>
              </div>
              <div className="flex gap-3">
                {([
                  { mode: "solver" as AppMode, icon: "📐", label: "Solver", desc: "Step-by-step problem solving" },
                  { mode: "visualizer" as AppMode, icon: "📊", label: "Visualizer", desc: "Generate diagrams & charts" },
                  { mode: "chat" as AppMode, icon: "💬", label: "Chat", desc: "Free-form Q&A" },
                ]).map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => createConversation(item.mode)}
                    className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl border border-input-border hover:border-foreground/30 hover:bg-hover-bg transition-all group w-36"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[13px] font-medium">{item.label}</span>
                    <span className="text-[11px] text-muted text-center leading-snug">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-6 px-4 space-y-6">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  message={msg}
                  onSaveToBank={msg.role === "assistant" && msg.content ? (q) => handleSaveToBank(q, msg.content) : undefined}
                  onSimilarQuestions={msg.role === "assistant" && msg.content ? () => {} : undefined}
                />
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-3xl mx-auto w-full">
                  <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium text-muted">AI</span>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    {statusText ? (
                      <span className="text-[12px] text-muted animate-pulse">{statusText}</span>
                    ) : (
                      <>
                        <div className="w-1 h-1 rounded-full bg-muted animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-muted animate-pulse [animation-delay:200ms]" />
                        <div className="w-1 h-1 rounded-full bg-muted animate-pulse [animation-delay:400ms]" />
                      </>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-divider px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center justify-between mb-1.5">
            <IntensitySelector value={intensity} onChange={setIntensity} isPaidTier={isPaidTier} onUpgrade={handleUpgrade} />
            <button
              onClick={handleUpgrade}
              className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors"
            >
              <Coins className="w-3 h-3 text-amber-500" />
              <span className={credits <= 0 ? "text-red-500 font-semibold" : ""}>
                {credits}
              </span>
              <span className="text-[10px]">{TIER_NAMES[creditTier] || "Free"}</span>
            </button>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-input-bg border border-input-border rounded-xl px-3 py-2.5 focus-within:border-foreground/30 transition-colors">
              <ImageUploader onImagesChange={setImages} clearTrigger={clearTrigger} />
              <FileUploader onFilesChange={setFiles} clearTrigger={clearTrigger} />
              <TextareaAutosize
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  activeMode === "solver" ? t("chat.solverPlaceholder")
                  : activeMode === "visualizer" ? t("chat.visualizerPlaceholder")
                  : t("chat.placeholder")
                }
                className="flex-1 bg-transparent resize-none outline-none text-foreground placeholder:text-muted min-h-[22px] max-h-[200px] text-[14px]"
                maxRows={8}
                disabled={isLoading}
              />
              {isLoading ? (
                <button onClick={stopGeneration} className="p-1.5 rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors flex-shrink-0">
                  <StopCircle className="w-4 h-4 text-foreground" />
                </button>
              ) : (
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() && images.length === 0 && files.length === 0}
                  className="p-1.5 rounded-lg bg-foreground text-background transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <QuestionBank open={bankOpen} onClose={() => setBankOpen(false)} />
      {kbOpen && <KnowledgeBasePage onClose={() => setKbOpen(false)} />}
      {examOpen && <MockExam onClose={() => setExamOpen(false)} />}
      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} onSelectQuestion={() => setSearchOpen(false)} />}
      {flashOpen && <FlashCard questions={allQuestions} onClose={() => setFlashOpen(false)} />}
      {wikiOpen && <PersonalWiki onClose={() => setWikiOpen(false)} />}

      {showCreditPopup && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-card border border-input-border rounded-xl px-5 py-4 shadow-lg">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-sm font-medium">{t("credits.monthlyQuota")}</div>
                <div className="text-xs text-muted">{t("credits.remaining", { n: credits })} · {t("credits.plan", { tier: TIER_NAMES[creditTier] || "Free" })}</div>
                {credits === 0 && (
                  <button onClick={() => { setShowCreditPopup(false); setShowUpgrade(true); }} className="text-xs text-amber-500 hover:text-amber-400 mt-1 underline">
                    {t("credits.upgradeForMore")}
                  </button>
                )}
              </div>
              <button onClick={() => setShowCreditPopup(false)} className="text-muted hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpgrade && <UpgradeModal onBack={() => setShowUpgrade(false)} onSelect={handleUpgradeSelect} userId={userId} userEmail={user?.email as string | undefined} currentTier={creditTier} />}
      {showProfile && (
        <ProfileSettings
          userId={userId}
          userName={userName}
          userEmail={user?.email as string | undefined}
          credits={credits}
          tier={creditTier}
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  );
}
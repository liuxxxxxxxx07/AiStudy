"use client";

import {
  Check, ArrowLeft, Sparkles, ChevronDown, HelpCircle,
  CreditCard, Shield, Clock, Loader2,
  Zap, Infinity, Star, Rocket, Coins,
  BookOpen, Library, Network, Layers, ClipboardCheck, Search,
  GraduationCap, BrainCircuit, FileText
} from "lucide-react";
import { useState, useCallback } from "react";

interface PaymentPlansProps {
  onBack: () => void;
  onSelect?: (tier: string) => void;
  userId?: string;
  userEmail?: string;
  currentTier?: string;
}

const TIERS = [
  {
    name: "Plus",
    id: "plus" as const,
    price: { monthly: 14.99, yearly: 11.99 },
    yearlySaving: "20%",
    desc: "For daily learners — AI study tools with expanded capacity",
    icon: Star,
    credits: 200,
    features: [
      { text: "200 AI credits per month", included: true },
      { text: "Vision recognition + Auto routing", included: true },
      { text: "Support: DeepSeek v4-pro, Qwen 3.7-Max + GLM 5.2", included: true },
      { text: "Knowledge Base: 100 entries", included: true },
      { text: "Question Bank: 100 Q&A pairs", included: true },
      { text: "Personal Wiki: 100 entries", included: true },
      { text: "Auto Flashcards, Mock Exam, Search", included: true },
      { text: "Unlimited file parsing (PDF, DOC, PPTX)", included: true },
      { text: "Hard models (GPT-5.5 + Claude Opus 4.8)", included: false },
      { text: "Extreme 7-model cross-validation", included: false },
    ],
  },
  {
    name: "Pro",
    id: "pro" as const,
    price: { monthly: 29.99, yearly: 23.99 },
    yearlySaving: "20%",
    desc: "For power users — unlock the full AI stack + all study tools",
    icon: Zap,
    popular: true,
    credits: 2000,
    features: [
      { text: "2,000 AI credits per month", included: true },
      { text: "All models: Auto → Light → Medium → Hard → Extreme", included: true },
      { text: "Hard: GPT-5.5 + Claude Opus 4.8 (60 cr)", included: true },
      { text: "Extreme: 7-model cross-validation (1400 cr)", included: true },
      { text: "Knowledge Base: unlimited entries", included: true },
      { text: "Question Bank: unlimited Q&A pairs", included: true },
      { text: "Personal Wiki: unlimited entries + graph view", included: true },
      { text: "Auto Flashcards + Mock Exam + Deep Search", included: true },
      { text: "Unlimited file parsing (all formats)", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    name: "Pro+",
    id: "pro+" as const,
    price: { monthly: 99.99, yearly: 79.99 },
    yearlySaving: "20%",
    desc: "For heavy users — maximum throughput + premium features",
    icon: Infinity,
    credits: 10000,
    features: [
      { text: "10,000 AI credits per month", included: true },
      { text: "All models + latest preview models", included: true },
      { text: "Extreme 7-model cross-validation (1400 cr)", included: true },
      { text: "All study tools: unlimited storage", included: true },
      { text: "Knowledge Base + Wiki + Question Bank", included: true },
      { text: "Auto Flashcards + Mock Exam + Search", included: true },
      { text: "Unlimited file parsing (all formats)", included: true },
      { text: "Priority support + SLA guarantee", included: true },
      { text: "Early feature access", included: true },
    ],
  },
];

const CORE_FEATURES = [
  {
    icon: BookOpen,
    title: "Knowledge Base",
    desc: "Store notes, summaries, file extracts, and Mermaid diagrams. Auto-extract key info from uploaded textbooks.",
    detail: "Your personal study repository — organize by course, subject, and tags. Supports rich Markdown + LaTeX.",
  },
  {
    icon: Library,
    title: "Question Bank",
    desc: "Save every Q&A from AI responses. Search, filter by subject/difficulty, and export for review.",
    detail: "Auto-saved with metadata (subject, course, difficulty). Built-in full-text search across all entries.",
  },
  {
    icon: Network,
    title: "Personal Wiki",
    desc: "Build an interconnected knowledge graph of theorems, definitions, formulas, and concepts.",
    detail: "Visual graph view shows how concepts link together. Auto-link detection between related entries.",
  },
  {
    icon: Layers,
    title: "Auto Flashcards",
    desc: "AI-generated flashcards from your Question Bank. Flip, review, and track progress.",
    detail: "Keyboard shortcuts for fast review. Color-coded by difficulty. Tracks review count per card.",
  },
  {
    icon: ClipboardCheck,
    title: "Mock Exam",
    desc: "Simulate exams with timed tests. Configurable difficulty, question count, and subject filters.",
    detail: "Real-time timer, auto-submit on expiry. Score breakdown, per-question review, wrong answer analysis.",
  },
  {
    icon: Search,
    title: "Deep Search",
    desc: "Full-text search across your entire study ecosystem — questions, wiki entries, knowledge base.",
    detail: "Filter by subject, difficulty, tags, and time range. Instantly jump from results to the full entry.",
  },
];

const FAQS = [
  { q: "What makes AI Study different from ChatGPT?", a: "AI Study is purpose-built for STEM learning. Beyond AI chat, you get a complete study ecosystem: Knowledge Base to store what you learn, Question Bank to save every Q&A, Personal Wiki to connect concepts, Flashcards for spaced repetition, Mock Exams to test yourself, and Deep Search to find anything instantly. It's not just an AI — it's your personal study engine." },
  { q: "How do AI credits work?", a: "Each AI request costs credits based on intensity (Auto=2 analysis + model cost, Light=3, Balanced=8, Deep=60, Extreme=1400) plus a mode fee (Solver=2, Visualizer=1, Chat=0). Credits reset monthly on the 1st. Study tools (Knowledge Base, Wiki, Question Bank, Flashcards, Mock Exam) use storage space, not credits." },
  { q: "What models can I access?", a: "Free tier: Auto + Light (DeepSeek v4-pro). Plus: adds Balanced (Qwen 3.7-Max + GLM 5.2). Pro: unlocks Hard (GPT-5.5 + Claude Opus 4.8) and Extreme (7-model cross-validation). Pro+: latest preview models too." },
  { q: "Is there storage or entry limits?", a: "Free tier: 10 entries total across Knowledge Base, Question Bank, and Wiki. Plus: 100 entries each. Pro and Pro+: unlimited entries across all study tools." },
  { q: "What payment methods do you accept?", a: "Major credit cards (Visa, Mastercard), PayPal, Alipay, and WeChat Pay. All transactions are securely processed." },
  { q: "Is there a free trial?", a: "All paid plans include a 7-day free trial. You won't be charged until the trial period ends. Cancel anytime during the trial at no cost." },
  { q: "Can I use it for commercial purposes?", a: "Yes, all paid plans allow commercial use. Pro+ is recommended for teams and commercial applications with SLA support." },
];

const COMPARISON_ROWS = [
  ["Monthly AI credits", "200", "2,000", "10,000"],
  ["Vision recognition", "✓", "✓", "✓"],
  ["Auto routing (by difficulty)", "✓", "✓", "✓"],
  ["DeepSeek v4-pro (Light)", "✓", "✓", "✓"],
  ["Qwen 3.7-Max + GLM 5.2 (Medium)", "✓", "✓", "✓"],
  ["GPT-5.5 + Claude Opus 4.8 (Hard)", "—", "✓", "✓"],
  ["Extreme 7-model cross-validation", "—", "✓", "✓"],
  ["Knowledge Base entries", "100", "Unlimited", "Unlimited"],
  ["Question Bank Q&A pairs", "100", "Unlimited", "Unlimited"],
  ["Personal Wiki entries", "100", "Unlimited", "Unlimited"],
  ["Auto Flashcards", "✓", "✓", "✓"],
  ["Mock Exam", "✓", "✓", "✓"],
  ["Deep Search", "✓", "✓", "✓"],
  ["File parsing (PDF, DOC, PPTX, TXT)", "✓", "Unlimited", "Unlimited"],
  ["Priority support", "—", "✓", "✓ + SLA"],
  ["Early features", "—", "—", "✓"],
];

export default function PaymentPlans({ onBack, onSelect, userId, userEmail, currentTier }: PaymentPlansProps) {
  const [yearly, setYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSelect = useCallback(async (tierId: string) => {
    setLoadingTier(tierId);
    await new Promise((r) => setTimeout(r, 800));
    onSelect?.(tierId);
    setLoadingTier(null);
  }, [onSelect]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-divider bg-background/80 backdrop-blur-sm z-10 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-base text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-16">

          {/* ── Hero ── */}
          <section className="text-center space-y-5 pt-4">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-foreground/5 border border-divider text-sm text-muted font-medium">
              <GraduationCap className="w-3.5 h-3.5" />
              AI Study — Your Personal STEM Learning Engine
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Choose your plan
            </h1>
            <p className="text-base text-muted max-w-xl mx-auto leading-relaxed">
              Beyond AI answers — get a complete study ecosystem with Knowledge Base, Wiki, Flashcards, and Mock Exams.
              <br />
              <span className="text-sm text-foreground/60">Start with a 7-day free trial. No risk, cancel anytime.</span>
            </p>
          </section>

          {/* ── Billing Toggle ── */}
          <section className="flex justify-center">
            <div className="inline-flex items-center gap-1 bg-foreground/5 border border-divider rounded-lg p-0.5">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                  !yearly
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                  yearly
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                Yearly
                <span className="ml-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Save ~25%
                </span>
              </button>
            </div>
          </section>

          {/* ── Plan Cards ── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {TIERS.map((tier) => {
              const price = yearly ? tier.price.yearly : tier.price.monthly;
              const period = yearly ? "/month, billed yearly" : "/month";
              const isCurrent = currentTier === tier.id;
              const isLoading = loadingTier === tier.id;
              const Icon = tier.icon;

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                    tier.popular
                      ? "border-foreground/20 bg-gradient-to-b from-card to-background shadow-xl shadow-foreground/5 ring-1 ring-foreground/5"
                      : "border-divider bg-card/50 hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/5"
                  } ${isCurrent ? "opacity-60 pointer-events-none" : ""}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-semibold px-4 py-1 rounded-full z-10 shadow-sm">
                      Most popular
                    </div>
                  )}

                  <div className="p-7 pb-0">
                    <div className="w-11 h-11 rounded-xl bg-foreground/5 border border-divider flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="text-xl font-bold">{tier.name}</h3>
                    <p className="text-sm text-muted mt-1 leading-relaxed">{tier.desc}</p>

                    <div className="mt-6 flex items-baseline gap-0.5">
                      <span className="text-4xl font-bold tracking-tight">${price.toFixed(2)}</span>
                      <span className="text-sm text-muted">{period}</span>
                    </div>
                    {yearly && (
                      <div className="mt-1.5 flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        Save {tier.yearlySaving}
                      </div>
                    )}

                    <div className="mt-5 flex items-center gap-2 py-2.5 px-3.5 rounded-lg bg-foreground/[0.03] border border-divider/50">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-semibold text-foreground">{tier.credits.toLocaleString()} AI credits</span>
                      <span className="text-xs text-muted ml-auto">/month</span>
                    </div>
                  </div>

                  <div className="p-7 flex-1 space-y-3">
                    <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Includes</div>
                    {tier.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${
                          feat.included ? "text-foreground" : "text-divider"
                        }`} />
                        <span className={`text-sm leading-snug ${feat.included ? "text-foreground/80" : "text-muted/50"}`}>
                          {feat.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="px-7 pb-7">
                    <button
                      disabled={isCurrent || isLoading}
                      onClick={() => handleSelect(tier.id)}
                      className={`w-full h-12 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        isCurrent
                          ? "bg-foreground/5 text-muted cursor-not-allowed"
                          : tier.popular
                            ? "bg-foreground text-background hover:opacity-90 shadow-sm"
                            : "bg-transparent border border-divider text-foreground hover:bg-foreground/5"
                      }`}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing</>
                      ) : isCurrent ? (
                        <><Check className="w-4 h-4" /> Current Plan</>
                      ) : (
                        <>
                          Start Free Trial
                          <Rocket className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {/* ── Core Features Showcase ── */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">More than just AI chat</h2>
              <p className="text-sm text-muted max-w-lg mx-auto">
                Six integrated study tools that turn AI answers into lasting knowledge.
                Your personal learning ecosystem — built in.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CORE_FEATURES.map((feature) => {
                const FeatureIcon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex flex-col gap-3 p-5 rounded-xl border border-divider bg-card/30 hover:border-foreground/20 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-foreground/5 border border-divider flex items-center justify-center">
                      <FeatureIcon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{feature.title}</h3>
                      <p className="text-sm text-muted mt-1 leading-relaxed">{feature.desc}</p>
                    </div>
                    <p className="text-xs text-muted/60 leading-relaxed border-t border-divider/50 pt-2.5 mt-auto">
                      {feature.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Model Architecture ── */}
          <section className="space-y-5 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-center">AI Model Architecture</h2>
            <div className="overflow-x-auto rounded-xl border border-divider">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-divider bg-foreground/[0.02]">
                    <th className="text-left py-3.5 px-4 font-semibold text-muted">Level</th>
                    <th className="text-left py-3.5 px-4 font-semibold text-muted">Model(s)</th>
                    <th className="text-center py-3.5 px-4 font-semibold text-muted">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Vision recognition", "Tencent hy3-preview → route to solver", "—"],
                    ["Auto (AI selects)", "Difficulty analysis (2cr) + routed model cost", "2 + model"],
                    ["Light (Simple)", "DeepSeek v4-pro", "3"],
                    ["Balanced (Medium)", "Qwen 3.7-Max + Z-AI GLM 5.2", "8"],
                    ["Deep (Hard)", "GPT-5.5 + Claude Opus 4.8", "60"],
                    ["Extreme (Hardest)", "GPT-5.5-Pro + 7-model ensemble", "1400"],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-divider/50">
                      <td className="py-3.5 px-4 font-medium text-foreground">{row[0]}</td>
                      <td className="py-3.5 px-4 text-muted">{row[1]}</td>
                      <td className="py-3.5 px-4 text-center text-foreground/70 font-semibold">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Feature Comparison ── */}
          <section className="space-y-5">
            <h2 className="text-xl font-bold text-center">Full plan comparison</h2>
            <div className="overflow-x-auto rounded-xl border border-divider">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-divider bg-foreground/[0.02]">
                    <th className="text-left py-3.5 px-4 font-semibold text-muted">Feature</th>
                    <th className="py-3.5 px-4 text-center font-medium">Plus</th>
                    <th className="py-3.5 px-4 text-center font-medium bg-foreground/[0.02]">Pro</th>
                    <th className="py-3.5 px-4 text-center font-medium">Pro+</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={i} className="border-b border-divider/50">
                      <td className="py-3.5 px-4 text-muted font-medium">{row[0]}</td>
                      {[1, 2, 3].map((col) => (
                        <td key={col} className={`py-3.5 px-4 text-center ${col === 2 ? "bg-foreground/[0.015]" : ""}`}>
                          {["✓", "—"].includes(row[col]) ? (
                            <span className={row[col] === "✓" ? "text-foreground/60" : "text-divider"}>
                              {row[col]}
                            </span>
                          ) : (
                            <span className="text-foreground/70 font-semibold">{row[col]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Payment Methods ── */}
          <section className="text-center space-y-5">
            <p className="text-sm text-muted uppercase tracking-wider font-semibold">Secure payment</p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {[
                { icon: CreditCard, label: "Visa / Mastercard" },
                { icon: Shield, label: "Alipay" },
                { icon: Clock, label: "WeChat Pay" },
                { icon: CreditCard, label: "PayPal" },
              ].map((pm, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-muted">
                  <pm.icon className="w-4 h-4" />
                  {pm.label}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted/50 max-w-md mx-auto">
              Your payment info is encrypted. We never store your card details.
            </p>
          </section>

          {/* ── FAQ ── */}
          <section className="space-y-5 max-w-2xl mx-auto pb-12">
            <h2 className="text-xl font-bold text-center">FAQ</h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => {
                const isOpen = expandedFaq === i;
                return (
                  <div key={i} className="border border-divider rounded-xl overflow-hidden transition-colors hover:border-foreground/10">
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-left hover:bg-foreground/[0.02] transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-muted shrink-0" />
                        {faq.q}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-sm text-muted leading-relaxed border-t border-divider pt-3.5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-3">
              <p className="text-sm text-muted">
                Still have questions?{" "}
                <button className="text-foreground underline underline-offset-2 hover:text-muted transition-colors font-medium">
                  Contact support
                </button>
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted/50">
              <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
              <span className="text-divider">·</span>
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <span className="text-divider">·</span>
              <a href="/refund" className="hover:text-foreground transition-colors">Refund Policy</a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
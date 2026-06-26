"use client";

import { Check, Sparkles, X, Loader2, Coins, BookOpen, Library, Network, Layers, ClipboardCheck } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  onBack: () => void;
  onSelect?: (tier: string) => void;
  showOnDepleted?: boolean;
  userId?: string;
  userEmail?: string;
  currentTier?: string;
}

const TIERS = [
  {
    name: "Plus",
    id: "plus" as const,
    price: "$14.99",
    period: "/month",
    credits: 200,
    popular: false,
    features: [
      "200 AI credits per month",
      "Knowledge Base: 100 entries",
      "Question Bank: 100 Q&A pairs",
      "Personal Wiki: 100 entries",
      "Auto Flashcards + Mock Exam + Search",
      "DeepSeek v4-pro + Qwen 3.7-Max + GLM 5.2",
    ],
  },
  {
    name: "Pro",
    id: "pro" as const,
    price: "$29.99",
    period: "/month",
    credits: 2000,
    popular: true,
    features: [
      "2,000 AI credits per month",
      "All study tools: unlimited storage",
      "All AI models (Light → Extreme)",
      "GPT-5.5 + Claude Opus 4.8 (Hard)",
      "Extreme 7-model cross-validation",
      "Priority support",
    ],
  },
  {
    name: "Pro+",
    id: "pro+" as const,
    price: "$99.99",
    period: "/month",
    credits: 10000,
    popular: false,
    features: [
      "10,000 AI credits per month",
      "All study tools: unlimited storage",
      "All models + latest preview",
      "Unlimited file parsing",
      "Priority support + SLA",
      "Early feature access",
    ],
  },
];

const STUDY_FEATURES = [
  { icon: BookOpen, label: "Knowledge Base" },
  { icon: Library, label: "Question Bank" },
  { icon: Network, label: "Personal Wiki" },
  { icon: Layers, label: "Auto Flashcards" },
  { icon: ClipboardCheck, label: "Mock Exam" },
];

export default function UpgradeModal({ onBack, onSelect, userId, userEmail, currentTier }: UpgradeModalProps) {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = useCallback(async (tierId: string) => {
    if (currentTier === tierId) return;

    setLoadingTier(tierId);
    setError(null);

    try {
      await onSelect?.(tierId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setError(message);
    } finally {
      setLoadingTier(null);
    }
  }, [onSelect, currentTier]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-input-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-semibold">Upgrade Your Plan</h1>
          </div>
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-hover-bg text-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => {
              const isLoading = loadingTier === tier.id;
              const isCurrent = currentTier === tier.id;

              return (
                <div
                  key={tier.name}
                  className={`relative flex flex-col rounded-xl border p-5 transition-all hover:shadow-md ${
                    tier.popular
                      ? "border-foreground/30 ring-1 ring-foreground/20 shadow-lg shadow-foreground/5"
                      : isCurrent
                        ? "border-emerald-500/30 ring-1 ring-emerald-500/20"
                        : "border-input-border"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-semibold px-3 py-0.5 rounded-full">
                      Popular
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-semibold px-3 py-0.5 rounded-full">
                      Current
                    </div>
                  )}

                  <div className="font-semibold text-lg">{tier.name}</div>
                  <div className="mt-2 flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted">{tier.period}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 py-1.5 px-2.5 rounded-md bg-foreground/[0.03] border border-input-border/50">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-foreground">{tier.credits.toLocaleString()}</span>
                    <span className="text-[10px] text-muted">AI credits/mo</span>
                  </div>

                  <div className="mt-4 flex-1 space-y-2.5">
                    {tier.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                        <span className="text-foreground/80">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={isLoading || isCurrent}
                    onClick={() => handleSubscribe(tier.id)}
                    className={`mt-6 w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-not-allowed border border-emerald-500/20"
                        : tier.popular
                          ? "bg-foreground text-background hover:opacity-90 shadow-sm"
                          : "bg-hover-bg text-foreground border border-input-border hover:bg-input-border"
                    }`}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : isCurrent ? (
                      "Active Plan"
                    ) : (
                      `Subscribe to ${tier.name}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-center gap-4 flex-wrap py-3 px-4 rounded-lg bg-foreground/[0.02] border border-divider">
              {STUDY_FEATURES.map((f) => {
                const FeatureIcon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-1.5 text-xs text-muted">
                    <FeatureIcon className="w-3.5 h-3.5" />
                    {f.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-center space-y-1.5">
            <p className="text-xs text-muted">
              All plans include a 7-day free trial. Cancel anytime.
            </p>
            <p className="text-xs text-muted/60">
              AI credits reset monthly. Study tools (Knowledge Base, Wiki, Question Bank, Flashcards, Mock Exam) use storage space instead of credits.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-muted/40">
              <button onClick={() => router.push("/terms")} className="hover:text-foreground transition-colors">Terms</button>
              <span>·</span>
              <button onClick={() => router.push("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
              <span>·</span>
              <button onClick={() => router.push("/refund")} className="hover:text-foreground transition-colors">Refund</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
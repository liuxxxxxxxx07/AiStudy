"use client";

import { Check, Sparkles, X, Loader2 } from "lucide-react";
import { useState, useCallback } from "react";

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
    price: "$9.99",
    period: "/month",
    popular: false,
    features: [
      "200 credits / 3hr",
      "Balanced model (Claude Sonnet-4)",
      "Basic file upload",
      "No ads",
    ],
  },
  {
    name: "Pro",
    id: "pro" as const,
    price: "$19.99",
    period: "/month",
    popular: true,
    features: [
      "500 credits / 3hr",
      "All models (Deep + Extreme)",
      "Multi-model cross-validation",
      "Reasoning / Thinking access",
      "Priority file processing",
      "Priority support",
    ],
  },
  {
    name: "Pro+",
    id: "pro+" as const,
    price: "$39.99",
    period: "/month",
    popular: false,
    features: [
      "Unlimited credits",
      "All models + latest preview",
      "Multi-model cross-validation",
      "Unlimited file processing",
      "Full reasoning",
      "Priority support + SLA",
      "Early feature access",
    ],
  },
];

export default function UpgradeModal({ onBack, onSelect, userId, userEmail, currentTier }: UpgradeModalProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = useCallback(async (tierId: string) => {
    if (currentTier === tierId) return;

    setLoadingTier(tierId);
    setError(null);

    try {
      onSelect?.(tierId);
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

                  <div className="mt-5 flex-1 space-y-2.5">
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

          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-muted">
              All plans include a 7-day free trial. Cancel anytime.
            </p>
            <p className="text-[10px] text-muted/50">
              Securely processed by our payment partners. We accept Visa, Mastercard, Alipay, WeChat Pay & PayPal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
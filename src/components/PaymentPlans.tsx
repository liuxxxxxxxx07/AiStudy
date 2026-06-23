"use client";

import {
  Check, ArrowLeft, Sparkles, ChevronDown, HelpCircle,
  CreditCard, Shield, Globe, Clock, Loader2
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
    price: { monthly: 9.99, yearly: 7.99 },
    yearlySaving: "20%",
    desc: "For casual learners who want more credits",
    features: [
      { text: "200 credits / 3hr refill", included: true },
      { text: "Balanced model (Claude Sonnet-4)", included: true },
      { text: "Basic file upload", included: true },
      { text: "No ads", included: true },
      { text: "Deep model (GPT-5.4)", included: false },
      { text: "Multi-model cross-validation", included: false },
      { text: "Unlimited credits", included: false },
    ],
  },
  {
    name: "Pro",
    id: "pro" as const,
    price: { monthly: 19.99, yearly: 14.99 },
    yearlySaving: "25%",
    desc: "For serious students & power users",
    popular: true,
    features: [
      { text: "500 credits / 3hr refill", included: true },
      { text: "All models (Balanced + Deep + Extreme)", included: true },
      { text: "Multi-model cross-validation", included: true },
      { text: "Reasoning / Thinking access", included: true },
      { text: "Priority file processing", included: true },
      { text: "Priority support", included: true },
      { text: "Unlimited credits", included: false },
    ],
  },
  {
    name: "Pro+",
    id: "pro+" as const,
    price: { monthly: 39.99, yearly: 29.99 },
    yearlySaving: "25%",
    desc: "For professionals who need unlimited access",
    features: [
      { text: "Unlimited credits", included: true },
      { text: "All models + latest preview", included: true },
      { text: "Multi-model cross-validation", included: true },
      { text: "Full reasoning", included: true },
      { text: "Unlimited file processing", included: true },
      { text: "Priority support + SLA", included: true },
      { text: "Early feature access", included: true },
    ],
  },
];

const FAQS = [
  { q: "How do credits work?", a: "Each AI request costs credits based on the model used. Credits refill every 3 hours up to your plan's limit. Free users get 50 credits, Plus gets 200, Pro gets 500, and Pro+ has unlimited credits." },
  { q: "Can I switch or cancel my plan?", a: "Yes, you can upgrade, downgrade, or cancel anytime. Changes take effect at the next billing cycle. There's no long-term contract." },
  { q: "What payment methods do you accept?", a: "We accept major credit cards (Visa, Mastercard), PayPal, Alipay, and WeChat Pay through our payment partners. All transactions are securely processed." },
  { q: "Is there a free trial?", a: "All paid plans include a 7-day free trial. You won't be charged until the trial period ends. Cancel anytime during the trial at no cost." },
  { q: "Can I use it for commercial purposes?", a: "Yes, all paid plans allow commercial use. Pro+ is recommended for teams and commercial applications with SLA support." },
];

export default function PaymentPlans({ onBack, onSelect, userId, userEmail, currentTier }: PaymentPlansProps) {
  const [yearly, setYearly] = useState(false);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSelect = useCallback(async (tierId: string) => {
    setLoadingTier(tierId);
    // Payment gateway stub — will be connected to Paddle + Payoneer
    await new Promise((r) => setTimeout(r, 800));
    onSelect?.(tierId);
    setLoadingTier(null);
  }, [onSelect]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-card-border shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-12">

          {/* ── Hero ── */}
          <section className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-xs text-muted">
              <Sparkles className="w-3 h-3 text-amber-500" />
              AI Study — STEM Learning Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Choose Your Plan
            </h1>
            <p className="text-muted text-sm max-w-md mx-auto">
              Unlock more credits, smarter models, and priority features.
              All plans include a 7-day free trial.
            </p>
          </section>

          {/* ── Billing Toggle ── */}
          <section className="flex justify-center">
            <div className="inline-flex items-center gap-3 bg-input-bg border border-input-border rounded-full p-1">
              <button
                onClick={() => setYearly(false)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !yearly ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  yearly ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                Yearly
                <span className="ml-1.5 text-[10px] opacity-80">Save ~25%</span>
              </button>
            </div>
          </section>

          {/* ── Plan Cards ── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {TIERS.map((tier) => {
              const price = yearly ? tier.price.yearly : tier.price.monthly;
              const period = yearly ? "/month, billed yearly" : "/month";
              const isCurrent = currentTier === tier.id;
              const isLoading = loadingTier === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl border transition-all duration-200 ${
                    tier.popular
                      ? "border-foreground/20 bg-card shadow-lg shadow-foreground/5 scale-[1.02] md:scale-105"
                      : "border-input-border bg-input-bg hover:border-foreground/20 hover:shadow-md"
                  } ${isCurrent ? "opacity-60" : ""}`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-semibold px-4 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                  )}

                  <div className="p-6 pb-0">
                    <h3 className="text-lg font-semibold">{tier.name}</h3>
                    <p className="text-xs text-muted mt-1">{tier.desc}</p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${price.toFixed(2)}</span>
                      <span className="text-sm text-muted">{period}</span>
                    </div>

                    {yearly && (
                      <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                        Save {tier.yearlySaving} vs monthly
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 space-y-3">
                    {tier.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm">
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          feat.included ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted/10 text-muted"
                        }`}>
                          <Check className={`w-3 h-3 ${feat.included ? "" : "opacity-40"}`} />
                        </div>
                        <span className={feat.included ? "" : "text-muted line-through"}>
                          {feat.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 pt-0">
                    <button
                      disabled={isCurrent || isLoading}
                      onClick={() => handleSelect(tier.id)}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        isCurrent
                          ? "bg-muted/10 text-muted cursor-not-allowed"
                          : tier.popular
                            ? "bg-foreground text-background hover:opacity-90 shadow-sm"
                            : "bg-hover-bg text-foreground border border-input-border hover:bg-input-border"
                      }`}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : (
                        "Start Free Trial"
                      )}
                    </button>

                    {tier.popular && !isCurrent && (
                      <p className="text-[10px] text-center text-muted mt-2">
                        Free for 7 days, then ${price.toFixed(2)}/mo
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </section>

          {/* ── Payment Methods ── */}
          <section className="text-center space-y-4">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Secure Payment Processed By</h2>
            <div className="flex items-center justify-center gap-6 flex-wrap text-xs text-muted">
              <div className="flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> Visa / Mastercard</div>
              <div className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Alipay</div>
              <div className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> WeChat Pay</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> PayPal</div>
            </div>
            <p className="text-[11px] text-muted/60 max-w-md mx-auto">
              Your payment info is encrypted and processed securely by our payment partners.
              We never store your card details.
            </p>
          </section>

          {/* ── Feature Comparison ── */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-center">Compare Plans Side by Side</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left py-3 pr-4 font-medium text-muted">Feature</th>
                    <th className="py-3 px-4 text-center font-medium">Plus</th>
                    <th className="py-3 px-4 text-center font-medium bg-foreground/5 rounded-t-xl">Pro</th>
                    <th className="py-3 px-4 text-center font-medium">Pro+</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Credits per 3hr", "200", "500", "Unlimited"],
                    ["Free models (Auto + Light)", "✓", "✓", "✓"],
                    ["Balanced model (Sonnet-4)", "✓", "✓", "✓"],
                    ["Deep model (GPT-5.4)", "—", "✓", "✓"],
                    ["Extreme (cross-validation)", "—", "✓", "✓"],
                    ["Reasoning / Thinking", "—", "✓", "✓"],
                    ["Full reasoning", "—", "—", "✓"],
                    ["File upload", "Basic", "Priority", "Unlimited"],
                    ["Priority support", "—", "✓", "✓ + SLA"],
                    ["Early features", "—", "—", "✓"],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-card-border/50">
                      <td className="py-2.5 pr-4 text-muted">{row[0]}</td>
                      {[1, 2, 3].map((col) => (
                        <td key={col} className={`py-2.5 px-4 text-center ${col === 2 ? "bg-foreground/5" : ""}`}>
                          {["✓", "—"].includes(row[col]) ? (
                            <span className={row[col] === "✓" ? "text-emerald-600 dark:text-emerald-400" : "text-muted/30"}>
                              {row[col]}
                            </span>
                          ) : (
                            <span className="text-foreground/80">{row[col]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section className="space-y-4 max-w-2xl mx-auto pb-8">
            <h2 className="text-xl font-bold text-center">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => {
                const isOpen = expandedFaq === i;
                return (
                  <div key={i} className="border border-card-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-left hover:bg-hover-bg transition-colors"
                    >
                      {faq.q}
                      <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-3.5 text-sm text-muted leading-relaxed animate-fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
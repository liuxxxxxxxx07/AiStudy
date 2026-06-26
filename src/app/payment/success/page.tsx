"use client";

import { useEffect, useState, Suspense } from "react";
import { CheckCircle, ArrowLeft, Sparkles } from "lucide-react";

declare global {
  interface Window {
    Paddle: any;
  }
}

function SuccessContent() {
  const [tier, setTier] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const txId = params.get("id") || params.get("transaction_id");
    const tierParam = params.get("tier");
    const txnParam = params.get("txn");

    if (txId) setTransactionId(txId);
    if (tierParam) setTier(tierParam);

    const updateCredits = () => {
      const userId = localStorage.getItem("ai-study-user-id");
      if (userId) {
        try {
          const key = `ai-study-credits-${userId}`;
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            data.tier = tierParam;
            data.balance = tierParam === "pro+" ? 10000 : tierParam === "pro" ? 2000 : 200;
            data.lastResetMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
            localStorage.setItem(key, JSON.stringify(data));
          }
        } catch {}
      }
    };

    // Explicit checkout: ?txn=txn_... in URL
    if (txnParam && tierParam) {
      const successUrl = `${window.location.origin}/payment/success?tier=${tierParam}`;
      const loadPaddle = () => {
        if (typeof window.Paddle !== "undefined") {
          window.Paddle.Checkout.open({
            transactionId: txnParam,
            settings: { displayMode: "overlay", successUrl },
          });
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
        script.async = true;
        script.onload = () => {
          const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";
          window.Paddle.Initialize({ token });
          setTimeout(() => {
            window.Paddle.Checkout.open({
              transactionId: txnParam,
              settings: { displayMode: "overlay", successUrl },
            });
          }, 500);
        };
        document.head.appendChild(script);
      };
      loadPaddle();
      return;
    }

    // Post-payment redirect back (no txn/_ptpn): update credits
    if (tierParam) {
      updateCredits();
      setCheckingOut(false);
      return;
    }

    setCheckingOut(false);
  }, []);

  if (checkingOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const tierNames: Record<string, string> = {
    plus: "Plus",
    pro: "Pro",
    "pro+": "Pro+",
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Payment Successful!</h1>
          <p className="text-muted text-base leading-relaxed">
            Thank you for your purchase.
            {tier && (
              <>
                {" "}Your <span className="font-semibold text-foreground">{tierNames[tier] || tier}</span> plan is now active.
              </>
            )}
          </p>
        </div>

        {transactionId && (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-foreground/5 border border-divider text-sm text-muted">
            <Sparkles className="w-3.5 h-3.5" />
            Transaction: {transactionId.slice(0, 12)}...
          </div>
        )}

        <div className="pt-4 space-y-3">
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            Start Learning
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </a>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-divider text-foreground text-sm font-semibold hover:bg-foreground/5 transition-all"
          >
            Manage Subscription
          </a>
        </div>

        <p className="text-xs text-muted/50">
          Your credits and plan level have been updated automatically. If you have any questions, please contact support.
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
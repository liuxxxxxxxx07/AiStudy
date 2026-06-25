"use client";

import { ArrowLeft, XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20">
          <XCircle className="w-10 h-10 text-amber-500" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Payment Cancelled</h1>
          <p className="text-muted text-base leading-relaxed">
            Your payment was cancelled. No charges have been made. You can try again whenever you&apos;re ready.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <a
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-divider text-foreground text-sm font-semibold hover:bg-foreground/5 transition-all"
          >
            Return to App
          </a>
        </div>

        <p className="text-xs text-muted/50">
          Need help? <a href="mailto:support@stem-aistudy.com" className="text-foreground underline underline-offset-2">Contact support</a>
        </p>
      </div>
    </div>
  );
}
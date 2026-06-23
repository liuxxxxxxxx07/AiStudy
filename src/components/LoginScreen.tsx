"use client";

import { Sparkles } from "lucide-react";

interface LoginScreenProps {
  onLogin: () => Promise<void>;
  onPlans: () => void;
}

export default function LoginScreen({ onLogin, onPlans }: LoginScreenProps) {
  return (
    <div className="flex h-full items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col items-center rounded-xl border border-input-border bg-card p-8 shadow-lg">
        <Sparkles className="mb-4 h-10 w-10 text-foreground" />

        <h1
          className="mb-1 text-4xl font-bold text-foreground"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          AI Study
        </h1>

        <p className="mb-8 text-center text-sm text-muted-foreground">
          STEM Learning Engine powered by Puter
        </p>

        <button
          onClick={onLogin}
          className="w-full rounded-lg bg-foreground px-6 py-3 font-semibold text-background transition-opacity hover:opacity-90"
        >
          Sign in with Puter
        </button>

        <button
          onClick={onPlans}
          className="mt-4 text-xs text-muted-foreground underline transition-colors hover:text-foreground"
        >
          View Pricing
        </button>
      </div>
    </div>
  );
}

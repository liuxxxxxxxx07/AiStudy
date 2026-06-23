"use client";

declare global {
  interface Window {
    puter: typeof puter;
  }
}

interface ModelDefinition {
  id: string;
  label: string;
  provider: string;
  paid: boolean;
}

export const INTENSITY_MODELS: Record<string, ModelDefinition> = {
  auto: { id: "tencent/hy3-preview", label: "Auto", provider: "Tencent", paid: false },
  easy: { id: "gpt-5.4-nano", label: "Light", provider: "OpenAI", paid: false },
  medium: { id: "claude-sonnet-4", label: "Balanced", provider: "Anthropic", paid: true },
  hard: { id: "gpt-5.4", label: "Deep", provider: "OpenAI", paid: true },
  extreme: { id: "gpt-5.4", label: "Extreme", provider: "Multi-Model", paid: true },
};

export const VISION_MODEL = "tencent/hy3-preview";

export const MODE_COST: Record<string, number> = {
  solver: 20,
  visualizer: 15,
  chat: 10,
};

export const CREDIT_REFILL_AMOUNT = 50;
export const CREDIT_REFILL_INTERVAL_MS = 3 * 60 * 60 * 1000;
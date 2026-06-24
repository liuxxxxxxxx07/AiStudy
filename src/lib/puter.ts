interface ModelDefinition {
  id: string;
  label: string;
  provider: string;
  paid: boolean;
}

export const INTENSITY_MODELS: Record<string, ModelDefinition> = {
  auto: { id: "tencent/hy3-preview", label: "Auto", provider: "Tencent", paid: false },
  easy: { id: "deepseek/deepseek-v4-pro", label: "Light", provider: "DeepSeek", paid: false },
  medium: { id: "qwen/qwen3.7-max", label: "Balanced", provider: "Qwen + Z-AI", paid: true },
  hard: { id: "openai/gpt-5.5", label: "Deep", provider: "OpenAI + Anthropic", paid: true },
  extreme: { id: "openai/gpt-5.5-pro", label: "Extreme", provider: "Multi-Model", paid: true },
};

export const VISION_MODEL = "tencent/hy3-preview";

export const MEDIUM_MODELS = ["qwen/qwen3.7-max", "z-ai/glm-5.2"];
export const HARD_MODELS = ["openai/gpt-5.5", "anthropic/claude-opus-4.8"];
export const EXTREME_MODEL = "openai/gpt-5.5-pro";
export const EXTREME_MERGE_MODEL = "openai/gpt-5.5-pro";

export const CROSS_VALIDATION_MODELS = [
  "tencent/hy3-preview",
  "deepseek/deepseek-v4-pro",
  "qwen/qwen3.7-max",
  "z-ai/glm-5.2",
  "openai/gpt-5.5",
  "anthropic/claude-opus-4.8",
  "openai/gpt-5.5-pro",
];

export const MODEL_CREDIT_COST: Record<string, number> = {
  auto: 2,
  easy: 3,
  medium: 8,
  hard: 60,
  extreme: 1400,
};

export const MODE_COST: Record<string, number> = {
  solver: 2,
  visualizer: 1,
  chat: 0,
};

export const MODEL_COST_USD: Record<string, number> = {
  auto: 0.00019,
  easy: 0.00087,
  medium: 0.00314,
  hard: 0.024,
  extreme: 0.535,
};

export const TIER_ACCESS: Record<string, string[]> = {
  free: ["auto", "easy"],
  plus: ["auto", "easy", "medium"],
  pro: ["auto", "easy", "medium", "hard", "extreme"],
  "pro+": ["auto", "easy", "medium", "hard", "extreme"],
};
"use client";

import { Coins } from "lucide-react";

interface CreditDisplayProps {
  credits: number;
  tier: string;
}

const tierConfig: Record<string, { label: string; color: string }> = {
  plus: { label: "Plus", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  pro: { label: "Pro", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  "pro+": { label: "Pro+", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

export default function CreditDisplay({ credits, tier }: CreditDisplayProps) {
  const cfg = tierConfig[tier.toLowerCase()];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-input-bg border border-input-border text-sm">
      <Coins className="w-4 h-4 text-muted" />
      <span className="font-medium text-foreground">{credits.toLocaleString()}</span>
      {cfg && (
        <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded border ${cfg.color}`}>
          {cfg.label}
        </span>
      )}
    </div>
  );
}
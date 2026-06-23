"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { INTENSITY_MODELS } from "@/lib/puter";

interface IntensitySelectorProps {
  value: string;
  onChange: (value: string) => void;
  isPaidTier: boolean;
  onUpgrade: () => void;
}

const LEVELS = [
  { key: "auto", label: "Auto", icon: "🔄" },
  { key: "easy", label: "Light", icon: "🌱" },
  { key: "medium", label: "Balanced", icon: "⚖️" },
  { key: "hard", label: "Deep", icon: "🔬" },
  { key: "extreme", label: "Extreme", icon: "⚡" },
];

export default function IntensitySelector({ value, onChange, isPaidTier, onUpgrade }: IntensitySelectorProps) {
  const [dragging, setDragging] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIdx = LEVELS.findIndex((l) => l.key === value);
  const displayIdx = currentIdx >= 0 ? currentIdx : 0;

  const handleClickLevel = useCallback((key: string) => {
    const model = INTENSITY_MODELS[key];
    if (model?.paid && !isPaidTier) {
      onUpgrade();
      return;
    }
    onChange(key);
  }, [isPaidTier, onChange, onUpgrade]);

  const handleSliderChange = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const idx = Math.round(pct * (LEVELS.length - 1));
    const key = LEVELS[idx].key;
    const model = INTENSITY_MODELS[key];
    if (model?.paid && !isPaidTier) {
      onUpgrade();
      return;
    }
    onChange(key);
  }, [isPaidTier, onChange, onUpgrade]);

  const handleMouseDown = useCallback(() => {
    setDragging(true);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      handleSliderChange(e as unknown as React.MouseEvent);
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, handleSliderChange]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="flex items-center gap-0 cursor-pointer select-none"
        onClick={lockedOpen ? undefined : (e) => {
          handleSliderChange(e);
          setLockedOpen(true);
        }}
      >
        <div className="flex items-center gap-1 bg-input-bg border border-input-border rounded-full px-2 py-1">
          <span className="text-[11px] mr-1">{LEVELS[displayIdx].icon}</span>
          <span className="text-[11px] font-medium">{LEVELS[displayIdx].label}</span>
        </div>
      </div>

      {lockedOpen && (
        <div className="absolute bottom-full mb-2 left-0 bg-card border border-input-border rounded-xl p-3 shadow-lg z-50 min-w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted">AI 强度</span>
            <button
              onClick={() => setLockedOpen(false)}
              className="text-[10px] text-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div
            ref={containerRef}
            className="relative h-8 flex items-center"
            onMouseDown={handleMouseDown}
            onTouchStart={(e) => {
              handleSliderChange(e);
              handleMouseDown();
            }}
          >
            <div className="absolute inset-x-0 h-1 bg-input-border rounded-full" />
            <div
              className="absolute left-0 h-1 bg-foreground/30 rounded-full transition-all"
              style={{ width: `${(displayIdx / (LEVELS.length - 1)) * 100}%` }}
            />
            <div
              className="absolute w-4 h-4 bg-foreground rounded-full shadow-md cursor-grab active:cursor-grabbing -translate-x-1/2"
              style={{ left: `${(displayIdx / (LEVELS.length - 1)) * 100}%` }}
            />
          </div>

          <div className="flex justify-between mt-1">
            {LEVELS.map((level, i) => {
              const model = INTENSITY_MODELS[level.key];
              const isPaid = model?.paid;
              const selected = level.key === value;
              return (
                <button
                  key={level.key}
                  onClick={() => handleClickLevel(level.key)}
                  className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded transition-colors ${
                    selected ? "text-foreground" : "text-muted hover:text-foreground"
                  }`}
                  style={{ width: `${100 / LEVELS.length}%` }}
                >
                  <span className="text-[10px]">{level.icon}</span>
                  <span className="text-[9px] font-medium whitespace-nowrap">{level.label}</span>
                  {isPaid && (
                    <span className="text-[7px] text-amber-500 font-semibold">PAID</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {lockedOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setLockedOpen(false)} />
      )}
    </div>
  );
}
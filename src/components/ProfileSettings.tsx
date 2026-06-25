"use client";

import { useState, useCallback, useEffect } from "react";
import { X, User, Coins, Sun, Moon, LogOut, Sparkles, ExternalLink, Check, Pencil, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { updateProfile } from "@/lib/supabase-db";

const PROFILE_DISPLAY_KEY = "ai-study-profile-display";

interface StoredProfile {
  displayName: string;
}

function getStoredProfile(userId: string): StoredProfile {
  try {
    const raw = localStorage.getItem(`${PROFILE_DISPLAY_KEY}-${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { displayName: "" };
}

function saveStoredProfile(userId: string, profile: StoredProfile) {
  localStorage.setItem(`${PROFILE_DISPLAY_KEY}-${userId}`, JSON.stringify(profile));
}

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500/20 text-blue-500",
    "bg-purple-500/20 text-purple-500",
    "bg-emerald-500/20 text-emerald-500",
    "bg-amber-500/20 text-amber-500",
    "bg-rose-500/20 text-rose-500",
    "bg-cyan-500/20 text-cyan-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ProfileSettings({
  userId,
  userName,
  userEmail,
  credits,
  tier,
  onClose,
  onLogout,
  onUpgrade,
}: {
  userId: string;
  userName: string;
  userEmail?: string;
  credits: number;
  tier: string;
  onClose: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = getStoredProfile(userId);
    setDisplayName(stored.displayName || userName);
  }, [userId, userName]);

  const handleSaveName = useCallback(async () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    setSaving(true);
    saveStoredProfile(userId, { displayName: trimmed });
    await updateProfile(userId, { full_name: trimmed }).catch(() => {});
    setSaving(false);
    setEditing(false);
  }, [displayName, userId]);

  const displayName_ = displayName || userName;
  const tierLabel: Record<string, string> = { free: "Free", plus: "Plus", pro: "Pro", "pro+": "Pro+" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-input-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted" />
            <h1 className="text-lg font-semibold">Profile & Settings</h1>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-hover-bg text-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarColor(displayName_)}`}>
              {getInitials(displayName_)}
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 bg-input-bg border border-input-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none focus:border-foreground/30"
                    placeholder="Display name"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  />
                  <button onClick={handleSaveName} disabled={saving} className="p-1.5 rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{displayName_}</span>
                  <button onClick={() => setEditing(true)} className="p-0.5 rounded hover:bg-hover-bg text-muted transition-colors">
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="text-xs text-muted truncate">{userEmail || userId}</div>
            </div>
          </div>

          {/* Credits & Tier */}
          <div className="rounded-xl border border-input-border bg-input-bg/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">Credits</span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                tier === "free" ? "border-muted/30 bg-muted/10 text-muted" : "border-blue-500/30 bg-blue-500/20 text-blue-400"
              }`}>
                {tierLabel[tier] || "Free"}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{credits.toLocaleString()}</span>
              <span className="text-xs text-muted">credits remaining</span>
            </div>
            <button onClick={onUpgrade} className="mt-3 w-full py-2 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {tier === "free" ? "Upgrade Plan" : "Manage Plan"}
            </button>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Preferences</h3>
            <div className="space-y-1">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-hover-bg transition-colors"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
                <span className="ml-auto text-xs text-muted">{theme === "dark" ? "🌙" : "☀️"}</span>
              </button>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Account</h3>
            <div className="space-y-1">
              <button
                onClick={onUpgrade}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-hover-bg transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Subscription & Billing
                <ExternalLink className="w-3 h-3 ml-auto text-muted" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* App info */}
          <div className="text-center text-[10px] text-muted/40 pt-2 border-t border-divider">
            AI Study v0.1.0
          </div>
        </div>
      </div>
    </div>
  );
}

export { getStoredProfile, saveStoredProfile, getInitials, getAvatarColor };
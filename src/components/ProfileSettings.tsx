"use client";

import { useState, useCallback, useEffect } from "react";
import { X, User, Coins, Sun, Moon, LogOut, Sparkles, ExternalLink, Check, Pencil, Loader2, Languages, Download, Trash2, FileText, Eye } from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n, LOCALE_NAMES, type SupportedLocale } from "@/lib/i18n";
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
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);
  const [dataPreview, setDataPreview] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const stored = getStoredProfile(userId);
    setDisplayName(stored.displayName || userName);
  }, [userId, userName]);

  const collectUserData = useCallback(() => {
    const data: Record<string, unknown> = {};
    const keys = Object.keys(localStorage);
    const userKeys = keys.filter(k => k.includes(userId) || k.startsWith("ai-study-") || k === "dev_auth_session");
    for (const key of userKeys) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  }, [userId]);

  const handleExportData = useCallback(() => {
    const data = collectUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-study-data-${userId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [collectUserData, userId]);

  const handleViewData = useCallback(() => {
    const data = collectUserData();
    const summary: Record<string, string> = {};
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val)) {
        summary[key] = `${val.length} items`;
      } else if (val && typeof val === "object") {
        summary[key] = `${Object.keys(val as object).length} fields`;
      } else {
        summary[key] = String(val);
      }
    }
    setDataPreview(JSON.stringify(summary, null, 2));
  }, [collectUserData]);

  const handleDeleteAccount = useCallback(async () => {
    if (!window.confirm("Are you sure you want to delete all your data? This action cannot be undone.")) return;
    setDeleting(true);
    const keys = Object.keys(localStorage);
    const userKeys = keys.filter(k => k.includes(userId) || k.startsWith("ai-study-") || k === "dev_auth_session");
    for (const key of userKeys) {
      localStorage.removeItem(key);
    }
    setDeleting(false);
    onLogout();
    onClose();
  }, [userId, onLogout, onClose]);

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

  const cycleLocale = useCallback(() => {
    const locales: SupportedLocale[] = ["en", "zh"];
    const idx = locales.indexOf(locale);
    setLocale(locales[(idx + 1) % locales.length]);
  }, [locale, setLocale]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-input-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted" />
            <h1 className="text-lg font-semibold">{t("profile.title")}</h1>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-hover-bg text-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
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
                    placeholder={t("profile.displayName")}
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

          <div className="rounded-xl border border-input-border bg-input-bg/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium">{t("sidebar.credits")}</span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                tier === "free" ? "border-muted/30 bg-muted/10 text-muted" : "border-blue-500/30 bg-blue-500/20 text-blue-400"
              }`}>
                {tierLabel[tier] || "Free"}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{credits.toLocaleString()}</span>
              <span className="text-xs text-muted">{t("credits.creditsRemaining")}</span>
            </div>
            <button onClick={onUpgrade} className="mt-3 w-full py-2 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {tier === "free" ? t("credits.upgradePlan") : t("credits.managePlan")}
            </button>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{t("profile.preferences")}</h3>
            <div className="space-y-1">
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-hover-bg transition-colors">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? t("sidebar.lightMode") : t("sidebar.darkMode")}
                <span className="ml-auto text-xs text-muted">{theme === "dark" ? "🌙" : "☀️"}</span>
              </button>
              <button onClick={cycleLocale} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-hover-bg transition-colors">
                <Languages className="w-4 h-4" />
                {LOCALE_NAMES[locale] === "English" ? "English" : "中文"}
                <span className="ml-auto text-xs text-muted">{LOCALE_NAMES[locale === "en" ? "zh" : "en"]}</span>
              </button>
            </div>
          </div>

          {/* ── Data Management ── */}
          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{t("profile.account")}</h3>
            <div className="space-y-1">
              <button onClick={onUpgrade} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-hover-bg transition-colors">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {t("profile.subscriptionBilling")}
                <ExternalLink className="w-3 h-3 ml-auto text-muted" />
              </button>
              <button onClick={() => { onClose(); onLogout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                <LogOut className="w-4 h-4" />
                {t("profile.signOut")}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Your Data</h3>
            <div className="space-y-1">
              <button onClick={handleViewData} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-hover-bg transition-colors">
                <Eye className="w-4 h-4" />
                View my data
              </button>
              <button onClick={handleExportData} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground/80 hover:bg-hover-bg transition-colors">
                <Download className="w-4 h-4" />
                Export my data
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete my account"}
              </button>
            </div>
          </div>

          {dataPreview && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDataPreview(null)}>
              <div className="bg-card border border-input-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Your Stored Data
                  </h2>
                  <button onClick={() => setDataPreview(null)} className="p-1 rounded-lg hover:bg-hover-bg text-muted transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <pre className="text-xs text-muted leading-relaxed whitespace-pre-wrap font-mono bg-foreground/[0.03] rounded-lg p-4 border border-divider">
                  {dataPreview}
                </pre>
                <p className="text-xs text-muted/50 mt-4">
                  This is a summary of the data stored for your account. Use "Export my data" to download the full JSON.
                </p>
              </div>
            </div>
          )}

          <div className="text-center text-[10px] text-muted/40 pt-2 border-t border-divider space-y-1">
            <div className="flex items-center justify-center gap-2">
              <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
              <span>·</span>
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <span>·</span>
              <a href="/refund" className="hover:text-foreground transition-colors">Refund</a>
            </div>
            <div>{t("app.version")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { getInitials, getAvatarColor };
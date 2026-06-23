"use client";

import { Moon, Sun, Trash2, PanelLeftClose, Bookmark, BookOpen, GraduationCap, Search, Sparkles, LogOut, Coins, GitBranch } from "lucide-react";
import { useTheme } from "next-themes";

export type AppMode = "solver" | "visualizer" | "chat";

interface Conversation {
  id: string;
  title: string;
  mode: AppMode;
  createdAt: number;
}

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  credits: number;
  tier: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCollapse: () => void;
  onOpenBank: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenMockExam: () => void;
  onOpenSearch: () => void;
  onOpenFlashCards: () => void;
  onOpenWiki: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
}

const MODE_TAG_STYLE: Record<string, string> = {
  solver: "bg-blue-500/10 text-blue-500",
  visualizer: "bg-purple-500/10 text-purple-500",
  chat: "bg-emerald-500/10 text-emerald-500",
};

const MODE_LABEL: Record<string, string> = {
  solver: "Solver",
  visualizer: "Visualizer",
  chat: "Chat",
};

export default function Sidebar({
  conversations,
  currentId,
  credits,
  tier,
  onSelect,
  onDelete,
  onCollapse,
  onOpenBank,
  onOpenKnowledgeBase,
  onOpenMockExam,
  onOpenSearch,
  onOpenFlashCards,
  onOpenWiki,
  onLogout,
  onUpgrade,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="w-60 flex-shrink-0 h-full bg-sidebar-bg border-r border-sidebar-border flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <span className="font-serif-body text-sm font-semibold tracking-wide">
          AI Study
        </span>
        <button
          onClick={onCollapse}
          className="p-1 rounded hover:bg-hover-bg transition-colors text-muted"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-input-bg border border-input-border">
          <Coins className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">{credits.toLocaleString()}</span>
          <span className="text-[10px] text-muted">credits</span>
          {tier !== "free" && (
            <span className="ml-auto px-1.5 py-0.5 text-[9px] font-semibold rounded border border-blue-500/30 bg-blue-500/20 text-blue-400">
              {tier}
            </span>
          )}
        </div>
        <button
          onClick={onUpgrade}
          className="w-full mt-1.5 py-1.5 rounded-lg text-[11px] font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          {credits === 0 ? "Out of credits - Upgrade" : "Upgrade"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <div className="px-2 pt-6 text-center text-muted text-[12px]">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-0.5 pt-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                  currentId === conv.id
                    ? "bg-accent-light"
                    : "hover:bg-hover-bg"
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${MODE_TAG_STYLE[conv.mode] || MODE_TAG_STYLE.chat}`}
                >
                  {MODE_LABEL[conv.mode] || "Chat"}
                </span>
                <span className="flex-1 truncate text-[13px] text-foreground/80">
                  {conv.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-hover-bg flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-muted" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-sidebar-border space-y-0.5">
        <button
          onClick={onOpenBank}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-muted hover:text-foreground hover:bg-hover-bg transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5" />
          Question Bank
        </button>
        <button
          onClick={onOpenFlashCards}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-muted hover:text-foreground hover:bg-hover-bg transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Flashcards
        </button>
        <button
          onClick={onOpenKnowledgeBase}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-muted hover:text-foreground hover:bg-hover-bg transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Knowledge Base
        </button>
        <button
          onClick={onOpenWiki}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-muted hover:text-foreground hover:bg-hover-bg transition-colors"
        >
          <GitBranch className="w-3.5 h-3.5" />
          Personal Wiki
        </button>
        <button
          onClick={onOpenMockExam}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-muted hover:text-foreground hover:bg-hover-bg transition-colors"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Mock Exam
        </button>
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-muted hover:text-foreground hover:bg-hover-bg transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          Search
        </button>
        <div className="border-t border-sidebar-border my-1" />
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-muted hover:text-foreground hover:bg-hover-bg transition-colors"
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export { MODE_LABEL };
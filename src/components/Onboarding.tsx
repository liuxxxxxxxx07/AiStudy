"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, BookOpen, GraduationCap, Zap, ChevronRight, ChevronLeft, Bookmark, GitBranch, Search, MessageSquare, BarChart3, Brain, Construction, PanelLeft, Send, FileImage, Coins, SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Feature {
  icon: React.ReactNode;
  label: string;
  desc: string;
  comingSoon?: boolean;
}

export interface Slide {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  features: Feature[];
}

export default function Onboarding({ doneKey, onComplete }: {
  doneKey: "pre-login" | "post-login";
  onComplete: () => void;
}) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const slides: Slide[] = doneKey === "pre-login" ? [
    {
      icon: <Sparkles className="w-10 h-10" />,
      title: t("onboarding.preLogin.welcome.title"),
      subtitle: t("onboarding.preLogin.welcome.subtitle"),
      features: [
        { icon: <Brain className="w-4 h-4" />, label: t("onboarding.preLogin.welcome.feature1"), desc: t("onboarding.preLogin.welcome.feature1Desc") },
        { icon: <Zap className="w-4 h-4" />, label: t("onboarding.preLogin.welcome.feature2"), desc: t("onboarding.preLogin.welcome.feature2Desc") },
        { icon: <Coins className="w-4 h-4" />, label: t("onboarding.preLogin.welcome.feature3"), desc: t("onboarding.preLogin.welcome.feature3Desc") },
      ],
    },
    {
      icon: <Zap className="w-10 h-10" />,
      title: t("onboarding.preLogin.modes.title"),
      subtitle: t("onboarding.preLogin.modes.subtitle"),
      features: [
        { icon: <BookOpen className="w-4 h-4" />, label: t("onboarding.preLogin.modes.solver"), desc: t("onboarding.preLogin.modes.solverDesc") },
        { icon: <BarChart3 className="w-4 h-4" />, label: t("onboarding.preLogin.modes.visualizer"), desc: t("onboarding.preLogin.modes.visualizerDesc") },
        { icon: <MessageSquare className="w-4 h-4" />, label: t("onboarding.preLogin.modes.chat"), desc: t("onboarding.preLogin.modes.chatDesc") },
      ],
    },
    {
      icon: <Construction className="w-10 h-10" />,
      title: t("onboarding.preLogin.knowledge.title"),
      subtitle: t("onboarding.preLogin.knowledge.subtitle"),
      features: [
        { icon: <Bookmark className="w-4 h-4" />, label: t("onboarding.preLogin.knowledge.bank"), desc: t("onboarding.preLogin.knowledge.bankDesc"), comingSoon: true },
        { icon: <BookOpen className="w-4 h-4" />, label: t("onboarding.preLogin.knowledge.base"), desc: t("onboarding.preLogin.knowledge.baseDesc"), comingSoon: true },
        { icon: <GitBranch className="w-4 h-4" />, label: t("onboarding.preLogin.knowledge.wiki"), desc: t("onboarding.preLogin.knowledge.wikiDesc"), comingSoon: true },
      ],
    },
    {
      icon: <GraduationCap className="w-10 h-10" />,
      title: t("onboarding.preLogin.tools.title"),
      subtitle: t("onboarding.preLogin.tools.subtitle"),
      features: [
        { icon: <Sparkles className="w-4 h-4" />, label: t("onboarding.preLogin.tools.cards"), desc: t("onboarding.preLogin.tools.cardsDesc"), comingSoon: true },
        { icon: <GraduationCap className="w-4 h-4" />, label: t("onboarding.preLogin.tools.exam"), desc: t("onboarding.preLogin.tools.examDesc"), comingSoon: true },
        { icon: <Search className="w-4 h-4" />, label: t("onboarding.preLogin.tools.search"), desc: t("onboarding.preLogin.tools.searchDesc"), comingSoon: true },
      ],
    },
    {
      icon: <Coins className="w-10 h-10" />,
      title: t("onboarding.preLogin.credits.title"),
      subtitle: t("onboarding.preLogin.credits.subtitle"),
      features: [
        { icon: <Coins className="w-4 h-4" />, label: t("onboarding.preLogin.credits.free"), desc: t("onboarding.preLogin.credits.freeDesc") },
        { icon: <Zap className="w-4 h-4" />, label: t("onboarding.preLogin.credits.levels"), desc: t("onboarding.preLogin.credits.levelsDesc") },
        { icon: <Sparkles className="w-4 h-4" />, label: t("onboarding.preLogin.credits.upgrade"), desc: t("onboarding.preLogin.credits.upgradeDesc") },
      ],
    },
  ] : [
    {
      icon: <Sparkles className="w-10 h-10" />,
      title: t("onboarding.postLogin.welcome.title"),
      subtitle: t("onboarding.postLogin.welcome.subtitle"),
      features: [
        { icon: <PanelLeft className="w-4 h-4" />, label: t("onboarding.postLogin.welcome.sidebar"), desc: t("onboarding.postLogin.welcome.sidebarDesc") },
        { icon: <Zap className="w-4 h-4" />, label: t("onboarding.postLogin.welcome.modeSwitch"), desc: t("onboarding.postLogin.welcome.modeSwitchDesc") },
        { icon: <Send className="w-4 h-4" />, label: t("onboarding.postLogin.welcome.input"), desc: t("onboarding.postLogin.welcome.inputDesc") },
      ],
    },
    {
      icon: <SlidersHorizontal className="w-10 h-10" />,
      title: t("onboarding.postLogin.intensity.title"),
      subtitle: t("onboarding.postLogin.intensity.subtitle"),
      features: [
        { icon: <Zap className="w-4 h-4" />, label: t("onboarding.postLogin.intensity.auto"), desc: t("onboarding.postLogin.intensity.autoDesc") },
        { icon: <Brain className="w-4 h-4" />, label: t("onboarding.postLogin.intensity.light"), desc: t("onboarding.postLogin.intensity.lightDesc") },
        { icon: <BarChart3 className="w-4 h-4" />, label: t("onboarding.postLogin.intensity.deep"), desc: t("onboarding.postLogin.intensity.deepDesc") },
      ],
    },
    {
      icon: <Coins className="w-10 h-10" />,
      title: t("onboarding.postLogin.credits.title"),
      subtitle: t("onboarding.postLogin.credits.subtitle"),
      features: [
        { icon: <Coins className="w-4 h-4" />, label: t("onboarding.postLogin.credits.cost"), desc: t("onboarding.postLogin.credits.costDesc") },
        { icon: <SlidersHorizontal className="w-4 h-4" />, label: t("onboarding.postLogin.credits.insufficient"), desc: t("onboarding.postLogin.credits.insufficientDesc") },
        { icon: <PanelLeft className="w-4 h-4" />, label: t("onboarding.postLogin.credits.balance"), desc: t("onboarding.postLogin.credits.balanceDesc") },
      ],
    },
    {
      icon: <FileImage className="w-10 h-10" />,
      title: t("onboarding.postLogin.files.title"),
      subtitle: t("onboarding.postLogin.files.subtitle"),
      features: [
        { icon: <FileImage className="w-4 h-4" />, label: t("onboarding.postLogin.files.image"), desc: t("onboarding.postLogin.files.imageDesc") },
        { icon: <BookOpen className="w-4 h-4" />, label: t("onboarding.postLogin.files.doc"), desc: t("onboarding.postLogin.files.docDesc") },
        { icon: <MessageSquare className="w-4 h-4" />, label: t("onboarding.postLogin.files.chat"), desc: t("onboarding.postLogin.files.chatDesc") },
      ],
    },
  ];

  const goTo = useCallback((index: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(index);
  }, [animating]);

  const next = useCallback(() => {
    if (current < slides.length - 1) goTo(current + 1);
  }, [current, goTo, slides.length]);

  const prev = useCallback(() => {
    if (current > 0) goTo(current - 1);
  }, [current, goTo]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimating(false), 350);
    return () => clearTimeout(timer);
  }, [current]);

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-foreground/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-foreground/60" />
          </div>
          <span className="text-sm font-medium text-foreground/60">AI Study</span>
        </div>
        {!isLast && (
          <button onClick={onComplete} className="text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-hover-bg">
            {t("onboarding.skip")}
          </button>
        )}
      </div>

      <div className="px-6 mb-8">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} className={`h-1 rounded-full transition-all duration-300 ${i === current ? "flex-1 bg-foreground" : "flex-1 bg-foreground/10 hover:bg-foreground/20"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">
        <div key={current} className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-foreground/5 to-foreground/10 border border-foreground/10 flex items-center justify-center text-foreground/80">
              {slide.icon}
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">{slide.title}</h2>
            <p className="text-muted text-sm">{slide.subtitle}</p>
          </div>

          <div className="space-y-3">
            {slide.features.map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-input-border bg-input-bg/50">
                <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0 text-foreground/70">
                  {f.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{f.label}</span>
                    {f.comingSoon && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium border border-amber-500/20">
                        {t("onboarding.comingSoon")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted leading-relaxed mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 border-t border-divider">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={prev} disabled={current === 0} className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none px-3 py-2">
            <ChevronLeft className="w-4 h-4" />
            {t("onboarding.previous")}
          </button>

          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-foreground w-6" : "bg-foreground/20 hover:bg-foreground/40"}`} />
            ))}
          </div>

          {isLast ? (
            <button onClick={onComplete} className="flex items-center gap-1.5 text-sm font-medium px-5 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity">
              {doneKey === "pre-login" ? t("onboarding.signUpToTry") : t("onboarding.getStarted")}
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={next} className="flex items-center gap-1 text-sm text-foreground font-medium hover:opacity-80 transition-opacity px-3 py-2">
              {t("onboarding.next")}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
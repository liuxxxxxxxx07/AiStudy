"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, BookOpen, GraduationCap, Zap, ChevronRight, ChevronLeft, Bookmark, GitBranch, Search, MessageSquare, BarChart3, Brain, Construction, PanelLeft, Send, FileImage, Coins, SlidersHorizontal } from "lucide-react";

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

export const PRE_LOGIN_SLIDES: Slide[] = [
  {
    icon: <Sparkles className="w-10 h-10" />,
    title: "欢迎来到 AI Study",
    subtitle: "你的 AI 驱动 STEM 学习引擎",
    features: [
      { icon: <Brain className="w-4 h-4" />, label: "AI 解题", desc: "智能分析数理化难题" },
      { icon: <BarChart3 className="w-4 h-4" />, label: "可视化", desc: "一句话生成 Mermaid 图表" },
      { icon: <MessageSquare className="w-4 h-4" />, label: "自由对话", desc: "随时提问 AI 助教" },
    ],
  },
  {
    icon: <Zap className="w-10 h-10" />,
    title: "三种学习模式",
    subtitle: "根据需求选择最适合的模式",
    features: [
      { icon: <BookOpen className="w-4 h-4" />, label: "Solver 解题模式", desc: "分步解析数学、物理、化学等 STEM 题目" },
      { icon: <BarChart3 className="w-4 h-4" />, label: "Visualizer 可视化", desc: "生成流程图、思维导图、时序图" },
      { icon: <MessageSquare className="w-4 h-4" />, label: "Chat 自由问答", desc: "像老师一样解释概念，举例子打比方" },
    ],
  },
  {
    icon: <Construction className="w-10 h-10" />,
    title: "知识管理（开发中）",
    subtitle: "部分功能正在完善，敬请期待",
    features: [
      { icon: <Bookmark className="w-4 h-4" />, label: "题库", desc: "收藏好题按学科管理", comingSoon: true },
      { icon: <BookOpen className="w-4 h-4" />, label: "知识库", desc: "保存 AI 生成的知识笔记", comingSoon: true },
      { icon: <GitBranch className="w-4 h-4" />, label: "个人 Wiki", desc: "知识图谱可视化学习", comingSoon: true },
    ],
  },
  {
    icon: <GraduationCap className="w-10 h-10" />,
    title: "学习工具（开发中）",
    subtitle: "高效复习与自我检测即将上线",
    features: [
      { icon: <Sparkles className="w-4 h-4" />, label: "闪卡", desc: "间隔重复记忆复习", comingSoon: true },
      { icon: <GraduationCap className="w-4 h-4" />, label: "模拟考试", desc: "限时模拟检验成果", comingSoon: true },
      { icon: <Search className="w-4 h-4" />, label: "全文搜索", desc: "快速检索对话和笔记", comingSoon: true },
    ],
  },
  {
    icon: <Coins className="w-10 h-10" />,
    title: "免费额度 & 升级",
    subtitle: "注册即享 50 免费额度，无需信用卡",
    features: [
      { icon: <Coins className="w-4 h-4" />, label: "50 额度/月", desc: "免费体验所有核心功能" },
      { icon: <Zap className="w-4 h-4" />, label: "5 级 AI 强度", desc: "Auto → Light → Balanced → Deep → Extreme" },
      { icon: <Sparkles className="w-4 h-4" />, label: "按需升级", desc: "Plus/Pro/Pro+ 解锁更强模型和更多额度" },
    ],
  },
];

export const POST_LOGIN_SLIDES: Slide[] = [
  {
    icon: <Sparkles className="w-10 h-10" />,
    title: "开始使用 AI Study",
    subtitle: "快速上手，三分钟学会使用",
    features: [
      { icon: <PanelLeft className="w-4 h-4" />, label: "左侧边栏", desc: "管理对话、查看额度、访问所有工具" },
      { icon: <Zap className="w-4 h-4" />, label: "顶部模式切换", desc: "在 Solver / Visualizer / Chat 间切换" },
      { icon: <Send className="w-4 h-4" />, label: "底部输入框", desc: "输入问题、上传图片或文件" },
    ],
  },
  {
    icon: <SlidersHorizontal className="w-10 h-10" />,
    title: "调整 AI 强度",
    subtitle: "根据问题难度选择合适的 AI",
    features: [
      { icon: <Zap className="w-4 h-4" />, label: "Auto 智能匹配", desc: "自动分析题目难度，选择最合适的 AI" },
      { icon: <Brain className="w-4 h-4" />, label: "Light / Balanced", desc: "简单问题用轻量模型，节省额度" },
      { icon: <BarChart3 className="w-4 h-4" />, label: "Deep / Extreme", desc: "复杂问题用顶级模型，深度推理" },
    ],
  },
  {
    icon: <Coins className="w-10 h-10" />,
    title: "额度消耗说明",
    subtitle: "清晰了解每次对话的消耗",
    features: [
      { icon: <Coins className="w-4 h-4" />, label: "每次消耗 = 模型 + 模式", desc: "Chat+Easy 仅 2 额度，Solver+Deep 31 额度" },
      { icon: <SlidersHorizontal className="w-4 h-4" />, label: "额度不足时", desc: "系统会提示升级，不会中断学习" },
      { icon: <PanelLeft className="w-4 h-4" />, label: "随时查看余额", desc: "左侧边栏和底部工具栏实时显示" },
    ],
  },
  {
    icon: <FileImage className="w-10 h-10" />,
    title: "上传文件 & 图片",
    subtitle: "支持多种格式，AI 自动识别",
    features: [
      { icon: <FileImage className="w-4 h-4" />, label: "图片识别", desc: "上传数学公式、图表，AI 自动解析" },
      { icon: <BookOpen className="w-4 h-4" />, label: "文档解析", desc: "支持 PDF / DOC / PPTX / HTML" },
      { icon: <MessageSquare className="w-4 h-4" />, label: "结合对话", desc: "上传后继续提问，AI 基于文件内容回答" },
    ],
  },
];

export default function Onboarding({ slides, onComplete, doneKey }: {
  slides: Slide[];
  onComplete: () => void;
  doneKey: string;
}) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((index: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(index);
  }, [animating]);

  const next = useCallback(() => {
    if (current < slides.length - 1) goTo(current + 1);
  }, [current, goTo]);

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
          <button
            onClick={onComplete}
            className="text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-hover-bg"
          >
            跳过
          </button>
        )}
      </div>

      <div className="px-6 mb-8">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === current ? "flex-1 bg-foreground" : "flex-1 bg-foreground/10 hover:bg-foreground/20"
              }`}
            />
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
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-xl border border-input-border bg-input-bg/50"
              >
                <div className="w-9 h-9 rounded-lg bg-foreground/5 flex items-center justify-center flex-shrink-0 text-foreground/70">
                  {f.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{f.label}</span>
                    {f.comingSoon && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium border border-amber-500/20">
                        开发中
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
          <button
            onClick={prev}
            disabled={current === 0}
            className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none px-3 py-2"
          >
            <ChevronLeft className="w-4 h-4" />
            上一步
          </button>

          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current ? "bg-foreground w-6" : "bg-foreground/20 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={onComplete}
              className="flex items-center gap-1.5 text-sm font-medium px-5 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              {doneKey === "pre-login" ? "注册体验" : "开始使用"}
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={next}
              className="flex items-center gap-1 text-sm text-foreground font-medium hover:opacity-80 transition-opacity px-3 py-2"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
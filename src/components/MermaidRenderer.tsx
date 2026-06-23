"use client";

import { useEffect, useRef, useState } from "react";

export default function MermaidRenderer({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains("dark")
            ? "dark"
            : "default",
          securityLevel: "loose",
          fontFamily: "inherit",
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "图表渲染失败"
          );
        }
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
        <p className="font-medium mb-1">图表渲染错误</p>
        <p className="text-xs opacity-80">{error}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs">查看源码</summary>
          <pre className="text-xs mt-1 overflow-x-auto">{code}</pre>
        </details>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="p-4 text-center text-muted text-sm">渲染中...</div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-container [&>svg]:max-w-full [&>svg]:h-auto my-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

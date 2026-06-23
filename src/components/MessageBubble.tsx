"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Copy, Check, ChevronDown, ChevronRight, FileText, BookmarkPlus, Lightbulb } from "lucide-react";
import { useState, useCallback, memo } from "react";
import MermaidRenderer from "./MermaidRenderer";
import SimilarQuestions from "./SimilarQuestions";

export interface MessageFile {
  name: string;
  text: string;
  charCount: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  images?: string[];
  files?: MessageFile[];
  meta?: { difficulty?: string; model?: string; vision?: string };
}

function MessageBubble({
  message,
  onSaveToBank,
  onSimilarQuestions,
}: {
  message: Message;
  onSaveToBank?: (q: string, a: string) => void;
  onSimilarQuestions?: (q: string, a: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [message.content]);

  const parts = splitMermaid(message.content);

  return (
    <div
      className={`flex gap-3 max-w-3xl mx-auto w-full animate-fade-in ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
          isUser
            ? "bg-user-bubble text-background"
            : "bg-foreground/10 text-muted"
        }`}
      >
        {isUser ? "U" : "AI"}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? "flex flex-col items-end" : ""}`}>
        {!isUser && message.meta && (
          <div className="flex items-center gap-2 mb-1 px-1">
            {message.meta.difficulty && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  message.meta.difficulty === "easy"
                    ? "bg-green-500/10 text-green-500"
                    : message.meta.difficulty === "hard"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-yellow-500/10 text-yellow-500"
                }`}
              >
                {message.meta.difficulty}
              </span>
            )}
            {message.meta.model && (
              <span className="text-[10px] text-muted font-mono">
                {message.meta.model.split("/").pop()}
              </span>
            )}
            {message.meta.vision && (
              <span className="text-[10px] text-muted font-mono opacity-60">
                vision: {message.meta.vision.split("/").pop()}
              </span>
            )}
          </div>
        )}

        {message.images && message.images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {message.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`attached-${i}`}
                className="max-w-[200px] max-h-[200px] rounded-lg border border-input-border object-cover"
              />
            ))}
          </div>
        )}

        {message.files && message.files.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {message.files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-input-bg border border-input-border rounded-md px-2 py-1"
              >
                <FileText className="w-3 h-3 text-muted" />
                <span className="text-[11px] text-foreground">{file.name}</span>
                <span className="text-[10px] text-muted">({file.charCount} chars)</span>
              </div>
            ))}
          </div>
        )}

        <div
          className={`group relative inline-block max-w-full ${
            isUser
              ? "bg-user-bubble text-background rounded-2xl rounded-tr-sm px-3.5 py-2"
              : "px-1 py-0.5"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{message.content}</p>
          ) : (
            <>
              {message.reasoning && (
                <div className="mb-2 border border-divider rounded-lg overflow-hidden">
                  <button
                    onClick={() => setReasoningOpen(!reasoningOpen)}
                    className="flex items-center gap-1.5 w-full px-3 py-1.5 text-[12px] text-muted hover:bg-hover-bg transition-colors"
                  >
                    {reasoningOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    <span>Thinking</span>
                  </button>
                  {reasoningOpen && (
                    <div className="px-3 pb-2 pt-0 text-[13px] text-muted leading-relaxed border-t border-divider">
                      <div className="markdown-body">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {message.reasoning}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="markdown-body text-[14px]">
                {parts.map((part, i) => {
                  if (part.type === "mermaid") {
                    return <MermaidRenderer key={i} code={part.content} />;
                  }
                  return (
                    <ReactMarkdown
                      key={i}
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {part.content}
                    </ReactMarkdown>
                  );
                })}
              </div>
            </>
          )}

          {!isUser && message.content && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-hover-bg text-muted"
                title="Copy"
              >
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
              {onSaveToBank && (
                <button
                  onClick={() => onSaveToBank(message.content, "")}
                  className="p-1 rounded hover:bg-hover-bg text-muted"
                  title="Save to Question Bank"
                >
                  <BookmarkPlus className="w-3 h-3" />
                </button>
              )}
              {onSimilarQuestions && (
                <button
                  onClick={() => setShowSimilar(!showSimilar)}
                  className="p-1 rounded hover:bg-hover-bg text-muted"
                  title="Generate Similar Questions"
                >
                  <Lightbulb className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {showSimilar && !isUser && message.content && (
          <div className="mt-2 w-full">
            <SimilarQuestions
              question={message.content}
              answer=""
              onSelect={(q, a) => {
                if (onSaveToBank) onSaveToBank(q, a);
              }}
              onClose={() => setShowSimilar(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function splitMermaid(
  content: string
): Array<{ type: "text" | "mermaid"; content: string }> {
  const parts: Array<{ type: "text" | "mermaid"; content: string }> = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "mermaid", content: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }

  if (parts.length === 0) {
    parts.push({ type: "text", content });
  }

  return parts;
}

export default memo(MessageBubble);
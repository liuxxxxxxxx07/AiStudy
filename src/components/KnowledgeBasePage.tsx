"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen, Plus, Search, X, Filter, Tag, Clock,
  Upload, FileText, Brain, GitBranch, Loader2,
} from "lucide-react";
import {
  KnowledgeEntry,
  getKnowledgeBase,
  addKnowledgeEntry,
  removeKnowledgeEntry,
  searchKnowledgeBase,
} from "@/lib/knowledgeBase";
import { addWikiEntry, getWikiEntries } from "@/lib/wikiEngine";
import {
  parseHtmlContent,
  extractFromPptx,
  readFileAsText,
  readFileAsArrayBuffer,
  analyzeWithAI,
  ExtractedContent,
} from "@/lib/fileParser";
import PersonalWiki from "./PersonalWiki";

interface KnowledgeBasePageProps {
  onClose: () => void;
}

const TYPE_STYLES: Record<string, string> = {
  mermaid: "bg-blue-500/10 text-blue-500",
  note: "bg-emerald-500/10 text-emerald-500",
  summary: "bg-amber-500/10 text-amber-500",
  visualization: "bg-purple-500/10 text-purple-500",
  file: "bg-cyan-500/10 text-cyan-500",
};

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const ACCEPTED_TYPES = ".html,.htm,.pptx,.ppt,.doc,.docx,.pdf,.txt,.md";

export default function KnowledgeBasePage({ onClose }: KnowledgeBasePageProps) {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [showWiki, setShowWiki] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formCourse, setFormCourse] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formType, setFormType] = useState<KnowledgeEntry["type"]>("note");

  useEffect(() => {
    setEntries(getKnowledgeBase());
  }, []);

  const filteredEntries = useMemo(() => {
    let result = searchQuery ? searchKnowledgeBase(searchQuery) : entries;
    if (typeFilter !== "all") {
      result = result.filter((e) => e.type === typeFilter);
    }
    return result;
  }, [entries, searchQuery, typeFilter]);

  const handleSave = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    addKnowledgeEntry({
      title: formTitle.trim(),
      content: formContent.trim(),
      type: formType,
      tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
      course: formCourse.trim() || undefined,
      subject: formSubject.trim() || undefined,
    });
    setEntries(getKnowledgeBase());
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setFormTitle("");
    setFormContent("");
    setFormTags("");
    setFormCourse("");
    setFormSubject("");
    setFormType("note");
  };

  const handleDelete = (id: string) => {
    removeKnowledgeEntry(id);
    setEntries(getKnowledgeBase());
  };

  const addExtractedToWiki = async (extracted: ExtractedContent) => {
    const existing = getWikiEntries();
    const isDuplicate = existing.some(
      (e) => e.title === extracted.title || e.content.includes(extracted.text.slice(0, 100))
    );
    if (isDuplicate) return;

    addWikiEntry({
      title: extracted.title,
      content: [
        extracted.text,
        ...(extracted.theorems.length > 0 ? ["\n\n## Theorems\n" + extracted.theorems.map((t) => `- ${t}`).join("\n")] : []),
        ...(extracted.definitions.length > 0 ? ["\n\n## Definitions\n" + extracted.definitions.map((d) => `- ${d}`).join("\n")] : []),
        ...(extracted.formulas.length > 0 ? ["\n\n## Formulas\n" + extracted.formulas.map((f) => `- ${f}`).join("\n")] : []),
      ].join("\n"),
      tags: extracted.tags,
      category: extracted.category,
      source: undefined,
      relatedIds: [],
    });
  };

  const addToKnowledgeBase = (title: string, content: string, tags: string[]) => {
    addKnowledgeEntry({
      title,
      content,
      type: "file",
      tags,
      course: undefined,
      subject: undefined,
    });
    setEntries(getKnowledgeBase());
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadStatus(`Processing ${file.name}...`);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let html = "";
      let text = "";
      let extracted: ExtractedContent | null = null;

      if (ext === "html" || ext === "htm") {
        html = await readFileAsText(file);
        extracted = parseHtmlContent(html);
        text = extracted.text;
      } else if (ext === "pptx") {
        const buf = await readFileAsArrayBuffer(file);
        text = await extractFromPptx(buf);
        extracted = await analyzeWithAI(text);
      } else if (ext === "txt" || ext === "md") {
        text = await readFileAsText(file);
        extracted = await analyzeWithAI(text);
      } else if (ext === "docx" || ext === "doc" || ext === "pdf" || ext === "ppt") {
        text = await readFileAsText(file);
        extracted = await analyzeWithAI(text);
      }

      if (extracted) {
        addToKnowledgeBase(extracted.title, extracted.text, extracted.tags);
        await addExtractedToWiki(extracted);
        setUploadStatus(`Extracted ${extracted.theorems.length} theorems, ${extracted.definitions.length} definitions, ${extracted.formulas.length} formulas`);
      } else {
        addToKnowledgeBase(file.name, text || "[No text extracted]", []);
        setUploadStatus("File added to knowledge base");
      }
    } catch (err) {
      setUploadStatus(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await handleFileUpload(file);
    }
    e.target.value = "";
  };

  if (showWiki) {
    return <PersonalWiki onClose={() => setShowWiki(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-card-border rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-5 py-3 border-b border-divider">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Knowledge Base</span>
            <span className="text-[11px] text-muted">({entries.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWiki(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Wiki
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-hover-bg transition-colors text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 pt-3 pb-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                placeholder="Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-input-bg border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-hover-bg text-muted">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input-border text-[13px] text-muted hover:text-foreground hover:bg-hover-bg transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload
            </button>
            <button
              onClick={() => setShowForm((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Entry
            </button>
          </div>

          {uploadStatus && (
            <div className="flex items-center gap-2 text-[12px] text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-lg">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
              {uploadStatus}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted" />
            {["all", "mermaid", "file", "note", "summary", "visualization"].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  typeFilter === type
                    ? "bg-foreground text-background"
                    : "bg-input-bg text-muted hover:text-foreground"
                }`}
              >
                {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {showForm && (
          <div className="mx-4 mb-3 p-4 rounded-lg border border-card-border bg-input-bg space-y-3">
            <input
              type="text" placeholder="Title" value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
            />
            <textarea
              placeholder="Content" value={formContent}
              onChange={(e) => setFormContent(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg bg-background border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors resize-none"
            />
            <div className="flex gap-2">
              <input type="text" placeholder="Tags (comma separated)" value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
              />
              <input type="text" placeholder="Course" value={formCourse}
                onChange={(e) => setFormCourse(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Subject" value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-input-border text-[13px] placeholder:text-muted outline-none focus:border-foreground/30 transition-colors"
              />
              <select value={formType} onChange={(e) => setFormType(e.target.value as KnowledgeEntry["type"])}
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-input-border text-[13px] outline-none focus:border-foreground/30 transition-colors"
              >
                <option value="note">Note</option>
                <option value="summary">Summary</option>
                <option value="mermaid">Mermaid</option>
                <option value="visualization">Visualization</option>
                <option value="file">File</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={resetForm} className="px-3 py-1.5 rounded-lg text-[13px] text-muted hover:text-foreground hover:bg-hover-bg transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-3 py-1.5 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity">Save</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center text-muted text-sm py-16">
              Your knowledge base is empty. Upload files (HTML, PPTX, DOC, PDF, TXT) or add entries.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="border border-card-border rounded-lg p-3 group flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13px] font-semibold leading-relaxed flex-1 line-clamp-2">{entry.title}</span>
                    <button onClick={() => handleDelete(entry.id)}
                      className="p-1 rounded hover:bg-hover-bg text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${TYPE_STYLES[entry.type] || "bg-gray-500/10 text-gray-500"}`}>
                      {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                    </span>
                    {entry.tags.length > 0 && (
                      <span className="flex items-center gap-0.5 flex-wrap">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">{tag}</span>
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-foreground/60 leading-relaxed line-clamp-2">
                    {entry.content.length > 100 ? entry.content.slice(0, 100) + "..." : entry.content}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted mt-auto flex-wrap">
                    {entry.course && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{entry.course}</span>}
                    {entry.subject && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{entry.subject}</span>}
                    <span className="flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />{relativeTime(entry.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
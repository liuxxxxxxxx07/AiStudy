"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { FileText, X, Loader2 } from "lucide-react";

export interface ParsedFile {
  name: string;
  text: string;
  charCount: number;
}

interface FileUploaderProps {
  onFilesChange: (files: ParsedFile[]) => void;
  clearTrigger?: number;
  maxFiles?: number;
}

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.txt,.md";

export default function FileUploader({
  onFilesChange,
  clearTrigger,
  maxFiles = 3,
}: FileUploaderProps) {
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (clearTrigger && clearTrigger > 0) {
      setFiles([]);
      setError(null);
    }
  }, [clearTrigger]);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      const remaining = maxFiles - files.length;
      const toProcess = Array.from(fileList).slice(0, remaining);

      if (toProcess.length === 0) return;

      setLoading(true);
      const newFiles: ParsedFile[] = [];

      for (const file of toProcess) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/parse-file", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || `Failed to parse ${file.name}`);
            continue;
          }

          newFiles.push({
            name: data.fileName,
            text: data.text,
            charCount: data.charCount,
          });
        } catch {
          setError(`Network error parsing ${file.name}`);
        }
      }

      if (newFiles.length > 0) {
        const updated = [...files, ...newFiles].slice(0, maxFiles);
        setFiles(updated);
        onFilesChange(updated);
      }

      setLoading(false);
    },
    [files, maxFiles, onFilesChange]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);
    setError(null);
  };

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {files.map((file, i) => (
        <div
          key={i}
          className="relative group flex items-center gap-1 bg-input-bg border border-input-border rounded-md px-2 py-1 max-w-[140px]"
        >
          <FileText className="w-3 h-3 text-muted flex-shrink-0" />
          <span className="text-[11px] text-foreground truncate">{file.name}</span>
          <button
            onClick={() => removeFile(i)}
            className="ml-0.5 w-3.5 h-3.5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <X className="w-2 h-2" />
          </button>
        </div>
      ))}

      {error && (
        <span className="text-[10px] text-red-500 max-w-[120px] truncate" title={error}>
          {error}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {loading ? (
        <Loader2 className="w-4 h-4 text-muted animate-spin" />
      ) : (
        files.length < maxFiles && (
          <button
            onClick={() => inputRef.current?.click()}
            className="p-1 rounded hover:bg-hover-bg transition-colors text-muted hover:text-foreground"
            title="上传文件 (PDF/DOC/DOCX/PPT/PPTX/TXT/MD)"
          >
            <FileText className="w-4 h-4" />
          </button>
        )
      )}
    </div>
  );
}

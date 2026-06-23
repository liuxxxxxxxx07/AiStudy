"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";

interface ImageUploaderProps {
  onImagesChange: (images: string[]) => void;
  clearTrigger?: number;
  maxImages?: number;
}

export default function ImageUploader({
  onImagesChange,
  clearTrigger,
  maxImages = 4,
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (clearTrigger && clearTrigger > 0) {
      setImages([]);
    }
  }, [clearTrigger]);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const newImages: string[] = [];
      const remaining = maxImages - images.length;
      const toProcess = Array.from(files).slice(0, remaining);

      let processed = 0;
      for (const file of toProcess) {
        if (!file.type.startsWith("image/")) continue;
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push(e.target?.result as string);
          processed++;
          if (processed === toProcess.length) {
            const updated = [...images, ...newImages].slice(0, maxImages);
            setImages(updated);
            onImagesChange(updated);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [images, maxImages, onImagesChange]
  );

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onImagesChange(updated);
  };

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {images.map((img, i) => (
        <div key={i} className="relative group">
          <img
            src={img}
            alt={`upload-${i}`}
            className="w-10 h-10 object-cover rounded-md border border-input-border"
          />
          <button
            onClick={() => removeImage(i)}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="p-1 rounded hover:bg-hover-bg transition-colors text-muted hover:text-foreground"
        title="上传图片"
      >
        <ImagePlus className="w-4 h-4" />
      </button>
    </div>
  );
}

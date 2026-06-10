"use client";

import { useRef, useCallback, useState } from "react";

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadArea({ onFileSelect, disabled }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect, disabled]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
    e.target.value = "";
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center p-8 text-center min-h-[360px] cursor-pointer group shadow-sm hover:shadow-md
        ${
          disabled
            ? "border-outline-variant bg-surface-container-lowest cursor-not-allowed"
            : isDragOver
            ? "border-primary bg-primary/10"
            : "border-primary/30 bg-surface-container-lowest hover:bg-primary/5"
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <div className="bg-surface-container p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
        <span className="material-symbols-outlined text-4xl text-primary">
          image
        </span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
        Drop image here or click to upload
      </h3>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
        Supports PNG, JPG, JPEG, WEBP
      </p>
      <div className="inline-flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-full font-body-sm text-body-sm font-medium">
        <span className="material-symbols-outlined text-sm">
          content_paste
        </span>
        Press Ctrl+V to paste screenshot
      </div>
    </div>
  );
}

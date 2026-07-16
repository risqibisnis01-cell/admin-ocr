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
    <div className="upload-frame">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        disabled={disabled}
        className="upload-zone"
        data-dragging={isDragOver}
        aria-describedby="ocr-upload-help"
      >
        <span className="upload-icon" aria-hidden="true">
          <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
        </span>
        <span className="upload-title">
          {disabled ? "Reading your image…" : "Choose an image"}
        </span>
        <span className="paste-hint">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">content_paste</span>
          Ctrl+V also works
        </span>
      </button>
      <p id="ocr-upload-help" className="upload-helper">
        Drop a file onto the button, or click to browse. PNG, JPEG, and WEBP are supported.
      </p>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { UploadArea } from "@/components/UploadArea";
import { ImagePreview } from "@/components/ImagePreview";
import { OCRResultTable } from "@/components/OCRResultTable";
import { ActionButtons } from "@/components/ActionButtons";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { useOCR } from "@/hooks/useOCR";
import type { OcrEngine } from "@/types/ocr";

interface OCRWorkspaceProps {
  engine: OcrEngine;
}

function getEngineLabel(engine: OcrEngine): string {
  switch (engine) {
    case "paddleocr": return "PaddleOCR";
    case "tesseract": return "Tesseract.js";
    case "google-vision": return "Google Vision AI";
  }
}

export default function OCRWorkspace({ engine }: OCRWorkspaceProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const {
    status,
    result,
    error,
    rows,
    processImage,
    clearResults,
    updateRowText,
    deleteRow,
  } = useOCR();

  const handleFileSelect = useCallback(
    (file: File) => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      processImage(file, engine);
    },
    [imageUrl, processImage, engine]
  );

  useClipboardPaste({ onPaste: handleFileSelect });

  const handleClear = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    clearResults();
  };

  const handleRemoveImage = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    clearResults();
  };

  const getStatusLabel = () => {
    switch (status) {
      case "processing":
        return "Processing...";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Idle";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "processing":
        return "bg-primary animate-pulse";
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-error";
      default:
        return "bg-outline-variant";
    }
  };

  return (
    <main className="flex-grow w-full px-4 md:px-10 py-12 max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Left Column: Upload / Drop Zone (5 columns) */}
      <section className="md:col-span-5 flex flex-col h-full">
        {!imageUrl ? (
          <>
            <UploadArea
              onFileSelect={handleFileSelect}
              disabled={status === "processing"}
            />
            <div className="mt-auto pt-6 flex flex-col items-center justify-center opacity-60">
              <span className="material-symbols-outlined text-3xl text-outline mb-2">
                assignment
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Upload or paste an image to start OCR
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <ImagePreview imageUrl={imageUrl} onClear={handleRemoveImage} />

            {status === "processing" && (
              <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                <span className="text-primary font-body-sm text-body-sm font-medium">
                  Processing with {getEngineLabel(engine)}...
                </span>
              </div>
            )}

            {status === "failed" && error && (
              <div className="p-4 bg-error-container rounded-xl border border-error/20">
                <p className="text-on-error-container font-body-sm text-body-sm">
                  {error}
                </p>
              </div>
            )}

            {status === "completed" && result && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    {getEngineLabel(engine)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-body-sm font-body-sm">
                  <div>
                    <span className="text-on-surface-variant">Detected:</span>
                    <span className="ml-1 font-semibold text-on-surface">
                      {result.metrics.detectedBoxes} boxes
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Recognized:</span>
                    <span className="ml-1 font-semibold text-on-surface">
                      {result.metrics.recognizedCount} lines
                    </span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Time:</span>
                    <span className="ml-1 font-semibold text-on-surface font-label-code text-label-code">
                      {result.metrics.totalMs.toFixed(0)}ms
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleClear}
              className="text-error hover:bg-error-container hover:text-on-error-container font-body-sm text-body-sm font-medium px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Clear &amp; upload new image
            </button>
          </div>
        )}
      </section>

      {/* Right Column: Results Panel (7 columns) */}
      <section className="md:col-span-7 flex flex-col h-full">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.02)] flex flex-col min-h-[460px] overflow-hidden">
          {/* Results Header */}
          <div className="px-6 py-4 border-b border-outline-variant/50 bg-surface-bright flex justify-between items-center">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">
              Results
            </h2>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${getStatusColor()}`}
              ></span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {getStatusLabel()}
              </span>
            </div>
          </div>

          {/* Results Canvas */}
          <OCRResultTable
            rows={rows}
            onRowUpdate={updateRowText}
            onRowDelete={deleteRow}
          />

          {/* Action Bar */}
          <div className="px-6 py-4 bg-surface-bright border-t border-outline-variant/50 flex flex-wrap gap-3 items-center">
            <ActionButtons rows={rows} onClear={handleClear} />
          </div>
        </div>
      </section>
    </main>
  );
}

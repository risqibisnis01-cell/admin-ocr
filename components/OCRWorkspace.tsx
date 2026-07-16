"use client";

import { useState, useCallback } from "react";
import { UploadArea } from "@/components/UploadArea";
import { ImagePreview } from "@/components/ImagePreview";
import { OCRResultTable } from "@/components/OCRResultTable";
import { AIStructuredTable } from "@/components/AIStructuredTable";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [resultView, setResultView] = useState<"raw" | "ai">("raw");
  const {
    status,
    result,
    error,
    rows,
    aiStatus,
    aiResult,
    aiError,
    processImage,
    retryAi,
    clearResults,
    updateRowText,
    deleteRow,
    updateAiCell,
  } = useOCR();

  const showingAi = resultView === "ai" && Boolean(aiResult);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setImageFile(file);
      setResultView("ai");
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
    setImageFile(null);
    setResultView("raw");
    clearResults();
  };

  const handleRemoveImage = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
    setImageFile(null);
    setResultView("raw");
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

  return (
    <main className="workspace-shell flex-grow">
      <header className="workspace-intro">
        <div>
          <span className="eyebrow">
            <span className="material-symbols-outlined text-base" aria-hidden="true">document_scanner</span>
            {getEngineLabel(engine)} workbench
          </span>
          <h1 className="workspace-title mt-4">Turn a screenshot into a clean table.</h1>
          <p className="workspace-copy">
            Add a document image, compare the raw OCR with the AI-shaped table, then copy the version you trust into Excel.
          </p>
        </div>
        <div className="status-chip" aria-live="polite">
          <span className="status-dot" data-state={status} aria-hidden="true" />
          {getStatusLabel()}
        </div>
      </header>

      <div className="workbench-grid">
      <section className="workbench-side" aria-label="Source image">
        {!imageUrl ? (
          <>
            <UploadArea
              onFileSelect={handleFileSelect}
              disabled={status === "processing"}
            />
            <div className="session-card">
              <h2 className="panel-title">Three quick passes</h2>
              <ol className="flow-list mt-4">
                <li><span className="flow-number">01</span> Read the visible text</li>
                <li><span className="flow-number">02</span> Shape fields into columns</li>
                <li><span className="flow-number">03</span> Review and export</li>
              </ol>
            </div>
          </>
        ) : (
          <div className="workbench-side">
            <ImagePreview imageUrl={imageUrl} onClear={handleRemoveImage} />

            {status === "processing" && (
              <div className="notice notice--processing" role="status">
                <span className="spinner" aria-hidden="true" />
                <span>
                  Processing with {getEngineLabel(engine)}...
                </span>
              </div>
            )}

            {status === "failed" && error && (
              <div className="notice notice--error" role="alert">
                <span className="material-symbols-outlined text-lg" aria-hidden="true">error</span>
                <span>{error}</span>
              </div>
            )}

            {status === "completed" && result && (
              <div className="notice notice--success" role="status">
                <span className="material-symbols-outlined text-lg" aria-hidden="true">check_circle</span>
                <div className="w-full">
                  <strong className="block font-headline-sm">OCR pass complete</strong>
                  <div className="metrics-grid mt-3">
                    <div className="metric-card">
                      <span className="metric-label">Detected</span>
                      <span className="metric-value">{result.metrics.detectedBoxes} boxes</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Recognized</span>
                      <span className="metric-value">{result.metrics.recognizedCount} lines</span>
                    </div>
                    <div className="metric-card">
                      <span className="metric-label">Time</span>
                      <span className="metric-value">{result.metrics.totalMs.toFixed(0)} ms</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleClear}
              className="ui-button ui-button--quiet justify-self-start"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">refresh</span>
              Start over
            </button>
          </div>
        )}
      </section>

      <section className="panel result-panel" aria-label="OCR results" aria-busy={status === "processing" || aiStatus === "processing"}>
          <div className="panel-header">
            <div className="flex items-center gap-3">
              <h2 className="panel-title">Review table</h2>
              {rows.length > 0 && (
                <div className="segmented" aria-label="Result view">
                  <button
                    type="button"
                    onClick={() => setResultView("raw")}
                    className="segment-button"
                    data-active={!showingAi}
                  >
                    Raw OCR
                  </button>
                  <button
                    type="button"
                    onClick={() => aiResult && setResultView("ai")}
                    disabled={!aiResult}
                    className="segment-button"
                    data-active={showingAi}
                  >
                    AI table
                    {aiStatus === "processing" && (
                      <span className="spinner" aria-hidden="true" />
                    )}
                  </button>
                </div>
              )}
            </div>
            <span className="panel-subtitle">Double-click a value to edit it</span>
          </div>

          {rows.length > 0 && aiStatus === "processing" && (
            <div className="notice notice--processing m-3" role="status">
              <span className="spinner" aria-hidden="true" />
              <span>Correcting OCR and reconstructing the spreadsheet with AI…</span>
            </div>
          )}

          {rows.length > 0 && aiStatus === "failed" && aiError && (
            <div className="notice notice--warning m-3 flex-wrap justify-between">
              <p className="flex items-start gap-2">
                <span className="material-symbols-outlined text-base" aria-hidden="true">warning</span>
                <span>Raw OCR is available. AI enhancement failed: {aiError}</span>
              </p>
              <button
                type="button"
                disabled={!imageFile}
                onClick={() => imageFile && retryAi(imageFile)}
                className="ui-button"
              >
                Retry AI
              </button>
            </div>
          )}

          {showingAi && aiResult ? (
            <AIStructuredTable result={aiResult} onCellUpdate={updateAiCell} />
          ) : (
            <OCRResultTable
              rows={rows}
              onRowUpdate={updateRowText}
              onRowDelete={deleteRow}
            />
          )}

          <div className="panel-footer">
            <ActionButtons
              rows={rows}
              aiResult={showingAi ? aiResult : null}
              onClear={handleClear}
            />
          </div>
      </section>
      </div>
    </main>
  );
}

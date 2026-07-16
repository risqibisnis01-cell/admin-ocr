"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AIStructuredTable } from "@/components/AIStructuredTable";
import { ActionButtons } from "@/components/ActionButtons";
import { useAiNativeSession } from "@/hooks/useAiNativeSession";
import { useClipboardPaste } from "@/hooks/useClipboardPaste";
import { runAiNativeOcr } from "@/lib/ai-native-client";
import type { AiNativeExtraction } from "@/types/ai-native";
import type { AiStructuredResult } from "@/types/ocr";

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export default function AiNativeWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestImageUrl, setLatestImageUrl] = useState<string | null>(null);
  const [latestFileName, setLatestFileName] = useState<string | null>(null);
  const [latestExtraction, setLatestExtraction] = useState<AiNativeExtraction | null>(null);
  const {
    session,
    startNewSession,
    appendExtraction,
    updateCell,
    deleteRow,
  } = useAiNativeSession();

  useEffect(() => {
    return () => {
      if (latestImageUrl) URL.revokeObjectURL(latestImageUrl);
    };
  }, [latestImageUrl]);

  const processFile = useCallback(
    async (file: File) => {
      if (processing) return;
      if (!ACCEPTED_TYPES.has(file.type)) {
        setError("Choose a PNG, JPEG, or WEBP image.");
        return;
      }
      if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
        setError("Image must be non-empty and no larger than 10 MB.");
        return;
      }

      requestControllerRef.current?.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;
      setProcessing(true);
      setError(null);
      setLatestFileName(file.name || "Pasted image");
      setLatestImageUrl(URL.createObjectURL(file));

      try {
        const extraction = await runAiNativeOcr(
          file,
          session?.columns ?? [],
          controller.signal,
        );
        if (controller.signal.aborted) return;
        appendExtraction(extraction);
        setLatestExtraction(extraction);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "AI Native OCR failed.");
      } finally {
        if (!controller.signal.aborted) setProcessing(false);
      }
    },
    [appendExtraction, processing, session],
  );

  useClipboardPaste({ onPaste: processFile });

  const beginNewSession = () => {
    if (
      session &&
      session.rows.length > 0 &&
      !window.confirm("Start a new session? The current table will be removed from this browser.")
    ) {
      return;
    }
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setProcessing(false);
    setError(null);
    setLatestExtraction(null);
    setLatestFileName(null);
    setLatestImageUrl(null);
    startNewSession();
  };

  const tableResult = useMemo<AiStructuredResult | null>(() => {
    if (!session || session.columns.length === 0) return null;
    return {
      columns: session.columns,
      rows: session.rows,
      corrections: latestExtraction?.corrections ?? [],
      warnings: latestExtraction?.warnings ?? [],
    };
  }, [latestExtraction, session]);

  return (
    <main className="workspace-shell flex-grow">
      <header className="workspace-intro">
        <div>
          <span className="eyebrow">
            <span className="material-symbols-outlined text-base" aria-hidden="true">auto_awesome</span>
            Direct vision extraction
          </span>
          <h1 className="workspace-title mt-4">Build a workbook, one image at a time.</h1>
          <p className="workspace-copy">
            Upload the first image to create the columns. Add similar images one by one and each extracted record will join the same Excel-ready table.
          </p>
        </div>
        <button
          type="button"
          onClick={beginNewSession}
          className="ui-button self-start"
        >
          <span>New session</span>
          <span className="material-symbols-outlined text-lg" aria-hidden="true">add</span>
        </button>
      </header>

      <div className="native-grid">
        <section className="workbench-side" aria-label="Image queue and session status">
          <div className="upload-frame">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={processing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) processFile(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={processing}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files[0];
                if (file) processFile(file);
              }}
              className="upload-zone"
              data-dragging={dragging}
              aria-describedby="ai-native-upload-help"
            >
              <span className="upload-icon" aria-hidden="true">
                <span className="material-symbols-outlined text-3xl">
                  {processing ? "progress_activity" : "add_photo_alternate"}
                </span>
              </span>
              <span className="upload-title">
                {processing
                  ? "Reading image with AI…"
                  : session?.columns.length
                    ? "Add the next similar image"
                    : "Upload the first image"}
              </span>
              <span className="paste-hint">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">content_paste</span>
                Ctrl+V also works
              </span>
            </button>
            <p id="ai-native-upload-help" className="upload-helper">
              Drop a screenshot onto the button, or click to browse. PNG, JPEG, and WEBP up to 10 MB.
            </p>
          </div>

          {error && (
            <div role="alert" className="notice notice--error">
              <span className="material-symbols-outlined text-lg" aria-hidden="true">error</span>
              <span>{error}</span>
            </div>
          )}

          {latestImageUrl && (
            <figure className="preview-card">
              <Image
                src={latestImageUrl}
                alt="Latest uploaded document"
                width={800}
                height={600}
                unoptimized
                className="preview-image"
              />
              <figcaption className="mt-3 truncate px-1 font-body-sm text-body-sm text-on-surface-variant">
                Latest: {latestFileName}
              </figcaption>
            </figure>
          )}

          <div className="session-card">
            <div className="flex items-center justify-between gap-3">
              <span className="font-body-sm text-body-sm text-on-surface-variant">Current session</span>
              <span className="status-chip normal-case tracking-normal">
                {session ? session.id.slice(0, 8) : "Not started"}
              </span>
            </div>
            <dl className="session-stats">
              <div className="session-stat">
                <dt className="font-body-sm text-body-sm text-on-surface-variant">Images</dt>
                <dd className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface tabular-nums">
                  {session?.uploadCount ?? 0}
                </dd>
              </div>
              <div className="session-stat">
                <dt className="font-body-sm text-body-sm text-on-surface-variant">Rows</dt>
                <dd className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface tabular-nums">
                  {session?.rows.length ?? 0}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="panel result-panel" aria-label="AI Native session table" aria-busy={processing}>
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Session table</h2>
                <p className="panel-subtitle">
                  {session?.columns.length
                    ? `${session.columns.length} columns · ${session.rows.length} rows`
                    : "Columns will be created from the first image"}
                </p>
              </div>
              {processing && (
                <div className="status-chip" role="status">
                  <span className="spinner" aria-hidden="true" />
                  Extracting
                </div>
              )}
            </div>

            {tableResult ? (
              <AIStructuredTable
                result={tableResult}
                onCellUpdate={updateCell}
                onRowDelete={deleteRow}
              />
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon" aria-hidden="true">
                  <span className="material-symbols-outlined text-3xl">table</span>
                </span>
                <h3 className="panel-title">
                  Your workbook starts with one image
                </h3>
                <p className="mt-2 max-w-md font-body-sm text-body-sm text-on-surface-variant text-pretty">
                  AI will identify the fields, create the columns, and add the visible data as the first row or rows.
                </p>
              </div>
            )}

            <div className="panel-footer">
              <ActionButtons
                rows={[]}
                aiResult={tableResult}
                onClear={beginNewSession}
                showClear={false}
              />
            </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { runAiStructure } from "@/lib/ai-structure-client";
import { runGoogleVisionOcr } from "@/lib/google-vision";
import { runOcr } from "@/lib/paddleocr";
import { runTesseractOcr } from "@/lib/tesseract";
import type {
  AiStatus,
  AiStructuredResult,
  OcrEngine,
  OcrResult,
  OcrStatus,
  OcrTableRow,
} from "@/types/ocr";

export function useOCR() {
  const [status, setStatus] = useState<OcrStatus>("idle");
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<OcrTableRow[]>([]);
  const [engine, setEngine] = useState<OcrEngine>("paddleocr");
  const [aiStatus, setAiStatus] = useState<AiStatus>("idle");
  const [aiResult, setAiResult] = useState<AiStructuredResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const aiControllerRef = useRef<AbortController | null>(null);

  const enhanceWithAi = useCallback(
    async (imageSource: Blob | File, ocrResult: OcrResult, requestId: number) => {
      aiControllerRef.current?.abort();
      const controller = new AbortController();
      aiControllerRef.current = controller;
      setAiStatus("processing");
      setAiResult(null);
      setAiError(null);

      try {
        const structured = await runAiStructure(imageSource, ocrResult, controller.signal);
        if (requestIdRef.current !== requestId) return;
        setAiResult(structured);
        setAiStatus("completed");
      } catch (err) {
        if (controller.signal.aborted || requestIdRef.current !== requestId) return;
        setAiError(err instanceof Error ? err.message : "AI enhancement failed.");
        setAiStatus("failed");
      }
    },
    [],
  );

  const processImage = useCallback(
    async (imageSource: Blob | File, selectedEngine?: OcrEngine) => {
      const activeEngine = selectedEngine || engine;
      const requestId = ++requestIdRef.current;
      aiControllerRef.current?.abort();
      setStatus("processing");
      setError(null);
      setResult(null);
      setRows([]);
      setAiStatus("idle");
      setAiResult(null);
      setAiError(null);

      try {
        let ocrResult: OcrResult;
        if (activeEngine === "tesseract") {
          ocrResult = await runTesseractOcr(imageSource);
        } else if (activeEngine === "google-vision") {
          ocrResult = await runGoogleVisionOcr(imageSource);
        } else {
          ocrResult = await runOcr(imageSource);
        }
        if (requestIdRef.current !== requestId) return;

        setResult(ocrResult);
        setRows(
          ocrResult.items.map((item, index) => ({
            id: index + 1,
            text: item.text,
            confidence: `${(item.score * 100).toFixed(1)}%`,
          })),
        );
        setStatus("completed");

        await enhanceWithAi(imageSource, ocrResult, requestId);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        console.error("[useOCR] Error:", err);
        setError(err instanceof Error ? err.message : "OCR processing failed");
        setStatus("failed");
      }
    },
    [engine, enhanceWithAi],
  );

  const retryAi = useCallback(
    async (imageSource: Blob | File) => {
      if (!result) return;
      await enhanceWithAi(imageSource, result, requestIdRef.current);
    },
    [enhanceWithAi, result],
  );

  const clearResults = useCallback(() => {
    requestIdRef.current += 1;
    aiControllerRef.current?.abort();
    aiControllerRef.current = null;
    setStatus("idle");
    setResult(null);
    setError(null);
    setRows([]);
    setAiStatus("idle");
    setAiResult(null);
    setAiError(null);
  }, []);

  const updateRowText = useCallback((id: number, text: string) => {
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, text } : row)),
    );
  }, []);

  const deleteRow = useCallback((id: number) => {
    setRows((previous) => previous.filter((row) => row.id !== id));
  }, []);

  const updateAiCell = useCallback(
    (rowIndex: number, columnIndex: number, value: string) => {
      setAiResult((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          rows: previous.rows.map((row, currentRowIndex) =>
            currentRowIndex !== rowIndex
              ? row
              : {
                  cells: row.cells.map((cell, currentColumnIndex) =>
                    currentColumnIndex !== columnIndex
                      ? cell
                      : { ...cell, value, needsReview: false, reason: "" },
                  ),
                },
          ),
        };
      });
    },
    [],
  );

  return {
    status,
    result,
    error,
    rows,
    engine,
    setEngine,
    aiStatus,
    aiResult,
    aiError,
    processImage,
    retryAi,
    clearResults,
    updateRowText,
    deleteRow,
    updateAiCell,
  };
}

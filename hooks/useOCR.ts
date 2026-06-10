"use client";

import { useState, useCallback } from "react";
import { runOcr } from "@/lib/paddleocr";
import { runTesseractOcr } from "@/lib/tesseract";
import { runGoogleVisionOcr } from "@/lib/google-vision";
import type { OcrStatus, OcrTableRow, OcrEngine } from "@/types/ocr";

export function useOCR() {
  const [status, setStatus] = useState<OcrStatus>("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<OcrTableRow[]>([]);
  const [engine, setEngine] = useState<OcrEngine>("paddleocr");

  const processImage = useCallback(
    async (imageSource: Blob | File, selectedEngine?: OcrEngine) => {
      const activeEngine = selectedEngine || engine;
      setStatus("processing");
      setError(null);
      setResult(null);

      try {
        let ocrResult;
        if (activeEngine === "tesseract") {
          ocrResult = await runTesseractOcr(imageSource);
        } else if (activeEngine === "google-vision") {
          ocrResult = await runGoogleVisionOcr(imageSource);
        } else {
          ocrResult = await runOcr(imageSource);
        }
        setResult(ocrResult);

        const tableRows: OcrTableRow[] = ocrResult.items.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: { text: string; score: number }, index: number) => ({
            id: index + 1,
            text: item.text,
            confidence: (item.score * 100).toFixed(1) + "%",
          })
        );

        setRows(tableRows);
        setStatus("completed");
      } catch (err) {
        console.error("[useOCR] Error:", err);
        const message =
          err instanceof Error
            ? `${err.message}`
            : "OCR processing failed";
        setError(message);
        setStatus("failed");
      }
    },
    [engine]
  );

  const clearResults = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
    setRows([]);
  }, []);

  const updateRowText = useCallback((id: number, text: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, text } : row))
    );
  }, []);

  const deleteRow = useCallback((id: number) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }, []);

  return {
    status,
    result,
    error,
    rows,
    engine,
    setEngine,
    processImage,
    clearResults,
    updateRowText,
    deleteRow,
  };
}

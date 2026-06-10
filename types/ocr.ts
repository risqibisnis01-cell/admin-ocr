/* eslint-disable @typescript-eslint/no-explicit-any */
export type OcrEngine = "paddleocr" | "tesseract" | "google-vision";

export type OcrResult = any;

export type OcrStatus = "idle" | "loading" | "processing" | "completed" | "failed";

export interface OcrState {
  status: OcrStatus;
  result: OcrResult | null;
  error: string | null;
  imageUrl: string | null;
}

export interface OcrTableRow {
  id: number;
  text: string;
  confidence: string;
}

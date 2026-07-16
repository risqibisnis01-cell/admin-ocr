export type OcrEngine = "paddleocr" | "tesseract" | "google-vision";

export interface OcrItem {
  text: string;
  score: number;
  poly?: number[][];
}

export interface OcrResult {
  image: {
    width: number;
    height: number;
  };
  items: OcrItem[];
  metrics: {
    detMs: number;
    recMs: number;
    totalMs: number;
    detectedBoxes: number;
    recognizedCount: number;
  };
  runtime: {
    backend: string;
    provider: string;
  };
}

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

export type AiStatus = "idle" | "processing" | "completed" | "failed";

export interface AiTableCell {
  value: string;
  sourceText: string;
  needsReview: boolean;
  reason: string;
}

export interface AiTableRow {
  cells: AiTableCell[];
}

export interface AiCorrection {
  original: string;
  corrected: string;
  reason: string;
}

export interface AiStructuredResult {
  columns: string[];
  rows: AiTableRow[];
  corrections: AiCorrection[];
  warnings: string[];
}

export interface AiStructureRequest {
  image: string;
  ocr: OcrResult;
}

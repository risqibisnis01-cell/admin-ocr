import type { AiCorrection, AiTableRow } from "@/types/ocr";

export interface AiNativeOcrRequest {
  image: string;
  columns?: string[];
}

export interface AiNativeSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  columns: string[];
  rows: AiTableRow[];
  uploadCount: number;
}

export interface AiNativeExtraction {
  columns: string[];
  rows: AiTableRow[];
  corrections: AiCorrection[];
  warnings: string[];
}

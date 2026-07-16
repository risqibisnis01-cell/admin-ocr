import { blobToDataUrl } from "@/lib/ai-structure-client";
import type { AiNativeExtraction } from "@/types/ai-native";

export async function runAiNativeOcr(
  imageSource: Blob | File,
  columns: string[],
  signal?: AbortSignal,
): Promise<AiNativeExtraction> {
  const image = await blobToDataUrl(imageSource);
  const response = await fetch("/api/ai-native-ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image,
      columns: columns.length > 0 ? columns : undefined,
    }),
    signal,
  });

  const payload = (await response.json().catch(() => null)) as
    | AiNativeExtraction
    | { error?: string }
    | null;
  if (!response.ok) {
    const message = payload && "error" in payload ? payload.error : undefined;
    throw new Error(message || `AI Native OCR returned HTTP ${response.status}.`);
  }
  return payload as AiNativeExtraction;
}

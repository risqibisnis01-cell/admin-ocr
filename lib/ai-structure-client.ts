import type { AiStructuredResult, OcrResult } from "@/types/ocr";

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(blob);
  });
}

export async function runAiStructure(
  imageSource: Blob | File,
  ocr: OcrResult,
  signal?: AbortSignal,
): Promise<AiStructuredResult> {
  const image = await blobToDataUrl(imageSource);
  const response = await fetch("/api/ai-structure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, ocr }),
    signal,
  });

  const payload = (await response.json().catch(() => null)) as
    | AiStructuredResult
    | { error?: string }
    | null;

  if (!response.ok) {
    const message = payload && "error" in payload ? payload.error : undefined;
    throw new Error(message || `AI enhancement returned HTTP ${response.status}.`);
  }

  return payload as AiStructuredResult;
}

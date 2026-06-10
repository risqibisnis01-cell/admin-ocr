/* eslint-disable @typescript-eslint/no-explicit-any */
import Tesseract from "tesseract.js";

let workerInstance: any = null;
let initializing = false;

async function getWorker(): Promise<any> {
  if (workerInstance) return workerInstance;
  if (initializing) {
    // Wait for ongoing initialization
    while (initializing) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return workerInstance;
  }

  initializing = true;
  try {
    console.log("[Tesseract] Creating worker...");
    workerInstance = await Tesseract.createWorker("eng", 1, {
      logger: (m: any) => {
        if (m.status === "recognizing text") {
          console.log(`[Tesseract] ${(m.progress * 100).toFixed(0)}%`);
        }
      },
    });
    console.log("[Tesseract] Worker ready");
    return workerInstance;
  } catch (err) {
    console.error("[Tesseract] Worker creation failed:", err);
    workerInstance = null;
    throw err;
  } finally {
    initializing = false;
  }
}

export async function runTesseractOcr(
  imageSource: Blob | File
): Promise<any> {
  const worker = await getWorker();

  console.log("[Tesseract] Starting recognition...");
  const result = await worker.recognize(imageSource);
  const { data } = result;
  console.log("[Tesseract] Recognition complete, text length:", data.text?.length);

  // Extract lines from the nested block -> paragraph -> line structure
  const lines: any[] = [];
  if (data.blocks) {
    for (const block of data.blocks) {
      if (block.paragraphs) {
        for (const paragraph of block.paragraphs) {
          if (paragraph.lines) {
            for (const line of paragraph.lines) {
              lines.push(line);
            }
          }
        }
      }
    }
  }

  // If no blocks/lines found, fall back to splitting text by newlines
  if (lines.length === 0 && data.text) {
    const textLines = data.text.split("\n").filter((l: string) => l.trim());
    for (const text of textLines) {
      lines.push({
        text,
        confidence: data.confidence || 80,
        bbox: { x0: 0, y0: 0, x1: 100, y1: 20 },
      });
    }
  }

  const items = lines.map((line: any, index: number) => ({
    text: line.text.trim(),
    score: (line.confidence || 80) / 100,
    poly: line.bbox
      ? [
          [line.bbox.x0, line.bbox.y0],
          [line.bbox.x1, line.bbox.y0],
          [line.bbox.x1, line.bbox.y1],
          [line.bbox.x0, line.bbox.y1],
        ]
      : [
          [0, index * 20],
          [100, index * 20],
          [100, index * 20 + 20],
          [0, index * 20 + 20],
        ],
  }));

  return {
    image: { width: 0, height: 0 },
    items,
    metrics: {
      detMs: 0,
      recMs: 0,
      totalMs: 0,
      detectedBoxes: items.length,
      recognizedCount: items.length,
    },
    runtime: {
      backend: "tesseract.js",
      provider: "tesseract",
    },
  };
}

export async function terminateTesseract() {
  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }
}

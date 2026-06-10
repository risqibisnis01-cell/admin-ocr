/* eslint-disable @typescript-eslint/no-explicit-any */
let ocrInstance: any = null;
let initializing = false;

/**
 * Custom fetch that routes PaddleOCR model downloads through our
 * server-side proxy, bypassing CORS / network restrictions.
 */
function proxiedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url;

  // Route Baidu CDN model downloads through our API proxy
  if (url.includes("paddle-model-ecology.bj.bcebos.com")) {
    const proxyUrl = `/api/proxy-model?url=${encodeURIComponent(url)}`;
    console.log("[PaddleOCR] Proxying model download:", url);
    return fetch(proxyUrl, init);
  }

  return fetch(input, init);
}

async function getOcrInstance(): Promise<any> {
  if (ocrInstance) return ocrInstance;
  if (initializing) {
    while (initializing) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return ocrInstance;
  }

  initializing = true;
  try {
    console.log("[PaddleOCR] Loading module...");
    const { PaddleOCR } = await import("@paddleocr/paddleocr-js");
    console.log("[PaddleOCR] Module loaded, creating instance...");

    ocrInstance = await PaddleOCR.create({
      lang: "en",
      ocrVersion: "PP-OCRv5",
      fetch: proxiedFetch,
      ortOptions: {
        backend: "wasm",
        numThreads: 1,
      },
    });

    console.log("[PaddleOCR] Engine ready");
    return ocrInstance;
  } catch (err) {
    console.error("[PaddleOCR] Init failed:", err);
    ocrInstance = null;
    throw err;
  } finally {
    initializing = false;
  }
}

export async function runOcr(
  imageSource: Blob | File | HTMLImageElement
): Promise<any> {
  const ocr = await getOcrInstance();
  console.log("[PaddleOCR] Starting recognition...");
  const [result] = await ocr.predict(imageSource);
  console.log("[PaddleOCR] Recognition complete");
  return result;
}

export function resetOcrInstance() {
  if (ocrInstance) {
    ocrInstance.dispose();
    ocrInstance = null;
  }
}

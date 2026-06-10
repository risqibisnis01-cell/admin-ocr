/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Client-side helper that sends an image to our server-side
 * Google Vision API route and returns normalized OCR results.
 */

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function runGoogleVisionOcr(
  imageSource: Blob | File
): Promise<any> {
  console.log("[Google Vision] Converting image to base64...");
  const base64Image = await blobToBase64(imageSource);

  console.log("[Google Vision] Sending to API...");
  const response = await fetch("/api/google-vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Google Vision API returned ${response.status}`
    );
  }

  const result = await response.json();
  console.log("[Google Vision] Recognition complete");
  return result;
}

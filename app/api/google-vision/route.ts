import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthenticated } from "@/lib/auth";

/**
 * Server-side API route for Google Cloud Vision AI OCR.
 * Receives a base64-encoded image, sends it to the Vision API,
 * and returns normalized OCR results.
 */

const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

export async function POST(request: NextRequest) {
  if (!isRequestAuthenticated(request)) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_VISION_API_KEY is not configured in environment variables." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }

    // Strip the data URL prefix if present (e.g. "data:image/png;base64,...")
    const base64Content = image.includes(",") ? image.split(",")[1] : image;

    const startTime = Date.now();

    const visionResponse = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Content },
            features: [
              { type: "TEXT_DETECTION", maxResults: 50 },
            ],
          },
        ],
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!visionResponse.ok) {
      const errText = await visionResponse.text();
      console.error("[Google Vision] API error:", errText);
      return NextResponse.json(
        { error: `Google Vision API error: ${visionResponse.status}` },
        { status: visionResponse.status }
      );
    }

    const data = await visionResponse.json();
    const annotations = data.responses?.[0]?.textAnnotations || [];

    // The first annotation is the full text; the rest are individual words/phrases.
    // We skip the first (full-page) annotation and use individual ones.
    const items = annotations.slice(1).map(
      (
        annotation: {
          description: string;
          boundingPoly?: {
            vertices?: Array<{ x?: number; y?: number }>;
          };
        },
        index: number
      ) => {
        const vertices = annotation.boundingPoly?.vertices || [];
        const poly = vertices.map((v: { x?: number; y?: number }) => [
          v.x || 0,
          v.y || 0,
        ]);

        return {
          text: annotation.description,
          score: 0.99, // Google Vision doesn't return per-word confidence for TEXT_DETECTION
          poly:
            poly.length === 4
              ? poly
              : [
                  [0, index * 20],
                  [100, index * 20],
                  [100, index * 20 + 20],
                  [0, index * 20 + 20],
                ],
        };
      }
    );

    // Also extract full text and page-level info
    const fullTextAnnotation = data.responses?.[0]?.fullTextAnnotation;
    const pages = fullTextAnnotation?.pages || [];
    const imageWidth = pages[0]?.width || 0;
    const imageHeight = pages[0]?.height || 0;

    // Group by lines using fullTextAnnotation for better structure
    const lineItems: Array<{ text: string; score: number; poly: number[][] }> = [];

    if (fullTextAnnotation?.pages) {
      for (const page of fullTextAnnotation.pages) {
        for (const block of page.blocks || []) {
          for (const paragraph of block.paragraphs || []) {
            // Build line text from words
            let lineText = "";
            let lineConfidence = 0;
            const wordConfidences: number[] = [];
            let linePoly: number[][] = [];

            for (const word of paragraph.words || []) {
              const wordText = (word.symbols || [])
                .map((s: { text: string }) => s.text)
                .join("");
              lineText += (lineText ? " " : "") + wordText;
              wordConfidences.push(word.confidence || 0.99);

              if (word.boundingBox?.vertices) {
                const verts = word.boundingBox.vertices;
                if (linePoly.length === 0) {
                  linePoly = verts.map((v: { x?: number; y?: number }) => [
                    v.x || 0,
                    v.y || 0,
                  ]);
                } else {
                  // Extend bounding box
                  const wVerts = verts.map((v: { x?: number; y?: number }) => [
                    v.x || 0,
                    v.y || 0,
                  ]);
                  if (wVerts.length === 4 && linePoly.length === 4) {
                    linePoly[1] = wVerts[1];
                    linePoly[2] = wVerts[2];
                  }
                }
              }
            }

            if (lineText.trim()) {
              lineConfidence =
                wordConfidences.length > 0
                  ? wordConfidences.reduce((a, b) => a + b, 0) /
                    wordConfidences.length
                  : 0.99;

              lineItems.push({
                text: lineText.trim(),
                score: lineConfidence,
                poly:
                  linePoly.length === 4
                    ? linePoly
                    : [
                        [0, lineItems.length * 20],
                        [100, lineItems.length * 20],
                        [100, lineItems.length * 20 + 20],
                        [0, lineItems.length * 20 + 20],
                      ],
              });
            }
          }
        }
      }
    }

    // Use line-grouped items if available, otherwise fall back to word-level items
    const resultItems = lineItems.length > 0 ? lineItems : items;

    return NextResponse.json({
      image: { width: imageWidth, height: imageHeight },
      items: resultItems,
      metrics: {
        detMs: 0,
        recMs: 0,
        totalMs: elapsed,
        detectedBoxes: resultItems.length,
        recognizedCount: resultItems.length,
      },
      runtime: {
        backend: "google-vision-api",
        provider: "google-cloud",
      },
    });
  } catch (err) {
    console.error("[Google Vision] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Google Vision processing failed",
      },
      { status: 500 }
    );
  }
}

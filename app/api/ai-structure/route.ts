import { NextResponse } from "next/server";
import {
  AiStructureError,
  requestStructuredTable,
} from "@/lib/ai-structure-server";
import { isRequestAuthenticated } from "@/lib/auth";

const MAX_REQUEST_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  if (!isRequestAuthenticated(request)) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json." },
      { status: 415 },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "Request body is too large." },
      { status: 413 },
    );
  }

  try {
    const body = await request.json();
    const result = await requestStructuredTable(body);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Request body contains invalid JSON." },
        { status: 400 },
      );
    }

    if (error instanceof AiStructureError) {
      if (error.status >= 500) {
        console.error(`[AI Structure] ${error.message}`);
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[AI Structure] Unexpected server error");
    return NextResponse.json(
      { error: "AI enhancement failed unexpectedly." },
      { status: 500 },
    );
  }
}

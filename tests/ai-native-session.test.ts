import { describe, expect, it } from "vitest";
import { parseNativeSession } from "@/hooks/useAiNativeSession";
import type { AiNativeSession } from "@/types/ai-native";

const session: AiNativeSession = {
  id: "session-1",
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:01:00.000Z",
  columns: ["Name"],
  rows: [
    {
      cells: [
        {
          value: "Alice",
          sourceText: "Alice",
          needsReview: false,
          reason: "",
        },
      ],
    },
  ],
  uploadCount: 1,
};

describe("AI Native OCR session storage", () => {
  it("restores a valid workbook session", () => {
    expect(parseNativeSession(JSON.stringify(session))).toEqual(session);
  });

  it("ignores malformed or incompatible stored data", () => {
    expect(parseNativeSession("not-json")).toBeNull();
    expect(parseNativeSession(JSON.stringify({ ...session, rows: [{ cells: [{ value: 12 }] }] }))).toBeNull();
  });
});

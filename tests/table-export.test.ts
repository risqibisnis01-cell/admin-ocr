import { describe, expect, it } from "vitest";
import { getExportTable, tableToCsv, tableToTsv } from "@/lib/table-export";
import type { AiStructuredResult } from "@/types/ocr";

const aiResult: AiStructuredResult = {
  columns: ["Name", "Amount"],
  rows: [
    {
      cells: [
        { value: "Alice", sourceText: "Alice", needsReview: false, reason: "" },
        { value: "1,000", sourceText: "1,000", needsReview: false, reason: "" },
      ],
    },
  ],
  corrections: [],
  warnings: [],
};

describe("table exports", () => {
  it("uses the AI table for Excel-ready TSV when selected", () => {
    const table = getExportTable([{ id: 1, text: "raw", confidence: "90%" }], aiResult);
    expect(tableToTsv(table)).toBe("Name\tAmount\nAlice\t1,000");
  });

  it("escapes CSV delimiters and preserves rows and columns", () => {
    const table = getExportTable([], aiResult);
    expect(tableToCsv(table)).toBe("Name;Amount\r\nAlice;1,000");
  });

  it("quotes values containing the semicolon delimiter, quotes, or line breaks", () => {
    expect(
      tableToCsv({
        columns: ["Name", "Notes"],
        rows: [["Alice; Bob", 'Said "done"\non site']],
      }),
    ).toBe('Name;Notes\r\n"Alice; Bob";"Said ""done""\non site"');
  });

  it("keeps raw OCR export available when no AI table is selected", () => {
    const table = getExportTable([{ id: 1, text: "raw OCR", confidence: "90%" }], null);
    expect(tableToTsv(table)).toBe("Text\nraw OCR");
  });
});

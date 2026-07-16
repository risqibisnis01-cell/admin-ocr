import type { AiStructuredResult, OcrTableRow } from "@/types/ocr";

export interface ExportTable {
  columns: string[];
  rows: string[][];
}

export const CSV_DELIMITER = ";";

export function getExportTable(
  rawRows: OcrTableRow[],
  aiResult?: AiStructuredResult | null,
): ExportTable {
  if (aiResult) {
    return {
      columns: aiResult.columns,
      rows: aiResult.rows.map((row) => row.cells.map((cell) => cell.value)),
    };
  }

  return {
    columns: ["Text"],
    rows: rawRows.map((row) => [row.text]),
  };
}

function escapeDelimited(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes("\n") || value.includes("\r") || value.includes(delimiter)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function tableToTsv(table: ExportTable): string {
  return [table.columns, ...table.rows]
    .map((row) => row.map((value) => escapeDelimited(value, "\t")).join("\t"))
    .join("\n");
}

export function tableToCsv(table: ExportTable, delimiter = CSV_DELIMITER): string {
  if (delimiter.length !== 1 || delimiter === '"' || delimiter === "\r" || delimiter === "\n") {
    throw new Error("CSV delimiter must be one valid character.");
  }

  return [table.columns, ...table.rows]
    .map((row) => row.map((value) => escapeDelimited(value, delimiter)).join(delimiter))
    .join("\r\n");
}

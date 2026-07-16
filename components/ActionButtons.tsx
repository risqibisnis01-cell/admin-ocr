"use client";

import { useState } from "react";
import { getExportTable, tableToCsv, tableToTsv } from "@/lib/table-export";
import type { AiStructuredResult, OcrTableRow } from "@/types/ocr";

interface ActionButtonsProps {
  rows: OcrTableRow[];
  aiResult?: AiStructuredResult | null;
  onClear: () => void;
  showClear?: boolean;
}

export function ActionButtons({
  rows,
  aiResult,
  onClear,
  showClear = true,
}: ActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const table = getExportTable(rows, aiResult);
  const hasResults = table.rows.length > 0;

  const copyToExcel = async () => {
    const tsv = tableToTsv(table);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = tsv;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportCSV = () => {
    const csvContent = tableToCsv(table);

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ocr-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={copyToExcel}
        disabled={!hasResults}
        className="ui-button ui-button--primary"
        aria-live="polite"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">
          {copied ? "check" : "table_view"}
        </span>
        {copied ? "Copied!" : "Copy to Excel"}
      </button>
      <button
        type="button"
        onClick={exportCSV}
        disabled={!hasResults}
        className="ui-button"
      >
        <span className="material-symbols-outlined text-sm" aria-hidden="true">download</span>
        Export CSV
      </button>
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          disabled={!hasResults}
          className="ui-button ui-button--danger sm:ml-auto"
        >
          <span className="material-symbols-outlined text-sm" aria-hidden="true">delete</span>
          Clear
        </button>
      )}
    </>
  );
}

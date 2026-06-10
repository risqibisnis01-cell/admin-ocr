"use client";

import { useState } from "react";
import type { OcrTableRow } from "@/types/ocr";

interface ActionButtonsProps {
  rows: OcrTableRow[];
  onClear: () => void;
}

export function ActionButtons({ rows, onClear }: ActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const hasResults = rows.length > 0;

  const copyToExcel = async () => {
    const tsv = rows.map((row) => row.text).join("\t");
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
    const csvContent = rows
      .map((row) => {
        const escaped = row.text.replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join("\n");

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
        onClick={copyToExcel}
        disabled={!hasResults}
        className={`bg-primary text-on-primary font-body-sm text-body-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2 ${
          hasResults
            ? "hover:bg-primary-container hover:text-on-primary-container"
            : "opacity-50 cursor-not-allowed"
        }`}
      >
        <span className="material-symbols-outlined text-sm">table_view</span>
        {copied ? "Copied!" : "Copy to Excel"}
      </button>
      <button
        onClick={exportCSV}
        disabled={!hasResults}
        className={`border border-outline bg-transparent text-on-surface font-body-sm text-body-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
          hasResults
            ? "hover:bg-surface-container"
            : "opacity-50 cursor-not-allowed"
        }`}
      >
        <span className="material-symbols-outlined text-sm">download</span>
        Export CSV
      </button>
      <button
        onClick={onClear}
        disabled={!hasResults}
        className={`ml-auto text-error font-body-sm text-body-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
          hasResults
            ? "hover:bg-error-container hover:text-on-error-container"
            : "opacity-50 cursor-not-allowed"
        }`}
      >
        <span className="material-symbols-outlined text-sm">delete</span>
        Clear
      </button>
    </>
  );
}

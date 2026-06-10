"use client";

import { useState } from "react";
import type { OcrTableRow } from "@/types/ocr";

interface OCRResultTableProps {
  rows: OcrTableRow[];
  onRowUpdate: (id: number, text: string) => void;
  onRowDelete: (id: number) => void;
}

export function OCRResultTable({
  rows,
  onRowUpdate,
  onRowDelete,
}: OCRResultTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleDoubleClick = (row: OcrTableRow) => {
    setEditingId(row.id);
    setEditValue(row.text);
  };

  const handleBlur = () => {
    if (editingId !== null) {
      onRowUpdate(editingId, editValue);
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="flex-grow p-6 flex flex-col items-center justify-center bg-surface-container-lowest text-on-surface-variant min-h-[300px]">
        <span className="material-symbols-outlined text-3xl text-outline mb-2">
          assignment
        </span>
        <p className="font-body-md text-body-md">No OCR results yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-96">
      <table className="w-full text-body-sm font-body-sm">
        <thead className="bg-surface-container sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-on-surface-variant w-12">
              #
            </th>
            <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">
              Text
            </th>
            <th className="px-4 py-3 text-left font-semibold text-on-surface-variant w-24">
              Score
            </th>
            <th className="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-surface-container-low transition-colors"
            >
              <td className="px-4 py-3 text-on-surface-variant">{row.id}</td>
              <td
                className="px-4 py-3 cursor-text text-on-surface"
                onDoubleClick={() => handleDoubleClick(row)}
              >
                {editingId === row.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full px-2 py-1 border border-outline rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface-container-lowest text-on-surface font-body-sm"
                    autoFocus
                  />
                ) : (
                  <span>{row.text}</span>
                )}
              </td>
              <td className="px-4 py-3 font-label-code text-label-code text-on-surface-variant">
                {row.confidence}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onRowDelete(row.id)}
                  className="text-outline hover:text-error hover:bg-error-container hover:text-on-error-container rounded-lg p-1 transition-colors"
                  title="Delete row"
                >
                  <span className="material-symbols-outlined text-sm">
                    delete
                  </span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

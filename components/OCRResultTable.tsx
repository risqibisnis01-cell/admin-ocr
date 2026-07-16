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
      <div className="empty-state">
        <span className="empty-state-icon" aria-hidden="true">
          <span className="material-symbols-outlined text-3xl">text_snippet</span>
        </span>
        <h3 className="panel-title">No text rows yet</h3>
        <p className="mt-2 max-w-sm font-body-sm text-body-sm">
          Add a document image and the detected text will appear here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
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
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td data-label="Row" className="font-label-code text-label-code text-on-surface-variant">{row.id}</td>
              <td
                data-label="Text"
                className="cursor-text text-on-surface"
                onDoubleClick={() => handleDoubleClick(row)}
              >
                {editingId === row.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="input-control min-h-10 py-2 pr-3 font-body-sm"
                    autoFocus
                  />
                ) : (
                  <span>{row.text}</span>
                )}
              </td>
              <td data-label="Score" className="font-label-code text-label-code text-on-surface-variant">
                {row.confidence}
              </td>
              <td data-label="Actions">
                <button
                  type="button"
                  onClick={() => onRowDelete(row.id)}
                  className="icon-button border-transparent bg-transparent text-outline shadow-none"
                  title="Delete row"
                  aria-label={`Delete row ${row.id}`}
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">
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

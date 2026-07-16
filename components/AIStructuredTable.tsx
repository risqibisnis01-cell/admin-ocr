"use client";

import { useState } from "react";
import type { AiStructuredResult } from "@/types/ocr";

interface AIStructuredTableProps {
  result: AiStructuredResult;
  onCellUpdate: (rowIndex: number, columnIndex: number, value: string) => void;
  onRowDelete?: (rowIndex: number) => void;
}

interface EditingCell {
  row: number;
  column: number;
}

export function AIStructuredTable({
  result,
  onCellUpdate,
  onRowDelete,
}: AIStructuredTableProps) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");

  const beginEditing = (row: number, column: number, value: string) => {
    setEditing({ row, column });
    setEditValue(value);
  };

  const finishEditing = () => {
    if (editing) onCellUpdate(editing.row, editing.column, editValue);
    setEditing(null);
  };

  return (
    <div className="table-scroll">
      {(result.warnings.length > 0 || result.corrections.length > 0) && (
        <div className="space-y-2 border-b border-outline-variant bg-surface-container-low px-4 py-3">
          {result.warnings.map((warning, index) => (
            <p key={`warning-${index}`} className="notice notice--warning">
              <span className="material-symbols-outlined text-base" aria-hidden="true">warning</span>
              <span>{warning}</span>
            </p>
          ))}
          {result.corrections.length > 0 && (
            <details className="text-body-sm font-body-sm text-on-surface-variant">
              <summary className="cursor-pointer font-medium text-on-surface">
                {result.corrections.length} AI correction{result.corrections.length === 1 ? "" : "s"}
              </summary>
              <ul className="mt-2 space-y-1 pl-5 list-disc">
                {result.corrections.map((correction, index) => (
                  <li key={`${correction.original}-${index}`}>
                    <span className="line-through">{correction.original}</span>
                    {" → "}
                    <span className="font-medium text-on-surface">{correction.corrected}</span>
                    {correction.reason ? ` — ${correction.reason}` : ""}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th className="px-3 py-3 text-left font-semibold text-on-surface-variant w-12">#</th>
            {result.columns.map((column, index) => (
              <th key={`${column}-${index}`} className="px-3 py-3 text-left font-semibold text-on-surface-variant min-w-32">
                {column}
              </th>
            ))}
            {onRowDelete && <th className="w-12" aria-label="Row actions" />}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td data-label="Row" className="font-label-code text-label-code text-on-surface-variant">{rowIndex + 1}</td>
              {row.cells.map((cell, columnIndex) => {
                const isEditing = editing?.row === rowIndex && editing.column === columnIndex;
                return (
                  <td
                    key={columnIndex}
                    data-label={result.columns[columnIndex] || `Column ${columnIndex + 1}`}
                    className={`cursor-text border-l border-outline-variant ${
                      cell.needsReview ? "review-cell" : ""
                    }`}
                    onDoubleClick={() => beginEditing(rowIndex, columnIndex, cell.value)}
                    title={cell.needsReview ? cell.reason || "AI marked this cell for review" : "Double-click to edit"}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value)}
                        onBlur={finishEditing}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") finishEditing();
                          if (event.key === "Escape") setEditing(null);
                        }}
                        className="input-control min-h-10 min-w-24 py-2 pr-3"
                      />
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <span className="text-on-surface whitespace-pre-wrap">{cell.value}</span>
                        {cell.needsReview && (
                          <span className="review-icon material-symbols-outlined shrink-0 text-sm" aria-hidden="true">warning</span>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
              {onRowDelete && (
                <td data-label="Actions">
                  <button
                    type="button"
                    onClick={() => onRowDelete(rowIndex)}
                    className="icon-button border-transparent bg-transparent text-outline shadow-none"
                    title="Delete row"
                    aria-label={`Delete row ${rowIndex + 1}`}
                  >
                    <span className="material-symbols-outlined text-lg" aria-hidden="true">delete</span>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {result.rows.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <span className="material-symbols-outlined text-3xl">table_rows</span>
          </span>
          <h3 className="panel-title">No table rows found</h3>
          <p className="mt-2 max-w-sm font-body-sm text-body-sm">
            Review the raw OCR output, then try the AI reconstruction again.
          </p>
        </div>
      )}
    </div>
  );
}

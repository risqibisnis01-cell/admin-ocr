"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { AiNativeExtraction, AiNativeSession } from "@/types/ai-native";

const STORAGE_KEY = "visionextract.ai-native-session.v1";
const listeners = new Set<() => void>();

function getSnapshot(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot(): string {
  return "";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function publish(session: AiNativeSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  listeners.forEach((listener) => listener());
}

function isSession(value: unknown): value is AiNativeSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AiNativeSession>;
  return (
    typeof session.id === "string" &&
    typeof session.createdAt === "string" &&
    typeof session.updatedAt === "string" &&
    typeof session.uploadCount === "number" &&
    Array.isArray(session.columns) &&
    session.columns.every((column) => typeof column === "string") &&
    Array.isArray(session.rows) &&
    session.rows.every(
      (row) =>
        row &&
        Array.isArray(row.cells) &&
        row.cells.every(
          (cell) =>
            cell &&
            typeof cell.value === "string" &&
            typeof cell.sourceText === "string" &&
            typeof cell.needsReview === "boolean" &&
            typeof cell.reason === "string",
        ),
    )
  );
}

export function parseNativeSession(serialized: string): AiNativeSession | null {
  if (!serialized) return null;
  try {
    const parsed: unknown = JSON.parse(serialized);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function createSession(): AiNativeSession {
  const timestamp = new Date().toISOString();
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    columns: [],
    rows: [],
    uploadCount: 0,
  };
}

export function useAiNativeSession() {
  const serialized = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const session = useMemo(() => parseNativeSession(serialized), [serialized]);

  const startNewSession = useCallback(() => {
    const next = createSession();
    publish(next);
    return next;
  }, []);

  const appendExtraction = useCallback(
    (extraction: AiNativeExtraction) => {
      const current = session ?? createSession();
      const timestamp = new Date().toISOString();
      const next: AiNativeSession = {
        ...current,
        updatedAt: timestamp,
        columns: current.columns.length > 0 ? current.columns : extraction.columns,
        rows: [...current.rows, ...extraction.rows],
        uploadCount: current.uploadCount + 1,
      };
      publish(next);
      return next;
    },
    [session],
  );

  const updateCell = useCallback(
    (rowIndex: number, columnIndex: number, value: string) => {
      if (!session) return;
      publish({
        ...session,
        updatedAt: new Date().toISOString(),
        rows: session.rows.map((row, currentRow) =>
          currentRow !== rowIndex
            ? row
            : {
                cells: row.cells.map((cell, currentColumn) =>
                  currentColumn !== columnIndex
                    ? cell
                    : { ...cell, value, needsReview: false, reason: "" },
                ),
              },
        ),
      });
    },
    [session],
  );

  const deleteRow = useCallback(
    (rowIndex: number) => {
      if (!session) return;
      publish({
        ...session,
        updatedAt: new Date().toISOString(),
        rows: session.rows.filter((_, currentRow) => currentRow !== rowIndex),
      });
    },
    [session],
  );

  return {
    session,
    startNewSession,
    appendExtraction,
    updateCell,
    deleteRow,
  };
}

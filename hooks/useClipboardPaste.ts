"use client";

import { useCallback, useEffect } from "react";

interface UseClipboardPasteOptions {
  onPaste: (file: File) => void;
}

export function useClipboardPaste({ onPaste }: UseClipboardPasteOptions) {
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            onPaste(file);
          }
          return;
        }
      }
    },
    [onPaste]
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);
}

"use client";

import dynamic from "next/dynamic";

const OCRWorkspace = dynamic(() => import("@/components/OCRWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-on-surface-variant font-body-md text-body-md">
          Loading PaddleOCR engine...
        </p>
      </div>
    </div>
  ),
});

export default function PaddleOCRPage() {
  return <OCRWorkspace engine="paddleocr" />;
}

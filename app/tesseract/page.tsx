"use client";

import dynamic from "next/dynamic";

const OCRWorkspace = dynamic(() => import("@/components/OCRWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="loading-state">
      <div className="text-center">
        <span className="spinner mx-auto mb-4 block" aria-hidden="true" />
        <p className="text-on-surface-variant font-body-md text-body-md">
          Loading the Tesseract workbench…
        </p>
      </div>
    </div>
  ),
});

export default function TesseractPage() {
  return <OCRWorkspace engine="tesseract" />;
}

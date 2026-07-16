"use client";

import Image from "next/image";

interface ImagePreviewProps {
  imageUrl: string;
  onClear?: () => void;
}

export function ImagePreview({ imageUrl, onClear }: ImagePreviewProps) {
  return (
    <figure className="preview-card">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <figcaption className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Source image
        </figcaption>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="ui-button ui-button--danger min-h-10 py-2"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
            Remove
          </button>
        )}
      </div>
      <Image
        src={imageUrl}
        alt="Uploaded document preview"
        width={900}
        height={700}
        unoptimized
        className="preview-image"
      />
    </figure>
  );
}

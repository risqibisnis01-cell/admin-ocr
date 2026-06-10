"use client";

interface ImagePreviewProps {
  imageUrl: string;
  onClear?: () => void;
}

export function ImagePreview({ imageUrl, onClear }: ImagePreviewProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">
          Image Preview
        </h3>
        {onClear && (
          <button
            onClick={onClear}
            className="text-error hover:bg-error-container hover:text-on-error-container font-body-sm text-body-sm font-medium px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">close</span>
            Remove
          </button>
        )}
      </div>
      <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest">
        <img
          src={imageUrl}
          alt="Uploaded preview"
          className="w-full h-auto max-h-80 object-contain"
        />
      </div>
    </div>
  );
}

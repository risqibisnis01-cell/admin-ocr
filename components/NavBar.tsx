"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="bg-surface text-primary font-body-md text-body-md border-b border-outline-variant sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-4 md:px-10 max-w-[1280px] mx-auto h-16">
        <div className="flex items-center gap-6 flex-grow">
          {/* Brand Logo */}
          <Link
            href="/paddleocr"
            className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              document_scanner
            </span>
            VisionExtract
          </Link>
          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex gap-6 mt-2 h-full items-end ml-auto">
            <Link
              href="/paddleocr"
              className={`pb-2 transition-colors ${
                pathname === "/paddleocr"
                  ? "text-primary border-b-2 border-primary font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              PaddleOCR
            </Link>
            <Link
              href="/tesseract"
              className={`pb-2 transition-colors ${
                pathname === "/tesseract"
                  ? "text-primary border-b-2 border-primary font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Tesseract
            </Link>
            <Link
              href="/google-vision"
              className={`pb-2 transition-colors ${
                pathname === "/google-vision"
                  ? "text-primary border-b-2 border-primary font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Google Vision AI
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

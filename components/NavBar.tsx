"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const tools = [
  { href: "/paddleocr", label: "PaddleOCR", shortLabel: "Paddle", icon: "document_scanner" },
  { href: "/tesseract", label: "Tesseract", shortLabel: "Tesseract", icon: "text_snippet" },
  { href: "/google-vision", label: "Google Vision", shortLabel: "Vision", icon: "visibility" },
  { href: "/ai-native", label: "AI Native", shortLabel: "AI Native", icon: "auto_awesome" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
      setLoggingOut(false);
    }
  };

  return (
    <header className="app-nav">
      <div className="nav-shell">
        <div className="nav-topline">
          <Link
            href="/paddleocr"
            className="brand"
          >
            <span className="brand-mark" aria-hidden="true">
              <span className="material-symbols-outlined text-2xl">
              document_scanner
              </span>
            </span>
            VisionExtract
          </Link>
          {pathname !== "/login" && (
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="logout-button"
              title="Lock workspace"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
              <span className="hidden sm:inline">{loggingOut ? "Locking…" : "Lock"}</span>
            </button>
          )}
        </div>
        {pathname !== "/login" && (
          <nav className="tool-nav" aria-label="OCR tools">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="tool-link"
                aria-current={pathname === tool.href ? "page" : undefined}
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  {tool.icon}
                </span>
                <span className="sm:hidden">{tool.shortLabel}</span>
                <span className="hidden sm:inline">{tool.label}</span>
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

import type { Metadata } from "next";
import { Hanken_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "VisionExtract - OCR Workspace",
  description: "Professional Grade OCR Tools - Convert screenshots to Excel-ready data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-body-md text-body-md">
        <NavBar />
        {children}
        {/* Footer */}
        <footer className="bg-surface-container-low text-on-surface font-body-sm text-body-sm border-t border-outline-variant mt-auto">
          <div className="flex flex-col md:flex-row justify-between items-center w-full py-6 px-4 md:px-10 max-w-[1280px] mx-auto gap-3">
            <div className="font-headline-sm text-headline-sm font-bold text-on-surface">
              VisionExtract
            </div>
            <div className="text-on-surface-variant text-center md:text-left">
              © 2024 VisionExtract. Professional Grade OCR Tools.
            </div>
            <div className="flex gap-4">
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                Documentation
              </span>
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                Privacy Policy
              </span>
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                Terms of Service
              </span>
              <span className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                Support
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

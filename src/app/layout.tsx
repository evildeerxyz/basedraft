import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Sans } from "next/font/google";
import { Analytics } from "@/site/analytics";
import { AuthModal, ProfileModal } from "@/site/auth";
import { COLOR_MODE_SCRIPT } from "@/site/color-mode-script";
import { MotionConfig } from "@/site/motion";
import { ProModal } from "@/site/pro-modal";
import { Toaster } from "@/site/toast";
import "./globals.css";

/* basedraft's own face, the one the first paint needs. Templates bring theirs. */
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"], axes: ["wdth"] });
// A fallback and the code face: fetched when something uses them, not ahead of every page.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], preload: false });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  metadataBase: new URL("https://basedraft.site"),
  title: { default: "basedraft | Landing pages that look finished", template: "%s | basedraft" },
  description: "Four finished landing sites, in Next.js and Astro, and every section in them, to arrange in Studio, copy into Figma and ship as code.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The script in <head> sets the saved or system mode before first paint, so the server's
    // "light" can differ from what hydrates: the DOM wins.
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: COLOR_MODE_SCRIPT }} />
      </head>
      <body>
        <MotionConfig>
          {children}
          <Toaster />
          <ProModal />
          <AuthModal />
          <ProfileModal />
          <Analytics />
        </MotionConfig>
      </body>
    </html>
  );
}

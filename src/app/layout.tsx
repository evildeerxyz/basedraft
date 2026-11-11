import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans, Inter } from "next/font/google";
import { Analytics } from "@/site/analytics";
import { ANNOUNCE_SCRIPT } from "@/site/announce-script";
import { AuthModal, ProfileModal } from "@/site/auth";
import { COLOR_MODE_SCRIPT } from "@/site/color-mode-script";
import { MotionConfig } from "@/site/motion";
import { Toaster } from "@/site/toast";
import "./globals.css";
import { shareCard } from "@/site/og";
import { TipModal } from "@/site/tip";

/* basedraft's own faces, the ones the first paint needs: Instrument Sans for the big type, Inter for text. Templates bring theirs. */
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
// The mono face, for code: fetched when something uses it, not ahead of every page.
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], preload: false });
const fonts = `${instrument.variable} ${inter.variable} ${geistMono.variable}`;

export const metadata: Metadata = {
  metadataBase: new URL("https://basedraft.site"),
  title: { default: "basedraft | Landing pages that look finished", template: "%s | basedraft" },
  description: "Finished landing sites, in Next.js and Astro, and every section in them, to arrange in Studio, copy into Figma and ship as code.",
  // Every page shares with this card unless it has its own (src/site/og.ts).
  ...shareCard("home", "basedraft | Landing pages that look finished", "Finished landing sites, in Next.js and Astro, and every section in them, to arrange in Studio, copy into Figma and ship as code."),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfe" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The scripts in <head> set the saved or system mode, and a closed announcement, before first
    // paint, so the server's "light" can differ from what hydrates: the DOM wins.
    <html lang="en" data-theme="light" suppressHydrationWarning className={fonts}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `${COLOR_MODE_SCRIPT};${ANNOUNCE_SCRIPT}` }} />
      </head>
      <body>
        <MotionConfig>
          {children}
          <Toaster />
          <AuthModal />
          <ProfileModal />
          <TipModal />
          <Analytics />
        </MotionConfig>
      </body>
    </html>
  );
}

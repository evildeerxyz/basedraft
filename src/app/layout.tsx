import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Sans, Inter_Tight, Mona_Sans } from "next/font/google";
import { Analytics } from "@/site/analytics";
import { AuthModal, ProfileModal } from "@/site/auth";
import { COLOR_MODE_SCRIPT } from "@/site/color-mode-script";
import { ConvexClientProvider } from "@/site/convex";
import { MotionConfig } from "@/site/motion";
import { ProModal } from "@/site/pro-modal";
import { Toaster } from "@/site/toast";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const mona = Mona_Sans({ variable: "--font-mona", subsets: ["latin"], axes: ["wdth"] });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });
/* basedraft's own face. Templates bring theirs. */
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://basedraft.site"),
  title: { default: "basedraft | Landing pages that look finished", template: "%s | basedraft" },
  description: "Three finished Next.js landing sites and every section in them, to arrange in Studio, copy into Figma and ship as code.",
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
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${mona.variable} ${interTight.variable} ${instrument.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: COLOR_MODE_SCRIPT }} />
      </head>
      <body>
        <ConvexClientProvider>
          <MotionConfig>
            {children}
            <Toaster />
            <ProModal />
            <AuthModal />
            <ProfileModal />
            <Analytics />
          </MotionConfig>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

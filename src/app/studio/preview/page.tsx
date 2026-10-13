import type { Metadata } from "next";
import { PreviewLoader } from "@/studio/preview-loader";

export const metadata: Metadata = { title: "Preview", robots: { index: false } };

export default function PreviewPage() {
  return <PreviewLoader />;
}

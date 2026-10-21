import type { Metadata } from "next";
import { StudioLoader } from "@/studio/loader";
import { withCard } from "@/site/og";

export const metadata: Metadata = withCard("studio", { title: "Studio", description: "Arrange a landing page from a template's real sections, check it at any width, copy it to Figma and export it as Next.js or Astro." });

export default function StudioPage() {
  return <StudioLoader />;
}

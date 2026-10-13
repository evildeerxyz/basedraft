import type { Metadata } from "next";
import { notFound } from "next/navigation";
import manifest from "@/bd/manifest.json";
import { Section } from "@/bd/sections";
import { Themed } from "@/bd/themed";

/* One home page section on its own, for basedraft's component library and thumbnails. */

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return manifest.sections.map((s) => ({ id: s.id }));
}

export default async function SectionPage({ params }: PageProps<"/bd/section/[id]">) {
  const { id } = await params;
  if (!manifest.sections.some((s) => s.id === id)) notFound();
  return (
    <Themed>
      <Section id={id} />
    </Themed>
  );
}

import { notFound } from "next/navigation";
import { LEGAL } from "@/lib/content/company";
import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Auren legal";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export function generateStaticParams() {
  return Object.keys(LEGAL).map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const doc = LEGAL[(await params).slug];
  if (!doc) notFound();
  return ogImage({
    eyebrow: "Legal",
    title: doc.title,
    subtitle: `Last updated ${doc.updated}.`,
    art: { variant: "grid", seed: 13 },
  });
}

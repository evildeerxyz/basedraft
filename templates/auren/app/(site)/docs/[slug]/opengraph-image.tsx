import { notFound } from "next/navigation";
import { DOCS, DOC_NAV, getDoc } from "@/lib/content/docs";
import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Auren documentation";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export function generateStaticParams() {
  return DOCS.filter((d) => d.slug !== "introduction").map((d) => ({ slug: d.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const doc = getDoc((await params).slug);
  if (!doc) notFound();
  const section = DOC_NAV.find((s) => s.slugs.includes(doc.slug))?.title ?? "Docs";
  return ogImage({
    eyebrow: `Docs / ${section}`,
    title: doc.title,
    subtitle: doc.description,
    art: { variant: "rings", seed: DOCS.indexOf(doc) + 2 },
  });
}

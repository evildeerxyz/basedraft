import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OgCard } from "@/components/og/card";
import cards from "@/components/og/cards.json";

/*
 * Social card studio. Renders one 1200 × 630 card per route so scripts/og.mjs
 * can screenshot it. Off unless the site is built with OG_STUDIO=1, so it
 * never ships in a normal deploy.
 */

export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return cards.map((card) => ({ card: card.id }));
}

export default async function OgStudioPage({ params }: { params: Promise<{ card: string }> }) {
  const { card } = await params;
  if (process.env.OG_STUDIO !== "1" || !cards.some((item) => item.id === card)) notFound();
  return <OgCard id={card} />;
}

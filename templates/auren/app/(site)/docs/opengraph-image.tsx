import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Auren documentation";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Docs",
    title: "Learn Auren in fifteen minutes.",
    subtitle: "Install, hand off your first task, and learn how agents, Tab and rules work.",
    art: { variant: "rings", seed: 1 },
  });
}

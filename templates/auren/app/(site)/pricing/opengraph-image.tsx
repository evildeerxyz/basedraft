import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Auren pricing";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Pricing",
    title: "Pay for agents, not for typing.",
    subtitle: "Tab runs on your machine, so it is free and unlimited on every plan.",
    art: { variant: "grid", seed: 4 },
  });
}

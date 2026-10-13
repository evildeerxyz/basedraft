import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Auren system status";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Status",
    title: "All systems normal.",
    subtitle: "Live and historical status for every Auren service.",
    art: { variant: "waves", seed: 5 },
  });
}

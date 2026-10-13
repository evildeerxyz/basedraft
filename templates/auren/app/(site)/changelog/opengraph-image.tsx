import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Auren changelog";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Changelog",
    title: "Shipping, weekly.",
    subtitle: "Every release, newest first.",
    art: { variant: "waves", seed: 2 },
  });
}

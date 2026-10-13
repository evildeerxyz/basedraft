import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "About Auren Labs";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "About",
    title: "We build tools for people who read code.",
    subtitle: "A small, remote company making one product very well.",
    art: { variant: "rings", seed: 6 },
  });
}

import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Security at Auren";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Security",
    title: "Your code stays yours.",
    subtitle: "What leaves your machine, how it is protected, and who processes it.",
    art: { variant: "rings", seed: 12 },
  });
}

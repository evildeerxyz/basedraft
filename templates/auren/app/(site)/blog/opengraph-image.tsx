import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "The Auren blog";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Blog",
    title: "Notes from the workbench.",
    subtitle: "How we build Auren, and what we learn along the way.",
    art: { variant: "waves", seed: 9 },
  });
}

import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Auren, the AI code editor that writes the intent into a diff";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "AI code editor",
    title: "Write the intent. Review the diff.",
    subtitle: "A native code editor with an agent that has read your entire codebase.",
    art: { variant: "sun", seed: 3 },
  });
}

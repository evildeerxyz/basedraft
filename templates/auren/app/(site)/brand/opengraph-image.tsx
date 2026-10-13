import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Auren brand assets";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Brand",
    title: "The mark, the type, the dots.",
    subtitle: "Logo, colours, typography and the dither patterns behind them.",
    art: { variant: "sun", seed: 11 },
  });
}

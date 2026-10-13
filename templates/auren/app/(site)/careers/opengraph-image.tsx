import { OG_SIZE, OG_TYPE, ogImage } from "@/lib/og";

export const alt = "Careers at Auren";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: "Careers",
    title: "Come build the instrument.",
    subtitle: "Six open roles, remote across Europe and the Americas.",
    art: { variant: "grid", seed: 8 },
  });
}

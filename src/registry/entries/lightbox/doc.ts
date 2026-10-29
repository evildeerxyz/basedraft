import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Lightbox } from "@basedraft/ui";

const shots = [
  { src: "/work/home.jpg", alt: "The home page", caption: "The home page, wide." },
  { src: "/work/pricing.jpg", alt: "The pricing page" },
];

export function Work() {
  return <Lightbox images={shots} className="grid grid-cols-3 gap-3" thumbClassName="aspect-[4/3] rounded-xl" />;
}`,
  use: [
    "For a set of pictures people want to see large: a portfolio, a product's screenshots, a team, a case study.",
    "Shape the thumbnails with thumbClassName; the viewer shows each picture whole, at its own shape.",
    "Give each picture alt text that says what's in it, and a caption when there's more to say.",
  ],
  avoid: [
    "For pictures people swipe through in place, without opening them: use Carousel.",
    "For comparing two versions of one picture: use Compare slider.",
    "For one picture that doesn't need to be larger: show it as it is.",
  ],
  parts: [
    {
      name: "Lightbox",
      note: "The thumbnails, and the viewer they open.",
      props: [
        { name: "images", type: "{ src, alt, caption?, thumb? }[]", note: "The pictures, in order. thumb is a smaller file for the thumbnail.", required: true },
        { name: "className", type: "string", note: "Lays out the thumbnails: a grid, a row." },
        { name: "thumbClassName", type: "string", note: "Each thumbnail's shape and corners; a picture shrinks back into its thumbnail's corners." },
      ],
    },
  ],
  examples: [
    { id: "team", title: "Round thumbnails", note: "Any shape: the picture opens out of the circle and closes back into it.", code: `<Lightbox images={people} className="flex gap-3" thumbClassName="size-24 rounded-full" />` },
  ],
  keyboard: [
    { keys: "Enter Space", does: "On a thumbnail, opens it." },
    { keys: "← →", does: "Goes to the previous or next picture." },
    { keys: "Home End", does: "Goes to the first or last." },
    { keys: "Tab", does: "Moves between the viewer's buttons, and stays in the viewer." },
    { keys: "Escape", does: "Closes it, and focus goes back to the thumbnail." },
  ],
  a11y: [
    "Each thumbnail is a button named Open, then the picture's alt text.",
    "The viewer is a modal dialog that says which picture it is and how many there are, and the page behind it doesn't scroll.",
    "Focus moves to the close button when it opens and back to the thumbnail when it closes.",
    "With reduced motion, pictures appear and change in place, without growing or sliding.",
  ],
};

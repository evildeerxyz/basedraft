import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { DitherImage } from "@/components/basedraft/dither-image";

export function Portrait() {
  return (
    <DitherImage
      src="/people/priya.jpg"
      alt="Megan Turner, in front of a purple wall"
      ratio={1}
      className="w-64 rounded-3xl"
    />
  );
}`,
  use: [
    "For pictures that should feel printed rather than pasted: team portraits, a hero image, the cover of a post.",
    "Keep ink for one color in a calm layout; use color for the picture's own colors, stepped down like an old screen.",
    "Give it a ratio, or a size in className, so nothing below shifts while the picture loads.",
  ],
  avoid: [
    "For a picture people need to read in detail, like a chart or a screenshot of text: show the photo as it is.",
    "For a person's small round picture beside their name: use Avatar.",
    "For pictures from a site that doesn't allow reading them (no CORS): they can't be dithered, so they show as they are.",
  ],
  parts: [
    {
      name: "DitherImage",
      note: "A picture drawn as dots on a canvas, named for screen readers by alt.",
      props: [
        { name: "src", type: "string", note: "The picture. From your own site, or one that allows reading it (CORS).", required: true },
        { name: "alt", type: "string", note: "What the picture shows, for a screen reader.", required: true },
        { name: "cell", type: "number", default: "3", note: "One dot's size, in CSS pixels. Smaller for a small picture, so a face still reads." },
        { name: "matrix", type: "2 | 4 | 8", default: "4", note: "The ordered-dither matrix: 2 is coarse and graphic, 8 has the most shades." },
        { name: "palette", type: '"ink" | "color"', default: '"ink"', note: "Dots in one ink, or in the picture's own colors stepped down." },
        { name: "ink", type: "string", default: '"currentColor"', note: "The dots' color, for ink: any CSS color, var() included. It follows the theme." },
        { name: "paper", type: "string", default: '"transparent"', note: "What's behind the dots: any CSS color." },
        { name: "levels", type: "number", default: "2", note: "How many tones: 2 is pure ink or paper; more adds lighter inks, or more steps of each color." },
        { name: "shape", type: '"square" | "round"', default: '"square"', note: "Square cells, or round dots like a halftone." },
        { name: "brightness", type: "number", default: "0", note: "Lifts or sinks the picture's light before it's dithered, from -1 to 1." },
        { name: "contrast", type: "number", default: "1", note: "Spreads its light apart above 1, or together below 1." },
        { name: "invert", type: 'boolean | "auto"', default: '"auto"', note: "Ink where the picture is light. On auto, a light ink prints the light and a dark one the shadows, so it reads true in light and dark." },
        { name: "normalize", type: "boolean", default: "true", note: "Stretches the picture's light to the whole range first, so a dull photo still prints with real blacks and whites." },
        { name: "ratio", type: "number", note: "Width over height, held before the picture loads. The picture's own once it has." },
        { name: "fit", type: '"cover" | "contain"', default: '"cover"', note: "Fills its box and crops, or fits inside it whole." },
        { name: "reveal", type: '"hover" | "none"', default: '"hover"', note: "Shows the photo through a dissolve under the pointer, or never." },
        { name: "revealed", type: "boolean", note: "Shows the photo, from outside, as when a card it sits in is hovered." },
        { name: "develop", type: "boolean", default: "true", note: "Its dots arrive in the matrix's order the first time it comes into view." },
        { name: "...props", type: "div props", note: "Everything a div takes. Size and round it with className." },
      ],
    },
  ],
  examples: [
    {
      id: "inks",
      title: "Inks",
      note: "The text's color by default, any color, or light ink on dark paper: a light ink prints the light, so the picture still reads true.",
      code: `<div className="grid grid-cols-3 gap-3">
  <DitherImage src="/people/ava.jpg" alt="Ava Robinson" ratio={1} cell={2} className="rounded-2xl" />
  <DitherImage src="/people/priya.jpg" alt="Megan Turner" ratio={1} cell={2} ink="var(--bd-ui-viz-1)" className="rounded-2xl" />
  <DitherImage src="/people/sofia.jpg" alt="Rachel Foster" ratio={1} cell={2} ink="white" paper="oklch(19% 0.004 265)" className="rounded-2xl" />
</div>`,
    },
    {
      id: "halftone",
      title: "Halftone",
      note: "Round dots on a larger cell, with the finest matrix, read like a printed photo.",
      code: `<DitherImage
  src="/people/ava.jpg"
  alt="Ava Robinson"
  ratio={1}
  shape="round"
  cell={5}
  matrix={8}
  className="w-64 rounded-3xl"
/>`,
    },
    {
      id: "color",
      title: "In its own colors",
      note: "Each color stepped down to a few levels: two is eight colors, like an old screen; more gets closer to the photo.",
      code: `<div className="grid grid-cols-3 gap-3">
  <DitherImage src="/people/priya.jpg" alt="Megan Turner" ratio={1} cell={2} palette="color" levels={2} />
  <DitherImage src="/people/priya.jpg" alt="Megan Turner" ratio={1} cell={2} palette="color" levels={3} />
  <DitherImage src="/people/priya.jpg" alt="Megan Turner" ratio={1} cell={2} palette="color" levels={5} />
</div>`,
    },
    {
      id: "matrix",
      title: "Three matrices",
      note: "2 by 2 is bold and graphic, 8 by 8 holds the softest gradients.",
      code: `<div className="grid grid-cols-3 gap-3">
  <DitherImage src="/people/ava.jpg" alt="Ava Robinson" ratio={1} cell={2} matrix={2} />
  <DitherImage src="/people/ava.jpg" alt="Ava Robinson" ratio={1} cell={2} matrix={4} />
  <DitherImage src="/people/ava.jpg" alt="Ava Robinson" ratio={1} cell={2} matrix={8} />
</div>`,
    },
  ],
  a11y: [
    "Role img, named by alt, so a screen reader hears what the picture shows and nothing of the dots.",
    "The canvases are drawn only and hidden from screen readers.",
    "With reduced motion, the picture appears whole and the photo shows through at once, without the dissolve.",
  ],
};

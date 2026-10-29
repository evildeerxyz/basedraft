import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { ColorPicker, ColorField } from "@/components/basedraft/color-picker";

export function BrandColor() {
  const [color, setColor] = useState("#2563eb");
  return <ColorField label="Brand color" value={color} onChange={setColor} swatches={["#2563eb", "#db2777"]} />;
}`,
  use: [
    "For a theme, a brand, a label or a chart series: anywhere someone sets a color and should see it as they do.",
    "ColorField in a form, where it sits like any other field; ColorPicker in a panel or a sidebar, always open.",
    "Give it swatches for the colors that belong together, so most picks are a single click.",
  ],
  avoid: [
    "For a few fixed choices, like a label's color: use Segmented or Radio group with colored dots.",
    "When any value will do and no one needs to see it: use Input.",
  ],
  parts: [
    {
      name: "ColorPicker",
      note: "The picker, as a panel.",
      props: [
        { name: "value", type: "string", note: "The color as hex: #rrggbb, or #rrggbbaa with alpha." },
        { name: "defaultValue", type: "string", default: '"#3b82f6"', note: "The color to start from, when it runs itself." },
        { name: "onChange", type: "(hex: string) => void", note: "Runs with each new color, as hex." },
        { name: "alpha", type: "boolean", default: "false", note: "Shows the alpha slider, and lets the value carry alpha." },
        { name: "swatches", type: "string[]", note: "Colors to pick in one click. Any form it can read." },
        { name: "contrast", type: "boolean", default: "true", note: "Shows how white and black text read on the color, as a ratio and AA or AAA." },
        { name: "format", type: '"hex" | "rgb" | "hsl"', default: '"hex"', note: "How the value shows to start; the button beside it switches." },
        { name: "className", type: "string", note: "Added to the panel." },
      ],
    },
    {
      name: "ColorField",
      note: "A swatch and its value, like an input, that opens the picker under it. Takes the picker's props too.",
      props: [{ name: "label", type: "string", note: "What the color is for, for screen readers and the popover: \"Brand color\".", required: true }],
    },
    {
      name: "parseColor, toHex, inkOn",
      note: "The helpers it uses, for your own code: read a color from text, write one as hex, and pick white or black text for a color.",
      props: [],
    },
  ],
  examples: [
    {
      id: "field",
      title: "In a form",
      note: "ColorField sits like an input; the picker opens under it, or above when there's no room.",
      code: `<label className="grid gap-1.5">
  Brand
  <ColorField label="Brand color" defaultValue="#2563eb" swatches={brand} />
</label>`,
    },
    {
      id: "alpha",
      title: "With alpha",
      note: "alpha adds the slider over a checkerboard; format=\"rgb\" shows the value as rgb().",
      code: `<ColorPicker alpha defaultValue="#7c3aedb3" format="rgb" contrast={false} />`,
    },
  ],
  keyboard: [
    { keys: "← → ↑ ↓", does: "On the field, move saturation and brightness; on a slider, move it." },
    { keys: "Shift with an arrow", does: "Moves ten times as far." },
    { keys: "Home End", does: "On a slider, go to its ends." },
    { keys: "Enter", does: "In the value, set the color typed: hex, rgb() or hsl()." },
    { keys: "Esc", does: "In the value, undo the typing; otherwise close ColorField's picker." },
  ],
  a11y: [
    "The field and the sliders are sliders, each saying its value in words: \"Saturation 72%, brightness 40%\".",
    "A value it can't read shakes and goes back, rather than being lost.",
    "ColorField's button says its label and color, and its picker is a dialog that takes focus and gives it back.",
    "The eyedropper shows only in browsers that have one.",
  ],
};

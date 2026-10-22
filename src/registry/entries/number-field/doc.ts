import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { NumberField } from "@basedraft/ui";

export function Seats() {
  const [seats, setSeats] = useState(3);
  return (
    <NumberField
      label="Seats"
      unit="people"
      min={1}
      max={10}
      value={seats}
      onValueChange={setSeats}
    />
  );
}`,
  use: [
    "For a count or an amount that's usually nudged rather than typed: seats, columns, a gap in pixels, a price.",
    "When there are limits: it stops at them and nudges, and its buttons fade at each end.",
    "In a toolbar or inspector, where dragging the label to scrub is the quickest way to try values.",
  ],
  avoid: [
    "To pick a value along a range where where it sits matters more than the number: use Slider.",
    "For numbers that aren't amounts, like a phone number or a code: use Input or Code input.",
    "For a handful of fixed sizes: use Segmented control.",
  ],
  props: [
    { name: "value", type: "number", note: "Controlled: the number." },
    { name: "defaultValue", type: "number", default: "0", note: "Where it starts, uncontrolled." },
    { name: "onValueChange", type: "(value: number) => void", note: "Called with each new number: each step while a button is held, each step of a scrub, and a typed number when it's kept." },
    { name: "min", type: "number", note: "The lowest it goes. Home goes there." },
    { name: "max", type: "number", note: "The highest it goes. End goes there." },
    { name: "step", type: "number", default: "1", note: "One press, one arrow, one wheel notch, or a few pixels of scrubbing." },
    { name: "bigStep", type: "number", default: "step × 10", note: "What Shift with an arrow, Page Up and Page Down, or Shift while scrubbing moves it by." },
    { name: "format", type: "Intl.NumberFormatOptions", note: "How the number reads: currency, percent, a unit, or set decimals. Typing takes plain numbers, read as shown: 50 is 50% when it reads as a percent." },
    { name: "locale", type: "string", default: '"en-US"', note: "The locale the number is formatted in." },
    { name: "label", type: "string", note: "A word before the number; drag it sideways to scrub the value. Also names the field for screen readers." },
    { name: "unit", type: "string", note: "A quiet word after the number: people, px, sections. Read out with the value." },
    { name: "size", type: '"sm" | "md"', default: '"md"', note: "36 or 44px tall." },
    { name: "disabled", type: "boolean", default: "false", note: "Faded, and nothing moves it." },
    { name: "name", type: "string", note: "With a name, a hidden input carries the number in a form." },
    { name: "id", type: "string", note: "Goes on the number's input, so a <label htmlFor> can point at it. Field sets it for you." },
    { name: "aria-invalid", type: "boolean", note: "Rims it in red. Field sets it when it has an error." },
    { name: "className", type: "string", note: "Goes on the pill. It's as wide as its content until you say otherwise." },
  ],
  examples: [
    {
      id: "seats",
      title: "Seats, with limits",
      note: "At 1 and at 10 the button fades, and pressing past the limit nudges the number instead.",
      code: `<NumberField label="Seats" unit="people" min={1} max={10} defaultValue={3} />`,
    },
    {
      id: "currency",
      title: "A price",
      note: "format reads it as dollars; Shift steps by ten.",
      code: `<NumberField
  label="Price"
  min={0}
  step={1}
  bigStep={10}
  defaultValue={79}
  format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
/>`,
    },
    {
      id: "percent",
      title: "A fraction, read as a percent",
      note: "The value stays between 0 and 1; format shows it as 85%.",
      code: `<NumberField
  label="Opacity"
  min={0}
  max={1}
  step={0.05}
  bigStep={0.1}
  defaultValue={0.85}
  format={{ style: "percent" }}
/>`,
    },
    {
      id: "small",
      title: "Small, for an inspector",
      code: `<NumberField size="sm" label="Columns" min={1} max={6} defaultValue={3} />`,
    },
    {
      id: "disabled",
      title: "Disabled",
      code: `<NumberField disabled label="Seats" unit="people" defaultValue={10} />`,
    },
  ],
  keyboard: [
    { keys: "↑ ↓", does: "Steps up or down by step." },
    { keys: "Shift + ↑ ↓", does: "Steps by bigStep." },
    { keys: "Page Up / Page Down", does: "Steps by bigStep." },
    { keys: "Home / End", does: "Goes to min or max, when they're set." },
    { keys: "0 to 9", does: "Types a number in place of the one shown." },
    { keys: "Enter", does: "Keeps the typed number, within the limits and rounded to the step. Leaving the field keeps it too." },
    { keys: "Esc", does: "Drops what's typed and shows the number again." },
  ],
  a11y: [
    "The number is an input with role spinbutton, with aria-valuenow, aria-valuemin and aria-valuemax, and aria-valuetext read as it's shown, unit included: 3 people, $79, 85%.",
    "It's the one Tab stop. The − and + are named buttons for the pointer; the keyboard steps with the arrows instead, as a spinbutton does.",
    "The label you can drag is a pointer shortcut; the field is named by it all the same. The wheel only steps while the field has focus, so scrolling past it never changes it.",
    "With reduced motion, numbers change in place rather than rolling, and nothing nudges.",
  ],
};

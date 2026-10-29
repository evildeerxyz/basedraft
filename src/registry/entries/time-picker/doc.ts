import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { useState } from "react";
import { TimePicker } from "@basedraft/ui";

export function CallTimes() {
  const [start, setStart] = useState("09:30");
  const [end, setEnd] = useState("10:00");
  return (
    <>
      <TimePicker label="Starts" value={start} onValueChange={setStart} step={15} />
      <TimePicker label="Ends" value={end} onValueChange={setEnd} from={start} step={15} />
    </>
  );
}`,
  use: [
    "For a time of day: when a meeting starts, when a shop opens, when a post goes out.",
    "Give the end time from={start}, so its list begins after the start and says how long each choice runs.",
    "Set min and max for hours that are open, and step for how fine the choices are.",
  ],
  avoid: [
    "For a day: use Date picker.",
    "For a length of time on its own, like 45 minutes: use Number field.",
    "For a handful of fixed slots people should compare: use Radio group or Chips.",
  ],
  parts: [
    {
      name: "TimePicker",
      note: "A field that takes typing, with a list of times under it.",
      props: [
        { name: "value", type: "string | null", note: "The time as \"HH:mm\", 24-hour, when you keep it." },
        { name: "defaultValue", type: "string | null", default: "null", note: "The time at first, when the picker keeps it." },
        { name: "onValueChange", type: "(value: string) => void", note: "Runs with \"HH:mm\" when a time is typed or picked." },
        { name: "step", type: "number", default: "30", note: "Minutes between the times in the list. Typing can still land between them." },
        { name: "hourCycle", type: "12 | 24", default: "12", note: "9:30 PM, or 21:30." },
        { name: "min", type: "string", note: "The earliest time, \"HH:mm\". Typed times are held to it." },
        { name: "max", type: "string", note: "The latest time, \"HH:mm\"." },
        { name: "from", type: "string | null", note: "A start time: the list begins after it, and each time says how long after it is." },
        { name: "label", type: "string", note: "Names it for screen readers when no Field or label does." },
        { name: "placeholder", type: "string", default: '"Pick a time"', note: "Shown while there's no time." },
        { name: "name", type: "string", note: "With a name, a hidden input carries the time in a form." },
        { name: "disabled", type: "boolean", note: "Can't be typed in or opened." },
      ],
    },
  ],
  examples: [
    { id: "hours", title: "24 hours", note: "hourCycle={24} for 08:00 rather than 8:00 AM.", code: `<TimePicker label="Opens at" defaultValue="08:00" hourCycle={24} step={15} />` },
    { id: "range", title: "Only open hours", note: "min and max hold both the list and anything typed.", code: `<TimePicker label="Delivery slot" defaultValue="13:00" min="09:00" max="17:00" step={60} />` },
  ],
  keyboard: [
    { keys: "Typing", does: "Reads times like 930, 9:30p, 21:30, noon or midnight when you press Enter or move on." },
    { keys: "↓ ↑", does: "Opens the list, then moves through it." },
    { keys: "Home End", does: "In the list, jumps to the first or last time." },
    { keys: "Enter", does: "Takes what's typed, or the time that's lit in the list." },
    { keys: "Escape", does: "Closes the list, and drops what was half typed." },
  ],
  a11y: [
    "A combobox: it says whether its list is open, and the lit time is read out as you move, through aria-activedescendant.",
    "The list is a listbox of options, the chosen one selected.",
    "Focus stays in the field the whole time, so typing and the arrows work together.",
    "A time typed that can't be read is set back to the last good one, not kept half finished.",
  ],
};

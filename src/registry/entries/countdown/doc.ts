import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Countdown } from "@basedraft/ui";

export function LaunchClock() {
  return <Countdown to="2026-11-12T17:00:00Z" label="Zuno for teams launches" done={<p>We're live.</p>} />;
}`,
  use: [
    "For a moment that's coming and matters to the people reading: a launch, a sale's end, the doors of an event.",
    "Give it done for what to say at zero, so the page doesn't sit on 00:00:00.",
    "Leave out units you don't need: a sale ending today reads better as hours, minutes and seconds.",
  ],
  avoid: [
    "For how long something has been running, counting up: show the start time.",
    "For progress through a task: use Meter.",
    "To pressure people with a deadline that isn't real: don't.",
  ],
  parts: [
    {
      name: "Countdown",
      note: "A timer, as tiles or inline.",
      props: [
        { name: "to", type: "Date | number | string", note: "The moment it counts down to.", required: true },
        { name: "units", type: '("days" | "hours" | "minutes" | "seconds")[]', default: "all four", note: "Which it shows, largest first. Time above the largest folds into it." },
        { name: "variant", type: '"tiles" | "inline"', default: '"tiles"', note: "Raised tiles, or inline in a sentence: 02h 14m 09s." },
        { name: "done", type: "ReactNode", note: "What it shows at zero, in place of the numbers." },
        { name: "onComplete", type: "() => void", note: "Runs once, at zero." },
        { name: "label", type: "string", note: "What it's counting down to, for screen readers." },
        { name: "className", type: "string", note: "Added to it." },
      ],
    },
  ],
  examples: [
    { id: "sale", title: "Inline", note: "In a sentence, without days.", code: `Ends in <Countdown to={end} variant="inline" units={["hours", "minutes", "seconds"]} />` },
    { id: "done", title: "At zero", note: "done takes over when it reaches zero.", code: `<Countdown to={opens} units={["minutes", "seconds"]} done={<p>Doors are open. Come in.</p>} />` },
  ],
  a11y: [
    "Role timer, named with what it's counting to and the time left in words, so a screen reader reads it on demand without announcing every second.",
    "The rolling digits are drawn only.",
    "It reads the clock in the browser only: the server shows dashes, so the page can be built ahead of time.",
    "With reduced motion, digits change in place.",
  ],
};

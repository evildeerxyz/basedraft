import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import { Step, Steps } from "@basedraft/ui";

export function TakeItHome({ at }: { at: number }) {
  return (
    <Steps current={at}>
      <Step
        title="Buy Zuno"
        description="$79 once, or every template with Pro."
      />
      <Step
        title="Download zuno.zip"
        description="From your Purchases page, in Next.js or Astro."
      />
      <Step
        title="Run it"
        description="Unzip it, then npm install and npm run dev."
      />
    </Steps>
  );
}`,
  use: [
    "A task done in a few steps in a set order: setting up an account, a checkout, taking a template home.",
    "To show where someone is and what's left, so a long task feels short.",
    "Down the page beside the steps' content, or across the top of a short form.",
  ],
  avoid: [
    "Choices someone can make in any order: Tabs, or a list of sections.",
    "Progress you can measure but not name in steps, like an upload: Meter.",
    "More than about six steps across, where the names won't fit: run them down the page instead.",
  ],
  parts: [
    {
      name: "Steps",
      note: "The ordered list. It tells each Step whether it's done, current or next.",
      props: [
        { name: "current", type: "number", required: true, note: "The step you're on, counting from 0. The ones before it are done; pass the number of steps for all done." },
        { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', note: "Down the page with text beside each step, or across with text under it." },
        { name: "children", type: "Step elements", required: true, note: "The steps, in order." },
        { name: "...props", type: "ol props", note: "Everything an ordered list takes, like aria-label." },
      ],
    },
    {
      name: "Step",
      note: "One step: its marker, its line to the next, its title and a line on it.",
      props: [
        { name: "title", type: "ReactNode", required: true, note: "What the step is, in a few words." },
        { name: "description", type: "ReactNode", note: "A line on it, under the title." },
        { name: "children", type: "ReactNode", note: "Anything else under it, like the action for the step you're on." },
        { name: "...props", type: "li props", note: "Everything a list item takes." },
      ],
    },
  ],
  examples: [
    {
      id: "horizontal",
      title: "Across",
      note: "For a short checkout over a form: the names under the markers, the line between them.",
      code: `<Steps
  current={1}
  orientation="horizontal"
  aria-label="Checkout"
  className="max-w-[440px]"
>
  <Step title="Plan" description="Pro" />
  <Step title="Details" description="Your email" />
  <Step title="Pay" description="Card or PayPal" />
</Steps>`,
    },
    {
      id: "action",
      title: "With the next action",
      note: "The step you're on carries the button that finishes it.",
      code: `<Steps current={1} className="max-w-[340px]">
  <Step title="Buy Zuno" description="Paid, $79 once." />
  <Step title="Download zuno.zip" description="From your Purchases page.">
    <Button variant="outline" size="sm">
      <DownloadSimpleIcon weight="duotone" /> zuno.zip
    </Button>
  </Step>
  <Step title="Run it" description="npm install and npm run dev." />
</Steps>`,
    },
    {
      id: "done",
      title: "All done",
      note: "Pass the number of steps as current, and every line is filled.",
      code: `<Steps current={3} className="max-w-[340px]">
  <Step title="Account made" description="Signed in with your email." />
  <Step title="Team named" description="Fieldwork, 4 of 10 seats." />
  <Step title="Invites sent" description="Maya and Jonah will get an email." />
</Steps>`,
    },
  ],
  a11y: [
    'It\'s an ordered list, so a screen reader says how many steps there are and which one this is.',
    'The current step has aria-current="step", and each title starts with a hidden word: done, current step, or next.',
    "The markers and lines are drawn, not read; the state is in the words.",
    "With reduced motion the current step's ring stops breathing; the line still fills, quickly.",
  ],
};

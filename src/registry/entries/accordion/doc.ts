import type { ComponentDoc } from "../../types";

export const doc: ComponentDoc = {
  usage: `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@basedraft/ui";

export function Questions() {
  return (
    <Accordion defaultValue={["client"]}>
      <AccordionItem value="client">
        <AccordionTrigger>Can I use it for a client?</AccordionTrigger>
        <AccordionContent>With a Team license, yes.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="updates">
        <AccordionTrigger>Do updates cost extra?</AccordionTrigger>
        <AccordionContent>
          No. Each one lands on your Purchases page.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}`,
  use: [
    "For questions and answers, or any list where each row's detail is read one at a time.",
    "When the questions alone should scan at a glance, with the answers there on demand.",
  ],
  avoid: [
    "For a few views of one thing: use Tabs.",
    "For content everyone needs to read: show it, rather than folding it away.",
    "For a sequence someone moves through: use Steps.",
  ],
  parts: [
    {
      name: "Accordion",
      note: "The card that holds the rows and which are open.",
      props: [
        { name: "type", type: '"single" | "multiple"', default: '"single"', note: "One answer open at a time, or several." },
        { name: "defaultValue", type: "string[]", default: "[]", note: "The rows open to begin with, by their value." },
        { name: "numbered", type: "boolean", default: "true", note: "A two-digit number before each question: 01, 02." },
        { name: "className", type: "string", note: "Added to the card, to size or place it." },
        { name: "children", type: "ReactNode", note: "AccordionItem rows.", required: true },
      ],
    },
    {
      name: "AccordionItem",
      note: "One row. It takes a soft tint while open.",
      props: [
        { name: "value", type: "string", note: "Names it, for defaultValue.", required: true },
        { name: "className", type: "string", note: "Added to the row." },
        { name: "children", type: "ReactNode", note: "An AccordionTrigger and its AccordionContent.", required: true },
      ],
    },
    {
      name: "AccordionTrigger",
      note: "The question, as a button, with the plus that turns into a cross.",
      props: [
        { name: "children", type: "ReactNode", note: "The question.", required: true },
        { name: "className", type: "string", note: "Added to the button." },
      ],
    },
    {
      name: "AccordionContent",
      note: "The answer, springing open to its own height.",
      props: [
        { name: "children", type: "ReactNode", note: "The answer.", required: true },
        { name: "className", type: "string", note: "Added to the answer's text block." },
      ],
    },
  ],
  examples: [
    {
      id: "single",
      title: "One at a time",
      note: "Opening a question closes the one that was open.",
      code: `<Accordion defaultValue={["zip"]} className="w-full max-w-[380px]">
  <AccordionItem value="zip">
    <AccordionTrigger>How do I get the code?</AccordionTrigger>
    <AccordionContent>
      Download a zip from your Purchases page, or send it to GitHub.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="astro">
    <AccordionTrigger>Is there an Astro version?</AccordionTrigger>
    <AccordionContent>
      Every template comes in Next.js and Astro.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="refund">
    <AccordionTrigger>Can I get a refund?</AccordionTrigger>
    <AccordionContent>
      Yes, within 14 days, no questions asked.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
    },
    {
      id: "multiple",
      title: "Several open",
      note: 'type="multiple" keeps each answer open until it is closed.',
      code: `<Accordion
  type="multiple"
  defaultValue={["figma", "paper"]}
  className="w-full max-w-[380px]"
>
  <AccordionItem value="figma">
    <AccordionTrigger>Copy to Figma</AccordionTrigger>
    <AccordionContent>
      Auto layout, components and named layers. No plugin.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="paper">
    <AccordionTrigger>Copy to Paper</AccordionTrigger>
    <AccordionContent>
      The same section, as editable layers in Paper.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="svg">
    <AccordionTrigger>Copy as SVG</AccordionTrigger>
    <AccordionContent>A flat picture, for anywhere else.</AccordionContent>
  </AccordionItem>
</Accordion>`,
    },
    {
      id: "plain",
      title: "Without numbers",
      note: "numbered={false}, for rows that aren't a sequence.",
      code: `<Accordion numbered={false} className="w-full max-w-[380px]">
  <AccordionItem value="fonts">
    <AccordionTrigger>Fonts</AccordionTrigger>
    <AccordionContent>
      Instrument Sans for headings, Inter for text.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="colors">
    <AccordionTrigger>Colors</AccordionTrigger>
    <AccordionContent>
      Four of them: accent, page, cards and text.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
    },
  ],
  keyboard: [
    { keys: "Tab", does: "Moves between the questions." },
    { keys: "Enter / Space", does: "Opens or closes the focused question." },
  ],
  a11y: [
    "Each question is a button with aria-expanded, and aria-controls pointing at its answer.",
    "Each open answer is a region labelled by its question; a closed one isn't rendered at all.",
    "The plus turning into a cross is drawn only; open or closed is in aria-expanded.",
  ],
};

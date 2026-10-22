"use client";

import type { ComponentType } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../ui/accordion";

export function Demo() {
  return (
    <Accordion defaultValue={["download"]} className="w-full max-w-[380px]">
      <AccordionItem value="download">
        <AccordionTrigger>What&apos;s in the download?</AccordionTrigger>
        <AccordionContent>The whole site in Next.js or Astro, every page wired and written.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="client">
        <AccordionTrigger>Can I use it for a client?</AccordionTrigger>
        <AccordionContent>With a Team license, yes. Pro covers what you make for yourself.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="updates">
        <AccordionTrigger>Do updates cost extra?</AccordionTrigger>
        <AccordionContent>No. Each one lands on your Purchases page.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Single() {
  return (
    <Accordion defaultValue={["zip"]} className="w-full max-w-[380px]">
      <AccordionItem value="zip">
        <AccordionTrigger>How do I get the code?</AccordionTrigger>
        <AccordionContent>Download a zip from your Purchases page, or send it to GitHub.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="astro">
        <AccordionTrigger>Is there an Astro version?</AccordionTrigger>
        <AccordionContent>Every template comes in Next.js and Astro.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="refund">
        <AccordionTrigger>Can I get a refund?</AccordionTrigger>
        <AccordionContent>Yes, within 14 days, no questions asked.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Multiple() {
  return (
    <Accordion type="multiple" defaultValue={["figma", "paper"]} className="w-full max-w-[380px]">
      <AccordionItem value="figma">
        <AccordionTrigger>Copy to Figma</AccordionTrigger>
        <AccordionContent>Auto layout, components and named layers. No plugin.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="paper">
        <AccordionTrigger>Copy to Paper</AccordionTrigger>
        <AccordionContent>The same section, as editable layers in Paper.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="svg">
        <AccordionTrigger>Copy as SVG</AccordionTrigger>
        <AccordionContent>A flat picture, for anywhere else.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function Plain() {
  return (
    <Accordion numbered={false} className="w-full max-w-[380px]">
      <AccordionItem value="fonts">
        <AccordionTrigger>Fonts</AccordionTrigger>
        <AccordionContent>Instrument Sans for headings, Inter for text.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="colors">
        <AccordionTrigger>Colors</AccordionTrigger>
        <AccordionContent>Four of them: accent, page, cards and text.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export const examples: Record<string, ComponentType> = { single: Single, multiple: Multiple, plain: Plain };

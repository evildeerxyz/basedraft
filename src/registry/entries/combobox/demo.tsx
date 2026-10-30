"use client";

import { ChartLineUpIcon, CodeIcon, DatabaseIcon, QuestionIcon, SquaresFourIcon, TagIcon, TextHOneIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { Combobox, type ComboboxOption } from "../../ui/combobox";

/* The sections of the templates, under the kind of section each is, to add to a page in Studio. */
const SECTIONS = [
  {
    label: "Hero",
    options: [
      { value: "zuno-hero", label: "Zuno hero", icon: <TextHOneIcon weight="duotone" />, hint: "Fintech" },
      { value: "noma-hero", label: "Noma hero", icon: <TextHOneIcon weight="duotone" />, hint: "AI and data" },
      { value: "auren-hero", label: "Auren hero", icon: <TextHOneIcon weight="duotone" />, hint: "Developer tools" },
    ],
  },
  {
    label: "Pricing",
    options: [
      { value: "zuno-pricing", label: "Zuno pricing", icon: <TagIcon weight="duotone" />, hint: "Fintech" },
      { value: "auren-pricing", label: "Auren pricing", icon: <TagIcon weight="duotone" />, hint: "Developer tools" },
    ],
  },
  {
    label: "Questions",
    options: [
      { value: "zuno-faq", label: "Zuno questions", icon: <QuestionIcon weight="duotone" />, hint: "Fintech", keywords: ["faq"] },
      { value: "noma-faq", label: "Noma questions", icon: <QuestionIcon weight="duotone" />, hint: "AI and data", keywords: ["faq"] },
    ],
  },
];

export function Demo() {
  return (
    <div className="grid w-full max-w-[340px] gap-2">
      <p className="px-1 text-xs font-medium text-[var(--bd-muted)]">Sections to add</p>
      <Combobox multiple label="Sections to add" placeholder="Search sections" defaultValue={["zuno-hero", "auren-pricing"]} options={SECTIONS} />
    </div>
  );
}

const FONTS = [
  {
    label: "Sans",
    options: [
      { value: "instrument", label: "Instrument Sans" },
      { value: "inter", label: "Inter" },
      { value: "geist", label: "Geist" },
      { value: "plex", label: "IBM Plex Sans" },
      { value: "manrope", label: "Manrope" },
      { value: "space", label: "Space Grotesk" },
    ],
  },
  {
    label: "Serif",
    options: [
      { value: "fraunces", label: "Fraunces" },
      { value: "newsreader", label: "Newsreader" },
      { value: "instrument-serif", label: "Instrument Serif" },
    ],
  },
];

function Single() {
  return <Combobox label="Heading font" placeholder="Search fonts" defaultValue="instrument" options={FONTS} className="max-w-[280px]" />;
}

function Multiple() {
  return <Combobox multiple label="Sections to add" placeholder="Search sections" defaultValue={["zuno-hero"]} options={SECTIONS} className="max-w-[340px]" />;
}

function Create() {
  const [labels, setLabels] = useState<ComboboxOption[]>([
    { value: "fintech", label: "Fintech", icon: <ChartLineUpIcon weight="duotone" /> },
    { value: "data", label: "AI and data", icon: <DatabaseIcon weight="duotone" /> },
    { value: "devtools", label: "Developer tools", icon: <CodeIcon weight="duotone" /> },
  ]);
  return (
    <Combobox
      multiple
      label="Labels"
      placeholder="Add a label"
      defaultValue={["fintech"]}
      options={labels}
      onCreate={(name) => setLabels((l) => [...l, { value: name, label: name, icon: <SquaresFourIcon weight="duotone" /> }])}
      className="max-w-[320px]"
    />
  );
}

/* The people on a Team license, found as if from a server: a little later than typed. */
const TEAM = ["Emily Carter", "Jake Morrison", "Sarah Mitchell", "Ryan Brooks", "Ashley Cooper", "Brandon Reed"];

function Async() {
  const [results, setResults] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Combobox
      label="Assign to"
      placeholder="Search your team"
      filter={false}
      loading={loading}
      options={results}
      empty="No one on the team by that name."
      onSearch={(q) => {
        clearTimeout(timer.current);
        if (!q.trim()) {
          setLoading(false);
          return setResults([]);
        }
        setLoading(true);
        timer.current = setTimeout(() => {
          setResults(TEAM.filter((n) => n.toLowerCase().includes(q.trim().toLowerCase())).map((n) => ({ value: n, label: n })));
          setLoading(false);
        }, 450);
      }}
      className="max-w-[280px]"
    />
  );
}

function Small() {
  return <Combobox size="sm" label="Template" placeholder="Template" defaultValue="noma" options={[{ value: "zuno", label: "Zuno", hint: "Fintech" }, { value: "noma", label: "Noma", hint: "AI and data" }, { value: "auren", label: "Auren", hint: "Developer tools" }]} className="max-w-[220px]" />;
}

export const examples: Record<string, ComponentType> = { single: Single, multiple: Multiple, create: Create, async: Async, small: Small };

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import type { Icon } from "@phosphor-icons/react";
import { BellRingingIcon, ChatsCircleIcon, CodeBlockIcon, ShareNetworkIcon, TableIcon } from "@phosphor-icons/react/ssr";
import { BrandTile, type BrandKey } from "@/components/site/brand";
import { cn } from "@/lib/cn";
import { AiChat, AlertCard, EditorMock, GraphMock, TablesMock } from "@/components/home/mocks";
import { Heading } from "@/components/home/sections";
import { Backdrop } from "@/components/shapes/shapes";
import { Container, Section, SectionHeading } from "@/components/site/ui";

type Tool = {
  id: string;
  icon: Icon;
  label: string;
  title: string;
  body: string;
  specs: [string, string][];
  backdrop: { shape: Backdrop; color: string };
  visual: ReactNode;
};

const TOOLS: Tool[] = [
  {
    id: "ask",
    icon: ChatsCircleIcon,
    label: "Ask Data",
    title: "Plain English in. Reviewed SQL out.",
    body: "Scope the tables, attach columns with /, pick a model. Nomad AI drafts the query, explains it and runs it on the spot when it only reads.",
    specs: [
      ["Input", "A sentence, with / to attach a column"],
      ["Output", "SQL, a result table and a chart"],
      ["Runs", "Instantly when read only"],
    ],
    backdrop: { shape: "burst", color: "var(--accent)" },
    visual: <AiChat />,
  },
  {
    id: "tables",
    icon: TableIcon,
    label: "Tables",
    title: "A spreadsheet that respects your schema.",
    body: "Browse every table with grouped views and filters you can read out loud. Edit a cell inline and Noma checks it against your constraints before it saves.",
    specs: [
      ["Filters", "Written like a sentence"],
      ["Edits", "Checked against constraints first"],
      ["Import", "CSV, with a dry run"],
    ],
    backdrop: { shape: "zigzag", color: "var(--warn)" },
    visual: <TablesMock />,
  },
  {
    id: "editor",
    icon: CodeBlockIcon,
    label: "SQL Editor",
    title: "For when you want to write it yourself.",
    body: "A fast editor with autocomplete that knows your columns, a shared snippet library and a one-click explanation for any query.",
    specs: [
      ["Autocomplete", "Tables, columns and joins"],
      ["Snippets", "Shared with your whole team"],
      ["Explain", "Any query, in plain words"],
    ],
    backdrop: { shape: "wedge", color: "var(--violet)" },
    visual: <EditorMock />,
  },
  {
    id: "graph",
    icon: ShareNetworkIcon,
    label: "Relationships",
    title: "See how your data actually connects.",
    body: "Every foreign key drawn as a map. Each line shows the join Noma would use, so you can check its reasoning before you trust an answer.",
    specs: [
      ["Map", "Every foreign key, drawn for you"],
      ["Joins", "Shown on each line"],
      ["Orphans", "Rows with a broken key, flagged"],
    ],
    backdrop: { shape: "cross", color: "var(--ok)" },
    visual: <GraphMock />,
  },
  {
    id: "insights",
    icon: BellRingingIcon,
    label: "Insights",
    title: "Bad numbers, caught before standup.",
    body: "Noma watches the metrics you care about and tells you when one moves more than it should, with the query that found it attached.",
    specs: [
      ["Digest", "Every morning, only what changed"],
      ["Alerts", "Slack or email"],
      ["Follow up", "Open any alert as a question"],
    ],
    backdrop: { shape: "stairs", color: "var(--blue)" },
    visual: <AlertCard />,
  },
];

function ToolText({ tool, index, onActive }: { tool: Tool; index: number; onActive: (index: number) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  // The tool whose text crosses the middle of the screen owns the sticky figure.
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);
  return (
    <li ref={ref} id={tool.id} className="scroll-mt-24 border-t border-line py-10 lg:flex lg:min-h-[78vh] lg:flex-col lg:justify-center lg:py-16">
      <p className="flex items-center gap-2 text-[14px] font-medium text-ink-2">
        <tool.icon size={20} weight="duotone" className="text-accent" />
        {tool.label}
      </p>
      <h3 className="mt-4 max-w-[480px] text-balance text-[32px] font-medium leading-[1.06] tracking-[-0.04em] text-ink md:text-[40px]">{tool.title}</h3>
      <p className="mt-5 max-w-[460px] text-[17px] leading-relaxed text-ink-2">{tool.body}</p>
      <dl className="mt-7 max-w-[460px] border-t border-line">
        {tool.specs.map(([term, detail]) => (
          <div key={term} className="grid grid-cols-[120px_1fr] gap-4 border-b border-line py-3 text-[14.5px]">
            <dt className="text-ink-3">{term}</dt>
            <dd className="text-ink">{detail}</dd>
          </div>
        ))}
      </dl>
      <div className="relative mt-10 lg:hidden">
        <Backdrop shape={tool.backdrop.shape} color={tool.backdrop.color} className="inset-0" />
        <div className="relative mx-auto max-w-[460px] px-4 py-10">{tool.visual}</div>
      </div>
    </li>
  );
}

/** Five tools as one scroll: the text scrolls, the figure stays and swaps to the tool you are reading. */
export function ProductTools() {
  const [active, setActive] = useState(0);
  const tool = TOOLS[active];
  return (
    <section id="tools" className="scroll-mt-24 border-t border-line">
      <Container>
        <div className="pt-24">
          <Heading title="Five tools. One place to ask." body="Everything a team needs to get answers out of Postgres, without handing out raw database access." />
        </div>
        <div className="mt-12 grid lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <ol>
            {TOOLS.map((item, index) => (
              <ToolText key={item.id} tool={item} index={index} onActive={setActive} />
            ))}
          </ol>
          <div className="hidden lg:block">
            <div className="sticky top-[calc(50vh-300px)] py-10">
              <div className="relative">
                <Backdrop shape={tool.backdrop.shape} color={tool.backdrop.color} className="inset-0" />
                <div className="relative mx-auto max-w-[460px] py-14">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={tool.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {tool.visual}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <ol className="mt-6 flex justify-center gap-1.5" aria-hidden>
                {TOOLS.map((item, index) => (
                  <li key={item.id} className={cn("h-1 transition-all duration-300", index === active ? "w-8 bg-ink" : "w-3 bg-line-strong")} />
                ))}
              </ol>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

const INTEGRATIONS: { name: string; brand: BrandKey; status: "GA" | "Beta" }[] = [
  { name: "PostgreSQL", brand: "postgresql", status: "GA" },
  { name: "Supabase", brand: "supabase", status: "GA" },
  { name: "Neon", brand: "neon", status: "GA" },
  { name: "Amazon RDS", brand: "rds", status: "GA" },
  { name: "Aurora", brand: "aurora", status: "GA" },
  { name: "Cloud SQL", brand: "googleCloud", status: "GA" },
  { name: "MySQL", brand: "mysql", status: "Beta" },
  { name: "Snowflake", brand: "snowflake", status: "Beta" },
];

export function Integrations() {
  return (
    <Section id="integrations" inner="py-24">
      <SectionHeading title="Works with the Postgres you already run." description="Connect with a read-only role in two minutes. MySQL and Snowflake are in beta on Team and Enterprise." />
      <div className="mt-12 grid grid-cols-2 border-l border-t border-line md:grid-cols-4">
        {INTEGRATIONS.map((integration) => (
          <div key={integration.name} className="flex items-center justify-between border-b border-r border-line px-6 py-7">
            <span className="flex items-center gap-3 text-[16px] font-medium tracking-[-0.02em] text-ink">
              <BrandTile brand={integration.brand} />
              {integration.name}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 font-mono text-[10.5px]",
                integration.status === "GA" ? "bg-[color-mix(in_oklab,var(--ok)_18%,transparent)] text-ok" : "bg-[color-mix(in_oklab,var(--warn)_20%,transparent)] text-warn",
              )}
            >
              {integration.status}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

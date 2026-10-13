"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useScroll, useSpring, useTransform } from "motion/react";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsLeftRightIcon,
  BellRingingIcon,
  CalendarBlankIcon,
  ChatCircleTextIcon,
  ChatsCircleIcon,
  ClockCounterClockwiseIcon,
  EyeSlashIcon,
  FileSqlIcon,
  GaugeIcon,
  PathIcon,
  RowsIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TimerIcon,
  TreeStructureIcon,
  UsersThreeIcon,
  DatabaseIcon,
} from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { CASE_STUDIES, LAYERS, METRICS, TESTIMONIALS } from "@/lib/content";
import { ConnectScene, StackScene, type LayerKey } from "@/components/gl/lazy";
import { Backdrop, DashedMark, Zigzag } from "@/components/shapes/shapes";
import { BrandTile, type BrandKey } from "@/components/site/brand";
import { Portrait } from "@/components/site/portrait";
import { Container, Index, LinkArrow } from "@/components/site/ui";
import { ConnectBar } from "./hero";
import { AiChat, AlertCard, ApprovalCard } from "./mocks";
import { Showcase } from "./showcase";

/** Split heading: title on the left, supporting copy on the right. */
export function Heading({ label, title, body, children, className }: { label?: string; title: ReactNode; body?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16", className)}>
      <div>
        {label && <Index className="mb-4">{label}</Index>}
        <h2 className="max-w-[720px] text-balance text-[38px] font-medium leading-[1.04] tracking-[-0.045em] text-ink md:text-[52px]">{title}</h2>
      </div>
      {(body || children) && (
        <div className="flex flex-col items-start gap-5 lg:pb-2">
          {body && <p className="max-w-[460px] text-pretty text-[17px] leading-relaxed text-ink-2">{body}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* How it works: the product itself, in isometric WebGL                       */
/* ------------------------------------------------------------------------ */

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 py-24 md:py-32">
      <Container>
        <Heading title="Four steps from question to answer." body="This is the Noma workspace, running on a sample database. Watch a question go in, the SQL get approved and the answer come out.">
          <LinkArrow href="/product">See the product</LinkArrow>
        </Heading>
        <Showcase className="mt-14" />
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Chapters: one product moment on a printed field, with its spec sheet       */
/* ------------------------------------------------------------------------ */

export function Chapter({
  id,
  icon: LabelIcon,
  label,
  title,
  body,
  specs,
  href,
  backdrop,
  visual,
  reverse = false,
}: {
  id: string;
  icon: Icon;
  label: string;
  title: ReactNode;
  body: string;
  specs: [Icon, string, string][];
  href: string;
  backdrop: { shape: Backdrop; color: string };
  visual: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Container className="grid items-center gap-14 py-16 md:py-24 lg:grid-cols-12 lg:gap-8">
        <div className={cn("lg:col-span-5", reverse && "lg:order-2 lg:col-start-8")}>
          <p className="flex items-center gap-2 text-[14px] font-medium text-ink-2">
            <LabelIcon size={20} weight="duotone" className="text-accent" />
            {label}
          </p>
          <h2 className="mt-4 text-balance text-[36px] font-medium leading-[1.05] tracking-[-0.045em] text-ink md:text-[46px]">{title}</h2>
          <p className="mt-5 max-w-[460px] text-pretty text-[17px] leading-relaxed text-ink-2">{body}</p>
          <dl className="mt-8 border-t border-line">
            {specs.map(([SpecIcon, term, detail]) => (
              <div key={term} className="grid grid-cols-[130px_1fr] gap-4 border-b border-line py-3 text-[14.5px] leading-snug">
                <dt className="flex items-center gap-2 text-ink-3">
                  <SpecIcon size={17} weight="duotone" className="shrink-0 text-ink-2" />
                  {term}
                </dt>
                <dd className="text-ink">{detail}</dd>
              </div>
            ))}
          </dl>
          <LinkArrow href={href} className="mt-8">
            Learn more
          </LinkArrow>
        </div>
        <div className={cn("relative lg:col-span-7", reverse && "lg:order-1 lg:col-start-1")}>
          <Backdrop shape={backdrop.shape} color={backdrop.color} className="inset-0" />
          <div className={cn("relative w-full max-w-[460px] px-5 py-14 sm:px-0 md:py-20", reverse ? "mx-auto lg:ml-[10%]" : "mx-auto lg:mr-[10%]")}>{visual}</div>
        </div>
      </Container>
    </section>
  );
}

export function NomadAi() {
  return (
    <Chapter
      id="ai"
      icon={SparkleIcon}
      label="Nomad AI"
      title="A co-pilot that shows its work."
      body="Ask follow-ups in plain English. Nomad AI keeps the thread, drafts the SQL and tells you which tables it touched, so you can trust a number before you share it."
      specs={[
        [ChatsCircleIcon, "Context", "Keeps the whole thread, so follow-ups just work"],
        [GaugeIcon, "Reads", "Run the moment you ask, on a read replica"],
        [FileSqlIcon, "Explains", "Every join and filter, in plain words"],
      ]}
      href="/product#ask"
      backdrop={{ shape: "burst", color: "var(--accent)" }}
      visual={<AiChat />}
    />
  );
}

export function Security() {
  return (
    <Chapter
      id="security"
      icon={ShieldCheckIcon}
      label="Guardrails"
      reverse
      title="Every write waits for a human."
      body="Noma can draft an UPDATE in a second. It cannot run one without a signature. Approvals, limits and a full audit trail are on from day one."
      specs={[
        [SealCheckIcon, "Writes", "INSERT, UPDATE, DELETE and DDL need approval"],
        [EyeSlashIcon, "Your rows", "Never sent to a model. Schema and stats only"],
        [TimerIcon, "Limits", "30 second timeouts and 500 row caps by default"],
        [ClockCounterClockwiseIcon, "Audit log", "Every decision, exportable to your SIEM"],
      ]}
      href="/security"
      backdrop={{ shape: "stairs", color: "var(--ok)" }}
      visual={<ApprovalCard />}
    />
  );
}

export function Insights() {
  return (
    <Chapter
      id="insights"
      icon={BellRingingIcon}
      label="Insights"
      title="Bad numbers, caught before standup."
      body="Noma watches the metrics you care about and tells you when one moves more than it should, with the query that found it attached."
      specs={[
        [CalendarBlankIcon, "Digest", "Every morning, only what changed"],
        [BellRingingIcon, "Alerts", "Slack or email, with the query attached"],
        [ChatCircleTextIcon, "Follow up", "Open any alert as a question"],
      ]}
      href="/product#insights"
      backdrop={{ shape: "wedge", color: "var(--blue)" }}
      visual={<AlertCard />}
    />
  );
}

/* ------------------------------------------------------------------------ */
/* Architecture: the WebGL stack, pulled apart by scroll                      */
/* ------------------------------------------------------------------------ */

const LAYER_ICONS: Record<string, Icon> = {
  postgres: DatabaseIcon,
  pool: ArrowsLeftRightIcon,
  schema: TreeStructureIcon,
  planner: PathIcon,
  ai: SparkleIcon,
  gate: SealCheckIcon,
};

function LayerItem({
  layer,
  level,
  active,
  setActive,
  align,
}: {
  layer: (typeof LAYERS)[number];
  level: number;
  active: LayerKey | null;
  setActive: (key: LayerKey | null) => void;
  align: "left" | "right";
}) {
  const on = active === layer.id;
  const LayerIcon = LAYER_ICONS[layer.id];
  return (
    <li>
      <button
        type="button"
        onPointerEnter={() => setActive(layer.id)}
        onPointerLeave={() => setActive(null)}
        onFocus={() => setActive(layer.id)}
        onBlur={() => setActive(null)}
        className={cn("flex w-full flex-col gap-1.5 border-t py-5 text-left transition-colors", on ? "border-accent" : "border-line", align === "right" && "lg:items-end lg:text-right")}
      >
        <span className={cn("flex items-center gap-2 font-mono text-[11.5px] transition-colors", on ? "text-accent" : "text-ink-3", align === "right" && "lg:flex-row-reverse")}>
          <LayerIcon size={20} weight="duotone" />
          Layer {level}
        </span>
        <span className="text-[19px] font-medium tracking-[-0.02em] text-ink">{layer.title}</span>
        <span className={cn("max-w-[280px] text-[14.5px] leading-relaxed transition-colors", on ? "text-ink" : "text-ink-2")}>{layer.body}</span>
      </button>
    </li>
  );
}

export function ArchitectureSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center 0.55"],
  });
  const target = useTransform(scrollYProgress, [0, 1], [0.65, 1.85]);
  const gap = useSpring(target, { stiffness: 90, damping: 22 });
  const [active, setActive] = useState<LayerKey | null>(null);
  const levels = LAYERS.map((layer, i) => ({ layer, level: i + 1 }));
  const top = levels.slice(3).reverse();
  const bottom = levels.slice(0, 3).reverse();
  return (
    <section id="architecture" data-theme="dark" className="scroll-mt-24 bg-sunken">
      <Container className="py-24 md:py-32">
        <Heading title="Six layers. One human checkpoint." body="Everything between a question and your data, stacked in the order it runs. Point at a layer to find it in the stack." />
        <div ref={ref} className="mt-14 grid items-center gap-6 lg:grid-cols-[1fr_1.5fr_1fr]">
          <ul className="order-2 lg:order-1">
            {top.map(({ layer, level }) => (
              <LayerItem key={layer.id} layer={layer} level={level} active={active} setActive={setActive} align="left" />
            ))}
          </ul>
          <div className="relative order-1 mx-auto aspect-[4/5] w-full max-w-[560px] lg:order-2">
            <StackScene gap={gap} active={active} className="absolute inset-0" />
          </div>
          <ul className="order-3">
            {bottom.map(({ layer, level }) => (
              <LayerItem key={layer.id} layer={layer} level={level} active={active} setActive={setActive} align="right" />
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Metrics                                                                  */
/* ------------------------------------------------------------------------ */

const METRIC_ICONS: Icon[] = [UsersThreeIcon, ChatsCircleIcon, RowsIcon, TimerIcon];

export function Stats() {
  return (
    <Container className="py-16 md:py-20">
      <dl className="grid grid-cols-2 border-y border-line lg:grid-cols-4">
        {METRICS.map((metric, i) => {
          const MetricIcon = METRIC_ICONS[i % METRIC_ICONS.length];
          return (
            <div key={metric.label} className={cn("flex flex-col-reverse justify-end gap-3 border-line p-5 md:p-7", i % 2 === 1 && "border-l", i > 1 && "max-lg:border-t", i === 2 && "lg:border-l")}>
              <dt className="max-w-[200px] text-[14.5px] leading-snug text-ink-2">{metric.label}</dt>
              <dd className="text-[44px] font-medium leading-none tracking-[-0.055em] text-ink tabular-nums md:text-[56px]">
                {metric.value.toLocaleString("en-US", {
                  minimumFractionDigits: metric.decimals ?? 0,
                  maximumFractionDigits: metric.decimals ?? 0,
                })}
                {metric.suffix}
              </dd>
              <MetricIcon size={26} weight="duotone" className="mb-6 text-accent" />
            </div>
          );
        })}
      </dl>
    </Container>
  );
}

/* ------------------------------------------------------------------------ */
/* Testimonials: one featured story, then the rest of the room                */
/* ------------------------------------------------------------------------ */

const QUOTES = TESTIMONIALS.map((testimonial) => ({
  ...testimonial,
  study: CASE_STUDIES.find((study) => study.company === testimonial.company),
}));

export function Testimonials({ featured = true }: { featured?: boolean }) {
  const [lead, ...rest] = QUOTES;
  const others = featured ? rest : QUOTES.slice(1);
  return (
    <section className="py-20 md:py-28">
      <Container>
        <Heading title="Teams that stopped waiting on SQL.">
          <LinkArrow href="/customers">Read their stories</LinkArrow>
        </Heading>
        {featured && (
          <figure className="mt-12 grid border border-line bg-surface md:grid-cols-[minmax(0,340px)_1fr] lg:grid-cols-[minmax(0,420px)_1fr]">
            <Portrait name={lead.name} className="aspect-square" />
            <div className="flex flex-col justify-between gap-10 border-line p-7 max-md:border-t md:border-l md:p-10">
              {lead.study && (
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[52px] font-medium leading-none tracking-[-0.055em] text-ink">{lead.study.metric}</span>
                  <span className="text-[15px] text-ink-2">
                    {lead.study.metricLabel} at {lead.company}
                  </span>
                </p>
              )}
              <blockquote className="text-balance text-[24px] font-medium leading-[1.25] tracking-[-0.025em] text-ink md:text-[30px]">&ldquo;{lead.quote}&rdquo;</blockquote>
              <figcaption className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5 text-[14px]">
                <span>
                  <span className="font-medium text-ink">{lead.name}</span>
                  <span className="text-ink-2">
                    {" "}
                    · {lead.role}, {lead.company}
                  </span>
                </span>
                <LinkArrow href="/customers">The {lead.company} story</LinkArrow>
              </figcaption>
            </div>
          </figure>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {others.map((quote) => (
            <figure key={quote.name} className="flex gap-5 border border-line bg-surface p-5 md:p-6">
              <Portrait name={quote.name} cell={1} className="size-[76px] shrink-0 md:size-[96px]" />
              <div className="flex flex-col justify-between gap-4">
                <blockquote className="text-[16px] leading-relaxed text-ink">&ldquo;{quote.quote}&rdquo;</blockquote>
                <figcaption className="text-[13.5px]">
                  <span className="font-medium text-ink">{quote.name}</span>
                  <span className="text-ink-2">
                    {" "}
                    · {quote.role}, {quote.company}
                  </span>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Integrations: a wiring diagram, sources into Noma, answers out             */
/* ------------------------------------------------------------------------ */

type Tool = { name: string; brand: BrandKey; note: string };

const SOURCES: Tool[] = [
  { name: "PostgreSQL", brand: "postgresql", note: "12 and up" },
  { name: "Supabase", brand: "supabase", note: "GA" },
  { name: "Neon", brand: "neon", note: "GA" },
  { name: "Amazon RDS", brand: "rds", note: "GA" },
  { name: "Cloud SQL", brand: "googleCloud", note: "GA" },
];

const DESTINATIONS: Tool[] = [
  { name: "Slack", brand: "slack", note: "Live answers" },
  { name: "Microsoft Teams", brand: "teams", note: "Live answers" },
  { name: "Notion", brand: "notion", note: "Embeds" },
  { name: "Linear", brand: "linear", note: "Issues" },
  { name: "GitHub", brand: "github", note: "Saved queries" },
  { name: "Webhooks", brand: "webhooks", note: "Any tool" },
];

function ToolList({ label, tools, side }: { label: string; tools: Tool[]; side: "left" | "right" }) {
  return (
    <div className="relative pt-9 lg:pt-0">
      <p className={cn("absolute top-0 text-[13px] text-ink-3 lg:-top-9", side === "right" && "lg:right-0")}>{label}</p>
      <ul
        className={cn(
          "relative grid gap-2",
          // the bus bar that collects every row on the side facing Noma
          side === "left"
            ? "lg:before:absolute lg:before:-right-10 lg:before:bottom-6 lg:before:top-6 lg:before:w-px lg:before:bg-line-strong"
            : "lg:before:absolute lg:before:-left-10 lg:before:bottom-6 lg:before:top-6 lg:before:w-px lg:before:bg-line-strong",
        )}
      >
        {tools.map(({ name, brand, note }) => (
          <li
            key={name}
            className={cn(
              "relative flex h-12 items-center gap-3 border border-line bg-surface px-3",
              side === "left"
                ? "lg:after:absolute lg:after:left-full lg:after:top-1/2 lg:after:h-px lg:after:w-10 lg:after:bg-line-strong"
                : "lg:flex-row-reverse lg:text-right lg:after:absolute lg:after:right-full lg:after:top-1/2 lg:after:h-px lg:after:w-10 lg:after:bg-line-strong",
            )}
          >
            <BrandTile brand={brand} size="sm" />
            <span className="min-w-0 truncate text-[14.5px] font-medium text-ink">{name}</span>
            <span className={cn("shrink-0 font-mono text-[11px] text-ink-3", side === "left" ? "ml-auto" : "lg:mr-auto max-lg:ml-auto")}>{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Integrations() {
  return (
    <section id="integrations" className="scroll-mt-24 border-t border-line">
      <Container className="py-20 md:py-28">
        <Heading title="Plugs into Postgres. Answers land where you work." body="If it speaks Postgres 12 or newer, Noma does too. Send what you find to the tools your team already lives in.">
          <LinkArrow href="/product#integrations">Every integration</LinkArrow>
        </Heading>
        <div className="mt-20 grid gap-8 lg:grid-cols-[1fr_200px_1fr] lg:items-center lg:gap-0">
          <ToolList label="Reads from" tools={SOURCES} side="left" />
          <div aria-hidden className="relative hidden h-20 lg:block">
            <span className="absolute left-10 top-1/2 h-px w-6 bg-line-strong" />
            <span className="absolute right-10 top-1/2 h-px w-6 bg-line-strong" />
            <span className="absolute left-1/2 top-1/2 grid size-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center bg-inverse">
              <DashedMark stroke="var(--inverse-fg)" className="h-7 w-8" />
            </span>
          </div>
          <ToolList label="Sends to" tools={DESTINATIONS} side="right" />
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------------ */
/* Final call to action                                                     */
/* ------------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="relative mt-8">
      <Zigzag color="var(--accent)" className="-mb-px" />
      <div data-tone="accent" className="relative bg-page">
        <Container className="grid items-end gap-10 py-20 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <h2 className="max-w-[720px] text-balance text-[44px] font-medium leading-[1] tracking-[-0.055em] text-ink md:text-[72px]">Your database already knows. Go ask it.</h2>
            <p className="mt-6 max-w-[480px] text-[18px] leading-relaxed text-ink-2">Connect Postgres in two minutes. Free for three seats, no card, read only until you say otherwise.</p>
          </div>
          <div>
            <div className="relative mb-2 aspect-[16/10] w-full max-w-[560px]">
              <ConnectScene className="absolute inset-0" span={12.5} packet="ink" />
            </div>
            <ConnectBar tone="ink" />
            <p className="mt-4 flex flex-wrap items-center gap-x-2 text-[14px] text-ink-2">
              Rather see it on a call first?
              <Link href="/contact" className="inline-flex items-center gap-1.5 font-medium text-ink underline underline-offset-4">
                <CalendarBlankIcon size={16} weight="duotone" />
                Book a demo
              </Link>
            </p>
          </div>
        </Container>
      </div>
    </section>
  );
}

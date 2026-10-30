import { ArrowRightIcon, GitBranchIcon, PlusIcon, StorefrontIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FAQS, PLANS, PRO_FEATURES } from "./content";
import { DotField } from "./dot-field";
import { WithKeys } from "./keys";
import { FEATURE_ICON } from "./plan-parts";
import { btn, btnLg, Tick } from "./sheet";
import { TextLink } from "./showcase";

const FREE = PLANS.find((p) => p.name === "Free")!;
const PRO = PLANS.find((p) => p.featured)!;
const TEAM = PLANS.find((p) => p.name === "Team")!;

/** What a plan has, a line each, ticked. */
function Ticks({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-ui">
          <Tick className="mt-[3px]" />
          {t}
        </li>
      ))}
    </ul>
  );
}

/*
 * The plans, on a panel in the hero's light: Free and Team as frosted glass, and Pro between them
 * as the one solid white card, ringed in blue and lifted, the one we'd pick for you. Each reads top
 * to bottom the same way: name and a word on it, the price, what's in it, and one action.
 */
export function PricingSheet({ id }: { id?: string }) {
  const plans = [FREE, PRO, TEAM];
  return (
    <div id={id} data-scroll="settle" className="bd-light bd-paper glow-b relative isolate mx-auto max-w-[1200px] scroll-mt-28 overflow-hidden rounded-[32px] p-3 sm:p-5 lg:p-7">
      <DotField patches={[]} layers={1} fade="radial-gradient(70% 45% at 50% 0%, #000, transparent 80%)" />
      <ul className="grid items-stretch gap-3 lg:grid-cols-3 lg:gap-4">
        {plans.map((p) => {
          const pro = p === PRO;
          const soft = pro ? "text-muted" : "text-paper-muted";
          const items = pro ? PRO_FEATURES.map((f) => f.t) : p.features.map((f) => f.t);
          return (
            <li
              key={p.name}
              className={cn(
                "relative flex flex-col rounded-[24px] p-7 sm:p-8",
                pro ? "bd-sheen bg-surface text-fg shadow-[var(--bd-shadow-float),0_0_0_1.5px_color-mix(in_oklab,var(--bd-brand)_32%,transparent)] lg:-my-2 lg:py-10" : "bg-white/55 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.75),var(--bd-shadow-resting)] backdrop-blur-xl dark:bg-white/[0.04] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[22px] font-medium tracking-[-0.025em]">{p.name}</h3>
                {pro && (
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium leading-none text-brand-ink">Most picked</span>
                )}
              </div>
              <p className={cn("mt-2 text-ui", soft)}>{p.blurb}</p>
              <p className="mt-8 flex items-baseline gap-2">
                <span className="font-display text-[56px] font-medium leading-none tracking-[-0.045em]">{p.price}</span>
                <span className={cn("text-ui", soft)}>{p.period || "forever"}</span>
              </p>
              <p className={cn("mt-2 text-meta", soft)}>{p.terms.t}</p>
              <Ticks items={items} className={cn("mt-7 border-t pt-7", pro ? "border-line" : "border-paper-ink/10")} />
              <span aria-hidden className="block min-h-9 flex-1" />
              <Link href={p.cta.href} prefetch={false} className={cn(pro ? btnLg.ink : `${btnLg.onPaperOutline}`, "w-full")}>
                {p.cta.label} <ArrowRightIcon weight="regular" size={15} />
              </Link>
              <p className={cn("mt-3 text-center text-meta", soft)}>{p.note.t}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 pb-1 text-center text-ui text-paper-muted">
        Need just one site? Every template is also $79 on its own.{" "}
        <Link href="/templates" className="font-medium text-paper-ink underline-offset-4 hover:underline">
          Browse templates
        </Link>
      </p>
    </div>
  );
}

/* What each license covers. Each use leads with the same icon it has on the plan cards, where it has one. */
const LICENSE: Array<{ group: string; rows: Array<[Icon, string, ...ReactNode[]]> }> = [
  {
    group: "What you can use",
    rows: [
      [FEATURE_ICON.studio, "Studio", true, true, true],
      [FEATURE_ICON.layouts, "Every template and section", false, true, true],
      [FEATURE_ICON.code, "Code in Next.js or Astro, downloaded or on GitHub", false, true, true],
      [FEATURE_ICON.figma, "Copy to Figma and Paper", false, true, true],
      [GitBranchIcon, "Updates, downloaded or sent to GitHub", false, true, true],
    ],
  },
  {
    group: "Where you can use it",
    rows: [
      [FEATURE_ICON.personal, "People", "You", "You", "Up to 10"],
      [FEATURE_ICON.personal, "Personal projects", true, true, true],
      [StorefrontIcon, "Commercial products you own", false, true, true],
      [FEATURE_ICON.client, "Client projects", false, false, true],
    ],
  },
];

/* The label column, then a column per plan: narrow on a phone, wide enough for a button above that. */
const COLS = "grid grid-cols-[minmax(0,1fr)_repeat(3,56px)] sm:grid-cols-[minmax(0,1fr)_repeat(3,148px)]";
/* Pro's column runs down the table as one band of light blue, from its head to its button. */
const BAND = "bg-brand-soft/55";

function Mark({ value }: { value: ReactNode }) {
  if (value === true)
    return (
      <span role="img" aria-label="Included">
        <Tick />
      </span>
    );
  if (value === false) return <span aria-label="Not included" className="block h-px w-3 bg-line-strong" />;
  return <span className="text-meta font-medium">{value}</span>;
}

/**
 * Every plan side by side, open on the page: uses down the side, the plans across the top, and
 * Pro's column lit in light blue all the way down. The head stays in view as you scroll, and each
 * plan's button sits at the foot of its column.
 */
export function CompareTable({ id }: { id?: string }) {
  const plans = [FREE, PRO, TEAM];
  const cell = (p: (typeof plans)[number], extra?: string) => cn("flex items-center justify-center px-2", p.featured && BAND, extra);
  return (
    <div id={id} role="table" aria-label="Compare plans" className="bd-reveal mx-auto max-w-[1120px] scroll-mt-28">
      <div role="row" className={cn(COLS, "sticky top-[var(--bd-header-h,80px)] z-10 bg-canvas")}>
        <span role="columnheader" className="flex items-end pb-4 text-meta text-subtle">
          What each plan includes
        </span>
        {plans.map((p) => (
          <div key={p.name} role="columnheader" className={cell(p, "flex-col rounded-t-[20px] pb-4 pt-5 text-center")}>
            <span className="text-ui font-medium">{p.name}</span>
            <span className="mt-0.5 hidden text-meta text-muted sm:block">
              {p.price} {p.period || "forever"}
            </span>
          </div>
        ))}
      </div>
      {LICENSE.map(({ group, rows }) => (
        <div key={group} role="rowgroup">
          <div className={COLS}>
            <p className="pb-2 pt-7 font-display text-[18px]">{group}</p>
            {plans.map((p) => (
              <span key={p.name} aria-hidden className={cell(p)} />
            ))}
          </div>
          {rows.map(([I, label, ...cols]) => (
            <div key={label} role="row" className={cn(COLS, "border-t border-dashed border-line")}>
              <span role="rowheader" className="flex min-h-12 min-w-0 items-center gap-3 py-2.5 pr-3 text-ui">
                <I weight="duotone" size={16} className="hidden shrink-0 text-subtle sm:block" />
                <span className="line-clamp-2">{label}</span>
              </span>
              {cols.map((c, n) => (
                <span key={n} role="cell" className={cell(plans[n])}>
                  <Mark value={c} />
                </span>
              ))}
            </div>
          ))}
        </div>
      ))}
      {/* Each plan's way in, at the foot of its column. */}
      <div className={cn(COLS, "border-t border-dashed border-line")}>
        <span />
        {plans.map((p) => (
          <div key={p.name} className={cell(p, "rounded-b-[20px] px-2 pb-4 pt-4 sm:px-4")}>
            <Link href={p.cta.href} prefetch={false} aria-label={p.cta.label} className={cn(p.featured ? btn.ink : btn.outline, "w-full px-0 max-sm:size-9 max-sm:p-0")}>
              <span className="max-sm:hidden">{p.cta.label}</span>
              <ArrowRightIcon weight="regular" size={14} className="sm:hidden" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Questions beside their heading, each on a soft rounded row: the questions scan at a glance, answers open one at a time. */
export function FaqSheet({ id, title = "Questions, answered", aside }: { id?: string; title?: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="bd-reveal grid scroll-mt-28 gap-x-20 gap-y-10 py-28 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div>
        <h2 id={id ? `${id}-title` : undefined} className="text-headline">
          {title}
        </h2>
        <div className="mt-5 text-ui text-muted">
          {aside ?? (
            <TextLink href="mailto:hello@basedraft.site" up>
              Write to us
            </TextLink>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {FAQS.map((f) => (
          <details key={f.q} name="faq" className="bd-faq group rounded-[var(--bd-r-sheet)] border border-line bg-surface transition-shadow open:shadow-[var(--bd-shadow-raised)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-heading [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-[transform,background-color,color] duration-300 ease-[var(--bd-ease)] group-open:rotate-45 group-open:bg-brand-soft group-open:text-brand-ink">
                <PlusIcon size={13} weight="regular" />
              </span>
            </summary>
            <p className="max-w-[600px] px-6 pb-6 text-body text-muted">
              <WithKeys text={f.a} />
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

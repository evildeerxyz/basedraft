"use client";

import { ArrowRightIcon, CheckIcon, MinusIcon, PlusIcon, StackIcon, UserIcon, UsersThreeIcon } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PLANS } from "./content";
import { TEMPLATES, templateLogo } from "./live";
import { btnLg } from "./sheet";

/*
 * Two ways to work out what you'd pay, side by side: pick the templates you'd use and see them
 * against Pro, or say how many people and see Team against a Pro license each. Every figure is
 * worked out from today's prices in content.ts and live.ts; nothing here is typed in.
 */

const PRO = PLANS.find((p) => p.featured)!;
const TEAM = PLANS.find((p) => p.name === "Team")!;
const dollars = (price: string) => Number(price.replace(/[^0-9.]/g, ""));
const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
/* Team's seats, read from its terms ("Up to 10 people"). */
const SEATS = Number(TEAM.terms.t.match(/\d+/)?.[0] ?? 0);
/* How many templates sit in the row before the rest fold into a "+N" circle. */
const SHOWN = 3;
/* A picked chip: raised and ringed in ink, so it reads as on without leaning on color. */
const PICKED = "bg-raised text-fg shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--bd-fg)_70%,transparent),var(--bd-shadow-resting)]";
const UNPICKED = "bg-surface-2 text-muted hover:text-fg";

/** A calculator's card: its icon and question, the control, then the answer on a strip of the hero's light. */
function Card({ icon: I, title, lead, control, answer }: { icon: Icon; title: string; lead: string; control: ReactNode; answer: ReactNode }) {
  return (
    <div className="flex flex-col rounded-[28px] border border-line bg-surface p-3 shadow-[var(--bd-shadow-resting)]">
      <div className="px-4 pb-6 pt-5 sm:px-5">
        <span className="grid size-10 place-items-center rounded-[12px] bg-surface-2 text-fg">
          <I weight="duotone" size={20} />
        </span>
        <h3 className="mt-5 font-display text-[24px] leading-[1.15]">{title}</h3>
        <p className="mt-2 text-ui text-muted">{lead}</p>
        <div className="mt-6">{control}</div>
      </div>
      <div className="bd-paper glow-c mt-auto flex flex-col rounded-[20px] p-5 sm:p-6">{answer}</div>
    </div>
  );
}

/** One line of a reckoning: what it is, and what it comes to. */
function Row({ label, value, strong }: { label: ReactNode; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-paper-ink/[0.08] py-2.5 text-ui last:border-b-0">
      <span className={strong ? "font-medium text-paper-ink" : "text-paper-muted"}>{label}</span>
      <motion.span key={value} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className={cn("shrink-0 tabular-nums", strong ? "font-display text-[22px] text-paper-ink" : "font-medium text-paper-ink")}>
        {value}
      </motion.span>
    </div>
  );
}

/** A template you can pick: its logo, name and price on a pill. */
function Chip({ t, on, onClick }: { t: (typeof TEMPLATES)[number]; on: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-ui transition-[background-color,box-shadow,color] duration-200", on ? PICKED : UNPICKED)}>
      <Image src={templateLogo(t.slug)} alt="" width={28} height={28} unoptimized className="size-7 rounded-full" />
      <span className="font-medium">{t.name}</span>
      <span className="tabular-nums opacity-70">${t.price as number}</span>
    </button>
  );
}

/**
 * The templates past the first few, folded into a circle that counts them. It opens a short list
 * to pick from, and wears the picked ring while any of them is picked, so nothing chosen is hidden.
 */
function More({ rest, picked, toggle }: { rest: typeof TEMPLATES; picked: string[]; toggle: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const on = rest.filter((t) => picked.includes(t.slug)).length;
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={root} className="sm:relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${rest.length} more ${rest.length === 1 ? "template" : "templates"}${on ? `, ${on} picked` : ""}`}
        onClick={() => setOpen((o) => !o)}
        className={cn("grid size-10 place-items-center rounded-full text-ui font-medium tabular-nums transition-[background-color,box-shadow,color] duration-200", on || open ? PICKED : UNPICKED)}
      >
        +{rest.length}
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 top-full z-20 mt-2 w-[232px] origin-top-left rounded-[18px] sm:left-auto sm:right-0 sm:origin-top-right bg-surface p-1.5 shadow-[var(--bd-shadow-float),0_0_0_1px_var(--bd-line)]"
          >
            {rest.map((t) => {
              const sel = picked.includes(t.slug);
              return (
                <li key={t.slug}>
                  <button type="button" aria-pressed={sel} onClick={() => toggle(t.slug)} className="flex w-full items-center gap-2.5 rounded-[12px] p-1.5 pr-2.5 text-left text-ui transition-colors hover:bg-surface-2">
                    <Image src={templateLogo(t.slug)} alt="" width={28} height={28} unoptimized className="size-7 rounded-full" />
                    <span className="flex-1 font-medium">{t.name}</span>
                    <span className="tabular-nums text-muted">${t.price as number}</span>
                    <span className={cn("grid size-5 place-items-center rounded-full transition-colors", sel ? "bg-fg text-canvas" : "shadow-[inset_0_0_0_1px_var(--bd-line-strong)]")}>
                      {sel && <CheckIcon weight="bold" size={11} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Pick the templates you'd use: their prices on their own, against Pro. */
function Templates() {
  const paid = TEMPLATES.filter((t) => t.price !== "free");
  const [picked, setPicked] = useState<string[]>(paid[0] ? [paid[0].slug] : []);
  const pro = dollars(PRO.price);
  const chosen = paid.filter((t) => picked.includes(t.slug));
  const total = chosen.reduce((n, t) => n + (t.price as number), 0);
  const one = chosen.length === 1 ? chosen[0] : null;
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));
  const rest = paid.slice(SHOWN);
  return (
    <Card
      icon={StackIcon}
      title="One template, or all of them"
      lead="Pick the templates you'd use, and see what they come to on their own."
      control={
        // On a phone the list opens under the whole row, so it can't run off the screen's edge.
        <div className="relative z-10 flex flex-wrap gap-2">
          {paid.slice(0, SHOWN).map((t) => (
            <Chip key={t.slug} t={t} on={picked.includes(t.slug)} onClick={() => toggle(t.slug)} />
          ))}
          {rest.length > 0 && <More rest={rest} picked={picked} toggle={toggle} />}
        </div>
      }
      answer={
        <>
          <Row label={chosen.length ? `${chosen.length} ${chosen.length === 1 ? "template" : "templates"} on ${chosen.length === 1 ? "its" : "their"} own` : "No templates picked"} value={money(total)} />
          <Row label="Pro: every template and section, with Figma copy" value={PRO.price} />
          <p className="mt-4 min-h-[3lh] text-ui text-paper-ink sm:min-h-[2lh]">
            {chosen.length === 0 ? "Pick the templates you'd use above." : total > pro ? `Pro is ${money(total - pro)} less, and every new template comes with it as it ships.` : one ? `On its own, ${one.name} is ${money(pro - total)} less than Pro. Copying to Figma comes only with Pro.` : "The same as Pro, which brings every other template too."}
          </p>
          <div className="mt-4">
            {one && total < pro ? (
              <Link href={`/checkout?product=${one.slug}`} prefetch={false} className={cn(btnLg.onPaperOutline, "w-full justify-between")}>
                Buy {one.name}, {money(total)} once <ArrowRightIcon weight="regular" size={15} />
              </Link>
            ) : (
              <Link href={PRO.cta.href} prefetch={false} className={cn(btnLg.ink, "w-full justify-between")}>
                Get Pro, {PRO.price} once <ArrowRightIcon weight="regular" size={15} />
              </Link>
            )}
          </div>
        </>
      }
    />
  );
}

/** Say how many people: Team for all of them, against a Pro license each. */
function Team() {
  const [n, setN] = useState(Math.min(3, SEATS));
  const pro = dollars(PRO.price);
  const team = dollars(TEAM.price);
  const each = n * pro;
  const set = (v: number) => setN(Math.min(SEATS, Math.max(1, v)));
  return (
    <Card
      icon={UsersThreeIcon}
      title="For your team"
      lead={`Team covers up to ${SEATS} people on one license, with client work. Say how many of you there are.`}
      control={
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1">
            <button type="button" onClick={() => set(n - 1)} disabled={n <= 1} aria-label="One person fewer" className="grid size-8 place-items-center rounded-full text-fg transition-colors hover:bg-raised disabled:pointer-events-none disabled:opacity-35">
              <MinusIcon weight="regular" size={14} />
            </button>
            <span aria-live="polite" className="min-w-[84px] whitespace-nowrap text-center text-ui tabular-nums">
              {n} {n === 1 ? "person" : "people"}
            </span>
            <button type="button" onClick={() => set(n + 1)} disabled={n >= SEATS} aria-label="One person more" className="grid size-8 place-items-center rounded-full text-fg transition-colors hover:bg-raised disabled:pointer-events-none disabled:opacity-35">
              <PlusIcon weight="regular" size={14} />
            </button>
          </div>
          {/* The seats, a circle each: filled for the people counted, dashed for room to spare. Tap one to set how many. */}
          <div className="flex flex-wrap gap-1" role="group" aria-label="People">
            {Array.from({ length: SEATS }, (_, i) => {
              const on = i < n;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => set(i + 1)}
                  aria-label={`${i + 1} ${i ? "people" : "person"}`}
                  aria-pressed={on}
                  className={cn("grid size-6 place-items-center rounded-full transition-[background-color,color,box-shadow,scale] duration-200 hover:scale-110", on ? "bg-fg text-canvas" : "border border-dashed border-line-strong text-transparent")}
                >
                  <UserIcon weight="fill" size={12} />
                </button>
              );
            })}
          </div>
        </div>
      }
      answer={
        <>
          <Row label={`${n} Pro ${n === 1 ? "license" : "licenses"}, one each`} value={money(each)} />
          <Row label={`Team, up to ${SEATS} people, ${money(team / n)} a person`} value={TEAM.price} />
          <p className="mt-4 min-h-[3lh] text-ui text-paper-ink sm:min-h-[2lh]">
            {n === 1 ? `Just you? Pro is ${PRO.price} and covers everything you make for yourself.` : each > team ? `Team is ${money(each - team)} less, and only Team covers client projects.` : `${n} Pro licenses are ${money(team - each)} less, but only Team covers client projects and leaves room to grow.`}
          </p>
          <div className="mt-4">
            {n === 1 ? (
              <Link href={PRO.cta.href} prefetch={false} className={cn(btnLg.ink, "w-full justify-between")}>
                Get Pro, {PRO.price} once <ArrowRightIcon weight="regular" size={15} />
              </Link>
            ) : (
              <Link href={TEAM.cta.href} prefetch={false} className={cn(each > team ? btnLg.ink : btnLg.onPaperOutline, "w-full justify-between")}>
                Get Team, {TEAM.price} once <ArrowRightIcon weight="regular" size={15} />
              </Link>
            )}
          </div>
        </>
      }
    />
  );
}

export function ProCalculators() {
  return (
    <div className="bd-reveal grid gap-4 lg:grid-cols-2">
      <Templates />
      <Team />
    </div>
  );
}

"use client";

import { ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon, CaretDownIcon, CaretLeftIcon, CaretRightIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, ViewTransition, type ReactNode, type Ref, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { DotField } from "./dot-field";
import { SECTION_ICON, type IconType } from "./icons";
import { GLASS, LIB_WRAP } from "./library-css";
import { isFree, KINDS, SECTIONS, sectionShot, TEMPLATES, templateLogo, templateOf, USED_KINDS, type LiveSection, type SectionKind } from "./live";
import { Menu } from "./menu";
import { ProBadge } from "./sheet";
import { GLOW, glowAt } from "./stage";

/*
 * The libraries, components and blocks, laid out as a showroom rather than as docs. Each front
 * page opens on a light card like the home page's hero, then a frosted dock follows you down the
 * page to filter what's shown, and the pieces sit on the hero's light, big enough to try. A page
 * for one piece puts it on a large stage, with the way to the next one beside its name.
 */

const SLIDE = { type: "spring", stiffness: 520, damping: 42 } as const;

/** Every library page fades into the next, like the rest of the site. */
export function LibraryFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  return (
    <ViewTransition key={path} enter="page-in" exit="page-out" default="none">
      <div className="pb-24">{children}</div>
    </ViewTransition>
  );
}

/* ---------- the front page's card ---------- */

/**
 * A library's front page opens on one light card, the way the home page does, everything on it
 * centered: a frosted pill of what's in it, the title, a line, and the actions.
 */
export function LibraryHero({ facts, title, lead, actions }: { facts: ReactNode; title: ReactNode; lead: ReactNode; actions: ReactNode }) {
  return (
    <div className="px-3 pt-3 sm:px-4 sm:pt-4">
      <header className="bd-light bd-paper glow-c relative isolate overflow-hidden rounded-[32px]">
        <DotField patches={[]} layers={1} fade="radial-gradient(60% 70% at 50% 30%, #000, transparent 85%)" className="opacity-40" />
        <div className={cn(LIB_WRAP, "flex flex-col items-center py-16 text-center sm:py-20 lg:py-24")}>
          <div className="bd-reveal">{facts}</div>
          <h1 className="bd-reveal mt-7 max-w-[760px] text-balance font-display text-[44px] font-medium leading-[1.02] tracking-[-0.042em] text-paper-ink sm:text-[64px]">{title}</h1>
          <p className="bd-reveal mt-5 max-w-[560px] text-pretty text-lead text-paper-muted">{lead}</p>
          <div className="bd-reveal mt-9 flex flex-wrap items-center justify-center gap-3">{actions}</div>
        </div>
      </header>
    </div>
  );
}

/** The frosted pill of what's in a library, a fact at a time with a hairline between. */
export function HeroFacts({ items }: { items: Array<{ icon: ReactNode; value: ReactNode; label: string }> }) {
  return (
    <p className="inline-flex h-9 items-center rounded-full bg-paper/70 p-1 text-meta text-paper-muted shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--bd-paper-ink)_10%,transparent),var(--bd-shadow-resting)] backdrop-blur">
      {items.map((f, i) => (
        <span key={f.label} className={cn("flex h-7 items-center gap-1.5 px-2.5 [&_svg]:shrink-0", i > 0 && "border-l border-paper-ink/10", i > 1 && "max-sm:hidden")}>
          {f.icon}
          <span className="font-medium text-paper-ink">{f.value}</span> {f.label}
        </span>
      ))}
    </p>
  );
}

/* ---------- the dock ---------- */

/**
 * The frosted dock: it sits under the hero, then holds just under the header as the page scrolls,
 * so filtering or jumping is always one tap away. Its pills scroll sideways when they run long;
 * whatever sits after them (a search, the templates) stays put at its end.
 */
export function Dock({ label, children, after }: { label: string; children: ReactNode; after?: ReactNode }) {
  const id = useId();
  return (
    <div className="sticky top-[calc(var(--bd-header-h,80px)+10px)] z-30 mt-6 px-3 sm:px-4">
      <nav aria-label={label} className={cn("mx-auto flex w-fit max-w-full items-center gap-1 rounded-full p-1", GLASS)}>
        <LayoutGroup id={id}>
          <div className="no-scrollbar flex min-w-0 items-center gap-0.5 overflow-x-auto">{children}</div>
        </LayoutGroup>
        {after && (
          <>
            <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />
            {after}
          </>
        )}
      </nav>
    </div>
  );
}

/**
 * A pill in the dock: an icon or a logo, the name, and a count. The one that's on is inked, on a
 * pill that slides from one to the next. It's a button that filters, or a link that jumps.
 */
export function DockPill({ on, onClick, href, icon: I, logo, count, children }: { on: boolean; onClick?: () => void; href?: string; icon?: IconType; logo?: string; count?: number; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  // The one that's on scrolls into view when the dock runs wider than the screen.
  useEffect(() => {
    if (on) ref.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [on]);
  const body = (
    <>
      {on && <motion.span layoutId="dock-pill" aria-hidden className="absolute inset-0 rounded-full bg-fg" transition={SLIDE} />}
      {I && <I size={15} weight="duotone" aria-hidden className={cn("relative shrink-0", on ? "text-canvas" : "text-subtle")} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logo && <img src={logo} alt="" width={18} height={18} className="relative size-[18px] shrink-0 rounded-[5px]" />}
      <span className="relative whitespace-nowrap">{children}</span>
      {count !== undefined && <span className={cn("relative text-[11px] tabular-nums", on ? "text-canvas/60" : "text-subtle")}>{count}</span>}
    </>
  );
  const cls = cn("relative flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200", on ? "text-canvas" : "text-muted hover:bg-fg/[0.05] hover:text-fg");
  return href ? (
    <a ref={ref as Ref<HTMLAnchorElement>} href={href} onClick={onClick} aria-current={on ? "location" : undefined} className={cls}>
      {body}
    </a>
  ) : (
    <button ref={ref as Ref<HTMLButtonElement>} type="button" onClick={onClick} aria-pressed={on} className={cls}>
      {body}
    </button>
  );
}

/**
 * Which of a page's parts you're reading: the last whose top has passed under the header and the
 * dock, or the last of all at the very foot of the page.
 */
export function useSpy(ids: string[], offset = 180) {
  const [at, setAt] = useState(ids[0]);
  const key = ids.join(" ");
  useEffect(() => {
    const els = key
      .split(" ")
      .map((i) => document.getElementById(i))
      .filter((e): e is HTMLElement => !!e);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top < offset) current = el.id;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = els.at(-1)?.id ?? current;
      setAt(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
    };
  }, [key, offset]);
  return at;
}

/** After a filter changes, a page scrolled past the gallery's top goes back up to it, so what's shown starts in view. */
export function useBackToTop(top: RefObject<HTMLElement | null>, key: string) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = top.current;
    if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - 150;
    if (scrollY > y) window.scrollTo({ top: y, behavior: "smooth" });
  }, [key, top]);
}

/* ---------- tiles ---------- */

/*
 * A tile: one card, its corner a little rounder than a sheet's. Hovered, it lifts and its edge
 * darkens. Each use sets its own height.
 */
const TILE_FRAME = "group/tile relative isolate flex flex-col overflow-hidden rounded-[24px] shadow-[inset_0_0_0_1px_var(--bd-line-subtle)] transition-[box-shadow,translate] duration-300 ease-[var(--bd-ease)] hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]";
/** A gallery tile, on the quiet gray. */
export const TILE = `bd-panel ${TILE_FRAME}`;
/** A tile in the hero's light, for the few that point onward. */
const TILE_LIT = `bd-paper ${TILE_FRAME}`;

/** The round glass button in a tile's corner that goes to it. */
export function TileArrow({ up }: { up?: boolean }) {
  const I = up ? ArrowUpRightIcon : ArrowRightIcon;
  return (
    <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-full text-muted transition-[color,translate] duration-300 ease-[var(--bd-ease)] group-hover/tile:text-fg", up ? "group-hover/tile:-translate-y-0.5 group-hover/tile:translate-x-0.5" : "group-hover/tile:translate-x-0.5", GLASS)}>
      <I weight="regular" size={14} />
    </span>
  );
}

/** A section as a tile: its template's logo and name over it, and its picture rising from the tile's foot. */
function BlockTile({ s, i }: { s: LiveSection; i: number }) {
  const t = templateOf(s.template)!;
  return (
    <motion.li layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SLIDE} className="min-w-0">
      <Link href={`/blocks/${s.kind}#${s.template}-${s.id}`} className={cn(TILE, GLOW[glowAt(i)], "h-[300px] sm:h-[320px]")}>
        <span className="flex items-center gap-2.5 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={templateLogo(t.slug)} alt="" width={28} height={28} className="size-7 shrink-0 rounded-[8px]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-ui font-medium text-fg">{t.name}</span>
            <span className="block truncate text-meta text-subtle">{s.name}</span>
          </span>
          {!isFree(s) && <ProBadge />}
          <TileArrow />
        </span>
        <span className="relative mx-4 flex-1 sm:mx-5">
          <span className="absolute inset-x-0 bottom-0 top-0 overflow-hidden rounded-t-[14px] bg-surface shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-raised)]">
            <Image src={sectionShot(s)} alt="" fill sizes="(min-width: 1280px) 380px, (min-width: 768px) 45vw, 100vw" className="object-cover object-top transition-transform duration-700 ease-[var(--bd-ease)] group-hover/tile:scale-[1.03]" />
          </span>
        </span>
      </Link>
    </motion.li>
  );
}

/** A kind's head in the gallery: its icon on a tile, its name and count, a line on it, and the way to see them live. */
function KindHead({ kind, n }: { kind: (typeof KINDS)[number]; n: number }) {
  const I = SECTION_ICON[kind.id];
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
          <I size={20} weight="duotone" />
        </span>
        <div className="min-w-0">
          <h2 className="flex items-baseline gap-2 font-display text-[24px] font-medium leading-[1.15] tracking-[-0.028em]">
            {kind.label}
            <span className="font-sans text-[13px] font-normal tracking-normal tabular-nums text-subtle">{n}</span>
          </h2>
          <p className="mt-0.5 truncate text-ui text-muted">{kind.blurb}</p>
        </div>
      </div>
      <Link href={`/blocks/${kind.id}`} className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-fg/[0.05] px-4 text-[13px] font-medium text-fg transition-colors hover:bg-fg/[0.09]">
        See them live <ArrowRightIcon weight="regular" size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/**
 * Blocks' front page under its card: the dock (every kind as a pill, then the templates as logos
 * to narrow by) and the sections, a group per kind with all of them showing, or the one kind.
 */
export function BlocksBrowser() {
  const [kind, setKind] = useState<SectionKind | "all">("all");
  const [from, setFrom] = useState<string[]>([]);
  const top = useRef<HTMLDivElement>(null);
  useBackToTop(top, `${kind} ${from.join(",")}`);
  const inFrom = (s: LiveSection) => !from.length || from.includes(s.template);
  const pool = SECTIONS.filter(inFrom);
  const kinds = USED_KINDS.map((k) => ({ ...k, n: pool.filter((s) => s.kind === k.id).length }));
  const shown = kinds.filter((k) => (kind === "all" || k.id === kind) && k.n > 0);
  const toggle = (slug: string) => setFrom((f) => (f.includes(slug) ? f.filter((x) => x !== slug) : [...f, slug]));
  const groups = shown.map((k) => ({ k, list: pool.filter((s) => s.kind === k.id) }));
  // Where each group's tiles start in one count down the page, so the tiles' light keeps turning from group to group.
  const starts = groups.map((_, gi) => groups.slice(0, gi).reduce((sum, g) => sum + g.list.length, 0));
  return (
    <>
      <Dock
        label="Filter sections"
        after={
          <div role="group" aria-label="From the templates" className="flex shrink-0 items-center gap-1 pr-1">
            {TEMPLATES.map((t) => {
              const on = from.includes(t.slug);
              return (
                <button key={t.slug} type="button" aria-pressed={on} onClick={() => toggle(t.slug)} title={t.name} aria-label={`Only ${t.name}`} className={cn("grid size-8 place-items-center rounded-full transition-[opacity,box-shadow] duration-200", on ? "shadow-[0_0_0_2px_var(--bd-fg)]" : from.length ? "opacity-40 hover:opacity-100" : "hover:shadow-[0_0_0_2px_var(--bd-line-strong)]")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={templateLogo(t.slug)} alt="" width={26} height={26} className="size-[26px] rounded-full" />
                </button>
              );
            })}
          </div>
        }
      >
        <DockPill on={kind === "all"} onClick={() => setKind("all")} icon={SquaresFourIcon} count={pool.length}>
          All
        </DockPill>
        {kinds.map((k) => (
          <DockPill key={k.id} on={kind === k.id} onClick={() => setKind(k.id)} icon={SECTION_ICON[k.id]} count={k.n}>
            {k.label}
          </DockPill>
        ))}
      </Dock>
      <div ref={top} className={cn(LIB_WRAP, "pt-6")}>
        {from.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 pt-4 text-[13px] text-muted">
            Only from {from.map((s) => templateOf(s)!.name).join(" and ")}.
            <button type="button" onClick={() => setFrom([])} className="font-medium text-fg underline-offset-4 hover:underline">
              Show every template
            </button>
          </p>
        )}
        {shown.length === 0 && <p className="py-24 text-center text-ui text-muted">No {kinds.find((k) => k.id === kind)?.label.toLowerCase()} sections in those templates yet.</p>}
        {groups.map(({ k, list }, gi) => (
          <section key={k.id} id={k.id} aria-label={k.label} className="scroll-mt-[calc(var(--bd-header-h,80px)+88px)] pt-12">
            <KindHead kind={k} n={k.n} />
            <ul className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {list.map((s, j) => (
                  <BlockTile key={s.key} s={s} i={starts[gi] + j} />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

/* ---------- a page for one piece ---------- */

/**
 * The row at the top of a piece's page: back to the library on the left; on the right the one
 * before, a menu of all of them under the current name, and the one after.
 */
export function PieceNav({ back, prev, next, menu }: { back: { href: string; label: string }; prev?: { href: string; label: string }; next?: { href: string; label: string }; menu: ReactNode }) {
  const step = "grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-fg/[0.06] hover:text-fg";
  return (
    <div className="flex items-center justify-between gap-3 pt-6">
      <Link href={back.href} className="group inline-flex h-9 items-center gap-2 rounded-full bg-fg/[0.05] pl-3 pr-4 text-[13px] font-medium text-fg transition-colors hover:bg-fg/[0.09]">
        <ArrowLeftIcon weight="regular" size={13} className="transition-transform duration-300 group-hover:-translate-x-0.5" />
        {back.label}
      </Link>
      <div className="flex items-center gap-0.5 rounded-full bg-fg/[0.05] p-0.5">
        {prev ? (
          <Link href={prev.href} aria-label={`Previous: ${prev.label}`} title={prev.label} className={step}>
            <CaretLeftIcon weight="regular" size={14} />
          </Link>
        ) : (
          <span className={cn(step, "pointer-events-none opacity-30")}>
            <CaretLeftIcon weight="regular" size={14} />
          </span>
        )}
        {menu}
        {next ? (
          <Link href={next.href} aria-label={`Next: ${next.label}`} title={next.label} className={step}>
            <CaretRightIcon weight="regular" size={14} />
          </Link>
        ) : (
          <span className={cn(step, "pointer-events-none opacity-30")}>
            <CaretRightIcon weight="regular" size={14} />
          </span>
        )}
      </div>
    </div>
  );
}

/** The current piece's name as a button that opens a menu of every piece in the library. */
export function PieceMenu({ label, current, icon: I, items }: { label: string; current: string; icon?: IconType; items: Array<{ label: string; href: string; icon?: IconType; hint?: string }> }) {
  return (
    <Menu
      label={label}
      align="right"
      className="no-scrollbar max-h-[min(420px,60vh)] overflow-y-auto"
      buttonClassName="flex h-9 items-center gap-2 rounded-full bg-surface px-3.5 text-[13px] font-medium text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)] transition-colors hover:bg-surface/80"
      button={
        <>
          {I && <I size={15} weight="duotone" className="text-subtle" />}
          {current}
          <CaretDownIcon weight="regular" size={11} className="text-subtle" />
        </>
      }
      items={items}
    />
  );
}

/** Every kind of section, as the menu on a kind's page. */
export function KindMenu({ current }: { current: SectionKind }) {
  const k = USED_KINDS.find((x) => x.id === current)!;
  return <PieceMenu label="Kinds of section" current={k.label} icon={SECTION_ICON[k.id]} items={USED_KINDS.map((x) => ({ label: x.label, href: `/blocks/${x.id}`, icon: SECTION_ICON[x.id], hint: String(SECTIONS.filter((s) => s.kind === x.id).length) }))} />;
}

/** The head of a piece's page: a small line of where it belongs, its name, and a line on it, with facts on the right. */
export function PieceHead({ kicker, title, lead, facts }: { kicker: ReactNode; title: ReactNode; lead: ReactNode; facts?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6 pb-8 pt-10">
      <div className="min-w-0 max-w-[640px]">
        <div className="flex items-center gap-2.5 text-[13px] text-muted">{kicker}</div>
        <h1 className="mt-4 text-balance font-display text-[40px] font-medium leading-[1.04] tracking-[-0.04em] sm:text-[52px]">{title}</h1>
        <p className="mt-3 text-pretty text-lead text-muted">{lead}</p>
      </div>
      {facts && <div className="flex flex-wrap gap-2 max-sm:hidden">{facts}</div>}
    </header>
  );
}

/** A small fact under or beside a piece's name: an icon and a line, on a quiet pill. */
export function FactPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-full bg-fg/[0.05] pl-3 pr-3.5 text-[13px] text-muted [&_svg]:shrink-0 [&_svg]:text-subtle">
      {icon}
      {children}
    </span>
  );
}

/** A part of a piece's page: a title and an optional line, then what it shows. */
export function PiecePart({ id, title, lead, children, className }: { id?: string; title: string; lead?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} aria-label={title} className={cn("scroll-mt-[calc(var(--bd-header-h,80px)+24px)] pt-16", className)}>
      <h2 className="font-display text-[26px] font-medium leading-[1.15] tracking-[-0.028em]">{title}</h2>
      {lead && <p className="mt-2 max-w-[600px] text-ui text-muted">{lead}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * The sections of one kind, as pills in the dock: each jumps to its section, and the one you're
 * reading is inked as you scroll.
 */
export function SectionDock({ items }: { items: Array<{ id: string; label: string; logo: string }> }) {
  const at = useSpy(
    items.map((i) => i.id),
    220,
  );
  return (
    <Dock label="Sections on this page">
      {items.map((it) => (
        <DockPill key={it.id} href={`#${it.id}`} on={at === it.id} logo={it.logo}>
          {it.label}
        </DockPill>
      ))}
    </Dock>
  );
}

/** Where to go next, at a page's foot: a few wide cards in the hero's light, each with an icon, a name and a line. */
export function NextUp({ title = "Keep going", items }: { title?: string; items: Array<{ href: string; label: string; lead: string; icon?: ReactNode; logo?: string; count?: number }> }) {
  return (
    <section aria-label={title} className="pt-20">
      <h2 className="font-display text-[26px] font-medium leading-[1.15] tracking-[-0.028em]">{title}</h2>
      <ul className="mt-6 grid gap-3 sm:gap-4 md:grid-cols-3">
        {items.map((it, i) => (
            <li key={it.href}>
              <Link href={it.href} prefetch={/\.\w+$/.test(it.href) ? false : undefined} className={cn(TILE_LIT, GLOW[glowAt(i + 1)], "h-full min-h-[176px] p-5")}>
                <span className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-[14px] bg-surface text-fg shadow-[var(--bd-shadow-resting),inset_0_0_0_1px_var(--bd-line-subtle)]">
                    {it.icon}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {it.logo && <img src={it.logo} alt="" width={28} height={28} className="size-7 rounded-[8px]" />}
                  </span>
                  <TileArrow />
                </span>
                <span className="mt-auto pt-6">
                  <span className="flex items-baseline gap-2 text-[17px] font-medium text-fg">
                    {it.label}
                    {it.count !== undefined && <span className="text-[12px] font-normal tabular-nums text-subtle">{it.count}</span>}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[13px] leading-[1.5] text-muted">{it.lead}</span>
                </span>
              </Link>
            </li>
        ))}
      </ul>
    </section>
  );
}

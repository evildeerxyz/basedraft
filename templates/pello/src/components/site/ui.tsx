"use client";

import { ArrowRightIcon, CheckIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Link from "next/link";
import { useId, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Person } from "@/lib/people";
import { personPhoto } from "@/lib/photos";
import { Dithered, type Ink } from "./dither";

/*
 * The pieces every section is built from. The home page tells one working day at Fieldwork, so its
 * sections are moments on a timeline: the time in the margin, what happened, and pello doing it.
 */

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10", className)}>{children}</div>;
}

/** A plain section of the page: its width, its spacing, and a pale band behind it with `tint`. */
export function Band({ children, id, className, inner, tint }: { children: ReactNode; id?: string; className?: string; inner?: string; tint?: boolean }) {
  return (
    <section id={id} className={cn("scroll-mt-24", tint && "bg-surface", className)}>
      <Container className={inner}>{children}</Container>
    </section>
  );
}

type Kind = "dark" | "light" | "accent";
const KIND: Record<Kind, string> = {
  dark: "pl-btn-dark",
  light: "pl-btn-light",
  accent: "bg-accent text-accent-ink hover:brightness-105",
};
const SIZE = { sm: "h-9 px-3.5 text-[15px]", md: "h-11 px-4 text-[15px]", lg: "h-12 px-5 text-[16px]" };
const button = (kind: Kind, size: keyof typeof SIZE) => cn("group/btn inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-medium transition-colors duration-150", SIZE[size], KIND[kind]);

/** The arrow a main action carries: it steps forward when the button is pointed at. */
const Arrow = () => <ArrowRightIcon size={16} weight="bold" className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />;

export function ButtonLink({ href, kind = "dark", size = "md", chevron = false, className, children }: { href: string; kind?: Kind; size?: keyof typeof SIZE; chevron?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn(button(kind, size), className)}>
      {children}
      {chevron && <Arrow />}
    </Link>
  );
}

export function Button({ kind = "dark", size = "md", chevron = false, className, children, ...rest }: ComponentProps<"button"> & { kind?: Kind; size?: keyof typeof SIZE; chevron?: boolean }) {
  return (
    <button type="button" className={cn(button(kind, size), "disabled:pointer-events-none disabled:opacity-40", className)} {...rest}>
      {children}
      {chevron && <Arrow />}
    </button>
  );
}

/** Leans a little toward the pointer while it's near, and springs back when it leaves. */
export function Magnetic({ children, strength = 0.18 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const still = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });
  return (
    <motion.span
      ref={ref}
      className="inline-flex"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (still || e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** A face, printed: the person's photo in the page's greys, or in vermilion while pello's on it. */
export function Face({ person, size = 36, hot, square, className }: { person: Pick<Person, "id" | "name">; size?: number; hot?: boolean; square?: boolean; className?: string }) {
  const inks: Ink[] = hot ? ["ink", "accent", "page"] : ["ink", "mute", "page"];
  return (
    <Dithered
      key={person.id}
      src={personPhoto(person.id)}
      alt=""
      inks={inks}
      cell={size < 48 ? 1 : 2}
      develop={false}
      focus={[0.5, 0.3]}
      className={cn("shrink-0", square ? "rounded-[8px]" : "rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** A section's head, set against the left edge: what it's about, and a line on what it means. */
export function SectionHead({ title, lead, actions, className, align = "left", as: Heading = "h2" }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; className?: string; align?: "left" | "center"; as?: "h1" | "h2" }) {
  return (
    <div className={cn("max-w-[820px]", align === "center" && "mx-auto text-center", className)}>
      <Heading className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-ink">{title}</Heading>
      {lead && <p className={cn("mt-5 max-w-[600px] text-pretty text-[19px] leading-[1.5] text-mute", align === "center" && "mx-auto")}>{lead}</p>}
      {actions && <div className={cn("mt-7 flex flex-wrap gap-3", align === "center" && "justify-center")}>{actions}</div>}
    </div>
  );
}

/** A number set apart: a step, a count. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("tabular font-mono text-[15px] font-medium text-accent", className)}>{children}</span>;
}

/** What happened to a request, as a word: done in ink with a tick, flagged in vermilion, open in grey. */
export function Tag({ tone, children, className }: { tone: "done" | "flag" | "open" | "live"; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-[15px] font-medium", tone === "flag" || tone === "live" ? "text-accent" : tone === "open" ? "text-mute" : "text-ink", className)}>
      {tone === "done" && <CheckIcon size={14} weight="bold" />}
      {tone === "flag" && <WarningIcon size={14} weight="bold" />}
      {tone === "live" && <motion.span aria-hidden className="h-3 w-[3px] rounded-full bg-accent" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />}
      {children}
    </span>
  );
}

/** A switch, in ink when it's on. */
export function Toggle({ on, onChange, label, className }: { on: boolean; onChange: (v: boolean) => void; label: string; className?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn("flex h-6 w-10 shrink-0 items-center rounded-full p-[3px] transition-colors duration-200", on ? "bg-ink" : "bg-line-strong", className)}>
      <motion.span layout transition={{ type: "spring", stiffness: 700, damping: 36 }} className={cn("size-[18px] rounded-full bg-page", on && "ml-auto")} />
    </button>
  );
}

/** Choices as words in a row; a line slides under the one that's picked. */
export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; label: string; className?: string }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex gap-5", className)}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={cn("relative h-9 text-[15px] font-medium transition-colors", value === o.value ? "text-ink" : "text-mute hover:text-ink")}>
          {o.label}
          {value === o.value && <motion.span layoutId={`seg-${id}`} className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-ink" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
        </button>
      ))}
    </div>
  );
}

/** A piece of pello itself: paper with a hairline, and a header saying where it is, if it has one. */
export function Window({ title, icon, aside, children, className }: { title?: ReactNode; icon?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("pl-card overflow-hidden rounded-[14px]", className)}>
      {title !== undefined && (
        <div className="flex h-12 items-center gap-2.5 px-4 shadow-[0_1px_0_var(--pl-line)]">
          {icon}
          <div className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink-2">{title}</div>
          {aside}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * A moment in Fieldwork's day: its time in the margin, on the line the whole day runs along, what
 * happened, and pello doing something about it. The dot fills when the moment comes into view.
 */
export function Moment({ id, time, where, title, lead, children }: { id?: string; time: string; where: string; title: ReactNode; lead?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { amount: 0.3, once: true });
  return (
    <section id={id} className="relative scroll-mt-24 py-20 lg:py-24">
      <Container>
        <div ref={ref} className="relative grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10">
          {/* The day's line, down the margin, and this moment's place on it. */}
          <span aria-hidden className="absolute -bottom-20 -top-20 left-[5px] hidden w-px bg-line lg:-bottom-24 lg:-top-24 lg:block" />
          <div className="relative">
            <div className="lg:sticky lg:top-28 lg:pl-8">
              <motion.span aria-hidden initial={false} animate={{ scale: seen ? 1 : 0.6, backgroundColor: seen ? "var(--pl-accent)" : "var(--pl-page)" }} transition={{ duration: 0.4 }} className="absolute left-0 top-[14px] hidden size-[11px] rounded-full shadow-[0_0_0_2px_var(--pl-accent)] lg:block" />
              <p className="tabular font-mono text-[40px] font-medium leading-none tracking-[-0.04em] text-ink lg:text-[48px]">{time}</p>
              <p className="mt-3 text-[15px] leading-[1.4] text-mute">{where}</p>
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="max-w-[760px] text-balance text-[clamp(2rem,3.6vw,3.1rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-ink">{title}</h2>
            {lead && <p className="mt-4 max-w-[600px] text-pretty text-[19px] leading-[1.5] text-mute">{lead}</p>}
            <div className="mt-10">{children}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

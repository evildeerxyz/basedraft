"use client";

import { CaretRightIcon } from "@phosphor-icons/react/ssr";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Link from "next/link";
import { useId, useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Person } from "@/lib/people";
import { personPhoto } from "@/lib/photos";
import { Dithered, type Ink } from "./dither";

/*
 * The pieces every section is built from. The page is drawn on a frame: two hairlines run its whole
 * length either side of the content, a rule crosses between sections, and a small cross marks where
 * they meet. Cards sit on the grey with a crisp lift; buttons are raised like keys.
 */

/** The frame's width, and how far content sits inside its lines. */
const FRAME = "w-[min(calc(100%-24px),1200px)]";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-10 lg:px-[76px]", className)}>{children}</div>;
}

function Cross({ side }: { side: "left" | "right" }) {
  return (
    <span aria-hidden className={cn("absolute top-0 size-[15px] -translate-y-1/2", side === "left" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2")}>
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line-strong" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-line-strong" />
    </span>
  );
}

/** A section on the frame: its lines run its full height, and with `rule` a hairline crosses its top. */
export function Band({ children, rule = false, id, className, inner }: { children: ReactNode; rule?: boolean; id?: string; className?: string; inner?: string }) {
  return (
    <section id={id} className={cn("relative scroll-mt-24", className)}>
      <div aria-hidden className={cn("pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 border-x border-line", FRAME)}>
        {rule && (
          <>
            <Cross side="left" />
            <Cross side="right" />
          </>
        )}
      </div>
      {rule && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-line" />}
      <Container className={cn("relative", inner)}>{children}</Container>
    </section>
  );
}

type Kind = "dark" | "light" | "accent";
const KIND: Record<Kind, string> = {
  dark: "pl-btn-dark",
  light: "pl-btn-light",
  accent: "bg-accent text-accent-ink shadow-[inset_0_2px_0_rgb(255_255_255/0.2)] hover:brightness-105",
};
const SIZE = { sm: "h-9 px-3 text-[15px] rounded-[10px]", md: "h-10 px-3.5 text-[15px] rounded-[12px]", lg: "h-12 px-5 text-[16px] rounded-[12px]" };
const button = (kind: Kind, size: keyof typeof SIZE) => cn("group/btn inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-[background-image,filter] duration-150", SIZE[size], KIND[kind]);

/** The chevron a button carries: it nudges forward when the button is pointed at. */
const Chevron = () => <CaretRightIcon size={14} weight="bold" className="opacity-70 transition-transform duration-200 group-hover/btn:translate-x-0.5" />;

export function ButtonLink({ href, kind = "dark", size = "md", chevron = true, className, children }: { href: string; kind?: Kind; size?: keyof typeof SIZE; chevron?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn(button(kind, size), className)}>
      {children}
      {chevron && <Chevron />}
    </Link>
  );
}

export function Button({ kind = "dark", size = "md", chevron = false, className, children, ...rest }: ComponentProps<"button"> & { kind?: Kind; size?: keyof typeof SIZE; chevron?: boolean }) {
  return (
    <button type="button" className={cn(button(kind, size), "disabled:pointer-events-none disabled:opacity-40", className)} {...rest}>
      {children}
      {chevron && <Chevron />}
    </button>
  );
}

/** Leans a little toward the pointer while it's near, and springs back when it leaves. */
export function Magnetic({ children, strength = 0.22 }: { children: ReactNode; strength?: number }) {
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
  const inks: Ink[] = hot ? ["ink", "accent", "surface"] : ["ink", "mute", "surface"];
  return (
    <Dithered
      key={person.id}
      src={personPhoto(person.id)}
      alt=""
      inks={inks}
      cell={size < 48 ? 1 : 2}
      develop={false}
      focus={[0.5, 0.3]}
      className={cn("shrink-0 shadow-[0_0_0_1px_var(--pl-line)]", square ? "rounded-[8px]" : "rounded-full", className)}
      style={{ width: size, height: size }}
    />
  );
}

/** A section's head: what it's about, a line on what it means, and what to do about it. */
export function SectionHead({ title, lead, actions, className, align = "center", as: Heading = "h2" }: { title: ReactNode; lead?: ReactNode; actions?: ReactNode; className?: string; align?: "left" | "center"; as?: "h1" | "h2" }) {
  return (
    <div className={cn("max-w-[760px]", align === "center" && "mx-auto text-center", className)}>
      <Heading className="text-balance font-display text-[clamp(2.3rem,4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.025em] text-ink">{title}</Heading>
      {lead && <p className={cn("mt-4 max-w-[600px] text-pretty text-[18px] leading-[1.55] text-mute", align === "center" && "mx-auto")}>{lead}</p>}
      {actions && <div className={cn("mt-7 flex flex-wrap gap-2", align === "center" && "justify-center")}>{actions}</div>}
    </div>
  );
}

/** A small grey label: a step's number, a count, a unit. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex h-7 items-center rounded-[7px] bg-sunken px-2 font-mono text-[15px] font-medium text-ink-2", className)}>{children}</span>;
}

/** What happened to a request: a dot and a word. Done is ink, flagged vermilion, open a ring, live a beat. */
export function Tag({ tone, children, className }: { tone: "done" | "flag" | "open" | "live"; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-surface px-2.5 text-[15px] font-medium shadow-[0_0_0_1px_var(--pl-line)]", tone === "flag" ? "text-accent" : "text-ink", className)}>
      <span aria-hidden className={cn("relative size-2 rounded-full", tone === "done" ? "bg-ink" : tone === "flag" ? "bg-accent" : tone === "live" ? "bg-accent" : "shadow-[inset_0_0_0_1.5px_var(--pl-mute)]")}>
        {tone === "live" && <span className="absolute inset-0 animate-ping rounded-full bg-accent/60" />}
      </span>
      {children}
    </span>
  );
}

/** A switch, in ink when it's on. */
export function Toggle({ on, onChange, label, className }: { on: boolean; onChange: (v: boolean) => void; label: string; className?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn("flex h-6 w-10 shrink-0 items-center rounded-full p-[3px] transition-colors duration-200", on ? "bg-ink" : "bg-line-strong", className)}>
      <motion.span layout transition={{ type: "spring", stiffness: 700, damping: 36 }} className={cn("size-[18px] rounded-full bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.25)]", on && "ml-auto")} />
    </button>
  );
}

/** A row of choices on a grey track, with a white tile that slides to the one that's picked. */
export function Segmented<T extends string>({ value, onChange, options, label, className }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; label: string; className?: string }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-[10px] bg-sunken p-[3px]", className)}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={cn("relative h-8 rounded-[8px] px-3 text-[15px] font-medium transition-colors", value === o.value ? "text-ink" : "text-mute hover:text-ink")}>
          {value === o.value && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[8px] bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.12),0_0_0_1px_var(--pl-line)]" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** A piece of the product, as a window: a white panel with a hairline, and a title bar if it has one. */
export function Window({ title, aside, children, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[12px] bg-surface shadow-[0_0_0_1px_var(--pl-line)]", className)}>
      {title !== undefined && (
        <div className="flex h-11 items-center justify-between gap-3 px-4 shadow-[0_1px_0_var(--pl-line)]">
          <div className="flex items-center gap-1.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2.5 rounded-full bg-line-strong" />
            ))}
          </div>
          <div className="min-w-0 flex-1 truncate text-center text-[15px] font-medium text-mute">{title}</div>
          <div className="flex w-[42px] justify-end">{aside}</div>
        </div>
      )}
      {children}
    </div>
  );
}

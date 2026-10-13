"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Link from "next/link";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { personPhoto } from "@/lib/photos";
import type { Person } from "@/lib/people";
import { Dithered, type Ink } from "./dither";

/* The pieces every section is built from: the page's width, buttons, faces, heads, tags and stamps. */

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-5 lg:px-10", className)}>{children}</div>;
}

type Kind = "ink" | "accent" | "quiet" | "light";
const KIND: Record<Kind, string> = {
  ink: "bg-ink text-page hover:bg-accent hover:text-accent-ink",
  accent: "bg-accent text-accent-ink hover:bg-ink hover:text-page",
  quiet: "bg-transparent text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] hover:bg-ink hover:text-page",
  light: "bg-page text-ink hover:bg-accent hover:text-accent-ink",
};
const button = (kind: Kind, size: "md" | "lg") =>
  cn("group/btn inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-[4px] font-semibold transition-colors duration-200", size === "lg" ? "h-14 px-6 text-[18px]" : "h-12 px-5 text-[16px]", KIND[kind]);

/** The arrow a main action carries: it steps forward when the button is pointed at. */
export const Arrow = () => <ArrowRightIcon size={18} weight="bold" className="transition-transform duration-200 group-hover/btn:translate-x-1" />;

export function ButtonLink({ href, kind = "ink", size = "md", arrow, className, children }: { href: string; kind?: Kind; size?: "md" | "lg"; arrow?: boolean; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn(button(kind, size), className)}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function Button({ kind = "ink", size = "md", className, ...rest }: ComponentProps<"button"> & { kind?: Kind; size?: "md" | "lg" }) {
  return <button type="button" className={cn(button(kind, size), "disabled:pointer-events-none disabled:opacity-35", className)} {...rest} />;
}

/** Leans a little toward the pointer while it's near, and springs back when it leaves. */
export function Magnetic({ children, strength = 0.24 }: { children: ReactNode; strength?: number }) {
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

/** Someone's photo, printed small. */
export function Face({ person, size = 40, inks, className }: { person: Pick<Person, "id" | "name">; size?: number; inks?: Ink[]; className?: string }) {
  return <Dithered src={personPhoto(person.id)} alt="" inks={inks} cell={size < 56 ? 1 : 2} develop={false} className={cn("shrink-0 rounded-[3px]", className)} style={{ width: size, height: size }} focus={[0.5, 0.3]} key={person.id} />;
}

/** A section's head: a big statement and, under it, what it means. */
export function SectionHead({ title, lead, className, align = "left", dark, as: Heading = "h2" }: { title: ReactNode; lead?: ReactNode; className?: string; align?: "left" | "center"; dark?: boolean; as?: "h1" | "h2" }) {
  return (
    <div className={cn("max-w-[900px]", align === "center" && "mx-auto text-center", className)}>
      <Heading className="text-balance font-display text-[clamp(3.1rem,6.6vw,6.4rem)] font-extrabold leading-[0.88] tracking-[-0.005em]">{title}</Heading>
      {lead && <p className={cn("mt-6 max-w-[620px] text-pretty text-[clamp(1.15rem,1.5vw,1.32rem)] leading-[1.5]", align === "center" && "mx-auto", dark ? "text-night-mute" : "text-ink-2")}>{lead}</p>}
    </div>
  );
}

/** What happened to a request, as a word with a mark: done is ink, flagged is vermilion, open is an outline. */
export function Tag({ tone, children, className }: { tone: "done" | "flag" | "open"; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 text-[15px] font-semibold", tone === "flag" ? "text-accent" : "text-ink", className)}>
      <span aria-hidden className={cn("size-2.5", tone === "done" ? "bg-ink" : tone === "flag" ? "bg-accent" : "shadow-[inset_0_0_0_1.5px_currentColor]")} />
      {children}
    </span>
  );
}

/** A rubber stamp, as paperwork gets one: it lands with a thump and stays a little crooked. */
export function Stamp({ children, tone = "ink", tilt = -7, className, play = true }: { children: ReactNode; tone?: "ink" | "accent"; tilt?: number; className?: string; play?: boolean }) {
  return (
    <motion.span
      initial={play ? { scale: 1.9, opacity: 0, rotate: tilt - 10 } : false}
      animate={{ scale: 1, opacity: 1, rotate: tilt }}
      transition={{ type: "spring", stiffness: 520, damping: 22, mass: 0.7 }}
      className={cn(
        "pointer-events-none inline-block rounded-[4px] px-3 pb-0.5 pt-1 font-display text-[22px] font-extrabold uppercase leading-none tracking-[0.06em] shadow-[inset_0_0_0_3px_currentColor] mix-blend-multiply",
        tone === "accent" ? "text-accent" : "text-ink",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

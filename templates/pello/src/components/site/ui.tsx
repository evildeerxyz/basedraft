"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Link from "next/link";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initials, teamOf, type Person } from "@/lib/people";

/* The pieces every section is built from: the page's width, buttons, avatars and section heads. */

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-5 lg:px-8", className)}>{children}</div>;
}

type Kind = "ink" | "accent" | "quiet" | "light";
const KIND: Record<Kind, string> = {
  ink: "bg-ink text-page hover:bg-ink-2",
  accent: "bg-accent text-accent-ink hover:bg-accent-deep",
  quiet: "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--pl-line-strong)] hover:bg-sunken",
  light: "bg-night-ink text-night hover:bg-[color-mix(in_oklab,var(--pl-night-ink)_88%,var(--pl-night))]",
};
const button = (kind: Kind, size: "md" | "lg") => cn("inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[14px] font-medium transition-colors duration-200", size === "lg" ? "h-[52px] px-6 text-[17px]" : "h-11 px-[18px] text-[16px]", KIND[kind]);

export function ButtonLink({ href, kind = "ink", size = "md", className, children }: { href: string; kind?: Kind; size?: "md" | "lg"; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn(button(kind, size), className)}>
      {children}
    </Link>
  );
}

export function Button({ kind = "ink", size = "md", className, ...rest }: ComponentProps<"button"> & { kind?: Kind; size?: "md" | "lg" }) {
  return <button type="button" className={cn(button(kind, size), "disabled:opacity-40", className)} {...rest} />;
}

/** Leans a little toward the pointer while it's near, and springs back when it leaves. */
export function Magnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
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

export function Avatar({ person, size = 40, ring = true, className }: { person: Person; size?: number; ring?: boolean; className?: string }) {
  const hue = teamOf(person.team).hue;
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full bg-sunken font-semibold text-ink-2", className)}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.36), boxShadow: ring ? `inset 0 0 0 2px ${hue}` : undefined }}
    >
      {initials(person.name)}
    </span>
  );
}

/** A section's head: a big statement and, under it, what it means. */
export function SectionHead({ title, lead, className, align = "left", dark, as: Heading = "h2" }: { title: ReactNode; lead?: ReactNode; className?: string; align?: "left" | "center"; dark?: boolean; as?: "h1" | "h2" }) {
  return (
    <div className={cn("max-w-[860px]", align === "center" && "mx-auto text-center", className)}>
      <Heading className="text-balance text-[clamp(2.4rem,4.8vw,4.4rem)] font-semibold leading-[0.98] tracking-[-0.045em]">{title}</Heading>
      {lead && <p className={cn("mt-6 max-w-[620px] text-pretty text-[clamp(1.12rem,1.5vw,1.3rem)] leading-[1.5]", align === "center" && "mx-auto", dark ? "text-night-mute" : "text-ink-2")}>{lead}</p>}
    </div>
  );
}

/** What happened to a request, as a small word in its color. */
export function Status({ tone, children }: { tone: "good" | "wait" | "bad" | "accent"; children: ReactNode }) {
  const t = { good: "bg-good-soft text-good", wait: "bg-sunken text-ink-2", bad: "bg-bad-soft text-bad", accent: "bg-accent-soft text-accent" }[tone];
  return <span className={cn("inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[15px] font-medium", t)}>{children}</span>;
}

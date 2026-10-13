import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { SITE_NAME } from "@/lib/site";

/* Radius scale for this system: 0 to 6px only. */

/** Content column: 1280px with modest gutters. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-5 sm:px-8", className)} {...props} />;
}

/** A page band, optionally sitting on an inset canvas. */
export function Section({ id, className, inner, children, theme }: { id?: string; className?: string; inner?: string; children: ReactNode; theme?: "dark" | "light"; border?: boolean }) {
  return (
    <section id={id} data-theme={theme} className={cn("relative scroll-mt-24", className)}>
      <Container className={inner}>{children}</Container>
    </section>
  );
}

/** Small section label. */
export function Index({ children, className }: { n?: string; children: ReactNode; className?: string }) {
  return <p className={cn("text-[14px] font-medium text-ink-2", className)}>{children}</p>;
}

/** The dashed Noma triangle on a dark square, same mark as the dashboard. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-[6px] bg-ink text-page", className)}>
      <svg viewBox="0 0 44 40" fill="none" aria-hidden className="h-[14px] w-[16px]">
        <path
          d="M19.4 4.6a3 3 0 0 1 5.2 0l15.9 27.6a3 3 0 0 1-2.6 4.5H6.1a3 3 0 0 1-2.6-4.5Z"
          stroke="currentColor"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="7 5"
          strokeDashoffset="3"
        />
      </svg>
    </span>
  );
}

export function Logo({ className, size = "md" }: { className?: string; size?: "md" | "lg" }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label={`${SITE_NAME} home`}>
      <LogoMark className={size === "lg" ? "size-12" : undefined} />
      <span className={cn("font-bold tracking-[-0.03em] text-ink", size === "lg" ? "text-[40px]" : "text-[19px]")}>{SITE_NAME}</span>
    </Link>
  );
}

type ButtonVariant = "primary" | "accent" | "secondary" | "ghost";

const BUTTON: Record<ButtonVariant, string> = {
  primary: "bg-inverse text-inverse-fg hover:bg-inverse-hover",
  accent: "bg-accent text-[#1d1a15] hover:bg-[#ffad26]",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink",
  ghost: "text-ink hover:bg-hover",
};

export function buttonClass(variant: ButtonVariant = "primary", size: "sm" | "md" | "lg" = "md") {
  return cn(
    "group/button inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[6px] font-medium transition-[background-color,border-color,color] duration-200",
    size === "lg" ? "h-12 px-5 text-[15.5px]" : size === "sm" ? "h-9 px-3.5 text-[13.5px]" : "h-11 px-4 text-[14.5px]",
    BUTTON[variant],
  );
}

/** Arrow that slides on hover of the enclosing button. */
export function ButtonArrow({ size = 15 }: { size?: number }) {
  return <ArrowRightIcon size={size} weight="bold" className="transition-transform duration-300 group-hover/button:translate-x-1" />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  arrow = false,
  icon: LeadIcon,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  arrow?: boolean;
  /** Optional leading Phosphor icon, drawn duotone. */
  icon?: Icon;
  className?: string;
  children: ReactNode;
}) {
  const classes = cn(buttonClass(variant, size), className);
  const content = (
    <>
      {LeadIcon && <LeadIcon size={size === "lg" ? 19 : 17} weight="duotone" className="-ml-0.5" />}
      {children}
      {arrow && <ButtonArrow size={size === "lg" ? 15 : 13} />}
    </>
  );
  // Only site routes go through the router; anchors, mail and external links are plain links.
  return href.startsWith("/") ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <a href={href} className={classes}>
      {content}
    </a>
  );
}

/** Underlined "Learn more" style link. */
export function LinkArrow({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2 border-b border-ink pb-1.5 text-[15px] font-medium text-ink", className)}>
      {children}
      <ArrowRightIcon size={14} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

/** Small uppercase section label. */
export function Kicker({ children, className }: { children: ReactNode; index?: string; className?: string }) {
  return <Index className={className}>{children}</Index>;
}

/** Kept for sub pages; same as Kicker. */
export const Eyebrow = Kicker;

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
}: {
  eyebrow?: ReactNode;
  index?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  layout?: "stack" | "split";
  className?: string;
  children?: ReactNode;
}) {
  const split = align === "left" && (description || children);
  return (
    <div className={cn(split ? "grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16" : "flex flex-col gap-5", align === "center" && "mx-auto items-center text-center", className)}>
      <div className={cn("flex flex-col", align === "center" && "items-center")}>
        {eyebrow && <Index>{eyebrow}</Index>}
        <h2 className={cn("max-w-[760px] text-balance text-[38px] font-medium leading-[1.04] tracking-[-0.045em] text-ink md:text-[50px]", eyebrow ? "mt-4" : undefined)}>{title}</h2>
      </div>
      {(description || children) && (
        <div className={cn("flex flex-col gap-5", align === "center" ? "items-center" : "items-start lg:pb-2")}>
          {description && <p className="max-w-[480px] text-pretty text-[17px] leading-relaxed text-ink-2">{description}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

/** Sub-page hero: a label, a headline and a short paragraph. Pages add their own figure. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  aside,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative", className)}>
      <Container className={cn("grid gap-10 pb-12 pt-14 md:pt-20", aside ? "lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-16" : undefined)}>
        <div className="max-w-[720px]">
          <Index>{eyebrow}</Index>
          <h1 className="mt-5 text-balance text-[42px] font-medium leading-[1.02] tracking-[-0.05em] text-ink md:text-[60px]">{title}</h1>
          <p className="mt-6 max-w-[560px] text-pretty text-[18px] leading-relaxed text-ink-2">{description}</p>
          {children && <div className="mt-8">{children}</div>}
        </div>
        {aside}
      </Container>
    </section>
  );
}

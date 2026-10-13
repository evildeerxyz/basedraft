"use client";

import { ArrowUpRightIcon, ListIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { ButtonLink, Container, Magnetic } from "./ui";

export const LINKS = [
  { label: "Product", href: "/product" },
  { label: "Customers", href: "/customers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Company", href: "/company" },
];

export function Nav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  // The menu is open on the page it was opened on, so going to another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [hover, setHover] = useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  return (
    <header className={cn("sticky top-0 z-50 bg-page transition-shadow duration-300", (scrolled || open) && "shadow-[0_1px_0_var(--pl-ink)]")}>
      <Container className="flex h-[76px] items-center justify-between gap-6">
        <Link href="/" aria-label="pello home" className="rounded-[4px]">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden lg:block" onPointerLeave={() => setHover(null)}>
          <ul className="flex items-center">
            {LINKS.map((l) => {
              const on = pathname.startsWith(l.href);
              return (
                <li key={l.href} className="relative">
                  <Link
                    href={l.href}
                    onPointerEnter={() => setHover(l.href)}
                    onFocus={() => setHover(l.href)}
                    aria-current={on ? "page" : undefined}
                    className={cn("relative flex h-11 items-center gap-2 rounded-[4px] px-4 text-[17px] font-semibold transition-colors", on ? "text-ink" : "text-ink-2 hover:text-ink")}
                  >
                    {on && <span aria-hidden className="size-2 bg-accent" />}
                    {l.label}
                  </Link>
                  {hover === l.href && <motion.span layoutId="nav-hover" aria-hidden className="absolute inset-x-4 -bottom-0.5 h-[3px] bg-ink" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden h-11 items-center rounded-[4px] px-4 text-[17px] font-semibold text-ink-2 transition-colors hover:text-ink sm:flex">
            Sign in
          </Link>
          <span className="max-sm:hidden">
            <Magnetic strength={0.2}>
              <ButtonLink href="/contact" kind="ink">
                Book a demo
              </ButtonLink>
            </Magnetic>
          </span>
          <button
            type="button"
            onClick={() => setOpenOn(open ? null : pathname)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid size-11 place-items-center rounded-[4px] text-ink shadow-[inset_0_0_0_1.5px_var(--pl-ink)] lg:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={open ? "x" : "menu"} initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.14 }}>
                {open ? <XIcon size={20} /> : <ListIcon size={20} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="overflow-hidden bg-page lg:hidden"
          >
            <Container className="pb-8 pt-2">
              <motion.ul initial="hide" animate="show" variants={{ show: { transition: { staggerChildren: 0.035, delayChildren: 0.04 } } }}>
                {[...LINKS, { label: "Sign in", href: "/login" }].map((l) => (
                  <motion.li key={l.href} variants={{ hide: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
                    <Link href={l.href} onClick={() => setOpenOn(null)} className="flex h-16 items-center justify-between font-display text-[34px] font-extrabold text-ink shadow-[0_1px_0_var(--pl-line)]">
                      {l.label}
                      <ArrowUpRightIcon size={22} className="text-mute" />
                    </Link>
                  </motion.li>
                ))}
              </motion.ul>
              <ButtonLink href="/contact" kind="accent" size="lg" arrow className="mt-6 w-full">
                Book a demo
              </ButtonLink>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

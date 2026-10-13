"use client";

import { ArrowUpRightIcon, ListIcon, XIcon } from "@phosphor-icons/react/ssr";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { ButtonLink } from "./ui";

export const LINKS = [
  { label: "Product", href: "/product" },
  { label: "Customers", href: "/customers" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Company", href: "/company" },
];

/*
 * At the top of the page the bar is part of it. Once you scroll it lifts into a white bar floating
 * just under the window's edge, so it's there without covering the page.
 */
export function Nav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [lifted, setLifted] = useState(false);
  // The menu is open on the page it was opened on, so going to another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useMotionValueEvent(scrollY, "change", (y) => setLifted(y > 24));
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 px-3 pt-2">
      <div className={cn("mx-auto flex h-[60px] max-w-[1176px] items-center justify-between gap-6 rounded-[16px] px-4 transition-[background-color,box-shadow] duration-300 sm:px-6", lifted || open ? "bg-surface shadow-[0_0_0_1px_var(--pl-line),0_8px_24px_-12px_rgb(0_0_0/0.12)]" : "bg-transparent")}>
        <Link href="/" aria-label="pello home" className="rounded-[8px]">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => {
              const on = pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link href={l.href} aria-current={on ? "page" : undefined} className={cn("flex h-9 items-center rounded-[10px] px-3.5 text-[15px] font-medium transition-colors", on ? "bg-sunken text-ink" : "text-ink-2 hover:bg-sunken hover:text-ink")}>
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden h-9 items-center rounded-[10px] px-3 text-[15px] font-medium text-ink transition-colors hover:bg-sunken sm:flex">
            Sign in
          </Link>
          <ButtonLink href="/contact" size="sm" className="max-sm:hidden">
            Book a demo
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpenOn(open ? null : pathname)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="pl-btn-light grid size-10 place-items-center rounded-[10px] lg:hidden"
          >
            {open ? <XIcon size={18} /> : <ListIcon size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pl-pop mx-auto mt-2 max-w-[1176px] rounded-[16px] p-3 lg:hidden"
          >
            <ul>
              {[...LINKS, { label: "Sign in", href: "/login" }].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpenOn(null)} className="flex h-12 items-center justify-between rounded-[10px] px-3 text-[17px] font-medium text-ink hover:bg-sunken">
                    {l.label}
                    <ArrowUpRightIcon size={16} className="text-mute" />
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink href="/contact" size="lg" className="mt-2 w-full">
              Book a demo
            </ButtonLink>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

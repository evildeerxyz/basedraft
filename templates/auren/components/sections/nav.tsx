"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { DownloadSimpleIcon, ListIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { NAV_LINKS } from "@/lib/routes";
import { PALETTE_EVENT, cn } from "@/lib/site";
import { Logo } from "../ui/logo";
import { Kbd, buttonClass } from "../ui/primitives";
import { SmartLink } from "../ui/smart-link";

export function Nav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > prev && y > 560 && !menu);
  });

  const isActive = (href: string) => !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={cn(
          "border-b transition-[background-color,border-color] duration-300",
          scrolled || menu ? "border-paper/10 bg-ink" : "border-transparent bg-transparent",
        )}
      >
        <nav aria-label="Primary" className="container-x flex h-[var(--nav-h)] items-center gap-8">
          <SmartLink href="/" aria-label="Auren home" className="shrink-0">
            <Logo />
          </SmartLink>
          <ul className="hidden items-center gap-7 text-[13.5px] lg:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <SmartLink
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={cn(
                    "relative transition-colors hover:text-paper",
                    isActive(l.href) ? "text-paper" : "text-paper/60",
                  )}
                >
                  {l.label}
                  {isActive(l.href) && <span className="absolute -bottom-[19px] left-0 h-px w-full bg-accent" />}
                </SmartLink>
              </li>
            ))}
          </ul>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(PALETTE_EVENT))}
              className="hidden h-9 items-center gap-2.5 rounded-[6px] border border-paper/12 pl-3 pr-1.5 text-[13px] text-paper/55 transition-colors hover:border-paper/30 hover:text-paper md:flex"
            >
              <MagnifyingGlassIcon size={14} />
              Search
              <span className="flex gap-0.5">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>
            <SmartLink href="/download" className={cn(buttonClass("light"), "hidden sm:inline-flex")}>
              <DownloadSimpleIcon size={15} weight="bold" />
              Download
            </SmartLink>
            <button
              type="button"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              onClick={() => setMenu((m) => !m)}
              className="grid size-9 place-items-center rounded-[6px] border border-paper/12 text-paper/80 lg:hidden"
            >
              {menu ? <XIcon size={16} /> : <ListIcon size={16} />}
            </button>
          </div>
        </nav>
        <AnimatePresence>
          {menu && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="container-x overflow-hidden lg:hidden"
            >
              {[...NAV_LINKS, { href: "/download", label: "Download" }].map((l) => (
                <li key={l.href} className="border-t border-paper/8 first:border-t-0">
                  <SmartLink
                    href={l.href}
                    onClick={() => setMenu(false)}
                    className="type-title flex h-14 items-center text-2xl text-paper/85"
                  >
                    {l.label}
                  </SmartLink>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

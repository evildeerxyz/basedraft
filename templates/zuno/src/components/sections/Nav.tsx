"use client";

import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  BankIcon,
  CaretDownIcon,
  ChatsCircleIcon,
  CurrencyBtcIcon,
  LeafIcon,
  ListIcon,
  PiggyBankIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { COMPANY, PRODUCT, TOP_NAV, type NavItem } from "@/lib/site";
import { cn, EASE_OUT } from "@/lib/utils";
import { useIntroDone } from "../Intro";
import { Logo } from "../ui/Logo";

const PRODUCT_ICONS: Record<string, Icon> = {
  "/autopilot": ArrowsClockwiseIcon,
  "/copilot": ChatsCircleIcon,
  "/tax-loss-harvesting": LeafIcon,
  "/cash": BankIcon,
  "/crypto": CurrencyBtcIcon,
  "/retirement": PiggyBankIcon,
};

function MenuLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  const Icon = PRODUCT_ICONS[item.href];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className="group flex gap-3 rounded-[12px] p-3 transition-colors hover:bg-white/[0.05] focus-visible:bg-white/[0.05]"
    >
      {Icon && <Icon size={18} className={cn("mt-0.5 shrink-0 transition-colors", active ? "text-accent" : "text-white/70 group-hover:text-accent")} />}
      <span>
        <span className={cn("block text-[17px] font-medium tracking-[-0.01em]", active ? "text-accent" : "text-white")}>{item.label}</span>
        {item.desc && <span className="mt-0.5 block text-[15px] text-white/60">{item.desc}</span>}
      </span>
    </Link>
  );
}

function ProductPanel({ path, close }: { path: string; close: () => void }) {
  return (
    <div className="w-[600px] p-2">
      <div className="grid grid-cols-2">
        {PRODUCT.map((item) => (
          <MenuLink key={item.href} item={item} active={path === item.href} onNavigate={close} />
        ))}
      </div>
      <Link
        href="/copilot"
        onClick={close}
        className="group mt-1 flex items-center justify-between rounded-[12px] bg-white/[0.04] px-4 py-3 text-[15px] text-white/70 transition-colors hover:text-white"
      >
        <span>
          <span className="font-medium text-white">Copilot 2.0</span> can now act on rules you approve
        </span>
        <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function CompanyPanel({ path, close }: { path: string; close: () => void }) {
  return (
    <div className="flex w-[480px] gap-2 p-2">
      <div className="flex-1">
        {COMPANY.map((item) => (
          <MenuLink key={item.href} item={item} active={path === item.href} onNavigate={close} />
        ))}
      </div>
      <Link
        href="/careers"
        onClick={close}
        className="group flex w-[180px] flex-col justify-between rounded-[12px] bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
      >
        <span className="text-[15px] font-medium text-accent">11 open roles</span>
        <span>
          <span className="block text-[17px] font-medium leading-snug">Help 380,000 people stop worrying about money.</span>
          <span className="mt-2 flex items-center gap-1 text-[15px] text-white/60 group-hover:text-white">
            See open roles <ArrowRightIcon size={12} />
          </span>
        </span>
      </Link>
    </div>
  );
}

export function Nav() {
  const play = useIntroDone();
  const path = usePathname();
  const { scrollY, scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [panelX, setPanelX] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    setHidden(y > prev && y > 520 && !menu);
  });

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const openMenu = (id: string, el: HTMLElement) => {
    clearTimeout(closeTimer.current);
    const nav = navRef.current?.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (nav) setPanelX(r.left - nav.left - 12);
    setMenu(id);
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 140);
  };
  const close = () => {
    setMenu(null);
    setMobile(false);
  };
  const onTriggerClick = (id: string) => (e: MouseEvent<HTMLButtonElement>) => {
    if (menu === id) return setMenu(null);
    openMenu(id, e.currentTarget);
    // Opened from the keyboard: move focus into the panel.
    if (e.detail === 0) requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("a")?.focus());
  };

  const solid = scrolled || mobile || Boolean(menu);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={play ? { y: hidden && !mobile ? -80 : 0, opacity: 1 } : undefined}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      onPointerLeave={scheduleClose}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300",
        solid ? "border-white/[0.08] bg-ink/85 backdrop-blur-xl" : "border-transparent",
      )}
    >
      <nav ref={navRef} aria-label="Main" className="relative mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 lg:px-8">
        <Link href="/" aria-label="Zuno home" onClick={close}>
          <Logo />
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center lg:flex">
          {TOP_NAV.map((item) => {
            if ("href" in item) {
              const active = path === item.href;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={close}
                    onPointerEnter={scheduleClose}
                    aria-current={active ? "page" : undefined}
                    className={cn("block px-3.5 py-2 text-[16px] transition-colors", active ? "text-white" : "text-white/70 hover:text-white")}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            }
            const open = menu === item.id;
            const childActive = item.menu.some((m) => m.href === path);
            return (
              <li key={item.label}>
                <button
                  onPointerEnter={(e) => openMenu(item.id, e.currentTarget)}
                  onClick={onTriggerClick(item.id)}
                  aria-expanded={open}
                  aria-controls="nav-panel"
                  className={cn("flex items-center gap-1 px-3.5 py-2 text-[16px] transition-colors", open || childActive ? "text-white" : "text-white/70 hover:text-white")}
                >
                  {item.label}
                  <CaretDownIcon size={11} weight="bold" className={cn("transition-transform duration-300", open && "rotate-180")} />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Link href="/login" onClick={close} className="hidden px-3 py-2 text-[16px] text-white/70 transition-colors hover:text-white sm:block">
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={close}
            className="group hidden h-9 items-center gap-1.5 rounded-[10px] bg-lime px-3.5 text-[16px] font-medium text-on-lime sm:inline-flex"
          >
            Get started
            <ArrowRightIcon size={13} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            onClick={() => setMobile((o) => !o)}
            className="grid size-9 place-items-center rounded-[10px] border border-white/10 lg:hidden"
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            aria-controls="mobile-menu"
          >
            {mobile ? <XIcon size={16} /> : <ListIcon size={16} />}
          </button>
        </div>

        {/* one panel that morphs between menus */}
        <AnimatePresence>
          {menu && (
            <motion.div
              id="nav-panel"
              ref={panelRef}
              onPointerEnter={() => clearTimeout(closeTimer.current)}
              className="absolute top-[58px] hidden overflow-hidden rounded-[18px] border border-white/10 bg-ink-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] lg:block"
              initial={{ opacity: 0, y: -6, x: panelX }}
              animate={{ opacity: 1, y: 0, x: panelX }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              layout
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={menu}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.18 }}
                >
                  {menu === "product" ? <ProductPanel path={path} close={close} /> : <CompanyPanel path={path} close={close} />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <motion.div style={{ scaleX: progress }} className="absolute inset-x-0 bottom-[-1px] h-px origin-left bg-lime" />

      <AnimatePresence>
        {mobile && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="max-h-[calc(100svh-64px)] overflow-y-auto border-t border-white/[0.08] lg:hidden"
          >
            <div className="px-5 pb-8 pt-4">
              {[
                { title: "Product", items: PRODUCT },
                { title: "Company", items: COMPANY },
              ].map((group) => (
                <div key={group.title} className="mb-6">
                  <div className="mb-2 text-[17px] font-medium text-white/60">{group.title}</div>
                  <div className="grid grid-cols-2 gap-x-4">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        aria-current={path === item.href ? "page" : undefined}
                        className={cn("py-2.5 text-[17px] tracking-tight", path === item.href ? "text-accent" : "text-white")}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-6 text-[17px]">
                {[
                  { href: "/pricing", label: "Pricing" },
                  { href: "/security", label: "Security" },
                  { href: "/help", label: "Help" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} onClick={close} className={path === l.href ? "text-accent" : "text-white"}>
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Link href="/login" onClick={close} className="flex h-12 items-center justify-center rounded-[12px] border border-white/15 font-medium">
                  Log in
                </Link>
                <Link href="/signup" onClick={close} className="flex h-12 items-center justify-center gap-2 rounded-[12px] bg-lime font-medium text-on-lime">
                  Get started <ArrowRightIcon size={15} weight="bold" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

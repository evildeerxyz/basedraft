"use client";

import { ArrowUpRightIcon, BooksIcon, CaretDownIcon, ChatCircleIcon, ListIcon, MagnifyingGlassIcon, ScrollIcon, TruckIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore, ViewTransition, type ReactNode } from "react";
import { cn, EASE_OUT } from "@/lib/utils";
import { KINDS, SECTIONS, TEMPLATES } from "./live";
import { AccountHeader, Avatar, displayName, openAuth, useAuth } from "./auth";
import { ICON, SECTION_ICON, type IconType } from "./icons";
import { BaseDraftLogo } from "./logo";
import { Menu } from "./menu";
import { ColorModeSwitch } from "./color-mode";
import { DitherSky } from "./plan-parts";
import { usePlan } from "./plan";
import { openPro } from "./pro-modal";
import { btn, btnSm } from "./sheet";
import { CommandMenu, openCommand } from "./command";
import { toast } from "./toast";
import { accountItems, TopBar } from "./topbar";

function Item({ href, children, count, sub, on, onNavigate, external, icon: Icon, dot }: { href: string; children: ReactNode; count?: number; sub?: boolean; on: boolean; onNavigate?: () => void; external?: boolean; icon?: IconType; dot?: string }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={on ? "page" : undefined}
      className={cn(
        "group relative isolate flex h-8 items-center gap-2.5 rounded-control px-2.5 transition-colors",
        sub ? "text-[13.5px]" : "text-ui",
        on ? "font-medium text-fg" : sub ? "text-muted hover:text-fg" : "text-fg/80 hover:text-fg",
      )}
    >
      {/* One highlight for the whole rail, gliding to the page you open. */}
      {on && <motion.span layoutId="rail-active" aria-hidden className="absolute inset-0 -z-10 rounded-control bg-fg/[0.06]" transition={{ type: "spring", stiffness: 520, damping: 42 }} />}
      {Icon && <Icon size={sub ? 15 : 17} weight="duotone" className={cn("shrink-0 transition-colors", on ? "text-accent" : "text-subtle group-hover:text-fg")} />}
      {dot && <span aria-hidden className="ml-[3px] mr-[2px] size-2 shrink-0 rounded-full" style={{ background: dot }} />}
      <span className="flex-1 truncate">{children}</span>
      {count !== undefined && <span className="text-meta tabular-nums text-subtle">{count}</span>}
      {external && <ArrowUpRightIcon size={13} className="text-subtle" />}
    </Link>
  );
}

function Rail({ onNavigate, onClose }: { onNavigate?: () => void; onClose?: () => void }) {
  const path = usePathname();
  // Its own group, so the phone menu's rail and the desktop one never trade highlights.
  const group = useId();
  const is = (h: string) => path === h;
  const under = (h: string) => path === h || path.startsWith(`${h}/`);
  const [sections, setSections] = useState(true);
  return (
    <div className="flex h-full flex-col">
      {/* The logo, and opposite it the light and dark switch. In the phone menu, its close button too. */}
      <div className="mb-6 flex items-center gap-1.5">
        <Link href="/" onClick={onNavigate} aria-label="basedraft home" className="mr-auto flex h-9 items-center rounded-control px-2.5">
          <BaseDraftLogo />
        </Link>
        <ColorModeSwitch />
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close menu" className="grid size-9 shrink-0 place-items-center rounded-control bg-fg/[0.06]">
            <XIcon size={16} weight="bold" />
          </button>
        )}
      </div>
      {/* On phones there's no top bar, so search lives in the menu. */}
      {onClose && (
        <button
          type="button"
          onClick={() => {
            onClose();
            openCommand();
          }}
          className="-mt-2 mb-5 flex h-10 w-full items-center gap-2.5 rounded-control bg-fg/[0.05] px-3 text-left text-ui text-subtle transition-colors hover:bg-fg/[0.07]"
        >
          <MagnifyingGlassIcon size={16} className="shrink-0" />
          Search templates and sections
        </button>
      )}
      <LayoutGroup id={group}>
      <nav aria-label="Main" className="no-scrollbar -mx-1 flex-1 space-y-5 overflow-y-auto px-1">
        <div className="space-y-0.5">
          <Item href="/" icon={ICON.overview} on={is("/")} onNavigate={onNavigate}>
            Overview
          </Item>
          <Item href="/studio" icon={ICON.studio} on={false} onNavigate={onNavigate} external>
            Studio
          </Item>
          <Item href="/pro" icon={ICON.pro} on={is("/pro")} onNavigate={onNavigate}>
            Pro
          </Item>
        </div>
        <div className="space-y-0.5">
          <Item href="/templates" icon={ICON.templates} count={TEMPLATES.length} on={is("/templates")} onNavigate={onNavigate}>
            Templates
          </Item>
          <div className="ml-[18px] border-l border-line pl-1.5">
            {TEMPLATES.map((t) => (
              <Item key={t.slug} href={`/templates/${t.slug}`} sub dot={t.accent} on={under(`/templates/${t.slug}`)} onNavigate={onNavigate}>
                {t.name}
              </Item>
            ))}
          </div>
        </div>
        <div className="space-y-0.5">
          <div className="group/row relative">
            <Item href="/components" icon={ICON.components} count={SECTIONS.length} on={is("/components")} onNavigate={onNavigate}>
              Components
            </Item>
            <button
              type="button"
              onClick={() => setSections((o) => !o)}
              aria-expanded={sections}
              aria-label={sections ? "Fold the section types" : "Show the section types"}
              className="absolute right-9 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-[5px] text-subtle opacity-0 transition-opacity hover:bg-fg/[0.06] hover:text-fg focus-visible:opacity-100 group-hover/row:opacity-100"
            >
              <CaretDownIcon size={11} weight="bold" className={cn("transition-transform", !sections && "-rotate-90")} />
            </button>
          </div>
          {/* Open by default; the caret folds it away. */}
          <AnimatePresence initial={false}>
          {sections && (
          <motion.div key="sections" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="ml-[18px] overflow-hidden border-l border-line pl-1.5">
            {KINDS.filter((k) => SECTIONS.some((s) => s.kind === k.id)).map((k) => (
              <Item key={k.id} href={`/components/${k.id}`} sub icon={SECTION_ICON[k.id]} on={under(`/components/${k.id}`)} onNavigate={onNavigate}>
                {k.label}
              </Item>
            ))}
          </motion.div>
          )}
          </AnimatePresence>
        </div>
        {/* The top bar's Resources, for phones. */}
        {onClose && (
          <div className="space-y-0.5 border-t border-line pt-4">
            <p className="px-2.5 pb-1 text-meta font-medium text-subtle">Resources</p>
            <Item href="/pro#delivery" icon={TruckIcon} on={false} onNavigate={onNavigate}>
              How you get a template
            </Item>
            <Item href="/pro#license" icon={ScrollIcon} on={false} onNavigate={onNavigate}>
              What each license covers
            </Item>
            <Item href="/pro#faq" icon={BooksIcon} on={false} onNavigate={onNavigate}>
              Questions
            </Item>
            <Item href="mailto:hello@basedraft.site" icon={ChatCircleIcon} on={false} onNavigate={onNavigate}>
              Write to us
            </Item>
          </div>
        )}
      </nav>
      </LayoutGroup>
      {/* On phones the rail is a drawer, and the poster sits at its foot; on desktop it's a card in the corner. */}
      {onNavigate && <PlanPoster onNavigate={onNavigate} compact />}
    </div>
  );
}

/* The fan of templates on the rail poster. */
const FAN = [
  { slug: "zuno", className: "left-[6%] top-[38px] w-[44%] -rotate-[9deg] group-hover:-translate-x-1 group-hover:-rotate-[12deg]" },
  { slug: "auren", className: "right-[6%] top-[38px] w-[44%] rotate-[9deg] group-hover:translate-x-1 group-hover:rotate-[12deg]" },
  { slug: "noma", className: "left-1/2 top-[22px] z-10 w-[50%] -translate-x-1/2 group-hover:-translate-y-1" },
];

/**
 * The foot of the rail: a small poster for Pro, the templates fanned out over a dithered sky, a
 * headline and one action. On Pro it says the kit is yours. Your account sits under it, apart.
 */
function PlanPoster({ onNavigate, className = "mt-4", compact }: { onNavigate?: () => void; className?: string; /** Without the fan of templates, for the phone menu, where the list needs the room. */ compact?: boolean }) {
  const [plan] = usePlan();
  const pro = plan === "pro";
  return (
    <div className={cn("group relative overflow-hidden rounded-[var(--bd-r-sheet)] bg-fg text-canvas shadow-[0_18px_36px_-20px_rgb(var(--bd-shade)/0.7),inset_0_1px_0_rgb(var(--bd-paper)/0.08)]", className)}>
      {/* Clipped twice over: overflow alone lets a rotated, animating card escape in some browsers. */}
      <div aria-hidden className={cn("relative overflow-hidden [clip-path:inset(0)]", compact ? "h-4" : "h-[100px]")}>
        <DitherSky tone="ink" />
        {!compact && FAN.map((f) => (
          <span key={f.slug} className={cn("absolute aspect-[16/11] overflow-hidden rounded-[4px] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.8),0_0_0_1px_rgb(var(--bd-paper)/0.12)] transition-transform duration-500 ease-out motion-reduce:transition-none", f.className)}>
            <Image src={`/shots/${f.slug}.jpg`} alt="" fill sizes="120px" className="object-cover object-top" />
          </span>
        ))}
        {/* The fan sinks into the ink, so the words sit on a clean ground. */}
        <span className="absolute inset-x-0 bottom-0 z-20 h-12 bg-gradient-to-b from-transparent to-fg to-80%" />
      </div>
      {/* Its own solid ground, so nothing from the fan can ever draw through the words. */}
      <div className="relative z-10 bg-fg px-3.5 pb-3.5">
        <p className="text-balance text-[19px] font-semibold leading-[1.1] tracking-[-0.02em]">{pro ? "The whole kit is yours." : "The whole kit, paid once."}</p>
        <p className="mt-1.5 text-meta text-canvas/60">{pro ? "Every template and section, and every update to come." : `All ${TEMPLATES.length} templates and ${SECTIONS.length} sections, with Figma and code export.`}</p>
        {pro ? (
          <Link href="/studio" onClick={onNavigate} className={cn(btnSm.paper, "mt-3 w-full")}>
            Open Studio
          </Link>
        ) : (
          <button type="button" onClick={() => openPro("plan")} className={cn(btnSm.paper, "mt-3 w-full")}>
            Get Pro
            <span className="font-normal text-fg/50">$149 once</span>
          </button>
        )}
      </div>
    </div>
  );
}

/*
 * On desktop the poster is a card in the bottom right corner, out of the rail's way. Closing it
 * keeps it away for a week. It stays off the pages that already say the same thing.
 */
const CLOSED = "bd-poster-closed";
const posterEvents = new Set<() => void>();
const posterClosed = () => Date.now() - Number(localStorage.getItem(CLOSED) ?? 0) < 7 * 86400_000;
const onPoster = (cb: () => void) => {
  posterEvents.add(cb);
  return () => posterEvents.delete(cb);
};
function CornerPoster() {
  const path = usePathname();
  const [plan] = usePlan();
  const closed = useSyncExternalStore(onPoster, posterClosed, () => true);
  const quiet = closed || plan === "pro" || path === "/pro" || path === "/purchases";
  return (
    <AnimatePresence>
      {!quiet && (
        <motion.div
          key="poster"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.4, ease: EASE_OUT } }}
          exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
          className="fixed bottom-5 right-5 z-30 hidden w-[236px] lg:block"
        >
          <PlanPoster className="" />
          <button
            type="button"
            aria-label="Close"
            onClick={() => {
              localStorage.setItem(CLOSED, String(Date.now()));
              posterEvents.forEach((l) => l());
            }}
            className="absolute right-2 top-2 z-30 grid size-7 place-items-center rounded-full bg-black/40 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/60 hover:text-white"
          >
            <XIcon size={12} weight="bold" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Back from a checkout that couldn't open (Whop isn't connected yet): say so, once. */
function CheckoutNotice() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("checkout") !== "unavailable") return;
    toast("Checkout isn't open yet", { tone: "error", detail: q.get("why") || "Payments are being connected. Try again soon, or write to hello@basedraft.site." });
    q.delete("checkout");
    q.delete("why");
    window.history.replaceState(null, "", `${window.location.pathname}${q.size ? `?${q}` : ""}${window.location.hash}`);
  }, []);
  return null;
}

/** The phone header's account control: a sign in button, or your initials opening the same menu. */
function HeaderAccount() {
  const { user, loading } = useAuth();
  const [plan] = usePlan();
  if (loading) return <span className="size-9" />;
  if (!user)
    return (
      <button type="button" onClick={() => openAuth("sign-in")} className={btn.ghost}>
        Sign in
      </button>
    );
  return <Menu label="Account" buttonClassName="grid size-9 place-items-center rounded-full" button={<Avatar name={displayName(user)} size={32} />} header={<AccountHeader user={user} plan={plan} />} items={accountItems(plan)} />;
}

/** The drafting table: an index rail on the left, sheets of content on the right. */
export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <div className="min-h-dvh bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] p-3 lg:block">
        <Rail />
      </aside>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-canvas/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/" aria-label="basedraft home">
          <BaseDraftLogo />
        </Link>
        <div className="flex items-center gap-2">
          <HeaderAccount />
          <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="mobile-rail" className="grid size-9 place-items-center rounded-control bg-fg/[0.06]">
            <ListIcon size={18} weight="bold" />
          </button>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/30 lg:hidden" />
            <motion.aside
              id="mobile-rail"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="fixed inset-y-0 left-0 z-50 w-[min(320px,88vw)] bg-canvas p-3 shadow-xl lg:hidden"
            >
              <Rail onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {/* At least a window tall, so on a short page the footer sits at the bottom, not under the content. */}
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col lg:min-h-dvh lg:pl-[248px]">
        <TopBar />
        {/*
          A 1040px column, centered beside the rail, so pages read at one comfortable width on any
          screen. On phones the sheets line up with the header's 16px edge, one sheet gap below it.
        */}
        <div className="mx-auto w-full max-w-[1064px] flex-1 px-4 pb-6 pt-3 lg:px-3 lg:pb-3 lg:pt-0">
          {/* A new page fades and rises in as the old one fades out. Keyed by path, so each page enters and leaves. */}
          <ViewTransition key={path} enter="page-in" exit="page-out" default="none">
            <div>{children}</div>
          </ViewTransition>
        </div>
        <CornerPoster />
        <CommandMenu />
        <CheckoutNotice />
        <footer className="mx-auto flex w-full max-w-[1064px] flex-wrap items-center justify-between gap-3 px-4 pb-8 pt-4 text-meta text-subtle lg:px-6">
          <span>© 2026 basedraft. Licensed per seat, never resold.</span>
          <span className="flex gap-5">
            <Link href="/pro#license" className="hover:text-fg">
              License
            </Link>
            <Link href="/pro#faq" className="hover:text-fg">
              FAQ
            </Link>
            <a href="mailto:hello@basedraft.site" className="hover:text-fg">
              hello@basedraft.site
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}

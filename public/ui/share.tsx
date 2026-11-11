"use client";

import { BuildingsIcon, CaretDownIcon, CheckIcon, CopyIcon, GlobeHemisphereWestIcon, LinkSimpleIcon, LockSimpleIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

/*
 * Share, link first: the button opens a panel that starts with who can open the thing (only the
 * people invited, everyone in the workspace, or anyone with the link) and the link itself, ready
 * to copy. Under it, the faces of those invited, opening into a list to change or take away
 * anyone's access; at the foot, invite more by email (paste a list, or type and press Enter) with
 * the role they'll get. The panel floats over the page in the theme of where its button is;
 * Escape or a click away closes it and gives the focus back.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/*
 * A face for someone without a picture, the way Vercel draws them: two colors picked by their name,
 * one dithered into the other through a 4 by 4 ordered matrix, so the same name always gets the
 * same face.
 */
const FACE_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FACE_CELLS = 12;
/** The second color's cells, as one path, for each way the gradient can run. */
const FACE_RAMPS = [0, 1, 2, 3].map((dir) => {
  const n = FACE_CELLS - 1;
  let d = "";
  for (let y = 0; y < FACE_CELLS; y++)
    for (let x = 0; x < FACE_CELLS; x++) {
      const t = dir === 0 ? x / n : dir === 1 ? y / n : dir === 2 ? (x + y) / (2 * n) : (x + n - y) / (2 * n);
      if ((FACE_BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16 < t * 1.25 - 0.12) d += `M${x} ${y}h1v1h-1z`;
    }
  return d;
});
/** Light and deep, in the muted colors basedraft uses: ocean, pine, moss, ochre, clay, rose, plum, slate. */
const FACE_COLORS: Array<[string, string]> = [
  ["oklch(0.86 0.07 235)", "oklch(0.47 0.13 252)"],
  ["oklch(0.87 0.07 170)", "oklch(0.46 0.09 172)"],
  ["oklch(0.9 0.08 128)", "oklch(0.55 0.12 138)"],
  ["oklch(0.91 0.09 88)", "oklch(0.64 0.14 62)"],
  ["oklch(0.87 0.07 45)", "oklch(0.55 0.14 35)"],
  ["oklch(0.87 0.08 8)", "oklch(0.52 0.16 2)"],
  ["oklch(0.86 0.09 330)", "oklch(0.48 0.15 318)"],
  ["oklch(0.89 0.02 255)", "oklch(0.44 0.04 258)"],
];
const faceSeed = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/** Someone's dithered face, filling its box; give it colors to draw it in theirs. */
function Face({ name, colors }: { name: string; colors?: [string, string] }) {
  const seed = faceSeed(name);
  const [light, deep] = colors ?? FACE_COLORS[seed % FACE_COLORS.length];
  return (
    <svg viewBox={`0 0 ${FACE_CELLS} ${FACE_CELLS}`} shapeRendering="crispEdges" aria-hidden className="block size-full">
      <rect width={FACE_CELLS} height={FACE_CELLS} style={{ fill: light }} />
      <path d={FACE_RAMPS[(seed >>> 5) % 4]} style={{ fill: deep }} />
    </svg>
  );
}

export type ShareRole = "edit" | "view";
export type SharePerson = { id: string; name: string; email?: string; role: ShareRole | "owner"; /** You: marked, and your access can't be changed here. */ you?: boolean; /** Invited and not here yet. */ invited?: boolean };
export type ShareAccess = "invited" | "workspace" | "link";

export type ShareProps = {
  /** What's being shared, at the head of the panel. */
  title: string;
  /** Its address, for Copy link. */
  url: string;
  /** The workspace's name, for "Everyone at Acme". */
  workspace?: string;
  people?: SharePerson[];
  defaultPeople?: SharePerson[];
  onPeopleChange?: (people: SharePerson[]) => void;
  access?: ShareAccess;
  defaultAccess?: ShareAccess;
  onAccessChange?: (access: ShareAccess) => void;
  /** Told when people are invited, with their addresses and the role they get. */
  onInvite?: (emails: string[], role: ShareRole) => void;
  /** What the link lets people do, when anyone beyond the invited can open it. */
  linkRole?: ShareRole;
  defaultLinkRole?: ShareRole;
  onLinkRoleChange?: (role: ShareRole) => void;
  /** Told after the link is copied. */
  onCopy?: () => void;
  /** The button's words. */
  label?: string;
  className?: string;
};

const W = 392;
const isEmail = (s: string) => /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(s);
const nameOf = (email: string) => email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type PickOption<T extends string> = { value: T; label: string; note?: string; icon?: ReactNode; tone?: "stop" };

/**
 * A small choice that reads as words with a caret, and opens our own list: the one that's on is
 * checked, Remove stands apart in red, and the arrow keys, Enter and Escape drive it.
 */
function Pick<T extends string>({ value, options, onChange, label, align = "end", inline = false, className }: { value: T; options: Array<PickOption<T>>; onChange: (v: T) => void; label: string; align?: "start" | "end"; /** Set in a line of text: as tall as the line, its words lined up with the line's. */ inline?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [place, setPlace] = useState<{ style: CSSProperties; theme?: string; light: boolean } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const current = options.find((o) => o.value === value);
  const wide = options.some((o) => o.note);

  const show = () => {
    const b = button.current!;
    const r = b.getBoundingClientRect();
    const w = wide ? 288 : 196;
    const left = align === "end" ? Math.max(8, r.right - w) : Math.min(Math.max(8, r.left), innerWidth - w - 8);
    const tall = options.length * (wide ? 56 : 36) + 16;
    const up = r.bottom + tall + 8 > innerHeight && r.top > tall + 8;
    const scope = b.closest<HTMLElement>("[data-theme], .dark, .light, .bd-light");
    setPlace({ style: up ? { left, bottom: innerHeight - r.top + 6, width: w } : { left, top: r.bottom + 6, width: w }, theme: scope?.dataset.theme ?? (scope?.classList.contains("dark") ? "dark" : undefined), light: !!scope && (scope.classList.contains("light") || scope.classList.contains("bd-light")) });
    setAt(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const choose = (v: T) => {
    setOpen(false);
    button.current?.focus();
    if (v !== value) onChange(v);
  };

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => list.current?.focus());
    const away = (e: PointerEvent) => !list.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
  }, [open]);

  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setAt((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[at].value);
    } else if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      setOpen(false);
      button.current?.focus();
    }
  };

  return (
    <>
      <button ref={button} type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${current?.label}`} onClick={() => (open ? setOpen(false) : show())} className={cx("inline-flex items-center gap-1.5 font-medium text-[var(--bd-fg)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.05)] focus-visible:bg-[rgb(var(--bd-ink)/0.06)] aria-expanded:bg-[rgb(var(--bd-ink)/0.06)]", inline ? "-mx-1.5 h-6 rounded-[7px] px-1.5 text-[13px]" : "h-8 rounded-[9px] px-2.5 text-[12.5px]", className)}>
        {current?.label}
        <CaretDownIcon weight="regular" size={11} className={cx("text-[var(--bd-subtle)] transition-transform duration-200", open && "rotate-180")} />
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && place && (
              <div data-theme={place.theme} className={place.light ? "light bd-light" : undefined} style={{ display: "contents" }}>
                <motion.div
                  ref={list}
                  data-share-menu=""
                  role="listbox"
                  aria-label={label}
                  aria-activedescendant={`share-pick-${options[at]?.value}`}
                  tabIndex={-1}
                  onKeyDown={key}
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
                  transition={still ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 38 }}
                  style={{ ...place.style, transformOrigin: align === "end" ? "top right" : "top left" }}
                  className="fixed z-[96] rounded-[14px] bg-[var(--bd-surface)] p-1 text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1),0_16px_36px_-14px_rgb(var(--bd-shade)/0.5),0_2px_6px_rgb(var(--bd-shade)/0.08)] outline-none"
                >
                  {options.map((o, i) => (
                    <div key={o.value}>
                      {o.tone === "stop" && <div aria-hidden className="mx-2 my-1 h-px bg-[var(--bd-line-subtle)]" />}
                      <div
                        id={`share-pick-${o.value}`}
                        role="option"
                        aria-selected={o.value === value}
                        onPointerMove={() => setAt(i)}
                        onClick={() => choose(o.value)}
                        className={cx("flex cursor-pointer select-none items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] [&_svg]:shrink-0", wide ? "py-2" : "h-8", i === at && "bg-[rgb(var(--bd-ink)/0.06)]", o.tone === "stop" && "text-[var(--bd-ui-stop)]")}
                      >
                        {o.icon && <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-[var(--bd-ui-track)] text-[var(--bd-fg)] [&_svg]:size-3.5">{o.icon}</span>}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{o.label}</span>
                          {o.note && <span className="block text-[11.5px] leading-snug text-[var(--bd-muted)]">{o.note}</span>}
                        </span>
                        <CheckIcon weight="bold" size={13} className={cx("text-[var(--bd-fg)]", o.value === value ? "opacity-100" : "opacity-0")} />
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

const ROLES: Array<PickOption<ShareRole>> = [
  { value: "edit", label: "Can edit" },
  { value: "view", label: "Can view" },
];

export function Share({ title, url, workspace = "the workspace", people, defaultPeople = [], onPeopleChange, access, defaultAccess = "workspace", onAccessChange, linkRole, defaultLinkRole = "view", onLinkRoleChange, onInvite, onCopy, label = "Share", className }: ShareProps) {
  const [open, setOpen] = useState(false);
  const [innerPeople, setInnerPeople] = useState(defaultPeople);
  const [innerAccess, setInnerAccess] = useState(defaultAccess);
  const [innerLinkRole, setInnerLinkRole] = useState(defaultLinkRole);
  const list = people ?? innerPeople;
  const general = access ?? innerAccess;
  const linkCan = linkRole ?? innerLinkRole;
  const [managing, setManaging] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<ShareRole>("edit");
  const [copied, setCopied] = useState(false);
  const [place, setPlace] = useState<{ style: CSSProperties; theme?: string; light: boolean } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const still = useReducedMotion();

  const setPeople = (next: SharePerson[]) => {
    setInnerPeople(next);
    onPeopleChange?.(next);
  };
  const setAccess = (next: ShareAccess) => {
    setInnerAccess(next);
    onAccessChange?.(next);
  };
  const setLinkCan = (next: ShareRole) => {
    setInnerLinkRole(next);
    onLinkRoleChange?.(next);
  };

  const show = () => {
    const t = trigger.current!;
    const r = t.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.right - W, innerWidth - W - 8));
    const up = r.bottom + 440 > innerHeight && r.top > 440;
    // The panel floats over the page, so it carries the theme of where its button is.
    const scope = t.closest<HTMLElement>("[data-theme], .dark, .light, .bd-light");
    setPlace({ style: up ? { left, bottom: innerHeight - r.top + 8, width: W } : { left, top: r.bottom + 8, width: W }, theme: scope?.dataset.theme ?? (scope?.classList.contains("dark") ? "dark" : undefined), light: !!scope && (scope.classList.contains("light") || scope.classList.contains("bd-light")) });
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus());
    const inMenu = (t: EventTarget | null) => t instanceof Element && !!t.closest("[data-share-menu]");
    const away = (e: PointerEvent) => !panel.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node) && !inMenu(e.target) && setOpen(false);
    const key = (e: globalThis.KeyboardEvent) => e.key === "Escape" && !inMenu(e.target) && !document.querySelector("[data-share-menu]") && (e.preventDefault(), setOpen(false), trigger.current?.focus());
    // Left behind by a scroll or a resize, it would point at nothing.
    const drift = (e: Event) => !panel.current?.contains(e.target as Node) && !inMenu(e.target) && setOpen(false);
    const resize = () => setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", drift, { capture: true, passive: true });
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", drift, { capture: true });
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const take = (text: string) => {
    const found = text.split(/[\s,;]+/).filter(Boolean);
    if (!found.length) return;
    setEmails((all) => [...new Set([...all, ...found.map((e) => e.toLowerCase())])]);
    setDraft("");
  };
  const valid = emails.filter((e) => isEmail(e) && !list.some((p) => p.email === e));
  const invite = () => {
    const all = draft.trim() ? [...emails, ...draft.split(/[\s,;]+/).map((e) => e.toLowerCase())] : emails;
    const fresh = [...new Set(all)].filter((e) => isEmail(e) && !list.some((p) => p.email === e));
    if (!fresh.length) return;
    setPeople([...list, ...fresh.map((email) => ({ id: email, name: nameOf(email), email, role, invited: true }))]);
    onInvite?.(fresh, role);
    setEmails([]);
    setDraft("");
  };
  const copy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      onCopy?.();
    });
  };
  const ACCESS: Array<{ value: ShareAccess; label: string; icon: ReactNode }> = [
    { value: "invited", label: "Invited", icon: <LockSimpleIcon weight="duotone" /> },
    { value: "workspace", label: workspace, icon: <BuildingsIcon weight="duotone" /> },
    { value: "link", label: "Anyone", icon: <GlobeHemisphereWestIcon weight="duotone" /> },
  ];
  // Left and right walk who can open it, choosing as they go.
  const accessKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = ACCESS.findIndex((a) => a.value === general);
    const next = ACCESS[(i + step + ACCESS.length) % ACCESS.length];
    setAccess(next.value);
    e.currentTarget.querySelector<HTMLElement>(`[data-access="${next.value}"]`)?.focus();
  };
  const shown = list.slice(0, 5);
  const host = url.replace(/^https?:\/\//, "");

  return (
    <>
      <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? close() : show())} className={cx("inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--bd-surface)] px-3.5 text-[13px] font-medium text-[var(--bd-fg)] shadow-[inset_0_0_0_1px_var(--bd-line-strong),0_1px_2px_rgb(var(--bd-shade)/0.06)] outline-none transition-colors hover:bg-[var(--bd-surface-2)] focus-visible:shadow-[inset_0_0_0_1px_var(--bd-fg),0_0_0_3px_rgb(var(--bd-ink)/0.1)] [&_svg]:size-3.5", className)}>
        <LinkSimpleIcon weight="regular" />
        {label}
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && place && (
              <div data-theme={place.theme} className={place.light ? "light bd-light" : undefined} style={{ display: "contents" }}>
                <motion.div
                  ref={panel}
                  role="dialog"
                  aria-label={`Share ${title}`}
                  initial={{ opacity: 0, scale: 0.97, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.12 } }}
                  transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }}
                  style={{ ...place.style, transformOrigin: "top right" }}
                  className="fixed z-[95] overflow-hidden rounded-[20px] bg-[var(--bd-surface)] text-[var(--bd-fg)] shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.1),0_24px_56px_-20px_rgb(var(--bd-shade)/0.55),0_2px_8px_rgb(var(--bd-shade)/0.08)]"
                >
                  {/* Who can open it, first: the rest follows from that. */}
                  <div className="px-4 pb-4 pt-4">
                    <p className="truncate text-[12.5px] text-[var(--bd-muted)]">
                      Who can open <span className="font-medium text-[var(--bd-fg)]">{title}</span>
                    </p>
                    <div role="radiogroup" aria-label="Who can open it" onKeyDown={accessKey} className="mt-2.5 grid grid-cols-3 gap-0.5 rounded-full bg-[var(--bd-ui-track)] p-1 shadow-[var(--bd-ui-well)]">
                      {ACCESS.map((a) => {
                        const on = a.value === general;
                        return (
                          <button
                            key={a.value}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            data-access={a.value}
                            tabIndex={on ? 0 : -1}
                            onClick={() => setAccess(a.value)}
                            className={cx("relative flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-[12.5px] outline-none transition-colors [&_svg]:size-3.5 [&_svg]:shrink-0 focus-visible:shadow-[0_0_0_2px_var(--bd-ui-focus)]", on ? "font-medium text-[var(--bd-fg)]" : "text-[var(--bd-muted)] hover:text-[var(--bd-fg)]")}
                          >
                            {on && <motion.span layoutId="share-access" aria-hidden className="absolute inset-0 rounded-full [background:var(--bd-ui-raised)] shadow-[var(--bd-ui-lift),inset_0_0_0_1px_rgb(var(--bd-ink)/0.06)]" transition={still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 40 }} />}
                            <span className="relative flex">{a.icon}</span>
                            <span className="relative truncate">{a.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2.5 flex flex-wrap items-center gap-x-1 text-[12.5px] text-[var(--bd-muted)]">
                      {general === "invited" ? (
                        "Only the people below can open it, even with the link."
                      ) : (
                        <>
                          {general === "link" ? "Anyone with the link, signed in or not, can" : `Anyone at ${workspace} can find it and`}
                          <Pick label="What they can do" value={linkCan} options={[{ value: "view", label: "view" }, { value: "edit", label: "edit" }]} onChange={setLinkCan} align="start" inline className="text-[12.5px]" />
                          it.
                        </>
                      )}
                    </p>

                    {/* The link, ready to hand on. */}
                    <div className="mt-3 flex items-center gap-1.5 rounded-[12px] bg-[var(--bd-ui-field)] py-1 pl-3 pr-1 shadow-[var(--bd-ui-well)]">
                      <LinkSimpleIcon weight="regular" className="size-3.5 shrink-0 text-[var(--bd-subtle)]" />
                      <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--bd-muted)]">{host}</span>
                      <button type="button" onClick={copy} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[12.5px] font-medium text-[var(--bd-ui-ink-text)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_2px_6px_-3px_rgb(var(--bd-shade)/0.5)] transition-[filter] [background:var(--bd-ui-ink)] hover:brightness-110 [&_svg]:size-3.5">
                        {copied ? <CheckIcon weight="bold" /> : <CopyIcon weight="duotone" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* The people with it: their faces, and their access when you open the list. */}
                  <div className="border-t border-[var(--bd-line-subtle)] px-4 py-3">
                    <button type="button" onClick={() => setManaging((m) => !m)} aria-expanded={managing} className="flex w-full items-center gap-3 rounded-[10px] text-left outline-none focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]">
                      <span className="flex [&>*+*]:-ml-1.5">
                        {shown.map((p) => (
                          <span key={p.id} className="size-6 overflow-hidden rounded-full ring-2 ring-[var(--bd-surface)]">
                            <Face name={p.email ?? p.name} />
                          </span>
                        ))}
                        {list.length > shown.length && <span className="grid size-6 place-items-center rounded-full bg-[var(--bd-ui-track)] text-[10px] font-semibold text-[var(--bd-muted)] ring-2 ring-[var(--bd-surface)]">+{list.length - shown.length}</span>}
                      </span>
                      <span className="min-w-0 flex-1 text-[12.5px] text-[var(--bd-muted)]">
                        <span className="font-medium text-[var(--bd-fg)]">{list.length}</span> {list.length === 1 ? "person" : "people"} invited
                      </span>
                      <span className="flex items-center gap-1 text-[12.5px] font-medium">
                        {managing ? "Done" : "Manage"}
                        <CaretDownIcon weight="regular" size={11} className={cx("text-[var(--bd-subtle)] transition-transform duration-200", managing && "rotate-180")} />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {managing && (
                        <motion.ul aria-label="People with access" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 40 }} className="-mx-2 mt-2 max-h-[200px] overflow-y-auto">
                          {list.map((p) => (
                            <li key={p.id} className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5">
                              <span role="img" aria-label={p.name} className="size-7 shrink-0 overflow-hidden rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]">
                                <Face name={p.email ?? p.name} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-1.5 text-[13px]">
                                  <span className="truncate font-medium">{p.name}</span>
                                  {p.you && <span className="text-[12px] text-[var(--bd-subtle)]">you</span>}
                                </span>
                                <span className="block truncate text-[11.5px] text-[var(--bd-muted)]">{p.invited ? `Invited, ${p.email}` : p.email}</span>
                              </span>
                              {p.role === "owner" || p.you ? (
                                <span className="px-2.5 text-[12.5px] text-[var(--bd-muted)]">{p.role === "owner" ? "Owner" : ROLES.find((r) => r.value === p.role)?.label}</span>
                              ) : (
                                <Pick
                                  label={`${p.name}'s access`}
                                  value={p.role}
                                  options={[...ROLES, { value: "remove", label: "Remove", tone: "stop" }]}
                                  onChange={(v) => setPeople(v === "remove" ? list.filter((x) => x.id !== p.id) : list.map((x) => (x.id === p.id ? { ...x, role: v } : x)))}
                                />
                              )}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Someone new: their address, what they can do, and the invite. */}
                  <div className="flex items-start gap-2 border-t border-[var(--bd-line-subtle)] bg-[rgb(var(--bd-ink)/0.02)] p-3">
                    <div className="flex min-h-9 min-w-0 flex-1 flex-wrap items-center gap-1 rounded-[11px] bg-[var(--bd-surface)] py-0.5 pl-1 pr-0.5 shadow-[inset_0_0_0_1px_var(--bd-line)] focus-within:shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.35),0_0_0_3px_rgb(var(--bd-ink)/0.06)]" onClick={() => field.current?.focus()}>
                      {emails.map((e) => (
                        <span key={e} className={cx("inline-flex h-6 max-w-full items-center gap-1 rounded-[7px] pl-2 pr-0.5 text-[12px]", isEmail(e) ? "bg-[var(--bd-ui-track)]" : "bg-[color-mix(in_oklab,var(--bd-ui-stop)_12%,transparent)] text-[var(--bd-ui-stop)]")} title={isEmail(e) ? e : "That isn't an email address."}>
                          <span className="truncate">{e}</span>
                          <button type="button" aria-label={`Remove ${e}`} onClick={() => setEmails((all) => all.filter((x) => x !== e))} className="grid size-5 place-items-center rounded-[6px] text-[var(--bd-subtle)] hover:text-[var(--bd-fg)]">
                            <XIcon weight="regular" size={10} />
                          </button>
                        </span>
                      ))}
                      <input
                        ref={field}
                        value={draft}
                        aria-label="Invite by email"
                        placeholder={emails.length ? "" : "Invite by email"}
                        onChange={(e) => (/[,;\s]$/.test(e.target.value) ? take(e.target.value) : setDraft(e.target.value))}
                        onPaste={(e) => {
                          e.preventDefault();
                          take(e.clipboardData.getData("text"));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (draft.trim()) take(draft);
                            else invite();
                          } else if (e.key === "Backspace" && !draft && emails.length) setEmails((all) => all.slice(0, -1));
                        }}
                        className="h-8 min-w-[110px] flex-1 bg-transparent px-1.5 text-[13px] outline-none placeholder:text-[var(--bd-subtle)]"
                      />
                      <Pick label="Their role" value={role} options={ROLES} onChange={setRole} />
                    </div>
                    <button type="button" disabled={!valid.length && !isEmail(draft.trim())} onClick={invite} className="h-9 shrink-0 rounded-[11px] px-3.5 text-[12.5px] font-medium shadow-[inset_0_0_0_1px_var(--bd-line-strong)] transition-[background-color,opacity] hover:bg-[var(--bd-surface)] disabled:opacity-40">
                      Invite
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

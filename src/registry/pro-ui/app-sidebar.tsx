"use client";

import { CaretRightIcon, CaretUpDownIcon, CheckIcon, DotsThreeIcon, MagnifyingGlassIcon, PlusIcon, SidebarSimpleIcon } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

/*
 * A product's navigation, down the left: the workspace at the top with a menu to switch it, a
 * search, the pages in sections with their icons and counts, groups that open to show what's in
 * them, and you at the foot with your own menu. The page you're on sits on a soft pill that slides
 * from one to the next. It folds to a rail of icons (their names come up beside them), and where
 * there isn't room for it, it becomes a drawer that slides in over the page and swipes away.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const SNAPPY = { type: "spring", stiffness: 520, damping: 42 } as const;
const SOFT = { type: "spring", stiffness: 300, damping: 30 } as const;
const WIDE = 248;
const RAIL = 64;

/* True once it's running in the browser: the server and the first render agree on false, so a portal never trips hydration. */
const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export type SidebarItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** A count beside it, like unread messages. */
  count?: number | string;
  href?: string;
  /** Pages inside it: it opens to show them. */
  items?: SidebarItem[];
};
export type SidebarSection = { id?: string; label?: string; items: SidebarItem[] };
export type SidebarWorkspace = { id: string; name: string; plan?: string; logo?: ReactNode };
export type SidebarUser = { name: string; email?: string };
export type SidebarAction = { label: string; icon?: ReactNode; onSelect?: () => void; tone?: "default" | "stop" };

export type AppSidebarProps = {
  sections: SidebarSection[];
  /** The page you're on, by id. Leave it out and the sidebar keeps it itself. */
  active?: string;
  defaultActive?: string;
  onActiveChange?: (id: string, item: SidebarItem) => void;
  /** Folded to a rail of icons. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  workspaces?: SidebarWorkspace[];
  workspace?: string;
  defaultWorkspace?: string;
  onWorkspaceChange?: (id: string) => void;
  /** Adds "New workspace" to the switcher. */
  onCreateWorkspace?: () => void;
  user?: SidebarUser;
  /** What's in your own menu at the foot: account, settings, sign out. */
  userMenu?: SidebarAction[];
  /** Adds the search. Bind its shortcut yourself; the sidebar only shows it. */
  onSearch?: () => void;
  searchShortcut?: string[];
  /** The drawer, where there isn't room for the sidebar: open or not. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Under this width of the space around it, the sidebar becomes a drawer. */
  breakpoint?: number;
  /** Told whether it's beside the page or a drawer, so the page can show its own menu button. */
  onModeChange?: (mode: "side" | "drawer") => void;
  /** The drawer covers the element around it (which should be relative) rather than the window. */
  contained?: boolean;
  label?: string;
  className?: string;
};

/* ---------- a small menu, for the workspace and for you ---------- */

function Flyout({ anchor, open, onClose, side, label, children }: { anchor: RefObject<HTMLElement | null>; open: boolean; onClose: (refocus?: boolean) => void; side: "top" | "bottom"; label: string; children: ReactNode }) {
  const mounted = useMounted();
  const list = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const a = anchor.current?.getBoundingClientRect();
      const h = list.current?.offsetHeight ?? 0;
      if (!a) return;
      const width = Math.max(220, a.width);
      const top = side === "top" ? a.top - 6 - h : a.bottom + 6;
      setPos({ top: Math.min(Math.max(8, top), innerHeight - 8 - h), left: Math.min(Math.max(8, a.left), innerWidth - 8 - width), width });
    };
    const frame = requestAnimationFrame(() => {
      place();
      list.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus({ preventScroll: true });
    });
    const away = (e: PointerEvent) => {
      const n = e.target as Node;
      if (!list.current?.contains(n) && !anchor.current?.contains(n)) close.current(false);
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", away);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", away);
    };
  }, [open, anchor, side]);
  const onKey = (e: KeyboardEvent) => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => items[(i + items.length) % items.length]?.focus();
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
    else if (e.key === "Escape") onClose(true);
    else if (e.key === "Tab") onClose(false);
    else return;
    e.preventDefault();
  };
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={list}
          role="menu"
          aria-label={label}
          onKeyDown={onKey}
          initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: side === "top" ? 4 : -4 }}
          animate={{ opacity: pos ? 1 : 0, scale: 1, y: 0 }}
          exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
          transition={{ type: "spring", stiffness: 600, damping: 38 }}
          style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, width: pos?.width, transformOrigin: side === "top" ? "left bottom" : "left top" }}
          className="z-[95] rounded-[16px] bg-[var(--bd-surface)] p-1.5 text-[var(--bd-fg)] shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)] outline-none"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

const MENU_ROW = "flex h-9 w-full cursor-default select-none items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13.5px] outline-none transition-colors duration-100 focus:bg-[rgb(var(--bd-ink)/0.06)] [&_svg]:size-4 [&_svg]:shrink-0";

/* ---------- the name beside an icon, on the rail ---------- */

function useTip() {
  const [tip, setTip] = useState<{ text: string; top: number; left: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (el: HTMLElement, text: string, now: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    const go = () => {
      const r = el.getBoundingClientRect();
      setTip({ text, top: r.top + r.height / 2, left: r.right + 10 });
    };
    if (now) go();
    else timer.current = setTimeout(go, 220);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setTip(null);
  };
  useEffect(() => hide, []);
  return { tip, show, hide };
}

function Tip({ tip }: { tip: { text: string; top: number; left: number } | null }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {tip && (
        <motion.span
          role="tooltip"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
          transition={SNAPPY}
          style={{ position: "fixed", top: tip.top, left: tip.left, translateY: "-50%" }}
          className="pointer-events-none z-[96] whitespace-nowrap rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--bd-ui-ink-text)] shadow-[0_8px_20px_-8px_rgb(0_0_0/0.4)] [background:var(--bd-ui-ink)]"
        >
          {tip.text}
        </motion.span>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------- the list ---------- */

const contains = (item: SidebarItem, id: string | undefined): boolean => !!id && !!item.items?.some((c) => c.id === id || contains(c, id));

function Count({ value, rail }: { value: number | string; rail: boolean }) {
  if (rail) return <span aria-hidden className="absolute right-[7px] top-[7px] size-[7px] rounded-full bg-[var(--bd-fg)] shadow-[0_0_0_2px_var(--bd-surface)]" />;
  return <span className="ml-auto shrink-0 rounded-full bg-[var(--bd-ui-track)] px-1.5 py-px text-[11px] font-medium tabular-nums text-[var(--bd-muted)]">{value}</span>;
}

type RowProps = {
  item: SidebarItem;
  depth: number;
  rail: boolean;
  active: string | undefined;
  openGroups: Set<string>;
  toggleGroup: (id: string, open?: boolean) => void;
  choose: (item: SidebarItem) => void;
  expandTo: (id: string) => void;
  tip: ReturnType<typeof useTip>;
  layout: string;
};

function Row({ item, depth, rail, active, openGroups, toggleGroup, choose, expandTo, tip, layout }: RowProps) {
  const still = useReducedMotion();
  const group = !!item.items?.length;
  const open = group && openGroups.has(item.id) && !rail;
  const on = active === item.id;
  const holds = group && contains(item, active);
  const id = useId();
  const content = (
    <>
      {on && <motion.span layoutId={layout} aria-hidden className="absolute inset-0 rounded-[10px] bg-[color-mix(in_oklab,var(--bd-ui-track)_70%,var(--bd-surface))] shadow-[inset_0_0_0_1px_var(--bd-line-subtle)]" transition={still ? { duration: 0 } : SNAPPY} />}
      {on && <motion.span layoutId={`${layout}-tick`} aria-hidden className="absolute left-0 top-2 h-5 w-[2.5px] rounded-full bg-[var(--bd-fg)]" transition={still ? { duration: 0 } : SNAPPY} />}
      <span className={cx("relative grid size-5 shrink-0 place-items-center [&_svg]:size-[18px]", on || holds ? "text-[var(--bd-fg)]" : "text-[var(--bd-muted)] group-hover/row:text-[var(--bd-fg)]")}>{item.icon ?? (depth > 0 ? <span className="size-1 rounded-full bg-current" /> : null)}</span>
      <span className={cx("relative min-w-0 flex-1 truncate text-left transition-opacity duration-150", rail ? "opacity-0" : "opacity-100")}>{item.label}</span>
      {item.count !== undefined && !group && <Count value={item.count} rail={rail} />}
      {group && (
        <motion.span aria-hidden animate={{ rotate: open ? 90 : 0 }} transition={SNAPPY} className={cx("relative grid size-4 shrink-0 place-items-center text-[var(--bd-subtle)] transition-opacity duration-150 [&_svg]:size-3", rail && "opacity-0")}>
          <CaretRightIcon weight="regular" />
        </motion.span>
      )}
    </>
  );
  const rowClass = cx(
    "group/row relative flex h-9 w-full select-none items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] outline-none transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--bd-ui-focus)]",
    on ? "font-medium text-[var(--bd-fg)]" : holds ? "text-[var(--bd-fg)]" : "text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.035)] hover:text-[var(--bd-fg)]",
  );
  const hint = rail ? { onMouseEnter: (e: React.MouseEvent<HTMLElement>) => tip.show(e.currentTarget, item.label, false), onMouseLeave: tip.hide, onFocus: (e: React.FocusEvent<HTMLElement>) => tip.show(e.currentTarget, item.label, true), onBlur: tip.hide } : {};
  return (
    <li>
      {group ? (
        <button
          type="button"
          data-sb-item=""
          data-sb-group={item.id}
          aria-expanded={open}
          aria-controls={`${id}-group`}
          aria-label={rail ? item.label : undefined}
          onClick={() => {
            tip.hide();
            if (rail) expandTo(item.id);
            else toggleGroup(item.id);
          }}
          className={rowClass}
          {...hint}
        >
          {content}
        </button>
      ) : item.href ? (
        <a
          href={item.href}
          data-sb-item=""
          aria-current={on ? "page" : undefined}
          aria-label={rail ? item.label : undefined}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey) return;
            choose(item);
          }}
          className={rowClass}
          {...hint}
        >
          {content}
        </a>
      ) : (
        <button type="button" data-sb-item="" aria-current={on ? "page" : undefined} aria-label={rail ? item.label : undefined} onClick={() => choose(item)} className={rowClass} {...hint}>
          {content}
        </button>
      )}
      {group && (
        <AnimatePresence initial={false}>
          {open && (
            <motion.ul
              id={`${id}-group`}
              initial={still ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={still ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={still ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={SOFT}
              className="relative ml-[19px] overflow-hidden pl-2 before:absolute before:bottom-1.5 before:left-0 before:top-1.5 before:w-px before:bg-[var(--bd-line)]"
            >
              {item.items!.map((c) => (
                <Row key={c.id} item={c} depth={depth + 1} rail={rail} active={active} openGroups={openGroups} toggleGroup={toggleGroup} choose={choose} expandTo={expandTo} tip={tip} layout={layout} />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      )}
    </li>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/* ---------- the sidebar ---------- */

export function AppSidebar({
  sections,
  active,
  defaultActive,
  onActiveChange,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  workspaces,
  workspace,
  defaultWorkspace,
  onWorkspaceChange,
  onCreateWorkspace,
  user,
  userMenu,
  onSearch,
  searchShortcut = ["⌘", "K"],
  open,
  defaultOpen = false,
  onOpenChange,
  breakpoint = 768,
  onModeChange,
  contained = false,
  label = "Main",
  className,
}: AppSidebarProps) {
  const all = sections.flatMap((s) => s.items);
  const [innerActive, setInnerActive] = useState(defaultActive ?? all[0]?.id);
  const current = active ?? innerActive;
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const folded = collapsed ?? innerCollapsed;
  const setFolded = (c: boolean) => {
    setInnerCollapsed(c);
    onCollapsedChange?.(c);
  };
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const drawerOpen = open ?? innerOpen;
  const setDrawer = useCallback(
    (o: boolean) => {
      setInnerOpen(o);
      onOpenChange?.(o);
    },
    [onOpenChange],
  );
  const [innerWs, setInnerWs] = useState(defaultWorkspace ?? workspaces?.[0]?.id);
  const ws = workspaces?.find((w) => w.id === (workspace ?? innerWs));

  // The groups that are open: to start with, whichever holds the page you're on.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(all.filter((i) => contains(i, current)).map((i) => i.id)));
  const toggleGroup = (id: string, force?: boolean) =>
    setOpenGroups((s) => {
      const n = new Set(s);
      if (force ?? !n.has(id)) n.add(id);
      else n.delete(id);
      return n;
    });

  // Beside the page or a drawer, by the width of the space around it.
  const probe = useRef<HTMLSpanElement>(null);
  const [mode, setMode] = useState<"side" | "drawer">("side");
  const modeChange = useRef(onModeChange);
  useEffect(() => {
    modeChange.current = onModeChange;
  });
  // The page hears the mode once to start with, then on each change, outside of any render.
  const told = useRef<"side" | "drawer" | null>(null);
  useLayoutEffect(() => {
    const host = probe.current?.parentElement;
    if (!host) return;
    const check = () => {
      const next = host.getBoundingClientRect().width < breakpoint ? "drawer" : "side";
      setMode(next);
      if (told.current === next) return;
      told.current = next;
      modeChange.current?.(next);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(host);
    return () => ro.disconnect();
  }, [breakpoint]);

  const drawer = mode === "drawer";
  const rail = folded && !drawer;
  const tip = useTip();
  const layout = useId();
  const still = useReducedMotion();
  const mounted = useMounted();

  const choose = (item: SidebarItem) => {
    setInnerActive(item.id);
    onActiveChange?.(item.id, item);
    if (drawer) setDrawer(false);
  };
  const expandTo = (id: string) => {
    setFolded(false);
    toggleGroup(id, true);
  };

  // Arrows move through the visible rows; right opens a group, left closes it.
  const list = useRef<HTMLDivElement>(null);
  const onListKey = (e: KeyboardEvent) => {
    const rows = [...(list.current?.querySelectorAll<HTMLElement>("[data-sb-item]") ?? [])];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    const go = (i: number) => rows[Math.min(rows.length - 1, Math.max(0, i))]?.focus();
    const groupId = rows[at].dataset.sbGroup;
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(rows.length - 1);
    else if (e.key === "ArrowRight" && groupId) {
      if (rail) expandTo(groupId);
      else toggleGroup(groupId, true);
    }
    else if (e.key === "ArrowLeft" && groupId) toggleGroup(groupId, false);
    else return;
    e.preventDefault();
  };

  // The workspace's and your own menus.
  const wsButton = useRef<HTMLButtonElement>(null);
  const userButton = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState<null | "ws" | "user">(null);
  const closeMenu = (refocus = true) => {
    if (refocus) (menu === "ws" ? wsButton : userButton).current?.focus();
    setMenu(null);
  };

  const body = (
    <div className="flex h-full flex-col" style={{ width: drawer ? "100%" : WIDE }}>
      {/* The workspace, and its switcher. */}
      {ws && (
        <div className="px-3 pt-3">
          <button
            ref={wsButton}
            type="button"
            aria-haspopup="menu"
            aria-expanded={menu === "ws"}
            aria-label={rail ? `Workspace: ${ws.name}` : undefined}
            onClick={() => setMenu(menu === "ws" ? null : "ws")}
            onMouseEnter={rail ? (e) => tip.show(e.currentTarget, ws.name, false) : undefined}
            onMouseLeave={rail ? tip.hide : undefined}
            className="group/ws flex h-12 w-full items-center gap-2.5 rounded-[12px] px-1.5 text-left transition-[background-color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.035)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
          >
            <span className="grid size-[30px] shrink-0 place-items-center overflow-hidden rounded-[9px] text-[13px] font-semibold text-[var(--bd-ui-ink-text)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)] [background:var(--bd-ui-ink)]">{ws.logo ?? initials(ws.name)}</span>
            <span className={cx("min-w-0 flex-1 transition-opacity duration-150", rail && "opacity-0")}>
              <span className="block truncate text-[13.5px] font-semibold text-[var(--bd-fg)]">{ws.name}</span>
              {ws.plan && <span className="block truncate text-[12px] text-[var(--bd-subtle)]">{ws.plan}</span>}
            </span>
            <CaretUpDownIcon weight="regular" className={cx("size-3.5 shrink-0 text-[var(--bd-subtle)] transition-opacity duration-150", rail && "opacity-0")} />
          </button>
          <Flyout anchor={wsButton} open={menu === "ws"} onClose={closeMenu} side="bottom" label="Workspaces">
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--bd-subtle)]">Workspaces</p>
            {workspaces!.map((w) => (
              <div
                key={w.id}
                role="menuitemradio"
                aria-checked={w.id === ws.id}
                tabIndex={-1}
                onClick={() => {
                  setInnerWs(w.id);
                  onWorkspaceChange?.(w.id);
                  closeMenu();
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  e.preventDefault();
                  setInnerWs(w.id);
                  onWorkspaceChange?.(w.id);
                  closeMenu();
                }}
                className={MENU_ROW}
              >
                <span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-[7px] text-[11px] font-semibold text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)]">{w.logo ?? initials(w.name)}</span>
                <span className="min-w-0 flex-1 truncate">{w.name}</span>
                {w.id === ws.id && <CheckIcon weight="bold" className="!size-3.5 text-[var(--bd-fg)]" />}
              </div>
            ))}
            {onCreateWorkspace && (
              <>
                <div role="separator" className="mx-1 my-1.5 h-px bg-[var(--bd-line-subtle)]" />
                <div
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => {
                    closeMenu();
                    onCreateWorkspace();
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" && e.key !== " ") return;
                    e.preventDefault();
                    closeMenu();
                    onCreateWorkspace();
                  }}
                  className={cx(MENU_ROW, "text-[var(--bd-muted)]")}
                >
                  <PlusIcon weight="regular" /> New workspace
                </div>
              </>
            )}
          </Flyout>
        </div>
      )}

      {/* Search: a field to look at, a button underneath. */}
      {onSearch && (
        <div className="px-3 pt-2">
          <button
            type="button"
            onClick={onSearch}
            aria-label={rail ? "Search" : undefined}
            onMouseEnter={rail ? (e) => tip.show(e.currentTarget, "Search", false) : undefined}
            onMouseLeave={rail ? tip.hide : undefined}
            className="flex h-9 w-full items-center gap-2.5 rounded-[10px] bg-[var(--bd-ui-field)] px-2.5 text-[13px] text-[var(--bd-subtle)] shadow-[var(--bd-ui-well)] transition-[box-shadow,scale] duration-150 hover:shadow-[inset_0_1px_2px_rgb(var(--bd-shade)/0.09),inset_0_0_0_1px_rgb(var(--bd-ink)/0.16)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
          >
            <MagnifyingGlassIcon weight="duotone" className="size-[18px] shrink-0" />
            <span className={cx("flex-1 text-left transition-opacity duration-150", rail && "opacity-0")}>Search</span>
            <span aria-hidden className={cx("flex gap-0.5 transition-opacity duration-150", rail && "opacity-0")}>
              {searchShortcut.map((k) => (
                <kbd key={k} className="grid h-5 min-w-5 place-items-center rounded-[5px] bg-[var(--bd-ui-track)] px-1 font-sans text-[11px] font-medium text-[var(--bd-muted)]">
                  {k}
                </kbd>
              ))}
            </span>
          </button>
        </div>
      )}

      {/* The pages, in their sections. */}
      <div ref={list} onKeyDown={onListKey} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-2 [scrollbar-width:thin]">
        <LayoutGroup id={layout}>
          {sections.map((s, si) => (
            <div key={s.id ?? si} className={si > 0 ? "mt-4" : "mt-1"}>
              {s.label && (
                <div className="relative mb-1 h-6">
                  <p className={cx("absolute inset-x-2.5 top-1 truncate text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--bd-subtle)] transition-opacity duration-150", rail && "opacity-0")}>{s.label}</p>
                  {/* On the rail a section's name gives way to a short hairline. */}
                  <span aria-hidden className={cx("absolute left-3 top-3 h-px w-4 bg-[var(--bd-line)] transition-opacity duration-150", rail ? "opacity-100" : "opacity-0")} />
                </div>
              )}
              <ul className="grid gap-0.5" aria-label={s.label}>
                {s.items.map((item) => (
                  <Row key={item.id} item={item} depth={0} rail={rail} active={current} openGroups={openGroups} toggleGroup={toggleGroup} choose={choose} expandTo={expandTo} tip={tip} layout={layout} />
                ))}
              </ul>
            </div>
          ))}
        </LayoutGroup>
      </div>

      {/* The foot: fold to a rail, and you. */}
      <div className="grid gap-1 border-t border-[var(--bd-line-subtle)] p-3">
        {!drawer && (
          <button
            type="button"
            onClick={() => {
              tip.hide();
              setFolded(!folded);
            }}
            aria-label={folded ? "Expand the sidebar" : "Collapse the sidebar"}
            aria-expanded={!folded}
            onMouseEnter={rail ? (e) => tip.show(e.currentTarget, "Expand", false) : undefined}
            onMouseLeave={rail ? tip.hide : undefined}
            className="flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-[13.5px] text-[var(--bd-muted)] transition-[background-color,color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.035)] hover:text-[var(--bd-fg)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
          >
            <motion.span animate={{ scaleX: folded ? -1 : 1 }} transition={SNAPPY} className="grid size-5 shrink-0 place-items-center [&_svg]:size-[18px]">
              <SidebarSimpleIcon weight="duotone" />
            </motion.span>
            <span className={cx("transition-opacity duration-150", rail && "opacity-0")}>Collapse</span>
          </button>
        )}
        {user && (
          <>
            <button
              ref={userButton}
              type="button"
              aria-haspopup={userMenu?.length ? "menu" : undefined}
              aria-expanded={userMenu?.length ? menu === "user" : undefined}
              aria-label={rail ? user.name : undefined}
              onClick={() => userMenu?.length && setMenu(menu === "user" ? null : "user")}
              onMouseEnter={rail ? (e) => tip.show(e.currentTarget, user.name, false) : undefined}
              onMouseLeave={rail ? tip.hide : undefined}
              className="flex h-11 w-full items-center gap-2.5 rounded-[12px] px-1.5 text-left transition-[background-color,scale] duration-150 hover:bg-[rgb(var(--bd-ink)/0.035)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)]"
            >
              <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-[var(--bd-ui-track)] text-[12px] font-semibold text-[var(--bd-muted)] shadow-[var(--bd-ui-well)]">{initials(user.name)}</span>
              <span className={cx("min-w-0 flex-1 transition-opacity duration-150", rail && "opacity-0")}>
                <span className="block truncate text-[13px] font-medium text-[var(--bd-fg)]">{user.name}</span>
                {user.email && <span className="block truncate text-[12px] text-[var(--bd-subtle)]">{user.email}</span>}
              </span>
              {userMenu?.length ? <DotsThreeIcon weight="bold" className={cx("size-4 shrink-0 text-[var(--bd-subtle)] transition-opacity duration-150", rail && "opacity-0")} /> : null}
            </button>
            {userMenu && userMenu.length > 0 && (
              <Flyout anchor={userButton} open={menu === "user"} onClose={closeMenu} side="top" label="Your account">
                {userMenu.map((a) => (
                  <div
                    key={a.label}
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => {
                      closeMenu();
                      a.onSelect?.();
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      closeMenu();
                      a.onSelect?.();
                    }}
                    className={cx(MENU_ROW, a.tone === "stop" ? "text-[var(--bd-ui-stop)] focus:bg-[color-mix(in_oklab,var(--bd-ui-stop)_10%,transparent)]" : "text-[var(--bd-fg)]")}
                  >
                    {a.icon && <span className={cx("grid", a.tone !== "stop" && "text-[var(--bd-muted)]")}>{a.icon}</span>}
                    {a.label}
                  </div>
                ))}
              </Flyout>
            )}
          </>
        )}
      </div>
    </div>
  );

  // The drawer: where it came from gets focus back, and Escape or a swipe closes it.
  const drawerRef = useRef<HTMLElement>(null);
  const back = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!drawer || !drawerOpen) return;
    back.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>("[aria-current='page'], [data-sb-item]")?.focus({ preventScroll: true }));
    const key = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) setDrawer(false);
    };
    document.addEventListener("keydown", key);
    const lock = !contained ? document.documentElement.style.overflow : null;
    if (!contained) document.documentElement.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", key);
      if (lock !== null) document.documentElement.style.overflow = lock;
      if (back.current?.isConnected) back.current.focus({ preventScroll: true });
    };
  }, [drawer, drawerOpen, contained, setDrawer]);

  const drawerLayer = (
    <AnimatePresence>
      {drawer && drawerOpen && (
        <div className={cx(contained ? "absolute" : "fixed", "inset-0 z-[80]")}>
          <motion.div aria-hidden className="absolute inset-0 bg-black/30 backdrop-blur-[2px] dark:bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setDrawer(false)} />
          <motion.nav
            ref={drawerRef}
            aria-label={label}
            role="dialog"
            aria-modal="true"
            initial={still ? { opacity: 0 } : { x: "-100%" }}
            animate={still ? { opacity: 1 } : { x: 0 }}
            exit={still ? { opacity: 0 } : { x: "-100%" }}
            transition={SOFT}
            drag={still ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.7, right: 0.04 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -450) setDrawer(false);
            }}
            className="absolute inset-y-0 left-0 w-[min(300px,86%)] touch-pan-y bg-[var(--bd-surface)] shadow-[var(--bd-shadow-float),1px_0_0_var(--bd-line)]"
          >
            {body}
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span ref={probe} aria-hidden className="hidden" />
      {!drawer && (
        <motion.nav
          aria-label={label}
          initial={false}
          animate={{ width: folded ? RAIL : WIDE }}
          transition={still ? { duration: 0 } : SOFT}
          className={cx("relative h-full shrink-0 overflow-hidden border-r border-[var(--bd-line-subtle)] bg-[var(--bd-surface)]", className)}
        >
          {body}
        </motion.nav>
      )}
      {drawer && (contained ? drawerLayer : mounted ? createPortal(drawerLayer, document.body) : null)}
      <Tip tip={rail ? tip.tip : null} />
    </>
  );
}

"use client";

import {
  CaretRightIcon,
  FileCodeIcon,
  FileCssIcon,
  FileHtmlIcon,
  FileIcon,
  FileImageIcon,
  FileJsIcon,
  FileJsxIcon,
  FileMdIcon,
  FileSvgIcon,
  FileTextIcon,
  FileTsIcon,
  FileTsxIcon,
  FolderIcon,
  FolderOpenIcon,
  type Icon,
} from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { createContext, use, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/*
 * A tree of folders and files, or of anything nested. A folder springs open as its caret turns,
 * and a guide line runs down beside what it holds, darker along the branch that leads to the
 * chosen row, which sits on a soft pill that glides to the next. The keyboard runs it the way a
 * file tree should: arrows move and open, Home and End jump, a letter finds, Enter picks, and
 * the whole tree is one stop for Tab.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export type TreeNode = {
  id: string;
  label: string;
  /** In place of the folder or file icon. */
  icon?: ReactNode;
  /** What it holds. Any node with children, even none yet, is a folder. */
  children?: TreeNode[];
  /** Something small at the row's end: a count, a badge, a letter for its git status. */
  meta?: ReactNode;
  disabled?: boolean;
};

export type TreeProps = {
  items: TreeNode[];
  /** The open folders' ids. Leave it out and the tree keeps them itself, starting from defaultExpanded. */
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** The chosen row's id. Leave it out and the tree keeps it itself, starting from defaultSelected. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelect?: (id: string, node: TreeNode) => void;
  /** Folder and file icons picked by name, or none. */
  icons?: "files" | "none";
  /** What the tree is called, for a screen reader. */
  label: string;
  className?: string;
};

/* How far each level steps in, and where its caret sits. */
const INDENT = 16;
const PAD = 6;

/* A file's icon by its extension. */
const BY_EXT: Record<string, Icon> = {
  ts: FileTsIcon,
  tsx: FileTsxIcon,
  js: FileJsIcon,
  mjs: FileJsIcon,
  cjs: FileJsIcon,
  jsx: FileJsxIcon,
  css: FileCssIcon,
  md: FileMdIcon,
  mdx: FileMdIcon,
  html: FileHtmlIcon,
  svg: FileSvgIcon,
  png: FileImageIcon,
  jpg: FileImageIcon,
  jpeg: FileImageIcon,
  webp: FileImageIcon,
  gif: FileImageIcon,
  avif: FileImageIcon,
  json: FileCodeIcon,
  yml: FileCodeIcon,
  yaml: FileCodeIcon,
  toml: FileCodeIcon,
  txt: FileTextIcon,
};

type Place = { node: TreeNode; parent: string | null; level: number };

type TreeState = {
  open: Set<string>;
  toggle: (id: string, to?: boolean) => void;
  chosen: string | null;
  choose: (node: TreeNode) => void;
  stop: string | null;
  setStop: (id: string) => void;
  path: Set<string>;
  icons: "files" | "none";
  still: boolean;
};
const TreeContext = createContext<TreeState | null>(null);
const useTree = () => {
  const ctx = use(TreeContext);
  if (!ctx) throw new Error("Tree rows render inside <Tree>.");
  return ctx;
};

export function Tree({ items, expanded, defaultExpanded = [], onExpandedChange, selected, defaultSelected = null, onSelect, icons = "files", label, className }: TreeProps) {
  const [innerOpen, setInnerOpen] = useState(() => new Set(defaultExpanded));
  const [innerChosen, setInnerChosen] = useState<string | null>(defaultSelected);
  const [focus, setFocus] = useState<string | null>(null);
  const root = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const id = useId();
  const still = !!useReducedMotion();
  const open = useMemo(() => (expanded ? new Set(expanded) : innerOpen), [expanded, innerOpen]);
  const chosen = selected !== undefined ? selected : innerChosen;

  // Every node by id, with its parent and level, for moving about and for the chosen row's branch.
  const places = useMemo(() => {
    const m = new Map<string, Place>();
    const walk = (list: TreeNode[], parent: string | null, level: number) => {
      for (const n of list) {
        m.set(n.id, { node: n, parent, level });
        if (n.children) walk(n.children, n.id, level + 1);
      }
    };
    walk(items, null, 1);
    return m;
  }, [items]);
  // The rows you can see, top to bottom: every node whose folders above it are all open.
  const visible = useMemo(() => {
    const out: string[] = [];
    const walk = (list: TreeNode[]) => {
      for (const n of list) {
        out.push(n.id);
        if (n.children && open.has(n.id)) walk(n.children);
      }
    };
    walk(items);
    return out;
  }, [items, open]);
  const path = useMemo(() => {
    const s = new Set<string>();
    for (let p = chosen ? places.get(chosen)?.parent : null; p; p = places.get(p)?.parent ?? null) s.add(p);
    return s;
  }, [chosen, places]);

  // The one row Tab lands on: the focused one while it's in view, or the nearest open folder above it.
  let stop = focus ?? chosen ?? visible[0] ?? null;
  while (stop && !visible.includes(stop)) stop = places.get(stop)?.parent ?? visible[0] ?? null;

  const setOpen = (next: Set<string>) => {
    if (!expanded) setInnerOpen(next);
    onExpandedChange?.([...next]);
  };
  const toggle = (nodeId: string, to?: boolean) => {
    const next = new Set(open);
    if (to ?? !next.has(nodeId)) next.add(nodeId);
    else next.delete(nodeId);
    setOpen(next);
  };
  const choose = (node: TreeNode) => {
    if (node.disabled) return;
    if (selected === undefined) setInnerChosen(node.id);
    onSelect?.(node.id, node);
  };
  const moveTo = (nodeId: string | undefined) => {
    if (!nodeId) return;
    setFocus(nodeId);
    root.current?.querySelector<HTMLElement>(`[data-tree-id="${CSS.escape(nodeId)}"]`)?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const at = stop ? visible.indexOf(stop) : -1;
    const here = stop ? places.get(stop) : undefined;
    if (!here) return;
    const folder = !!here.node.children;
    const isOpen = folder && open.has(here.node.id);
    switch (e.key) {
      case "ArrowDown":
        moveTo(visible[at + 1]);
        break;
      case "ArrowUp":
        moveTo(visible[at - 1]);
        break;
      case "Home":
        moveTo(visible[0]);
        break;
      case "End":
        moveTo(visible.at(-1));
        break;
      case "ArrowRight":
        if (folder && !isOpen) toggle(here.node.id, true);
        else if (isOpen) moveTo(here.node.children?.[0]?.id);
        break;
      case "ArrowLeft":
        if (isOpen) toggle(here.node.id, false);
        else moveTo(here.parent ?? undefined);
        break;
      case "Enter":
      case " ":
        choose(here.node);
        if (folder && e.key === "Enter") toggle(here.node.id);
        break;
      case "*": {
        // Opens every folder beside this one.
        const siblings = here.parent ? (places.get(here.parent)?.node.children ?? []) : items;
        const next = new Set(open);
        for (const s of siblings) if (s.children) next.add(s.id);
        setOpen(next);
        break;
      }
      default: {
        if (e.key.length !== 1 || !/\S/.test(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
        // Type-ahead: the next row whose name starts with what's been typed.
        const now = Date.now();
        typed.current = { text: now - typed.current.at < 600 ? typed.current.text + e.key.toLowerCase() : e.key.toLowerCase(), at: now };
        const order = [...visible.slice(at + 1), ...visible.slice(0, at + 1)];
        moveTo(order.find((v) => places.get(v)?.node.label.toLowerCase().startsWith(typed.current.text)));
      }
    }
    e.preventDefault();
  };

  return (
    <TreeContext value={{ open, toggle, chosen, choose, stop, setStop: setFocus, path, icons, still }}>
      <LayoutGroup id={id}>
        <ul ref={root} role="tree" aria-label={label} onKeyDown={onKey} className={cx("select-none text-[13.5px]", className)}>
          {items.map((n, i) => (
            <Branch key={n.id} node={n} level={1} pos={i + 1} size={items.length} />
          ))}
        </ul>
      </LayoutGroup>
    </TreeContext>
  );
}

function Branch({ node, level, pos, size }: { node: TreeNode; level: number; pos: number; size: number }) {
  const t = useTree();
  const folder = !!node.children;
  const isOpen = folder && t.open.has(node.id);
  const chosen = t.chosen === node.id;
  const ext = node.label.includes(".") ? node.label.split(".").pop()!.toLowerCase() : "";
  const Glyph: Icon = folder ? (isOpen ? FolderOpenIcon : FolderIcon) : (BY_EXT[ext] ?? FileIcon);
  const indent = (level - 1) * INDENT + PAD;
  return (
    <li
      role="treeitem"
      aria-level={level}
      aria-setsize={size}
      aria-posinset={pos}
      aria-expanded={folder ? isOpen : undefined}
      aria-selected={chosen}
      aria-disabled={node.disabled || undefined}
      data-tree-id={node.id}
      tabIndex={t.stop === node.id ? 0 : -1}
      onFocus={(e) => e.target === e.currentTarget && t.setStop(node.id)}
      className="outline-none [&:focus-visible>div]:outline-2 [&:focus-visible>div]:-outline-offset-2 [&:focus-visible>div]:outline-[color:var(--bd-ui-focus)]"
    >
      <div
        onClick={(e) => {
          e.currentTarget.parentElement?.focus({ preventScroll: true });
          t.choose(node);
          if (folder) t.toggle(node.id);
        }}
        className={cx(
          "relative isolate flex h-8 cursor-default items-center gap-1.5 rounded-[9px] pr-2.5 transition-colors duration-150",
          chosen ? "font-medium text-[var(--bd-fg)]" : "text-[var(--bd-muted)] hover:bg-[rgb(var(--bd-ink)/0.04)] hover:text-[var(--bd-fg)]",
          node.disabled && "pointer-events-none opacity-45",
        )}
        style={{ paddingLeft: indent }}
      >
        {chosen && <motion.span layoutId="tree-chosen" aria-hidden className="absolute inset-0 -z-10 rounded-[9px] bg-[var(--bd-ui-track)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.05)]" transition={t.still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 42 }} />}
        <span aria-hidden className="grid size-4 shrink-0 place-items-center text-[var(--bd-subtle)]">
          {folder && (
            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={t.still ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 }} className="grid place-items-center">
              <CaretRightIcon weight="bold" className="size-3" />
            </motion.span>
          )}
        </span>
        {t.icons === "files" || node.icon ? (
          <span aria-hidden className={cx("grid size-4 shrink-0 place-items-center [&_svg]:size-4", chosen ? "text-[var(--bd-fg)]" : "text-[var(--bd-subtle)]")}>
            {node.icon ?? <Glyph weight="duotone" />}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
        {node.meta != null && <span className="shrink-0 pl-2 text-[11.5px] font-normal tabular-nums text-[var(--bd-subtle)]">{node.meta}</span>}
      </div>
      <AnimatePresence initial={false}>
        {isOpen && node.children && (
          <motion.ul
            role="group"
            initial={t.still ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={t.still ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ height: { type: "spring", stiffness: 420, damping: 40 }, opacity: { duration: 0.16 } }}
            className="relative overflow-hidden"
          >
            {/* The guide down beside what this folder holds: darker on the way to the chosen row. */}
            <span
              aria-hidden
              className={cx("pointer-events-none absolute bottom-1 top-0 z-[1] w-px transition-colors duration-200", t.path.has(node.id) ? "bg-[rgb(var(--bd-ink)/0.3)]" : "bg-[var(--bd-line)]")}
              style={{ left: indent + 7.5 }}
            />
            {node.children.map((c, i) => (
              <Branch key={c.id} node={c} level={level + 1} pos={i + 1} size={node.children!.length} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

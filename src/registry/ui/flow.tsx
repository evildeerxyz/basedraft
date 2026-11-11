"use client";

import { ArrowClockwiseIcon, ArrowCounterClockwiseIcon, CheckIcon, CornersOutIcon, MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

/*
 * A node editor: steps on a board that pans and zooms, joined by curves from an output
 * to an input. Drag a node and it snaps to the grid; drag from an output and a line follows your
 * hand, snapping to the input it nears; shift-drag to select a box of them. While a step runs,
 * what it's given visibly flows along the line into it. A minimap in the corner shows where you
 * are, and the keys move, delete, undo and fit.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export type FlowPort = { id: string; label: string };
export type FlowStatus = "idle" | "running" | "done" | "error" | "skipped";
export type FlowNode = {
  id: string;
  /** Where it sits on the board, in board pixels. */
  x: number;
  y: number;
  title: string;
  /** A word over the title: Trigger, Action, Branch. */
  kind?: string;
  icon?: ReactNode;
  inputs?: FlowPort[];
  outputs?: FlowPort[];
  /** A line under its ports. */
  meta?: string;
};
export type FlowEdge = { id: string; from: string; fromPort: string; to: string; toPort: string };

/* A node's shape, fixed so every port's place is known without measuring. */
const W = 216;
const HEAD = 48;
const ROW = 28;
const PAD = 8;
const FOOT = 30;
const rowsOf = (n: FlowNode) => Math.max(n.inputs?.length ?? 0, n.outputs?.length ?? 0);
const heightOf = (n: FlowNode) => HEAD + rowsOf(n) * ROW + PAD + (n.meta ? FOOT : 0);
const portAt = (n: FlowNode, side: "in" | "out", i: number) => ({ x: n.x + (side === "out" ? W : 0), y: n.y + HEAD + i * ROW + ROW / 2 });
const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const d = Math.max(48, Math.abs(x2 - x1) * 0.5);
  return `M${x1},${y1} C${x1 + d},${y1} ${x2 - d},${y2} ${x2},${y2}`;
};

type View = { x: number; y: number; k: number };

/** The view that fits every step in a board of this size, with room along the foot for the tools. */
function fitView(list: FlowNode[], bw: number, bh: number, minimap: boolean): View | null {
  if (!bw || !list.length) return null;
  const minX = Math.min(...list.map((n) => n.x));
  const minY = Math.min(...list.map((n) => n.y));
  const maxX = Math.max(...list.map((n) => n.x + W));
  const maxY = Math.max(...list.map((n) => n.y + heightOf(n)));
  const side = 48;
  const top = 40;
  const foot = minimap ? 132 : 76;
  const k = clamp(Math.min((bw - side * 2) / (maxX - minX), (bh - top - foot) / (maxY - minY)), 0.2, 1.1);
  return { k, x: (bw - (maxX - minX) * k) / 2 - minX * k, y: top + (bh - top - foot - (maxY - minY) * k) / 2 - minY * k };
}
type Snap = { nodes: FlowNode[]; edges: FlowEdge[] };
type Gesture =
  | { kind: "pan"; sx: number; sy: number; vx: number; vy: number; moved: boolean }
  | { kind: "drag"; sx: number; sy: number; start: Map<string, { x: number; y: number }>; before: Snap; moved: boolean }
  | { kind: "link"; from: string; port: string }
  | { kind: "band"; x0: number; y0: number; add: string[] };

const SAY: Record<FlowStatus, string> = { idle: "", running: "running", done: "done", error: "failed", skipped: "skipped" };

/** A step's state, small, at the end of its header: a hollow ring, a turning ring of dots, a tick, a cross or a dash. */
function StatusMark({ status, still }: { status: FlowStatus; still: boolean }) {
  if (status === "running")
    return (
      <motion.svg viewBox="0 0 16 16" className="size-4 text-[var(--bd-fg)]" animate={still ? undefined : { rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <circle key={i} cx={8 + Math.sin(a) * 5.5} cy={8 - Math.cos(a) * 5.5} r={1.3} fill="currentColor" opacity={[1, 0.75, 0.55, 0.4, 0.28, 0.2, 0.14, 0.1][i]} />;
        })}
      </motion.svg>
    );
  if (status === "done")
    return (
      <span className="grid size-4 place-items-center rounded-full bg-[var(--bd-fg)] text-[var(--bd-surface)]">
        <CheckIcon weight="bold" className="size-2.5" />
      </span>
    );
  if (status === "error")
    return (
      <span className="grid size-4 place-items-center rounded-full bg-[var(--bd-ui-stop)] text-white">
        <XIcon weight="bold" className="size-2.5" />
      </span>
    );
  if (status === "skipped") return <span className="h-[1.5px] w-2.5 rounded-full bg-[rgb(var(--bd-ink)/0.35)]" />;
  return <span className="size-2.5 rounded-full shadow-[inset_0_0_0_1.5px_rgb(var(--bd-ink)/0.25)]" />;
}

/* A brushed-metal hairline around the selected step. */
const METAL = "before:pointer-events-none before:absolute before:-inset-[3px] before:rounded-[17px] before:p-[1.5px] before:[background:var(--bd-ui-metal-edge)] before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]";

export type FlowProps = {
  /** The steps to start with; after that the board keeps its own, and onChange says what changed. */
  defaultNodes: FlowNode[];
  defaultEdges?: FlowEdge[];
  /** Runs after each change that can be undone: a move, a connection, a deletion. */
  onChange?: (flow: Snap) => void;
  /** How each step is doing, by id. A running step draws its input flowing in. */
  status?: Record<string, FlowStatus>;
  /** The board's height. */
  height?: number;
  /** The grid the nodes snap to, in board pixels. */
  grid?: number;
  /** Shows the minimap in the corner. */
  minimap?: boolean;
  /** What it is, for screen readers. */
  label?: string;
  className?: string;
};

export function Flow({ defaultNodes, defaultEdges = [], onChange, status = {}, height = 440, grid = 16, minimap = true, label = "Flow", className }: FlowProps) {
  const [nodes, setNodes] = useState(defaultNodes);
  const [edges, setEdges] = useState(defaultEdges);
  const [view, setView] = useState<View | null>(null);
  const [sel, setSel] = useState<{ nodes: string[]; edge: string | null }>({ nodes: [], edge: null });
  const [link, setLink] = useState<null | { from: string; port: string; x: number; y: number; to: { node: string; port: string } | null }>(null);
  const [band, setBand] = useState<null | { x0: number; y0: number; x1: number; y1: number }>(null);
  const [panning, setPanning] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [hist, setHist] = useState<{ past: Snap[]; future: Snap[] }>({ past: [], future: [] });
  const box = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const still = useReducedMotion();
  const id = useId();

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const snapTo = (v: number) => Math.round(v / grid) * grid;

  /* ---------- The view ---------- */

  const zoomAt = (factor: number, px: number, py: number) =>
    setView((v) => {
      if (!v) return v;
      const k = clamp(v.k * factor, 0.2, 2);
      return { k, x: px - ((px - v.x) * k) / v.k, y: py - ((py - v.y) * k) / v.k };
    });

  // Fits the board once it has a size; later resizes keep the view.
  const fitted = useRef(false);
  const first = useRef(defaultNodes);
  const showMap = useRef(minimap);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
      if (fitted.current || !el.clientWidth) return;
      fitted.current = true;
      setView(fitView(first.current, el.clientWidth, el.clientHeight, showMap.current) ?? { x: 0, y: 0, k: 1 });
    });
    ro.observe(el);
    // Pinching, or the wheel with Ctrl or ⌘, zooms around the pointer; the plain wheel scrolls the page.
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", wheel);
    };
  }, []);

  /* ---------- Changes, with undo ---------- */

  const commit = (before: Snap, next: Snap) => {
    setHist((h) => ({ past: [...h.past.slice(-49), before], future: [] }));
    setNodes(next.nodes);
    setEdges(next.edges);
    onChange?.(next);
  };
  const travel = (back: boolean) => {
    const snap = (back ? hist.past : hist.future).at(-1);
    if (!snap) return;
    const now = { nodes, edges };
    setHist(back ? { past: hist.past.slice(0, -1), future: [...hist.future, now] } : { past: [...hist.past, now], future: hist.future.slice(0, -1) });
    setNodes(snap.nodes);
    setEdges(snap.edges);
    setSel({ nodes: [], edge: null });
    onChange?.(snap);
  };
  const remove = () => {
    if (!sel.nodes.length && !sel.edge) return;
    const gone = new Set(sel.nodes);
    commit({ nodes, edges }, { nodes: nodes.filter((n) => !gone.has(n.id)), edges: edges.filter((e) => e.id !== sel.edge && !gone.has(e.from) && !gone.has(e.to)) });
    setSel({ nodes: [], edge: null });
  };

  /* ---------- Pointer ---------- */

  const world = (clientX: number, clientY: number) => {
    const r = box.current!.getBoundingClientRect();
    const v = view ?? { x: 0, y: 0, k: 1 };
    return { x: (clientX - r.left - v.x) / v.k, y: (clientY - r.top - v.y) / v.k };
  };
  const capture = (e: ReactPointerEvent) => box.current?.setPointerCapture(e.pointerId);

  const downOnBoard = (e: ReactPointerEvent) => {
    if (e.button !== 0 || !view) return;
    capture(e);
    if (e.shiftKey) {
      const p = world(e.clientX, e.clientY);
      gesture.current = { kind: "band", x0: p.x, y0: p.y, add: sel.nodes };
      setBand({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    } else {
      gesture.current = { kind: "pan", sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
      setPanning(true);
    }
  };
  const downOnNode = (e: ReactPointerEvent, n: FlowNode) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    capture(e);
    let picked = sel.nodes;
    if (e.shiftKey) picked = sel.nodes.includes(n.id) ? sel.nodes.filter((x) => x !== n.id) : [...sel.nodes, n.id];
    else if (!sel.nodes.includes(n.id)) picked = [n.id];
    setSel({ nodes: picked, edge: null });
    gesture.current = { kind: "drag", sx: e.clientX, sy: e.clientY, start: new Map(nodes.filter((x) => picked.includes(x.id)).map((x) => [x.id, { x: x.x, y: x.y }])), before: { nodes, edges }, moved: false };
  };
  const downOnPort = (e: ReactPointerEvent, n: FlowNode, port: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    capture(e);
    const p = world(e.clientX, e.clientY);
    gesture.current = { kind: "link", from: n.id, port };
    setLink({ from: n.id, port, x: p.x, y: p.y, to: null });
  };

  const move = (e: ReactPointerEvent) => {
    const g = gesture.current;
    if (!g || !view) return;
    if (g.kind === "pan") {
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (Math.abs(dx) + Math.abs(dy) > 2) g.moved = true;
      setView({ ...view, x: g.vx + dx, y: g.vy + dy });
    } else if (g.kind === "drag") {
      const dx = (e.clientX - g.sx) / view.k;
      const dy = (e.clientY - g.sy) / view.k;
      if (Math.abs(dx) + Math.abs(dy) > 2) g.moved = true;
      setNodes((list) => list.map((n) => (g.start.has(n.id) ? { ...n, x: snapTo(g.start.get(n.id)!.x + dx), y: snapTo(g.start.get(n.id)!.y + dy) } : n)));
    } else if (g.kind === "link") {
      const p = world(e.clientX, e.clientY);
      // The nearest input within reach, on another node, that isn't joined already.
      let to: { node: string; port: string; d: number } | null = null;
      for (const n of nodes) {
        if (n.id === g.from) continue;
        n.inputs?.forEach((port, i) => {
          const q = portAt(n, "in", i);
          const d = Math.hypot(q.x - p.x, q.y - p.y);
          const taken = edges.some((x) => x.from === g.from && x.fromPort === g.port && x.to === n.id && x.toPort === port.id);
          if (d < 28 / view.k && !taken && (!to || d < to.d)) to = { node: n.id, port: port.id, d };
        });
      }
      const t = to as { node: string; port: string; d: number } | null;
      setLink({ from: g.from, port: g.port, x: p.x, y: p.y, to: t && { node: t.node, port: t.port } });
    } else if (g.kind === "band") {
      const p = world(e.clientX, e.clientY);
      setBand({ x0: g.x0, y0: g.y0, x1: p.x, y1: p.y });
    }
  };

  const up = () => {
    const g = gesture.current;
    gesture.current = null;
    setPanning(false);
    if (!g) return;
    if (g.kind === "pan" && !g.moved) setSel({ nodes: [], edge: null });
    if (g.kind === "drag" && g.moved) commit(g.before, { nodes, edges });
    if (g.kind === "link") {
      if (link?.to) {
        const e: FlowEdge = { id: `${g.from}.${g.port}-${link.to.node}.${link.to.port}`, from: g.from, fromPort: g.port, to: link.to.node, toPort: link.to.port };
        commit({ nodes, edges }, { nodes, edges: [...edges, e] });
      }
      setLink(null);
    }
    if (g.kind === "band" && band) {
      const [x0, x1] = [Math.min(band.x0, band.x1), Math.max(band.x0, band.x1)];
      const [y0, y1] = [Math.min(band.y0, band.y1), Math.max(band.y0, band.y1)];
      const inside = nodes.filter((n) => n.x < x1 && n.x + W > x0 && n.y < y1 && n.y + heightOf(n) > y0).map((n) => n.id);
      setSel({ nodes: [...new Set([...g.add, ...inside])], edge: null });
      setBand(null);
    }
  };

  /* ---------- Keys ---------- */

  const keys = (e: ReactKeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      travel(!e.shiftKey);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove();
    } else if (e.key === "Escape") {
      setSel({ nodes: [], edge: null });
      setLink(null);
      gesture.current = null;
    } else if (e.key.startsWith("Arrow") && sel.nodes.length) {
      e.preventDefault();
      const s = grid * (e.shiftKey ? 4 : 1);
      const [dx, dy] = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key as "ArrowLeft"] ?? [0, 0];
      commit({ nodes, edges }, { nodes: nodes.map((n) => (sel.nodes.includes(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n)), edges });
    } else if ((e.key === "=" || e.key === "+" || e.key === "-") && box.current) {
      zoomAt(e.key === "-" ? 1 / 1.2 : 1.2, box.current.clientWidth / 2, box.current.clientHeight / 2);
    } else if (e.key === "0") {
      setView(fitView(nodes, box.current?.clientWidth ?? 0, box.current?.clientHeight ?? 0, minimap) ?? view);
    }
  };

  /* ---------- Drawing ---------- */

  const v = view ?? { x: 0, y: 0, k: 1 };
  const running = (to: string) => status[to] === "running";
  const ICON = "grid size-9 place-items-center rounded-full text-[var(--bd-muted)] outline-none transition-colors hover:bg-[rgb(var(--bd-ink)/0.06)] hover:text-[var(--bd-fg)] focus-visible:outline-2 focus-visible:outline-[color:var(--bd-ui-focus)] disabled:opacity-30";

  // The minimap's frame: everything on the board, and the part of it in view.
  const mini = (() => {
    if (!minimap || !view || !size || !nodes.length) return null;
    const bw = size.w;
    const bh = size.h;
    const vis = { x: -v.x / v.k, y: -v.y / v.k, w: bw / v.k, h: bh / v.k };
    const minX = Math.min(vis.x, ...nodes.map((n) => n.x));
    const minY = Math.min(vis.y, ...nodes.map((n) => n.y));
    const maxX = Math.max(vis.x + vis.w, ...nodes.map((n) => n.x + W));
    const maxY = Math.max(vis.y + vis.h, ...nodes.map((n) => n.y + heightOf(n)));
    const s = Math.min(152 / (maxX - minX), 96 / (maxY - minY));
    return { s, minX, minY, vis, w: (maxX - minX) * s, h: (maxY - minY) * s };
  })();

  return (
    <div
      ref={box}
      role="application"
      aria-label={`${label}: ${nodes.length} steps, ${edges.length} connections`}
      aria-describedby={`${id}-help`}
      tabIndex={0}
      onKeyDown={keys}
      onPointerDown={downOnBoard}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className={cx("relative touch-none select-none overflow-hidden rounded-[24px] bg-[var(--bd-paper)] outline-none shadow-[inset_0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] focus-visible:shadow-[inset_0_0_0_2px_var(--bd-ui-focus)]", panning ? "cursor-grabbing" : "cursor-grab", className)}
      style={{ height }}
    >
      <p id={`${id}-help`} className="sr-only">
        Tab to a step to select it. Arrow keys move it, Delete removes it, Escape lets go. Command or Control with Z undoes, with Shift redoes. Plus and minus zoom; 0 fits everything in view.
      </p>

      <div className={cx("absolute left-0 top-0 origin-top-left transition-opacity duration-300", view ? "opacity-100" : "opacity-0")} style={{ transform: `translate(${v.x}px, ${v.y}px) scale(${v.k})` }}>
        <svg aria-hidden className="absolute left-0 top-0 overflow-visible" width={1} height={1}>
          {edges.map((e) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            const p = portAt(a, "out", Math.max(0, a.outputs?.findIndex((o) => o.id === e.fromPort) ?? 0));
            const q = portAt(b, "in", Math.max(0, b.inputs?.findIndex((o) => o.id === e.toPort) ?? 0));
            const d = curve(p.x, p.y, q.x, q.y);
            const on = sel.edge === e.id;
            const lit = status[e.from] === "done" && status[e.to] === "done";
            const dim = status[e.to] === "skipped";
            return (
              <g key={e.id}>
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  vectorEffect="non-scaling-stroke"
                  className="pointer-events-auto cursor-pointer"
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    setSel({ nodes: [], edge: e.id });
                  }}
                />
                <path d={d} fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeWidth={on ? 2.5 : lit ? 2 : 1.5} strokeDasharray={dim ? "3 5" : undefined} className="pointer-events-none transition-[stroke,stroke-width] duration-300" style={{ stroke: on || lit ? "var(--bd-fg)" : dim ? "rgb(var(--bd-ink) / 0.2)" : "rgb(var(--bd-ink) / 0.3)" }} />
                {running(e.to) && (
                  <path d={d} fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="butt" strokeWidth={3.5} strokeDasharray="3 5" className="pointer-events-none" style={{ stroke: "var(--bd-fg)" }}>
                    {!still && <animate attributeName="stroke-dashoffset" from="16" to="0" dur="0.5s" repeatCount="indefinite" />}
                  </path>
                )}
              </g>
            );
          })}
          {link &&
            (() => {
              const a = byId.get(link.from)!;
              const p = portAt(a, "out", Math.max(0, a.outputs?.findIndex((o) => o.id === link.port) ?? 0));
              const t = link.to && byId.get(link.to.node);
              const q = t ? portAt(t, "in", Math.max(0, t.inputs?.findIndex((o) => o.id === link.to!.port) ?? 0)) : { x: link.x, y: link.y };
              return <path d={curve(p.x, p.y, q.x, q.y)} fill="none" vectorEffect="non-scaling-stroke" strokeWidth={2} strokeLinecap="round" strokeDasharray={t ? undefined : "5 5"} style={{ stroke: "var(--bd-fg)" }} />;
            })()}
        </svg>

        {nodes.map((n) => {
          const on = sel.nodes.includes(n.id);
          const st = status[n.id] ?? "idle";
          return (
            <div
              key={n.id}
              role="group"
              tabIndex={0}
              aria-label={`${n.title}${n.kind ? `, ${n.kind}` : ""}${SAY[st] ? `, ${SAY[st]}` : ""}${on ? ", selected" : ""}`}
              onPointerDown={(e) => downOnNode(e, n)}
              onFocus={() => !on && setSel({ nodes: [n.id], edge: null })}
              className={cx(
                "absolute rounded-[14px] outline-none transition-[box-shadow,opacity] duration-200 [background:var(--bd-ui-raised)]",
                on ? cx("z-10 shadow-[var(--bd-ui-lift),0_14px_30px_-14px_rgb(var(--bd-shade)/0.5)]", METAL) : "shadow-[var(--bd-ui-lift),0_0_0_1px_rgb(var(--bd-ink)/0.09)]",
                st === "skipped" && "opacity-45",
              )}
              style={{ left: n.x, top: n.y, width: W, height: heightOf(n) }}
            >
              <div className="flex items-center gap-2.5 px-3" style={{ height: HEAD }}>
                {n.icon && <span className="grid size-7 shrink-0 place-items-center rounded-[8px] text-[var(--bd-ui-ink-text)] [background:var(--bd-ui-ink)] shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(0_0_0/0.2)] [&_svg]:size-[15px]">{n.icon}</span>}
                <span className="grid min-w-0 flex-1 leading-tight">
                  {n.kind && <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--bd-subtle)]">{n.kind}</span>}
                  <span className="truncate text-[13.5px] font-medium tracking-[-0.01em] text-[var(--bd-fg)]">{n.title}</span>
                </span>
                <span aria-hidden className="grid size-4 shrink-0 place-items-center">
                  <StatusMark status={st} still={!!still} />
                </span>
              </div>
              {Array.from({ length: rowsOf(n) }, (_, i) => {
                const inp = n.inputs?.[i];
                const out = n.outputs?.[i];
                const target = link?.to?.node === n.id && link.to.port === inp?.id;
                const canTake = !!link && link.from !== n.id && !!inp;
                const joined = (side: "in" | "out", port?: FlowPort) => !!port && edges.some((x) => (side === "in" ? x.to === n.id && x.toPort === port.id : x.from === n.id && x.fromPort === port.id));
                return (
                  <div key={i} className="relative flex items-center justify-between gap-2 px-3.5 font-mono text-[11px] text-[var(--bd-muted)]" style={{ height: ROW }}>
                    <span className="truncate">{inp?.label}</span>
                    <span className="truncate text-right">{out?.label}</span>
                    {inp && (
                      <span
                        aria-hidden
                        className={cx(
                          "absolute left-0 top-1/2 grid size-[11px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full [background:var(--bd-ui-bead)] transition-[transform,box-shadow] duration-150",
                          target ? "scale-[1.45] shadow-[0_0_0_1.5px_var(--bd-fg),0_2px_6px_rgb(0_0_0/0.2)]" : canTake ? "shadow-[0_0_0_1.5px_var(--bd-fg),0_0_0_4px_rgb(var(--bd-ink)/0.08)]" : "shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.38),0_1px_1px_rgb(0_0_0/0.12)]",
                        )}
                      >
                        {joined("in", inp) && <span className="size-[4px] rounded-full bg-[var(--bd-fg)]" />}
                      </span>
                    )}
                    {out && (
                      <span aria-hidden onPointerDown={(e) => downOnPort(e, n, out.id)} className="group/port absolute right-0 top-1/2 grid size-6 -translate-y-1/2 translate-x-1/2 cursor-crosshair place-items-center">
                        <span
                          className={cx(
                            "grid size-[11px] place-items-center rounded-full [background:var(--bd-ui-bead)] transition-transform duration-150 group-hover/port:scale-[1.35]",
                            link?.from === n.id && link.port === out.id ? "scale-[1.35] shadow-[0_0_0_1.5px_var(--bd-fg)]" : "shadow-[0_0_0_1px_rgb(var(--bd-ink)/0.38),0_1px_1px_rgb(0_0_0/0.12)]",
                          )}
                        >
                          {joined("out", out) && <span className="size-[4px] rounded-full bg-[var(--bd-fg)]" />}
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
              {n.meta && (
                <div className="mx-3 flex items-center truncate border-t border-dashed border-[rgb(var(--bd-ink)/0.12)] text-[11.5px] text-[var(--bd-subtle)]" style={{ height: FOOT, marginTop: PAD }}>
                  {n.meta}
                </div>
              )}
              {/* Working: a strip of dither pixels marching along its foot. */}
              {st === "running" && (
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-4 bottom-[5px] h-[3px] [mask-image:linear-gradient(90deg,transparent,#000_20%,#000_80%,transparent)]"
                  style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--bd-fg) 0 3px, transparent 3px 6px)", backgroundSize: "12px 3px" }}
                  animate={still ? undefined : { backgroundPositionX: ["0px", "12px"] }}
                  transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
          );
        })}

        {band && <div aria-hidden className="pointer-events-none absolute rounded-[6px] bg-[rgb(var(--bd-ink)/0.05)] shadow-[inset_0_0_0_1px_rgb(var(--bd-ink)/0.35)]" style={{ left: Math.min(band.x0, band.x1), top: Math.min(band.y0, band.y1), width: Math.abs(band.x1 - band.x0), height: Math.abs(band.y1 - band.y0) }} />}
      </div>

      {/* The tools: zoom, fit, undo and redo. */}
      <div onPointerDown={(e) => e.stopPropagation()} className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-full bg-[color-mix(in_oklab,var(--bd-surface)_78%,transparent)] p-0.5 shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] backdrop-blur-md">
        <button type="button" aria-label="Zoom out" onClick={() => box.current && zoomAt(1 / 1.2, box.current.clientWidth / 2, box.current.clientHeight / 2)} className={ICON}>
          <MinusIcon weight="bold" className="size-3.5" />
        </button>
        <span className="w-10 text-center font-mono text-[11px] tabular-nums text-[var(--bd-subtle)]">{Math.round(v.k * 100)}%</span>
        <button type="button" aria-label="Zoom in" onClick={() => box.current && zoomAt(1.2, box.current.clientWidth / 2, box.current.clientHeight / 2)} className={ICON}>
          <PlusIcon weight="bold" className="size-3.5" />
        </button>
        <button type="button" aria-label="Fit everything in view" onClick={() => setView(fitView(nodes, box.current?.clientWidth ?? 0, box.current?.clientHeight ?? 0, minimap) ?? view)} className={ICON}>
          <CornersOutIcon weight="bold" className="size-3.5" />
        </button>
        <span className="mx-0.5 h-4 w-px bg-[var(--bd-line)]" />
        <button type="button" aria-label="Undo" disabled={!hist.past.length} onClick={() => travel(true)} className={ICON}>
          <ArrowCounterClockwiseIcon weight="bold" className="size-3.5" />
        </button>
        <button type="button" aria-label="Redo" disabled={!hist.future.length} onClick={() => travel(false)} className={ICON}>
          <ArrowClockwiseIcon weight="bold" className="size-3.5" />
        </button>
      </div>

      {mini && (
        <div
          aria-hidden
          onPointerDown={(e) => {
            e.stopPropagation();
            const r = e.currentTarget.getBoundingClientRect();
            const el = box.current;
            if (!el || !view) return;
            // Centers the view on the point clicked.
            const wx = mini.minX + (e.clientX - r.left - 8) / mini.s;
            const wy = mini.minY + (e.clientY - r.top - 8) / mini.s;
            setView({ ...view, x: el.clientWidth / 2 - wx * view.k, y: el.clientHeight / 2 - wy * view.k });
          }}
          className="absolute bottom-3 right-3 cursor-pointer rounded-[14px] bg-[color-mix(in_oklab,var(--bd-surface)_78%,transparent)] p-2 shadow-[0_0_0_1px_var(--bd-line),var(--bd-shadow-resting)] backdrop-blur-md max-sm:hidden"
        >
          <svg width={mini.w} height={mini.h} className="block overflow-visible">
            {nodes.map((n) => (
              <rect key={n.id} x={(n.x - mini.minX) * mini.s} y={(n.y - mini.minY) * mini.s} width={W * mini.s} height={heightOf(n) * mini.s} rx={2} style={{ fill: sel.nodes.includes(n.id) || status[n.id] === "running" ? "var(--bd-fg)" : "rgb(var(--bd-ink) / 0.22)" }} />
            ))}
            <rect x={(mini.vis.x - mini.minX) * mini.s} y={(mini.vis.y - mini.minY) * mini.s} width={mini.vis.w * mini.s} height={mini.vis.h * mini.s} rx={3} fill="none" strokeWidth={1.25} style={{ stroke: "rgb(var(--bd-ink) / 0.45)" }} />
          </svg>
        </div>
      )}
    </div>
  );
}

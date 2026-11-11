"use client";

import "@/registry/extras.css";
import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { COMPONENTS } from "@/registry";
import { ENTRY_DEMOS } from "@/registry/catalog-demos";
import { CopyButton } from "@/registry/ui/copy-button";
import { RollingNumber } from "@/registry/ui/number";
import { highlight } from "@/site/code";
import { BaseDraftMark } from "@/site/logo";

/*
 * The film's scenes, each the real component (its own demo from the library), on basedraft's
 * ground: ink with fine dots and the hero's light, or paper. A line at the foot names what's on
 * screen and how it's imported. Scenes change with an ordered-dither wipe, the same dither as the
 * charts. The recorder (in /tmp/film) calls window.__film.cut(i) on the beat and drives every
 * click, drag and keystroke with real input; the cursor drawn here follows that input.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type Scene = { id: string; theme: "dark" | "light"; names?: string; code?: string; body: ReactNode };

/** A component's own demo, in a box the recorder can find by name. */
function Spot({ name, zoom = 1, className, children }: { name: string; zoom?: number; className?: string; children?: ReactNode }) {
  const Demo = ENTRY_DEMOS[name];
  return (
    <div data-film={name} className={cx("grid flex-none place-items-center", className)} style={{ zoom }}>
      {children ?? (Demo ? <Demo /> : null)}
    </div>
  );
}

/**
 * A scene's content at the largest size that fits the frame, up to `max`: measured at its natural
 * size before the first paint, so it never jumps.
 */
function Fit({ max, children, className }: { max: number; children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    setZoom(Math.min(max, (o.clientWidth - 160) / i.offsetWidth, (o.clientHeight - 48) / i.offsetHeight));
  }, [max]);
  return (
    <div ref={outer} className="absolute inset-0 grid place-items-center">
      <div ref={inner} className={cx("w-max", className)} style={{ zoom: zoom ?? 1, visibility: zoom === null ? "hidden" : undefined }}>
        {children}
      </div>
    </div>
  );
}

/* The fine dots and the hero's light, for the ink scenes: both kept to a whisper. */
function InkGround() {
  return (
    <>
      <span aria-hidden className="absolute inset-0 [background:radial-gradient(circle,rgb(255_255_255/0.045)_0.7px,transparent_1.1px)_0_0/7px_7px] [mask-image:radial-gradient(ellipse_at_center,#000_25%,transparent_75%)]" />
      <span aria-hidden className="absolute -left-72 -top-96 size-[1100px] rounded-full bg-[radial-gradient(circle,rgb(125_150_240/0.085),transparent_62%)] blur-3xl" />
      <span aria-hidden className="absolute -right-80 -top-20 size-[1000px] rounded-full bg-[radial-gradient(circle,rgb(176_139_230/0.065),transparent_62%)] blur-3xl" />
      <span aria-hidden className="absolute -bottom-[34rem] left-1/4 size-[1100px] rounded-full bg-[radial-gradient(circle,rgb(99_195_174/0.055),transparent_62%)] blur-3xl" />
    </>
  );
}

/* The wall: every component, live, on a tilted plane that drifts past. */
function Wall() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-1/2 top-1/2 grid w-[2360px] grid-cols-10 gap-4"
        style={{ x: "-50%", y: "-50%", rotateX: 24, rotateZ: -10, transformPerspective: 1600 }}
        initial={{ x: "-38%", y: "-56%", scale: 0.92 }}
        animate={{ x: "-62%", y: "-46%", scale: 1 }}
        transition={{ duration: 4.2, ease: [0.45, 0, 0.55, 1] }}
      >
        {COMPONENTS.map((c) => {
          // Toasts live in one store for the page: a Toaster here would show the last scene's.
          const Demo = c.name === "toast" ? null : ENTRY_DEMOS[c.name];
          return (
            <div key={c.name} className="relative h-[180px] overflow-hidden rounded-[18px] bg-[var(--bd-surface)] shadow-[0_0_0_1px_var(--bd-line),0_18px_40px_-24px_rgb(0_0_0/0.4)]">
              <div className="absolute inset-0 grid place-items-center" style={{ zoom: 0.55 }}>
                {Demo ? <Demo /> : null}
              </div>
              <span className="absolute bottom-2.5 left-3 text-[11px] font-medium text-[var(--bd-muted)]">{c.title}</span>
            </div>
          );
        })}
      </motion.div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="rounded-[28px] bg-[color-mix(in_oklab,var(--bd-surface)_82%,transparent)] px-12 py-8 text-center shadow-[0_30px_80px_-30px_rgb(0_0_0/0.5),0_0_0_1px_var(--bd-line)] backdrop-blur-xl">
          <RollingNumber value={COMPONENTS.length} className="font-display text-[120px] font-medium leading-none tracking-[-0.05em] text-[var(--bd-fg)]" />
          <p className="mt-2 text-[22px] text-[var(--bd-muted)]">components, in one library</p>
        </div>
      </div>
    </div>
  );
}

const SCENES: Scene[] = [
  {
    id: "intro",
    theme: "dark",
    body: (
      <div className="grid h-full place-items-center text-center">
        <div className="grid justify-items-center">
          <motion.div initial={{ scale: 0.6, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.25 }} className="text-[#f4f4f5]">
            <BaseDraftMark size={92} />
          </motion.div>
          <motion.h1 initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 24, delay: 1 }} className="mt-8 font-display text-[112px] font-medium leading-none tracking-[-0.05em] text-[#f4f4f5]">
            basedraft UI
          </motion.h1>
          <motion.p initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 26, delay: 2 }} className="mt-6 text-[28px] text-[#a1a1aa]">
            {COMPONENTS.length} components. Every one of them moves.
          </motion.p>
        </div>
      </div>
    ),
  },
  {
    id: "actions",
    theme: "light",
    names: "Button, Hold button, Copy button",
    code: `import { Button, HoldButton, CopyButton } from "@basedraft/ui";`,
    body: (
      <Fit max={1.9} className="flex items-center gap-12">
        <Spot name="button" />
        <Spot name="hold-button" />
        <Spot name="copy-button" />
      </Fit>
    ),
  },
  {
    id: "forms",
    theme: "light",
    names: "Switch, Segmented, Slider, Checkbox",
    code: `import { Switch, Segmented, Slider, Checkbox } from "@basedraft/ui";`,
    body: (
      <div className="grid h-full grid-cols-2 place-items-center gap-x-24 gap-y-6 px-24 py-10">
        <Spot name="switch" zoom={1.35} />
        <Spot name="segmented" zoom={1.35} />
        <Spot name="slider" zoom={1.35} className="w-full" />
        <Spot name="checkbox" zoom={1.35} />
      </div>
    ),
  },
  {
    id: "inputs",
    theme: "light",
    names: "Code input, Date picker",
    code: `import { CodeInput, DatePicker } from "@basedraft/ui";`,
    body: (
      <Fit max={1.7} className="flex items-start gap-16 pb-40">
        <Spot name="code-input" />
        <Spot name="date-picker" />
      </Fit>
    ),
  },
  {
    id: "tabs-dialog",
    theme: "dark",
    names: "Tabs, Dialog",
    code: `import { Tabs, Dialog } from "@basedraft/ui";`,
    body: (
      <Fit max={1.8} className="flex items-center gap-16">
        <Spot name="tabs" />
        <Spot name="dialog" />
      </Fit>
    ),
  },
  {
    id: "command",
    theme: "dark",
    names: "Command",
    code: `import { Command, CommandInput, CommandList } from "@basedraft/ui";`,
    body: (
      <Fit max={1.5}>
        <Spot name="command" />
      </Fit>
    ),
  },
  {
    id: "toast-sheet",
    theme: "dark",
    names: "Toast, Sheet",
    code: `import { toast, Toaster, Sheet } from "@basedraft/ui";`,
    body: (
      <Fit max={1.8} className="flex items-center gap-16">
        <Spot name="toast" />
        <Spot name="sheet" />
      </Fit>
    ),
  },
  {
    id: "inbox",
    theme: "dark",
    names: "Inbox",
    code: `import { Inbox } from "@/components/basedraft/inbox";`,
    body: (
      <div className="flex h-full justify-center pt-10">
        <Spot name="inbox" zoom={1.15} className="w-[760px] items-start" />
      </div>
    ),
  },
  {
    id: "kanban",
    theme: "dark",
    names: "Kanban board",
    code: `import { KanbanBoard } from "@/components/basedraft/kanban-board";`,
    body: (
      <div className="grid h-full place-items-center">
        <Spot name="kanban-board" zoom={1.08} className="w-[1100px]" />
      </div>
    ),
  },
  {
    id: "chat",
    theme: "dark",
    names: "AI chat",
    code: `import { AiChat } from "@/components/basedraft/ai-chat";`,
    body: (
      <div className="grid h-full place-items-center">
        <Spot name="ai-chat" zoom={1.12} className="w-[640px]" />
      </div>
    ),
  },
  {
    id: "charts",
    theme: "dark",
    names: "Bar chart, Area chart",
    code: `import { BarChart } from "@/components/basedraft/bar-chart";\nimport { AreaChart } from "@/components/basedraft/area-chart";`,
    body: (
      <div className="grid h-full grid-cols-2 items-center gap-12 px-16">
        <Spot name="bar-chart" className="w-full" />
        <Spot name="area-chart" className="w-full" />
      </div>
    ),
  },
  {
    id: "donut-stat",
    theme: "dark",
    names: "Donut chart, Stat",
    code: `import { DonutChart } from "@/components/basedraft/donut-chart";\nimport { Stat } from "@basedraft/ui";`,
    body: (
      <div className="grid h-full grid-cols-[1.1fr_1fr] items-center gap-14 px-16">
        <Spot name="donut-chart" zoom={1.1} className="w-full" />
        <Spot name="stat" zoom={1.1} className="w-full" />
      </div>
    ),
  },
  {
    id: "pricing",
    theme: "light",
    names: "Pricing table",
    code: `import { PricingTable } from "@/components/basedraft/pricing-table";`,
    body: (
      <div className="grid h-full place-items-center px-16">
        <Spot name="pricing-table" zoom={0.92} className="w-full" />
      </div>
    ),
  },
  { id: "wall", theme: "light", body: <Wall /> },
  {
    id: "outro",
    theme: "dark",
    body: (
      <div className="grid h-full place-items-center text-center">
        <div className="grid justify-items-center">
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }} className="flex items-center gap-4 text-[#f4f4f5]">
            <BaseDraftMark size={64} />
            <span className="font-display text-[72px] font-medium leading-none tracking-[-0.05em]">basedraft UI</span>
          </motion.div>
          <motion.div data-film="install" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.6 }} className="mt-10 flex items-center gap-3 rounded-full bg-[#18181b] py-2 pl-6 pr-2 shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_20px_50px_-20px_rgb(0_0_0/0.8)]" style={{ zoom: 1.4 }}>
            <code className="font-mono text-[15px] text-[var(--code-text)]" dangerouslySetInnerHTML={{ __html: `<span style="color:var(--code-comment)">$ </span>${highlight("npm i @basedraft/ui")}` }} />
            <CopyButton value="npm i @basedraft/ui" label="Copy the command" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.4 }} className="mt-8 text-[26px] text-[#a1a1aa]">
            basedraft.site/components
          </motion.p>
        </div>
      </div>
    ),
  },
];

/* ---------- the dither wipe ---------- */

/* An 8 by 8 ordered (Bayer) matrix: each cell's turn in the wipe. */
const BAYER8 = (() => {
  let n = 1;
  let b = [[0]];
  while (n < 8) {
    const next: number[][] = [];
    for (let y = 0; y < n * 2; y++) next.push(new Array(n * 2).fill(0));
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = b[y][x] * 4;
        next[y][x] = v;
        next[y][x + n] = v + 2;
        next[y + n][x] = v + 3;
        next[y + n][x + n] = v + 1;
      }
    b = next;
    n *= 2;
  }
  return b;
})();
const WIPE_IN = 180;
const WIPE_OUT = 240;
const CELL = 20;

function Wipe({ start, color }: { start: number | null; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || start === null) return;
    const ctx = el.getContext("2d")!;
    const cols = Math.ceil(1280 / CELL);
    const rows = Math.ceil(720 / CELL);
    let raf = 0;
    const draw = () => {
      const t = performance.now() - start;
      ctx.clearRect(0, 0, el.width, el.height);
      // Covering, then uncovering: the cells take their turns from the matrix, both ways.
      const cover = t < WIPE_IN ? t / WIPE_IN : Math.max(0, 1 - (t - WIPE_IN) / WIPE_OUT);
      if (cover > 0) {
        ctx.fillStyle = color;
        for (let y = 0; y < rows; y++)
          for (let x = 0; x < cols; x++) if ((BAYER8[y % 8][x % 8] + 0.5) / 64 < cover) ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
      // Done: nothing left behind, and the wipe goes away.
      if (t < WIPE_IN + WIPE_OUT) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, el.width, el.height);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [start, color]);
  return <canvas ref={ref} width={1280} height={720} aria-hidden className="pointer-events-none absolute inset-0 z-40 h-full w-full" />;
}

/* ---------- the cursor ---------- */

function Cursor({ dark }: { dark: boolean }) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);
  const [down, setDown] = useState(false);
  useEffect(() => {
    const move = (e: PointerEvent) => setAt({ x: e.clientX, y: e.clientY });
    const press = (e: PointerEvent) => (setAt({ x: e.clientX, y: e.clientY }), setDown(true));
    const lift = () => setDown(false);
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerdown", press, true);
    window.addEventListener("pointerup", lift, true);
    return () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerdown", press, true);
      window.removeEventListener("pointerup", lift, true);
    };
  }, []);
  if (!at) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[2000]" style={{ transform: `translate(${at.x}px, ${at.y}px)` }}>
      <motion.span className="absolute -left-4 -top-4 size-8 rounded-full" style={{ background: dark ? "rgb(255 255 255 / 0.22)" : "rgb(0 0 0 / 0.14)" }} initial={false} animate={{ scale: down ? 1 : 0.2, opacity: down ? 1 : 0 }} transition={{ type: "spring", stiffness: 600, damping: 30 }} />
      <motion.svg width="22" height="26" viewBox="0 0 22 26" initial={false} animate={{ scale: down ? 0.88 : 1 }} transition={{ type: "spring", stiffness: 700, damping: 30 }} style={{ originX: 0, originY: 0 }}>
        <path d="M2 1.5 L2 20.5 L7 15.8 L10.4 23.6 L13.6 22.2 L10.3 14.6 L17.2 14.6 Z" fill={dark ? "#fafafa" : "#111"} stroke={dark ? "#111" : "#fff"} strokeWidth="1.4" strokeLinejoin="round" />
      </motion.svg>
    </div>
  );
}

/* ---------- the film ---------- */

declare global {
  interface Window {
    __film?: { cut: (i: number) => void; replay: () => void; count: number };
  }
}

export function Film() {
  const [index, setIndex] = useState(0);
  const [take, setTake] = useState(0);
  const [wipe, setWipe] = useState<{ start: number; color: string } | null>(null);
  const scene = SCENES[index];

  useEffect(() => {
    window.__film = {
      count: SCENES.length,
      // Mounts the scene on screen again, so its entrance plays from the start of a take.
      replay: () => setTake((t) => t + 1),
      cut: (i: number) => {
        const next = SCENES[i];
        setWipe({ start: performance.now(), color: next.theme === "dark" ? "#0c0c0e" : "#f4f4f2" });
        setTimeout(() => setIndex(i), WIPE_IN);
        setTimeout(() => setWipe(null), WIPE_IN + WIPE_OUT + 60);
      },
    };
  }, []);

  // Portals (a dialog, a menu) read light or dark from the page, so the page wears the scene's.
  useEffect(() => {
    document.documentElement.dataset.theme = scene.theme;
    document.documentElement.classList.toggle("dark", scene.theme === "dark");
  }, [scene.theme]);

  const dark = scene.theme === "dark";
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ cursor: "none" }}>
      <div key={`${scene.id}-${take}`} data-theme={scene.theme} data-bd-stage="" className={cx("absolute inset-0 overflow-hidden", dark ? "dark bg-[#0c0c0e] text-[#f4f4f5]" : "bd-light bd-paper text-[var(--bd-fg)]")}>
        {dark && <InkGround />}
        <div className="absolute inset-x-0 top-0 bottom-[118px]">{scene.body}</div>
        {/* The mark, and where in the film we are. */}
        {scene.id !== "intro" && scene.id !== "outro" && (
          <>
            <div className={cx("absolute left-10 top-8 flex items-center gap-2.5 text-[18px] font-medium tracking-[-0.03em]", dark ? "text-[#f4f4f5]" : "text-[var(--bd-fg)]")}>
              <BaseDraftMark size={22} /> basedraft UI
            </div>
            <div className={cx("absolute right-10 top-9 font-mono text-[13px] tabular-nums", dark ? "text-[#71717a]" : "text-[var(--bd-subtle)]")}>
              {String(index).padStart(2, "0")} / {String(SCENES.length - 2).padStart(2, "0")}
            </div>
          </>
        )}
        {/* What's on screen, and how it's imported. */}
        {scene.names && (
          <div className="absolute bottom-10 left-10 right-10">
            <motion.p initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.15 }} className="font-display text-[40px] font-medium leading-none tracking-[-0.04em]">
              {scene.names}
            </motion.p>
            {scene.code && (
              <motion.code
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.3 }}
                className="mt-3 block whitespace-pre-line font-mono text-[16px] leading-[1.6] text-[var(--code-text)]"
                dangerouslySetInnerHTML={{ __html: highlight(scene.code) }}
              />
            )}
          </div>
        )}
      </div>
      {/* A whisper of grain over everything: it keeps the soft gradients from banding once the video is compressed. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />
      {wipe && <Wipe start={wipe.start} color={wipe.color} />}
      <Cursor dark={dark} />
      {/* A pixel that never stops changing, so the screencast sends every frame, even when the scene is still. */}
      <span aria-hidden className="pointer-events-none fixed left-0 top-0 size-px animate-[bd-film-tick_1s_linear_infinite] bg-black opacity-[0.02]" />
      <style>{`@keyframes bd-film-tick{0%{transform:translateX(0)}50%{transform:translateX(1px)}100%{transform:translateX(0)}}`}</style>
      {/* Every face and weight the film uses, drawn once off screen, so none loads while the recording holds the clock. */}
      <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 opacity-0">
        <span className="font-mono">mono</span>
        <span className="font-mono font-medium">mono</span>
        <span className="font-display font-medium">display</span>
        <span className="font-sans font-normal">sans</span>
        <span className="font-sans font-medium">sans</span>
        <span className="font-sans font-semibold">sans</span>
        <span className="font-sans font-bold">sans</span>
        {/* And paper's textures, light and dark. */}
        <span className="bd-light bd-paper block size-16" />
        <span data-theme="dark" className="dark block">
          <span className="bd-paper block size-16" />
        </span>
      </div>
    </div>
  );
}

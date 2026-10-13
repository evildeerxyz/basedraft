"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { BellRingingIcon, CheckIcon, DatabaseIcon, PaperPlaneRightIcon, SparkleIcon } from "@phosphor-icons/react/ssr";
import { BrandLogo } from "@/components/site/brand";
import { cn } from "@/lib/cn";
import { Frame, Glyph, Stamp } from "@/components/shapes/shapes";

/*
 * Product snippets drawn in HTML. They are the real UI, simplified, so the
 * page sells the product instead of a stock illustration.
 */

/** Steps through `delays` (ms between stages) once `active` turns true. */
export function useStages(active: boolean, delays: number[]) {
  const [stage, setStage] = useState(0);
  const key = delays.join(",");
  useEffect(() => {
    if (!active) return;
    const steps = key.split(",").map(Number);
    let total = 0;
    const timers = steps.map((ms, i) => {
      total += ms;
      return window.setTimeout(() => setStage(i + 1), total);
    });
    return () => timers.forEach(window.clearTimeout);
  }, [active, key]);
  return stage;
}

/** Types `text` out once `active` turns true. */
export function useTyped(text: string, active: boolean, speed = 28) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setCount((value) => (value >= text.length ? value : value + 1)), speed);
    return () => window.clearInterval(timer);
  }, [active, text, speed]);
  return text.slice(0, count);
}

export function Caret({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
      className={cn("ml-px inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-ink", className)}
    />
  );
}

const KW = new Set(["SELECT", "FROM", "JOIN", "ON", "WHERE", "AND", "AS", "UPDATE", "SET", "GROUP", "BY", "ORDER", "DESC", "LIMIT", "SUM", "COUNT"]);

/** Tiny SQL highlighter: keywords, strings and numbers. */
export function Sql({ code, className, reveal }: { code: string; className?: string; reveal?: boolean }) {
  const lines = code.split("\n");
  return (
    <pre className={cn("font-mono text-[12px] leading-[1.7] text-ink", className)}>
      {lines.map((line, i) => (
        <motion.span
          key={i}
          className="block whitespace-pre-wrap [overflow-wrap:anywhere]"
          initial={reveal === undefined ? false : { opacity: 0, x: -6 }}
          animate={reveal === false ? { opacity: 0, x: -6 } : { opacity: 1, x: 0 }}
          transition={{ delay: reveal ? i * 0.12 : 0 }}
        >
          {line.split(/(\s+|'[^']*'|\b\d+\b|[(),;=.])/).map((part, j) =>
            KW.has(part) ? (
              <span key={j} className="text-blue">
                {part}
              </span>
            ) : /^'/.test(part) ? (
              <span key={j} className="text-ok">
                {part}
              </span>
            ) : /^\d+$/.test(part) ? (
              <span key={j} className="text-warn">
                {part}
              </span>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </motion.span>
      ))}
    </pre>
  );
}

function Chip({ children, on = true, className }: { children: ReactNode; on?: boolean; className?: string }) {
  return (
    <motion.span
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 4 }}
      className={cn("inline-flex h-6 items-center gap-1 border border-line bg-surface-2 px-2 font-mono text-[11px] text-ink-2", className)}
    >
      {children}
    </motion.span>
  );
}

/* ------------------------------------------------------------------------ */
/* Chapter visuals (large)                                                  */
/* ------------------------------------------------------------------------ */

function Window({ title, meta, children, className }: { title: ReactNode; meta?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Frame cut="notch" size={14} className={cn("w-full", className)}>
      <div className="flex h-11 items-center gap-2 border-b border-line px-4 pr-14 text-[13px] font-medium text-ink">
        {title}
        {meta && <span className="ml-auto font-mono text-[11px] font-normal text-ink-3">{meta}</span>}
      </div>
      {children}
    </Frame>
  );
}

const RESULT = [
  ["Fernway", "Pro", "Aug 06"],
  ["Kiln", "Team", "Aug 09"],
  ["Arcadia", "Pro", "Aug 12"],
];

export function AiChat() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  const stage = useStages(inView, [200, 500, 600, 500]);
  return (
    <div ref={ref}>
      <Window
        title={
          <>
            <SparkleIcon size={15} weight="duotone" className="text-pink" />
            Nomad AI
            <span className="bg-pill px-1.5 py-0.5 font-mono text-[10.5px] font-normal text-ink-2">beta</span>
          </>
        }
        meta="read only"
      >
        <div className="grid gap-3 p-4">
          <AnimatePresence>
            {stage > 0 && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="ml-auto max-w-[78%] bg-inverse px-3 py-2 text-[13.5px] leading-snug text-inverse-fg">
                Which customers churned after the price change?
              </motion.p>
            )}
          </AnimatePresence>
          {stage > 1 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[92%] text-[13.5px] leading-relaxed text-ink">
              I joined <span className="font-mono text-[12.5px]">subscriptions</span> to <span className="font-mono text-[12.5px]">plans</span> and kept cancellations after the Aug 4 change.
            </motion.p>
          )}
          <div className="border border-line bg-sunken">
            <Sql reveal={stage > 2} code={"SELECT c.name, p.name AS plan\nFROM subscriptions s\nJOIN plans p ON p.id = s.plan_id\nWHERE s.cancelled_at > '2026-08-04';"} className="px-3 py-2.5" />
            <div className="flex items-center gap-3 border-t border-line px-3 py-2 font-mono text-[11px] text-ink-3">
              <span>142 rows</span>
              <span>38ms</span>
              <span className="ml-auto flex items-center gap-1.5 text-ok">
                <CheckIcon size={11} weight="bold" />
                ran instantly
              </span>
            </div>
          </div>
          <table className="w-full text-left text-[12.5px]">
            <tbody>
              {RESULT.map((row, i) => (
                <motion.tr key={row[0]} initial={false} animate={{ opacity: stage > 3 ? 1 : 0, y: stage > 3 ? 0 : 4 }} transition={{ delay: i * 0.08 }} className="border-b border-line-soft">
                  {row.map((cell, j) => (
                    <td key={j} className={cn("py-1.5", j === 0 ? "font-medium text-ink" : "text-ink-2", j === 2 && "text-right font-mono text-[11.5px]")}>
                      {cell}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="flex h-10 min-w-0 items-center gap-2 border border-line bg-surface px-3 text-[13px] text-ink-3">
            <span className="min-w-0 flex-1 truncate">Ask a follow-up, or type / for a column</span>
            <PaperPlaneRightIcon size={14} weight="duotone" className="shrink-0 text-ink-2" />
          </div>
        </div>
      </Window>
    </div>
  );
}

export function ApprovalCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-140px" });
  const stage = useStages(inView, [1700]);
  const approved = stage > 0;
  return (
    <div ref={ref} className="relative">
      <Window
        title={
          <>
            Write request
            <span className="font-mono text-[12px] font-normal text-ink-3">#4821</span>
          </>
        }
        meta={
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-1.5 py-0.5 transition-colors",
              approved ? "bg-[color-mix(in_oklab,var(--ok)_16%,transparent)] text-ok" : "bg-[color-mix(in_oklab,var(--warn)_18%,transparent)] text-warn",
            )}
          >
            {approved ? "approved" : "waiting"}
          </span>
        }
      >
        <div className="grid gap-4 p-4">
          <div className="flex items-center gap-2.5 text-[13px] text-ink-2">
            <span className="grid size-7 place-items-center bg-rust text-[11px] font-semibold text-white">MH</span>
            <span>
              <span className="font-medium text-ink">Marcus Hale</span> wants to change 1 row
            </span>
            <span className="ml-auto font-mono text-[11px] text-ink-3">2m ago</span>
          </div>
          <div className="border border-line font-mono text-[12px] leading-[1.8]">
            <div className="bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] px-3 text-ink">
              <span className="mr-2 text-danger">-</span>plan = &apos;starter&apos;
            </div>
            <div className="bg-[color-mix(in_oklab,var(--ok)_12%,transparent)] px-3 text-ink">
              <span className="mr-2 text-ok">+</span>plan = &apos;pro&apos;
            </div>
            <div className="px-3 text-ink-3">
              <span className="mr-2"> </span>WHERE account_id = 9921
            </div>
          </div>
          <ul className="grid gap-1.5 text-[12.5px] text-ink-2">
            {["Inside the row limit (1 of 500)", "No schema changes", "Logged with a rollback query"].map((check) => (
              <li key={check} className="flex items-center gap-2">
                <CheckIcon size={12} weight="bold" className="text-ok" />
                {check}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex h-9 items-center gap-1.5 px-3.5 text-[13px] font-medium transition-colors", approved ? "bg-ok text-white" : "bg-inverse text-inverse-fg")}>
              <CheckIcon size={13} weight="bold" />
              {approved ? "Approved and ran" : "Approve and run"}
            </span>
            <span className="inline-flex h-9 items-center border border-line px-3.5 text-[13px] text-ink-2">Reject</span>
          </div>
          <ul className="grid gap-1 border-t border-line pt-3 font-mono text-[11px] text-ink-3">
            <AnimatePresence initial={false}>
              {approved && (
                <motion.li key="approved" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-ok">
                  09:41:07 priya approved #4821, 1 row
                </motion.li>
              )}
            </AnimatePresence>
            <li>09:39:52 marcus requested #4821</li>
            <li>09:12:30 sofia ran #4817, read only</li>
          </ul>
        </div>
      </Window>
      <Stamp show={approved} sub="P. RAMAN · 09:41" className="right-6 top-16 size-[118px]" />
    </div>
  );
}

const SPARK = [22, 24, 21, 25, 23, 26, 24, 23, 25, 27, 24, 26, 25, 41, 52, 49];

export function AlertCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-140px" });
  const stage = useStages(inView, [200, 1300, 500]);
  const w = 360;
  const h = 110;
  const max = 56;
  const pts = SPARK.map((v, i) => [(i / (SPARK.length - 1)) * w, h - (v / max) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const spike = pts[14];
  return (
    <div ref={ref} className="relative">
      <Window
        title={
          <>
            <BellRingingIcon size={15} weight="duotone" className="text-warn" />
            Morning digest
          </>
        }
        meta="06:02"
      >
        <div className="p-4">
          <p className="text-[19px] font-medium leading-snug tracking-[-0.02em] text-ink">
            Refunds in the EU are up <span className="bg-[color-mix(in_oklab,var(--warn)_24%,transparent)] px-1">38%</span> since Tuesday
          </p>
          <div className="relative mt-4">
            <svg viewBox={`0 0 ${w} ${h + 8}`} className="w-full overflow-visible">
              <rect x={pts[12][0]} y={0} width={w - pts[12][0]} height={h} fill="color-mix(in oklab, var(--warn) 12%, transparent)" />
              {[0.25, 0.5, 0.75].map((f) => (
                <line key={f} x1={0} x2={w} y1={h * f} y2={h * f} stroke="var(--line-soft)" />
              ))}
              <motion.path
                d={line}
                fill="none"
                stroke="var(--ink)"
                strokeWidth={1.8}
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: stage > 0 ? 1 : 0 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
              <line x1={0} x2={w} y1={h} y2={h} stroke="var(--line-strong)" />
            </svg>
            <motion.span
              initial={false}
              animate={{ scale: stage > 1 ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              className="absolute size-9 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(spike[0] / w) * 100}%`, top: `${(spike[1] / (h + 8)) * 100}%` }}
            >
              <Glyph shape="burst" color="var(--warn)" className="size-full" />
            </motion.span>
          </div>
          <div className="mt-4 border border-line bg-sunken">
            <Sql code={"SELECT date, SUM(amount)\nFROM refunds WHERE region = 'eu'\nGROUP BY date;"} className="px-3 py-2" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex h-9 items-center px-3.5 text-[13px] font-medium text-inverse-fg bg-inverse">Open as a question</span>
            <span className="inline-flex h-9 items-center border border-line px-3.5 text-[13px] text-ink-2">Mute for a week</span>
          </div>
        </div>
      </Window>
      <motion.div
        initial={false}
        animate={{ opacity: stage > 2 ? 1 : 0, x: stage > 2 ? 0 : 24 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="absolute -bottom-8 -right-8 w-[270px] max-sm:hidden"
      >
        <Frame cut="chamfer" size={10} fill="var(--surface)" className="p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
            <BrandLogo brand="slack" className="size-3.5" />
            #ops
            <span className="ml-auto font-mono text-[10.5px] font-normal text-ink-3">now</span>
          </p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">Noma: EU refunds up 38%. Query and chart attached.</p>
        </Frame>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Product page visuals                                                     */
/* ------------------------------------------------------------------------ */

const ORDERS = [
  { id: "#4821", customer: "Fernway", status: "paid", total: "$1,240" },
  { id: "#4822", customer: "Kiln", status: "refunded", total: "$310" },
  { id: "#4823", customer: "Arcadia", status: "paid", total: "$2,080" },
  { id: "#4824", customer: "Brightline", status: "pending", total: "$640" },
  { id: "#4825", customer: "Mosaic", status: "paid", total: "$975" },
];

const STATUS: Record<string, string> = { paid: "var(--ok)", refunded: "var(--danger)", pending: "var(--warn)" };

export function TablesMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-140px" });
  const stage = useStages(inView, [500, 900, 900]);
  const typed = useTyped("$2,140", stage > 1, 90);
  return (
    <div ref={ref}>
      <Window
        title={
          <>
            orders
            <span className="font-mono text-[11px] font-normal text-ink-3">12,408 rows</span>
          </>
        }
        meta="public"
      >
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-2.5 text-[12.5px] text-ink-2">
          Show orders where
          <Chip on={stage > 0}>status is paid</Chip>
          and
          <Chip on={stage > 0}>total over $500</Chip>
        </div>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-3">
              <th className="px-4 py-2 font-normal">id</th>
              <th className="py-2 font-normal">customer</th>
              <th className="py-2 font-normal">status</th>
              <th className="px-4 py-2 text-right font-normal">total</th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((order, i) => {
              const editing = i === 2 && stage > 1;
              const faded = stage > 0 && order.status !== "paid";
              return (
                <tr key={order.id} className={cn("border-b border-line-soft transition-opacity", faded && "opacity-30", editing && "bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]")}>
                  <td className="px-4 py-2 font-mono text-[11.5px] text-ink-3">{order.id}</td>
                  <td className="py-2 font-medium text-ink">{order.customer}</td>
                  <td className="py-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-2">
                      <span className="size-1.5" style={{ background: STATUS[order.status] }} />
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-[12px] text-ink">
                    {editing ? (
                      <span className="inline-flex h-6 items-center border border-ink bg-surface px-1.5">
                        {typed || order.total}
                        {stage < 3 && <Caret className="h-3" />}
                      </span>
                    ) : (
                      order.total
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center gap-2 px-4 py-3 font-mono text-[11px]">
          <motion.span initial={false} animate={{ opacity: stage > 2 ? 1 : 0 }} className="flex items-center gap-1.5 text-ok">
            <CheckIcon size={11} weight="bold" />
            saved, constraints ok
          </motion.span>
          <span className="ml-auto text-ink-3">3 of 5 shown</span>
        </div>
      </Window>
    </div>
  );
}

const COLUMNS = ["plan_id", "plan_name", "plan_price", "cancelled_at"];

export function EditorMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-140px" });
  const stage = useStages(inView, [600, 700, 700, 800]);
  const lines = ["SELECT p.plan_name,", "       COUNT(*) AS churned", "FROM subscriptions s", "JOIN plans p ON p.id = s.plan_id", "WHERE s.cancelled_at > '2026-09-01'", "GROUP BY 1 ORDER BY 2 DESC;"];
  return (
    <div ref={ref}>
      <Window title="churn_by_plan.sql" meta={stage > 3 ? "ran in 41ms" : "saved"}>
        <div className="relative grid grid-cols-[36px_1fr] font-mono text-[12px] leading-[1.75]">
          <div className="border-r border-line bg-surface-2 py-3 text-right text-ink-4">
            {lines.map((_, i) => (
              <div key={i} className="pr-2.5">
                {i + 1}
              </div>
            ))}
          </div>
          <div className="min-w-0 py-3 pl-3 pr-3">
            <Sql code={lines.join("\n")} className="leading-[1.75]" />
          </div>
          <motion.div
            initial={false}
            animate={{ opacity: stage > 0 && stage < 3 ? 1 : 0, y: stage > 0 ? 0 : -4 }}
            className="pointer-events-none absolute left-[26%] top-[118px] w-[min(190px,70%)] border border-ink bg-surface text-[11.5px]"
          >
            {COLUMNS.map((column, i) => (
              <div key={column} className={cn("flex items-center justify-between px-2.5 py-1", stage > 1 && i === 0 ? "bg-inverse text-inverse-fg" : "text-ink")}>
                {column}
                <span className={cn("text-[10px]", stage > 1 && i === 0 ? "text-accent" : "text-ink-3")}>plans</span>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
          <span className="inline-flex h-8 items-center gap-1.5 bg-inverse px-3 text-[12.5px] font-medium text-inverse-fg">Run query</span>
          <span className="inline-flex h-8 items-center gap-1.5 border border-line px-3 text-[12.5px] text-ink-2">
            <SparkleIcon size={12} weight="duotone" className="text-accent" />
            Explain
          </span>
          <motion.span initial={false} animate={{ opacity: stage > 3 ? 1 : 0 }} className="ml-auto font-mono text-[11px] text-ok">
            4 rows
          </motion.span>
        </div>
      </Window>
    </div>
  );
}

const NODES: { name: string; x: number; y: number; cols: string[] }[] = [
  { name: "users", x: 4, y: 6, cols: ["id", "email", "plan_id"] },
  { name: "orders", x: 58, y: 4, cols: ["id", "user_id", "total"] },
  { name: "payments", x: 58, y: 66, cols: ["id", "order_id", "status"] },
  { name: "plans", x: 6, y: 68, cols: ["id", "name", "price"] },
];

const EDGES = [
  { d: "M 40 17 H 49 V 14 H 58", label: "orders.user_id = users.id" },
  { d: "M 76 30 V 66", label: "payments.order_id = orders.id" },
  { d: "M 22 32 V 68", label: "users.plan_id = plans.id" },
];

export function GraphMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-140px" });
  const [edge, setEdge] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const timer = window.setInterval(() => setEdge((value) => (value + 1) % EDGES.length), 2200);
    return () => window.clearInterval(timer);
  }, [inView]);
  return (
    <div ref={ref}>
      <Window title="Relationships" meta="4 tables · 3 keys">
        <div className="relative aspect-square">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 h-full w-full">
            {EDGES.map((e, i) => (
              <motion.path
                key={e.d}
                d={e.d}
                fill="none"
                stroke={i === edge ? "var(--accent)" : "var(--line-strong)"}
                strokeWidth={i === edge ? 2.5 : 1.5}
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
                animate={{ strokeDashoffset: inView ? [0, -18] : 0 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ))}
          </svg>
          {NODES.map((node) => (
            <div key={node.name} className="absolute w-[36%] border border-line-strong bg-surface text-[11.5px]" style={{ left: `${node.x}%`, top: `${node.y}%` }}>
              <div className="flex items-center gap-1.5 border-b border-line bg-surface-2 px-2 py-1.5 font-medium text-ink">
                <DatabaseIcon size={11} weight="duotone" />
                {node.name}
              </div>
              {node.cols.map((col) => (
                <div key={col} className="px-2 py-1 font-mono text-[10.5px] text-ink-2">
                  {col}
                </div>
              ))}
            </div>
          ))}
          <AnimatePresence mode="wait">
            <motion.div
              key={edge}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-inverse px-2.5 py-1.5 font-mono text-[11px] text-inverse-fg"
            >
              JOIN ON {EDGES[edge].label}
            </motion.div>
          </AnimatePresence>
        </div>
      </Window>
    </div>
  );
}

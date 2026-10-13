"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Dashed, Solid, Stage, useBox, useKit, usePlate, type Family } from "./kit";
import { useTunnelBox } from "./holes";
import { Decal, Hole, Leds, Packet, Route, UiSlab, paintLabel } from "./parts";
import { fitText, rect, text, wrapText, type Painter } from "./paint";

/*
 * How it works, as four stations in a row: Ask, Draft, Approve, Chart. Each
 * lid shows only the piece of Noma that matters for that step. A packet rises
 * out of the plate, runs through every station's doorways and sinks back in at
 * the end, and each station does its part as the packet passes through.
 */

export type StepIndex = 0 | 1 | 2 | 3;

const GAP = 4.2; // distance between stations along the row
const STEP = GAP / Math.SQRT2;
const W = 2.7; // station footprint (square)
const H = 1.3; // station height
const LID = 0.5; // lid thickness; the lid carries the UI
const CHANNEL = 0.62; // doorway width
const PLATE = 0.3;
const CUBE = 0.34;
const FLOOR_SPEED = 2.2;
const KS = [0, 1, 2, 3].map((i) => ((-1.5 + i) * GAP) / Math.SQRT2);
const LID_TOP = PLATE + H;

const PROMPTS = [
  {
    q: "Which plans churned after the price change?",
    sql: ["SELECT plan, count(*)", "FROM subscriptions", "WHERE canceled_at >", "  '2026-03-01'", "GROUP BY plan;"],
    rows: [
      ["starter", 42],
      ["team", 18],
      ["business", 7],
      ["enterprise", 2],
    ],
    ms: 38,
  },
  {
    q: "How many subscriptions are there by status?",
    sql: ["SELECT status, count(*)", "FROM subscriptions", "GROUP BY status", "ORDER BY 2 DESC;"],
    rows: [
      ["active", 16],
      ["pending", 9],
      ["inactive", 6],
      ["paused", 5],
    ],
    ms: 43,
  },
  {
    q: "What is our monthly revenue from paid orders?",
    sql: ["SELECT month, sum(total)", "FROM orders", "WHERE status = 'paid'", "GROUP BY 1;"],
    rows: [
      ["jul", 204],
      ["aug", 231],
      ["sep", 262],
      ["oct", 298],
    ],
    ms: 51,
  },
] as const;

/* ------------------------------------------------------------------------ */
/* The packet's route and the story clock                                   */
/* ------------------------------------------------------------------------ */

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function buildRoute() {
  const ride = PLATE + 0.02 + CUBE / 2;
  const below = PLATE - CUBE / 2 - 0.1;
  const start = v3(KS[0], ride, -KS[0] + STEP);
  const end = v3(KS[3] + STEP, ride, -KS[3]);
  const route = new Route().start(v3(start.x, below, start.z), "s0");
  route.to(start, 1.0, true);
  KS.forEach((k, i) => {
    route.to(v3(k, ride, -k), FLOOR_SPEED, false, i > 0 ? `s${i}` : undefined);
    route.to(i < 3 ? v3(k + STEP, ride, -k) : end, FLOOR_SPEED);
    route.hold(i < 3 ? 1.6 : 2.2);
  });
  route.to(v3(end.x, below, end.z), 1.0, true);
  route.to(v3(start.x, below, start.z), 9); // under the plate, back to the start
  const tagTimes = [0, 1, 2, 3].map((i) => route.keys.find((key) => key.tag === `s${i}`)?.t ?? 0);
  const line = [start, ...KS.flatMap((k, i) => [v3(k, ride, -k), i < 3 ? v3(k + STEP, ride, -k) : end])].map((p) => v3(p.x, PLATE + 0.012, p.z));
  return { keys: route.keys, cycle: route.cycle, tagTimes, start, end, line };
}

type Moment = { loop: number; station: StepIndex; local: number };

function momentAt(time: number, cycle: number, tagTimes: number[]): Moment {
  const loop = Math.floor(time / cycle);
  const t = time - loop * cycle;
  let station: StepIndex = 0;
  tagTimes.forEach((at, i) => {
    if (t >= at) station = i as StepIndex;
  });
  return { loop, station, local: t - tagTimes[station] };
}

/** Everything the lids show, derived from the moment. Changes only a few times a second. */
function viewOf({ loop, station, local }: Moment) {
  const p = loop % PROMPTS.length;
  const prompt = PROMPTS[p];
  const typing = station === 0 ? Math.min(1, Math.max(0, (local - 0.3) / 1.4)) : 1;
  return {
    station,
    p,
    typed: Math.round(typing * prompt.q.length),
    lines: station === 0 ? 0 : station === 1 ? Math.min(prompt.sql.length, Math.max(0, Math.floor((local - 0.15) / 0.32) + 1)) : prompt.sql.length,
    approved: station === 3 || (station === 2 && local > 1.45),
    chart: station === 3 ? p : (p + PROMPTS.length - 1) % PROMPTS.length,
    bars: station === 3,
  };
}

type View = ReturnType<typeof viewOf>;

/* ------------------------------------------------------------------------ */
/* Lids                                                                     */
/* ------------------------------------------------------------------------ */

const paintAsk: Painter<{ q: string; typed: number }> = (g, w, d, { q, typed }) => {
  const { pal } = g;
  rect(g, 0, 0, w, d, pal.surface);
  fitText(g, "Ask Data", 0.22, 0.3, 0.17, 1.2, pal.ink2, { weight: 550 });
  fitText(g, "prod-replica", w - 0.22, 0.3, 0.12, 1.1, pal.ink3, { mono: true, align: "right" });
  rect(g, 0.2, 0.55, w - 0.4, 1.22, pal.surface2, pal.line);
  const lines = wrapText(g, q, 0.19, w - 0.75);
  let left = typed;
  lines.forEach((line, i) => {
    const shown = line.slice(0, Math.max(0, left));
    left -= line.length + 1;
    if (shown) text(g, shown, 0.38, 0.86 + i * 0.3, 0.19, pal.ink);
    if (typed < q.length && left < 0 && left + line.length + 1 >= 0) {
      g.ctx.font = `450 ${0.19 * 128}px ${g.sans}`;
      rect(g, 0.4 + g.ctx.measureText(shown).width / 128, 0.74 + i * 0.3, 0.02, 0.24, pal.ink);
    }
  });
  if (!typed) fitText(g, "Ask about your data…", 0.38, 0.86, 0.19, w - 0.75, pal.ink3);
  rect(g, 0.2, d - 0.66, 0.9, 0.36, pal.surface2);
  fitText(g, "2 tables", 0.65, d - 0.48, 0.13, 0.8, pal.ink2, { mono: true, align: "center" });
  rect(g, w - 1.2, d - 0.72, 1.0, 0.5, pal.sunken, pal.line);
};

const paintDraft: Painter<{ sql: string[]; lines: number }> = (g, w, d, { sql, lines }) => {
  const { pal } = g;
  rect(g, 0, 0, w, d, pal.surface);
  rect(g, 0.22, 0.2, 0.22, 0.22, pal.pink);
  fitText(g, "Nomad AI", 0.56, 0.31, 0.17, 1.0, pal.ink, { weight: 550 });
  rect(g, w - 1.02, 0.17, 0.82, 0.28, pal.okTint);
  fitText(g, "read-only", w - 0.61, 0.31, 0.12, 0.72, pal.ok, { mono: true, align: "center" });
  rect(g, 0.2, 0.6, w - 0.4, d - 1.1, pal.sunken);
  if (!lines) {
    fitText(g, "Waiting for a question", w / 2, 0.6 + (d - 1.1) / 2, 0.15, w - 0.7, pal.ink3, { align: "center" });
  }
  g.ctx.font = `450 ${0.15 * 128}px ${g.mono}`;
  const widest = Math.max(...sql.map((line) => g.ctx.measureText(line).width / 128));
  const size = widest > w - 0.75 ? (0.15 * (w - 0.75)) / widest : 0.15;
  const keyword = /^(SELECT|FROM|WHERE|GROUP|ORDER|BY|DESC|AS)$/;
  sql.slice(0, lines).forEach((line, i) => {
    let x = 0.36;
    const y = 0.84 + i * 0.27;
    line.split(/(\s+)/).forEach((part) => {
      g.ctx.font = `450 ${size * 128}px ${g.mono}`;
      if (part.trim()) text(g, part, x, y, size, keyword.test(part) ? pal.blue : pal.ink, { mono: true });
      x += g.ctx.measureText(part).width / 128;
    });
  });
  fitText(g, lines ? "explained · 2 assumptions" : "", 0.22, d - 0.27, 0.12, w - 0.44, pal.ink3, { mono: true });
};

function check(g: Parameters<Painter<null>>[0], x: number, y: number, color: string) {
  const { ctx } = g;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.035 * 128;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo((x - 0.07) * 128, y * 128);
  ctx.lineTo((x - 0.02) * 128, (y + 0.05) * 128);
  ctx.lineTo((x + 0.08) * 128, (y - 0.06) * 128);
  ctx.stroke();
}

const paintApprove: Painter<{ approved: boolean }> = (g, w, d, { approved }) => {
  const { pal } = g;
  rect(g, 0, 0, w, d, pal.surface);
  fitText(g, "Before it runs", 0.22, 0.3, 0.17, w - 0.44, pal.ink2, { weight: 550 });
  ["Read only, on a replica", "Under 500 rows", "30 second timeout"].forEach((item, i) => {
    const y = 0.68 + i * 0.3;
    check(g, 0.34, y, pal.ok);
    fitText(g, item, 0.52, y, 0.16, w - 0.75, pal.ink);
  });
  fitText(g, approved ? "Approved by Priya" : "Needs 1 approval", 0.22, d - 1.08, 0.15, w - 0.44, approved ? pal.ok : pal.ink3, { weight: 550 });
  rect(g, 0.2, d - 0.76, w - 0.4, 0.56, pal.sunken, pal.line);
};

const paintChart: Painter<{ rows: [string, number][]; shown: boolean; slots: number[] }> = (g, w, d, { rows, shown, slots }) => {
  const { pal } = g;
  rect(g, 0, 0, w, d, pal.surface);
  fitText(g, shown ? `${rows.length} rows` : "Waiting to run", 0.22, 0.3, 0.17, 1.6, shown ? pal.ink : pal.ink3, { weight: 550 });
  fitText(g, "CSV", w - 0.22, 0.3, 0.12, 0.5, pal.ink3, { mono: true, align: "right" });
  const spacing = slots[1] - slots[0];
  rows.forEach(([label, value], i) => {
    rect(g, slots[i] - 0.22, 1.0, 0.44, 0.44, pal.sunken, pal.lineStrong);
    fitText(g, String(label), slots[i], 1.82, 0.13, spacing - 0.06, pal.ink2, { mono: true, align: "center" });
    if (shown) fitText(g, String(value), slots[i], 2.12, 0.17, spacing - 0.06, pal.ink, { weight: 600, align: "center" });
  });
};

const paintKey: Painter<{ label: string; tone: "ink" | "ok" }> = (g, w, d, { label, tone }) => {
  rect(g, 0, 0, w, d, tone === "ok" ? g.pal.ok : g.pal.inverse);
  fitText(g, label, w / 2, d / 2, 0.17, w - 0.2, tone === "ok" ? "#ffffff" : g.pal.inverseFg, { weight: 550, align: "center" });
};

/** Lid-local placement: (u, v) from the lid's back-left corner, as in the painted texture. */
const onLid = (u: number, v: number, w: number, d: number, y = LID_TOP): [number, number, number] => [u + w / 2 - W / 2, y, v + d / 2 - W / 2];

/* ------------------------------------------------------------------------ */
/* Stations                                                                 */
/* ------------------------------------------------------------------------ */

function Station<D>({ i, on, paint, data, children }: { i: number; on: boolean; paint: Painter<D>; data: D; children?: ReactNode }) {
  const { body } = useTunnelBox(W, H, LID, CHANNEL, ["+z", "+x"], 0);
  const titles = ["Ask", "Draft", "Approve", "Chart"];
  return (
    <group position={[KS[i], 0, -KS[i]]}>
      <Solid geometry={body} position={[0, PLATE, 0]} />
      <UiSlab w={W} d={W} h={LID} paint={paint} data={data} position={[0, PLATE + H - LID, 0]} />
      <Decal w={1.9} h={0.36} paint={paintLabel} data={{ n: `0${i + 1}`, title: titles[i], on, size: 0.26 }} position={[-W / 2 + 0.2 + 0.95, PLATE + H - LID / 2, W / 2 + 0.003]} />
      <Leds on={on} position={[W / 2 + 0.02, PLATE + H - LID / 2, W / 2 - 0.36]} count={3} />
      {children}
    </group>
  );
}

/** A key on a lid that dips while `pressed(moment)` is true. */
function Key({
  w,
  d,
  at,
  family,
  label,
  tone,
  pressed,
  clockRef,
}: {
  w: number;
  d: number;
  at: [number, number];
  family: Family;
  label: string;
  tone: "ink" | "ok";
  pressed: (m: Moment) => boolean;
  clockRef: RefObject<Moment>;
}) {
  const group = useRef<THREE.Group>(null);
  const position = onLid(at[0], at[1], w, d);
  useFrame((_, delta) => {
    if (group.current) group.current.position.y = THREE.MathUtils.damp(group.current.position.y, position[1] - (pressed(clockRef.current) ? 0.1 : 0), 18, delta);
  });
  return (
    <group ref={group} position={position}>
      <UiSlab w={w} d={d} h={0.2} family={family} paint={paintKey} data={{ label, tone }} position={[0, 0, 0]} />
    </group>
  );
}

/** Columns that rise out of their slots when the result arrives and sink back for the next question. */
function Bars({ rows, shown, slots, clipAt }: { rows: readonly (readonly [string, number])[]; shown: boolean; slots: number[]; clipAt: number }) {
  const column = useBox(0.36, 1, 0.36);
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const rise = useRef([0, 0, 0, 0]);
  const families: Family[] = ["blue", "green", "pink", "accent"];
  const max = Math.max(...rows.map(([, value]) => value));
  useFrame((_, delta) => {
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      rise.current[i] = THREE.MathUtils.damp(rise.current[i], shown ? 1 : 0, shown ? 4 - i * 0.5 : 6, delta);
      const height = 0.3 + (rows[i][1] / max) * 1.3;
      mesh.scale.y = height;
      mesh.position.y = LID_TOP - height * (1 - rise.current[i]);
    });
  });
  return (
    <>
      {rows.map((row, i) => {
        const [x, , z] = onLid(slots[i], 1.22, 0, 0);
        return <Solid key={i} ref={(m) => void (refs.current[i] = m)} geometry={column} position={[x, LID_TOP - 1, z]} family={families[i]} clipBelow={clipAt} />;
      })}
    </>
  );
}

function Clock({ route, onView, clockRef }: { route: ReturnType<typeof buildRoute>; onView: (view: View) => void; clockRef: RefObject<Moment> }) {
  const last = useRef("");
  const { reduced } = useKit();
  useFrame(({ clock: c }) => {
    const moment = reduced ? { loop: 0, station: 3 as StepIndex, local: 9 } : momentAt(c.elapsedTime, route.cycle, route.tagTimes);
    clockRef.current = moment;
    const view = viewOf(moment);
    const key = JSON.stringify(view);
    if (key !== last.current) {
      last.current = key;
      onView(view);
    }
  }, -1);
  return null;
}

/** On narrow screens the row slides so the working station stays in frame. */
function Follow({ station, enabled, children }: { station: StepIndex; enabled: boolean; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    const k = enabled ? KS[station] : 0;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, -k, 3, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, k, 3, delta);
  });
  return <group ref={group}>{children}</group>;
}

function Steps({ onStep, follow, y }: { onStep?: (step: StepIndex) => void; follow: boolean; y: number }) {
  const route = useMemo(() => buildRoute(), []);
  const clockRef = useRef<Moment>({ loop: 0, station: 0, local: 0 });
  const [view, setView] = useState<View>(() => viewOf({ loop: 0, station: 0, local: 0 }));
  const plate = usePlate("stage", [3 * GAP + 4.8, 6.4, 1.1, 1.4], PLATE);
  useEffect(() => {
    onStep?.(view.station);
  }, [view.station, onStep]);
  const prompt = PROMPTS[view.p];
  const result = PROMPTS[view.chart];
  const slots = [0.5, 0.5 + (W - 1) / 3, 0.5 + (2 * (W - 1)) / 3, W - 0.5];
  const approveW = W - 0.5;
  return (
    <group position={[0, y, 0]}>
      <Clock route={route} onView={setView} clockRef={clockRef} />
      <Follow station={view.station} enabled={follow}>
        <Solid geometry={plate} rotation={[0, Math.PI / 4, 0]} family="sand" />
        <Dashed points={route.line} />
        <Hole size={CUBE + 0.18} position={[route.start.x, PLATE + 0.001, route.start.z]} />
        <Hole size={CUBE + 0.18} position={[route.end.x, PLATE + 0.001, route.end.z]} />

        <Station i={0} on={view.station === 0} paint={paintAsk} data={{ q: prompt.q, typed: view.typed }}>
          <Key w={0.92} d={0.42} at={[W - 1.16, W - 0.68]} family="ink" label="Ask" tone="ink" clockRef={clockRef} pressed={(m) => m.station === 0 && m.local > 1.75 && m.local < 2.1} />
        </Station>
        <Station i={1} on={view.station === 1} paint={paintDraft} data={{ sql: [...prompt.sql], lines: view.lines }} />
        <Station i={2} on={view.station === 2} paint={paintApprove} data={{ approved: view.approved }}>
          <Key
            w={approveW}
            d={0.44}
            at={[0.25, W - 0.72]}
            family={view.approved ? "green" : "ink"}
            label={view.approved ? `Approved · ran in ${prompt.ms}ms` : "Approve and run"}
            tone={view.approved ? "ok" : "ink"}
            clockRef={clockRef}
            pressed={(m) => m.station === 2 && m.local > 1.2 && m.local < 1.5}
          />
        </Station>
        <Station i={3} on={view.station === 3} paint={paintChart} data={{ rows: result.rows.map(([l, n]) => [l, n] as [string, number]), shown: view.bars, slots }}>
          <Bars rows={result.rows} shown={view.bars} slots={slots} clipAt={y + LID_TOP} />
        </Station>

        <Packet keys={route.keys} cycle={route.cycle} size={CUBE} clipBelow={y + PLATE} />
      </Follow>
    </group>
  );
}

/** How it works, in four stations. `follow` keeps the working station in frame on narrow screens. */
export function StepsScene({ className, onStep, follow = false }: { className?: string; onStep?: (step: StepIndex) => void; follow?: boolean }) {
  return (
    <Stage className={className} span={follow ? 7.6 : 18.6} lift={0.4}>
      <Steps onStep={onStep} follow={follow} y={follow ? -0.55 : -0.35} />
    </Stage>
  );
}

"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { motion, useMotionValue, type MotionValue } from "motion/react";
import { cn } from "@/lib/cn";
import { Dashed, Pin, Solid, Stage, useBox, useCylinder, useKit, usePlate, type Family } from "./kit";
import { useTunnelBox } from "./holes";

/* ------------------------------------------------------------------------ */
/* Shared bits                                                              */
/* ------------------------------------------------------------------------ */

function usePins(count: number) {
  const a = [useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999)];
  const b = [useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999)];
  return Array.from({ length: count }, (_, i) => ({ x: a[i], y: b[i] }));
}

/* ------------------------------------------------------------------------ */
/* Architecture: exploded layers                                            */
/* ------------------------------------------------------------------------ */

export type LayerKey = "postgres" | "pool" | "schema" | "planner" | "ai" | "gate";

const PLATE = 7;

function Keys({ lit }: { lit: number }) {
  const key = useBox(0.62, 0.32, 0.62);
  return (
    <group>
      {Array.from({ length: 36 }, (_, n) => {
        const i = n % 6;
        const j = Math.floor(n / 6);
        const on = n === lit || n === (lit + 13) % 36 || n === (lit + 25) % 36;
        return <Solid key={n} geometry={key} position={[-2.5 + i * 1, 0, -2.5 + j * 1]} family={on ? "accent" : "paper"} />;
      })}
    </group>
  );
}

function Layer({ index, base, h, gap, family, children }: { index: number; base: number; h: number; gap: MotionValue<number>; family: Family; children?: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const plate = useBox(PLATE, h, PLATE);
  useFrame(() => {
    if (group.current) group.current.position.y = base + index * gap.get();
  });
  return (
    <group ref={group}>
      <Solid geometry={plate} family={family} />
      <group position={[0, h, 0]}>{children}</group>
    </group>
  );
}

function StackInner({ gap, active }: { gap: MotionValue<number>; active: LayerKey | null }) {
  const [lit, setLit] = useState(0);
  const tick = useRef(0);
  useFrame((_, delta) => {
    tick.current += delta;
    if (tick.current > 0.45) {
      tick.current = 0;
      setLit((value) => (value + 1) % 36);
    }
  });
  const disc = useCylinder(0.7, 0.45, 40);
  const lane = useBox(5.6, 0.12, 0.42);
  const die = useBox(3.2, 0.35, 3.2);
  const chip = useBox(2.2, 0.24, 2.2);
  const spreader = useBox(1.5, 0.1, 1.5);
  const housing = useBox(2.1, 0.3, 1.15);
  const rocker = useBox(0.86, 0.24, 0.85);
  const led = useBox(0.22, 0.08, 0.22);
  const trace = useBox(2.6, 0.08, 0.16);
  const pad = useBox(0.36, 0.14, 0.36);
  const fam = (key: LayerKey, base: Family): Family => (active === key ? "accent" : active ? "sand" : base);
  const heights = [0.9, 0.3, 0.35, 0.3, 0.45, 0.45];
  const base = heights.reduce<number[]>((acc, _, i) => [...acc, i === 0 ? 0 : acc[i - 1] + heights[i - 1]], []);
  const root = useRef<THREE.Group>(null);
  useFrame(() => {
    // Keep the stack centred as it pulls apart: plates + five gaps + the gate on top.
    if (root.current) root.current.position.y = -(base[5] + heights[5] + 0.7 + 5 * gap.get()) / 2;
  });
  return (
    <group ref={root}>
      <Layer index={0} base={base[0]} h={heights[0]} gap={gap} family={fam("postgres", "paper")}>
        {[-1.6, 0, 1.6].map((x) => (
          <Solid key={x} geometry={disc} position={[x, 0, x === 0 ? -1.2 : 0.9]} family={active === "postgres" ? "accent" : "blue"} threshold={30} />
        ))}
      </Layer>
      <Layer index={1} base={base[1]} h={heights[1]} gap={gap} family={fam("pool", "paper")}>
        {[-2, -1, 0, 1, 2].map((z) => (
          <Solid key={z} geometry={lane} position={[0, 0, z]} family="sand" />
        ))}
      </Layer>
      <Layer index={2} base={base[2]} h={heights[2]} gap={gap} family={fam("schema", "paper")}>
        <Keys lit={lit} />
      </Layer>
      <Layer index={3} base={base[3]} h={heights[3]} gap={gap} family={fam("planner", "paper")}>
        {[
          [-1.4, -1.6, 0],
          [1.2, -0.4, Math.PI / 2],
          [-0.8, 1.5, 0],
          [1.9, 1.8, Math.PI / 2],
        ].map(([x, z, r], i) => (
          <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
            <Solid geometry={trace} family="ink" edges={false} />
            <Solid geometry={pad} position={[1.3, 0, 0]} family="accent" />
          </group>
        ))}
      </Layer>
      <Layer index={4} base={base[4]} h={heights[4]} gap={gap} family={fam("ai", "paper")}>
        <Solid geometry={die} family="sand" />
        <Solid geometry={chip} position={[0, 0.35, 0]} family="ink" />
        <Solid geometry={spreader} position={[0, 0.59, 0]} family={active === "ai" ? "accent" : "paper"} />
      </Layer>
      <Layer index={5} base={base[5]} h={heights[5]} gap={gap} family={fam("gate", "paper")}>
        {/* the approval switch: a rocker in its housing, with a status light */}
        <Solid geometry={housing} family="ink" />
        <Solid geometry={rocker} position={[-0.42, 0.3, 0]} rotation={[0, 0, -0.22]} family={active === "gate" ? "accent" : "green"} />
        <Solid geometry={led} position={[1.6, 0, 0.9]} family="green" edges={false} />
      </Layer>
    </group>
  );
}

export function StackScene({ gap, active, className }: { gap: MotionValue<number>; active: LayerKey | null; className?: string }) {
  return (
    <Stage className={className} span={15}>
      <StackInner gap={gap} active={active} />
    </Stage>
  );
}

/* ------------------------------------------------------------------------ */
/* Smaller scenes for sub pages                                             */
/* ------------------------------------------------------------------------ */

/** Slides its children up out of a slot, once, the first time the scene runs. Pair with `clipBelow` on the solids. */
function Emerge({ depth, delay = 0, children }: { depth: number; delay?: number; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const { reduced } = useKit();
  useFrame(({ clock }) => {
    if (!group.current) return;
    if (start.current === null) start.current = clock.elapsedTime;
    const t = reduced ? 1 : Math.min(1, Math.max(0, (clock.elapsedTime - start.current - delay) / 1.1));
    group.current.position.y = -depth * Math.pow(1 - t, 3);
  });
  return (
    <group ref={group} position={[0, -depth, 0]}>
      {children}
    </group>
  );
}

/** A dark slot cut into a surface, `size` across. */
function Slot({ size, position }: { size: number; position: [number, number, number] }) {
  const slot = useBox(size, 0.012, size);
  return <Solid geometry={slot} position={position} family="void" edges={false} />;
}

/* Towers that carry a customer name (index into the tower list). */
const NAMED: [number, string][] = [
  [5, "Ledgerly"],
  [10, "Parcelworks"],
  [7, "Helio"],
  [13, "Northbeam"],
];

/** Customers: a little city of teams, a few of them named. */
export function CityScene({ className, span = 17 }: { className?: string; span?: number }) {
  const pins = usePins(NAMED.length);
  return (
    <Stage
      className={className}
      span={span}
      overlay={NAMED.map(([, name], i) => (
        <motion.div key={name} style={{ x: pins[i].x, y: pins[i].y }} className="pointer-events-none absolute left-0 top-0">
          <span
            className={cn(
              "block -translate-x-1/2 -translate-y-full whitespace-nowrap border px-2 py-0.5 text-[12px] font-medium",
              i === 0 ? "border-ink bg-inverse text-inverse-fg" : "border-line-strong bg-page text-ink",
            )}
          >
            {name}
          </span>
        </motion.div>
      ))}
    >
      <City pins={pins} />
    </Stage>
  );
}

const CITY_Y = -2;
const CITY_TOP = 0.35; // top of the ground plate, where the slots are

function City({ pins }: { pins: { x: MotionValue<number>; y: MotionValue<number> }[] }) {
  const ground = usePlate("stage", [13, 13, 1.8, 2.4], 0.35);
  const towers = [
    [-4, -4, 2.2, "paper"],
    [-1.3, -4, 3.6, "paper"],
    [1.4, -4, 1.6, "sand"],
    [4, -4, 2.8, "paper"],
    [-4, -1.3, 3.1, "sand"],
    [-1.3, -1.3, 5.4, "accent"],
    [1.4, -1.3, 2.5, "paper"],
    [4, -1.3, 1.9, "blue"],
    [-4, 1.4, 1.7, "paper"],
    [-1.3, 1.4, 2.9, "paper"],
    [1.4, 1.4, 4.2, "paper"],
    [4, 1.4, 2.2, "sand"],
    [-4, 4, 1.2, "sand"],
    [-1.3, 4, 1.8, "green"],
    [1.4, 4, 1.4, "paper"],
    [4, 4, 2.6, "paper"],
  ] as const;
  const box = useBox(2, 1, 2);
  return (
    <group position={[0, CITY_Y, 0]}>
      <Solid geometry={ground} family="sand" />
      {towers.map(([x, z, h, family], i) => {
        const named = NAMED.findIndex(([index]) => index === i);
        return (
          <group key={i} position={[x, CITY_TOP, z]}>
            <Slot size={2.08} position={[0, 0.001, 0]} />
            <Emerge depth={h + 0.05} delay={i * 0.05}>
              <Solid geometry={box} scale={[1, h, 1]} family={family} clipBelow={CITY_Y + CITY_TOP} />
              {named >= 0 && <Pin {...pins[named]} position={[0, h + 0.25, 0]} />}
            </Emerge>
          </group>
        );
      })}
    </group>
  );
}

/** Company / announcement: funding rounds as rising bars with pinned amounts. */
export function FundingScene({ rounds, className, span = 16 }: { rounds: { label: string; amount: number; year: string }[]; className?: string; span?: number }) {
  const pins = usePins(rounds.length);
  return (
    <Stage
      className={className}
      span={span}
      overlay={rounds.map((round, i) => (
        <motion.div key={round.label} style={{ x: pins[i].x, y: pins[i].y }} className="pointer-events-none absolute left-0 top-0">
          <div className="-translate-x-1/2 -translate-y-full pb-2 text-center">
            <span className="block text-[20px] font-semibold tracking-[-0.03em] text-ink">${round.amount}M</span>
            <span className="block whitespace-nowrap bg-page px-1 font-mono text-[11px] text-ink-3">
              {round.label} · {round.year}
            </span>
          </div>
        </motion.div>
      ))}
    >
      <Funding rounds={rounds} pins={pins} />
    </Stage>
  );
}

function Funding({ rounds, pins }: { rounds: { amount: number }[]; pins: { x: MotionValue<number>; y: MotionValue<number> }[] }) {
  const base = usePlate("stage", [14, 5, 1.2, 1.6], 0.3);
  const bar = useBox(1.5, 1, 1.5);
  const y = -2.6;
  const top = 0.3;
  return (
    <group position={[0, y, 0]}>
      <Solid geometry={base} rotation={[0, Math.PI / 4, 0]} family="sand" />
      {rounds.map((round, i) => {
        const h = 0.6 + round.amount * 0.11;
        const k = (-4.8 + i * 3.2) / Math.SQRT2;
        return (
          <group key={i} position={[k, top, -k]}>
            <Slot size={1.58} position={[0, 0.001, 0]} />
            <Emerge depth={h + 0.05} delay={0.2 + i * 0.18}>
              <Solid geometry={bar} scale={[1, h, 1]} family={i === rounds.length - 1 ? "accent" : "paper"} clipBelow={y + top} />
              <Pin {...pins[i]} position={[0, h + 0.4, 0]} />
            </Emerge>
          </group>
        );
      })}
    </group>
  );
}

/** Changelog: release blocks riding a track. */
export function ReleaseScene({ versions, className, span = 15 }: { versions: string[]; className?: string; span?: number }) {
  const pins = usePins(versions.length);
  return (
    <Stage
      className={className}
      span={span}
      overlay={versions.map((version, i) => (
        <motion.div key={version} style={{ x: pins[i].x, y: pins[i].y }} className="pointer-events-none absolute left-0 top-0">
          <span
            className={cn(
              "block -translate-x-1/2 -translate-y-full whitespace-nowrap border px-2 py-0.5 font-mono text-[12px]",
              i === versions.length - 1 ? "border-ink bg-inverse text-inverse-fg" : "border-line-strong bg-page text-ink",
            )}
          >
            {version}
          </span>
        </motion.div>
      ))}
    >
      <Release count={versions.length} pins={pins} />
    </Stage>
  );
}

const REL = { y: -1.4, top: 0.3, gap: 3.4, block: 2.2, tunnel: 0.5, channel: 0.56, cube: 0.36 };

/**
 * The runner's loop, in scene units: up out of the start hole, through every
 * release block (in at the front, out at the right, round the corner into the
 * next), down the end hole, and back to the start underneath the rail.
 */
function releaseLoop(count: number) {
  const step = REL.gap / Math.SQRT2;
  const ks = Array.from({ length: count }, (_, i) => (-(count - 1) * REL.gap * 0.5 + i * REL.gap) / Math.SQRT2);
  const ride = REL.top + 0.02;
  const below = REL.top - REL.cube - 0.2;
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const start = v(ks[0], ride, -ks[0] + step);
  const end = v(ks[count - 1] + step, ride, -ks[count - 1]);
  const surface: THREE.Vector3[] = [start];
  ks.forEach((k) => {
    surface.push(v(k, ride, -k));
    surface.push(v(k + step, ride, -k));
  });
  surface[surface.length - 1] = end;
  const keys: { p: THREE.Vector3; t: number; ease: boolean }[] = [];
  let t = 0;
  const go = (p: THREE.Vector3, speed: number, ease = false) => {
    const last = keys[keys.length - 1];
    if (last) t += last.p.distanceTo(p) / speed;
    keys.push({ p, t, ease });
  };
  go(v(start.x, below, start.z), 1);
  go(start.clone(), 1.1, true);
  surface.slice(1).forEach((p) => go(p.clone(), 2.6));
  go(v(end.x, below, end.z), 1.1, true);
  go(v(start.x, below, start.z), 9); // under the rail, out of sight
  return { keys, cycle: t, surface, start, end };
}

const runnerAt = new THREE.Vector3();

function Release({ count, pins }: { count: number; pins: { x: MotionValue<number>; y: MotionValue<number> }[] }) {
  const rail = usePlate("stage", [16, 4.6, 1.0, 1.3], REL.top);
  const cube = useBox(REL.cube, REL.cube, REL.cube);
  const hole = useBox(REL.cube + 0.16, 0.012, REL.cube + 0.16);
  const loop = useMemo(() => releaseLoop(count), [count]);
  const route = useMemo(() => loop.surface.map((p) => new THREE.Vector3(p.x, REL.top + 0.012, p.z)), [loop]);
  const runner = useRef<THREE.Mesh>(null);
  const { reduced } = useKit();
  useFrame(({ clock }) => {
    if (!runner.current) return;
    const { keys, cycle } = loop;
    const t = reduced ? keys[3].t : clock.elapsedTime % cycle;
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      if (t > b.t) continue;
      const k = b.t > a.t ? (t - a.t) / (b.t - a.t) : 1;
      runnerAt.copy(a.p).lerp(b.p, b.ease ? k * k * (3 - 2 * k) : k);
      runner.current.position.copy(runnerAt);
      return;
    }
  });
  return (
    <group position={[0, REL.y, 0]}>
      <Solid geometry={rail} rotation={[0, Math.PI / 4, 0]} family="sand" />
      <Dashed points={route} />
      {[loop.start, loop.end].map((p) => (
        <Solid key={p.x} geometry={hole} position={[p.x, REL.top + 0.001, p.z]} family="void" />
      ))}
      <Solid ref={runner} geometry={cube} family="accent" clipBelow={REL.y + REL.top} />
      {Array.from({ length: count }, (_, i) => {
        const latest = i === count - 1;
        const k = (-(count - 1) * REL.gap * 0.5 + i * REL.gap) / Math.SQRT2;
        return <ReleaseBlock key={i} position={[k, REL.top, -k]} h={latest ? 1.76 : 1.1} latest={latest} pin={pins[i]} />;
      })}
    </group>
  );
}

/** A release block with a doorway at the front and one on the right, so the runner passes through it. */
function ReleaseBlock({ position, h, latest, pin }: { position: [number, number, number]; h: number; latest: boolean; pin: { x: MotionValue<number>; y: MotionValue<number> } }) {
  const { body, lid } = useTunnelBox(REL.block, h, h - REL.tunnel, REL.channel, ["+z", "+x"], 0);
  return (
    <group position={position}>
      <Solid geometry={body} family={latest ? "accent" : "paper"} />
      <Solid geometry={lid} family={latest ? "accent" : "paper"} />
      <Pin {...pin} position={[0, h + 1.15, 0]} />
    </group>
  );
}

/** 404: an empty tray and a query that found nothing. */
export function TrayScene({ className }: { className?: string }) {
  return (
    <Stage className={className} span={13}>
      <Tray />
    </Stage>
  );
}

function Tray() {
  const tray = usePlate("stage", [8, 6, 0.8, 1.2], 0.45);
  const floor = useBox(6.4, 0.12, 4.4);
  const cube = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), []);
  const { dashed } = useKit();
  const spin = useRef<THREE.Group>(null);
  const lines = useMemo(() => {
    const l = new THREE.LineSegments(cube, dashed);
    l.computeLineDistances();
    return l;
  }, [cube, dashed]);
  useFrame(({ clock }, delta) => {
    if (!spin.current) return;
    spin.current.rotation.y += delta * 0.6;
    spin.current.position.y = 3 + Math.sin(clock.elapsedTime * 1.3) * 0.25;
  });
  return (
    <group position={[0, -1.5, 0]}>
      <Solid geometry={tray} family="sand" />
      <Solid geometry={floor} position={[0, 0.45, 0]} family="paper" />
      <group ref={spin}>
        <primitive object={lines} />
      </group>
    </group>
  );
}

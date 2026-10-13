"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { motion, useMotionValue, type MotionValue } from "motion/react";
import { cn } from "@/lib/cn";
import { Dashed, Pin, Solid, Stage, usePlate, type Family } from "./kit";
import { Hole, Packet, Route, TunnelDevice } from "./parts";

/*
 * A line of towers on a plate. Each tower is a stack of units with a shaft
 * through every lid. One packet runs the line: up out of a hole at the start,
 * in at each tower's front doorway, up the shaft to the top and back down, out
 * of the side doorway to the next tower, and finally down a hole at the end
 * and back underneath to the start.
 */

export type RackItem = { label: string; units: number; accent?: boolean };

const U = { w: 2.4, h: 0.72, lid: 0.27, channel: 0.62, shaft: 0.27 };
const CUBE = 0.34;
const PLATE = 0.3; // plate thickness; its top is where things ride
const ABOVE = CUBE / 2 + 0.1;
const REST_GAP = 0.06;
const OPEN_GAP = 0.36;

const towerTop = (units: number, gap: number) => units * U.h + (units - 1) * gap;

function RackInner({
  items,
  spacing,
  active,
  packet,
  pins,
  y,
}: {
  items: RackItem[];
  spacing: number;
  active: number | null;
  packet: Family;
  pins: { x: MotionValue<number>; y: MotionValue<number> }[];
  y: number;
}) {
  const n = items.length;
  const step = spacing / Math.SQRT2;
  const ks = useMemo(() => items.map((_, i) => (-(n - 1) * spacing * 0.5 + i * spacing) / Math.SQRT2), [items, n, spacing]);
  const plate = usePlate("stage", [n * spacing + 2.8, 4.4, 1.0, 1.3], PLATE);
  const gaps = useRef<number[]>(items.map(() => REST_GAP));
  const units = useRef<(THREE.Group | null)[][]>([]);

  const loop = useMemo(() => {
    const v = (x: number, yy: number, z: number) => new THREE.Vector3(x, yy, z);
    const ride = PLATE + 0.02 + CUBE / 2;
    const below = PLATE - CUBE - 0.2;
    const start = v(ks[0], ride, -ks[0] + step);
    const end = v(ks[n - 1] + step, ride, -ks[n - 1]);
    const route = new Route().start(v(start.x, below, start.z));
    route.to(start, 1.1, true);
    const surface = [start];
    ks.forEach((k, i) => {
      const centre = v(k, ride, -k);
      route.to(centre, 2.6);
      surface.push(centre);
      // up the shaft to the top of the tower (a live height), pause, back down
      route.to(v(k, ride + 1, -k), 1.4, true, `t${i}`, i);
      route.hold(0.7);
      route.to(centre, 1.4, true);
      const corner = i === n - 1 ? end : v(k + step, ride, -k);
      route.to(corner, 2.6);
      surface.push(corner);
    });
    route.to(v(end.x, below, end.z), 1.1, true);
    route.to(v(start.x, below, start.z), 9); // under the plate, out of sight
    return { keys: route.keys, cycle: route.cycle, surface, start, end };
  }, [ks, n, step]);

  const line = useMemo(() => loop.surface.map((p) => new THREE.Vector3(p.x, PLATE + 0.012, p.z)), [loop]);

  useFrame((_, delta) => {
    items.forEach((_, i) => {
      gaps.current[i] = THREE.MathUtils.damp(gaps.current[i], active === i ? OPEN_GAP : REST_GAP, 7, delta);
      units.current[i]?.forEach((group, j) => {
        if (group) group.position.y = PLATE + j * (U.h + gaps.current[i]);
      });
    });
  });

  const heights = (i: number) => PLATE + towerTop(items[i].units, gaps.current[i]) + ABOVE;

  return (
    <group position={[0, y, 0]}>
      <Solid geometry={plate} rotation={[0, Math.PI / 4, 0]} family="sand" />
      <Dashed points={line} />
      <Hole size={CUBE + 0.18} position={[loop.start.x, PLATE + 0.001, loop.start.z]} />
      <Hole size={CUBE + 0.18} position={[loop.end.x, PLATE + 0.001, loop.end.z]} />
      {items.map((item, i) => {
        const on = active === i;
        return (
          <group key={item.label} position={[ks[i], 0, -ks[i]]}>
            {Array.from({ length: item.units }, (_, j) => {
              const top = j === item.units - 1;
              return (
                <group
                  key={j}
                  ref={(g) => {
                    units.current[i] = units.current[i] ?? [];
                    units.current[i][j] = g;
                  }}
                  position={[0, PLATE + j * (U.h + REST_GAP), 0]}
                >
                  <TunnelDevice
                    w={U.w}
                    h={U.h}
                    lid={U.lid}
                    channel={U.channel}
                    shaft={U.shaft}
                    sides={j === 0 ? ["+z", "+x"] : []}
                    family={top && (item.accent || on) ? "accent" : "paper"}
                    on={on}
                    vent={false}
                  />
                  {top && <Pin {...pins[i]} position={[0, U.h + 0.35, 0]} />}
                </group>
              );
            })}
          </group>
        );
      })}
      <Packet keys={loop.keys} cycle={loop.cycle} size={CUBE} family={packet} clipBelow={y + PLATE} heights={heights} />
    </group>
  );
}

function usePins(count: number) {
  const a = [useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999)];
  const b = [useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999), useMotionValue(-999)];
  return Array.from({ length: count }, (_, i) => ({ x: a[i], y: b[i] }));
}

/** A line of towers with pinned labels. */
function RackLine({
  items,
  active = null,
  spacing = 3.6,
  span = 15,
  y = -1.6,
  packet = "accent",
  className,
}: {
  items: RackItem[];
  active?: number | null;
  spacing?: number;
  span?: number;
  y?: number;
  packet?: Family;
  className?: string;
}) {
  const pins = usePins(items.length);
  return (
    <Stage
      className={className}
      span={span}
      overlay={items.map((item, i) => (
        <motion.div key={item.label} style={{ x: pins[i].x, y: pins[i].y }} className="pointer-events-none absolute left-0 top-0">
          <span
            className={cn(
              "block -translate-x-1/2 -translate-y-full whitespace-nowrap border px-2 py-0.5 text-[12px] font-medium transition-colors",
              active === i || (active === null && item.accent) ? "border-ink bg-inverse text-inverse-fg" : "border-line-strong bg-page text-ink",
            )}
          >
            {item.label}
          </span>
        </motion.div>
      ))}
    >
      <RackInner items={items} spacing={spacing} active={active} packet={packet} pins={pins} y={y} />
    </Stage>
  );
}

/** Pricing: one tower per plan; the plan you point at lifts apart. */
export function PlansScene({ plans, active, className, span = 14.5 }: { plans: { name: string; blocks: number; featured?: boolean }[]; active: number | null; className?: string; span?: number }) {
  const items = useMemo(() => plans.map((plan) => ({ label: plan.name, units: plan.blocks, accent: plan.featured })), [plans]);
  return <RackLine items={items} active={active} spacing={3.7} span={span} y={-2.1} className={className} />;
}

/** Status: one rack per region, pinged in turn by a heartbeat. */
export function StatusScene({ regions, className, span = 14 }: { regions: string[]; className?: string; span?: number }) {
  const items = useMemo(() => regions.map((label, i) => ({ label, units: [3, 2, 2, 3][i % 4] })), [regions]);
  return <RackLine items={items} spacing={3.5} span={span} y={-1.3} packet="green" className={className} />;
}

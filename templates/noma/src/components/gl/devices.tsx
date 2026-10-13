"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Dashed, Solid, Stage, useBox, useKit, usePlate } from "./kit";
import { useRing, useTunnelBox, type Side } from "./holes";
import { Decal, Floor, Leds, paintLabel, paintLid, paintVent } from "./parts";

/*
 * Hero: a small rack of devices on a desk grid, with your Postgres in the
 * middle. Every device has doorways on the sides the route uses and a shaft
 * through its lid, so the packet travels a closed loop: along the floor, in
 * through a doorway, up the shaft to pause on the lid, down again and out the
 * other side. It never pops in or out of view.
 */

export type HeroStep = "ask" | "draft" | "approve" | "run" | "answer";

const S = 3.45; // grid cell; one device per cell
const BOX = { w: S, h: 1.2, lid: 0.45, channel: 0.95, shaft: 0.34 };
const HUB = { w: 2.9, h: 1.0, lid: 0.35, r: 1.02, ring: 0.38, gap: 0.06 };
const HUB_TOP = HUB.h + 3 * HUB.ring + 2 * HUB.gap;
const CUBE = 0.4;
const FLOOR_Y = CUBE / 2 + 0.02; // packet centre while it rides the floor
const ABOVE = CUBE / 2 + 0.12; // how far the packet clears a lid when it pauses

type XZ = [number, number];

const DEVICES: { id: HeroStep; n: string; title: string; at: XZ; sides: Side[] }[] = [
  { id: "ask", n: "01", title: "Ask", at: [-S, S], sides: ["+x", "-z"] },
  { id: "draft", n: "02", title: "Draft", at: [-S, -S], sides: ["+z", "+x"] },
  { id: "approve", n: "03", title: "Approve", at: [S, -S], sides: ["-x", "+z"] },
  { id: "answer", n: "05", title: "Answer", at: [S, S], sides: ["-z", "-x"] },
];

/* ------------------------------------------------------------------------ */
/* The loop                                                                 */
/* ------------------------------------------------------------------------ */

const FLOOR_SPEED = 3.2;
const SHAFT_SPEED = 1.5;
const DWELL = 1.1;

type Key = { p: THREE.Vector3; t: number; ease: boolean; step?: HeroStep };

function buildLoop() {
  const keys: Key[] = [];
  let t = 0;
  const floor = (x: number, z: number) => new THREE.Vector3(x, FLOOR_Y, z);
  const go = (p: THREE.Vector3, speed: number, ease: boolean, step?: HeroStep) => {
    const last = keys[keys.length - 1];
    if (last) t += last.p.distanceTo(p) / speed;
    keys.push({ p, t, ease, step });
  };
  const hold = () => {
    const last = keys[keys.length - 1];
    t += DWELL;
    keys.push({ p: last.p.clone(), t, ease: false });
  };
  /** Up the shaft, pause above the lid, back down. */
  const visit = (x: number, z: number, top: number, step: HeroStep) => {
    keys[keys.length - 1].step = step;
    go(new THREE.Vector3(x, top + ABOVE, z), SHAFT_SPEED, true);
    hold();
    go(floor(x, z), SHAFT_SPEED, true);
  };

  go(floor(-S, S), FLOOR_SPEED, false);
  visit(-S, S, BOX.h, "ask");
  go(floor(-S, -S), FLOOR_SPEED, false);
  visit(-S, -S, BOX.h, "draft");
  go(floor(S, -S), FLOOR_SPEED, false);
  visit(S, -S, BOX.h, "approve");
  go(floor(S, 0), FLOOR_SPEED, false);
  go(floor(0, 0), FLOOR_SPEED, false);
  visit(0, 0, HUB_TOP, "run");
  go(floor(S, 0), FLOOR_SPEED, false);
  go(floor(S, S), FLOOR_SPEED, false);
  visit(S, S, BOX.h, "answer");
  go(floor(-S, S), FLOOR_SPEED, false); // back into Ask: the loop closes
  return { keys, cycle: t };
}

const LOOP = buildLoop();

const smooth = (k: number) => k * k * (3 - 2 * k);

/** Where the packet is at time `time`, and the step it belongs to. */
function packetAt(time: number, out: THREE.Vector3) {
  const { keys, cycle } = LOOP;
  const t = time % cycle;
  let step: HeroStep = "answer";
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i].step) step = keys[i].step!;
    const a = keys[i];
    const b = keys[i + 1];
    if (t > b.t) continue;
    const k = b.t > a.t ? (t - a.t) / (b.t - a.t) : 1;
    out.copy(a.p).lerp(b.p, b.ease || a.ease ? smooth(k) : k);
    return step;
  }
  out.copy(keys[keys.length - 1].p);
  return step;
}

/* ------------------------------------------------------------------------ */
/* Pieces                                                                   */
/* ------------------------------------------------------------------------ */

function Device({ device, on }: { device: (typeof DEVICES)[number]; on: boolean }) {
  const { body, lid } = useTunnelBox(BOX.w, BOX.h, BOX.lid, BOX.channel, device.sides, BOX.shaft);
  const [x, z] = device.at;
  const a = BOX.w / 2;
  const band = BOX.h - BOX.lid / 2; // the lid band, above the doorways
  return (
    <group position={[x, 0, z]}>
      <Solid geometry={body} family="paper" />
      <Solid geometry={lid} family="paper" />
      <Decal w={BOX.w} h={BOX.w} paint={paintLid} data={{ on, hole: BOX.shaft }} position={[0, BOX.h + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      <Decal w={2.3} h={0.42} paint={paintLabel} data={{ n: device.n, title: device.title, on, size: 0.31 }} position={[-a + 0.25 + 1.15, band, a + 0.003]} />
      <Decal w={0.75} h={0.42} paint={paintVent} data={null} position={[a - 0.55, 0.36, a + 0.003]} />
      <Leds on={on} position={[a + 0.02, band, a - 0.42]} />
    </group>
  );
}

function Hub({ on }: { on: boolean }) {
  const { body, lid } = useTunnelBox(HUB.w, HUB.h, HUB.lid, BOX.channel, ["+x"], BOX.shaft);
  const ring = useRing(HUB.r, BOX.shaft, HUB.ring, 56);
  const a = HUB.w / 2;
  return (
    <group>
      <Solid geometry={body} family="sand" />
      <Solid geometry={lid} family="sand" />
      <Decal w={2.3} h={0.32} paint={paintLabel} data={{ n: "04", title: "Postgres", on, size: 0.25 }} position={[-a + 0.22 + 1.15, HUB.h - HUB.lid / 2, a + 0.003]} />
      <Leds on={on} position={[a + 0.02, HUB.h - HUB.lid / 2, a - 0.38]} />
      {[0, 1, 2].map((i) => (
        <Solid key={i} geometry={ring} position={[0, HUB.h + i * (HUB.ring + HUB.gap), 0]} family={on ? "blue" : "paper"} threshold={30} />
      ))}
    </group>
  );
}

/** The dashed route on the floor, running into each doorway, with arrows on the straights. */
function Route() {
  const y = 0.015;
  const lines = useMemo(
    () =>
      [
        [
          [-S, S],
          [-S, -S],
        ],
        [
          [-S, -S],
          [S, -S],
        ],
        [
          [S, -S],
          [S, S],
        ],
        [
          [S, 0],
          [0, 0],
        ],
        [
          [S, S],
          [-S, S],
        ],
      ].map((pair) => pair.map(([x, z]) => new THREE.Vector3(x, y, z))),
    [],
  );
  const chevron = usePlate("chevron", [0.62, 0.2], 0.05);
  const marks: [number, number, number][] = [
    [-S, 0, Math.PI / 2],
    [0, -S, 0],
    [S, -S / 2, -Math.PI / 2],
    [S, S / 2 + 0.3, -Math.PI / 2],
    [0, S, Math.PI],
  ];
  return (
    <group>
      {lines.map((points, i) => (
        <Dashed key={i} points={points} />
      ))}
      {marks.map(([x, z, r]) => (
        <Solid key={`${x}:${z}`} geometry={chevron} position={[x, 0.02, z]} rotation={[0, r, 0]} family="sand" edges={false} />
      ))}
    </group>
  );
}

const scratch = new THREE.Vector3();

/** The packet. It only ever moves along the loop. */
function Packet({ onStep }: { onStep: (step: HeroStep) => void }) {
  const mesh = useRef<THREE.Mesh>(null);
  const cube = useBox(CUBE, CUBE, CUBE);
  const last = useRef<HeroStep | "">("");
  const { reduced } = useKit();
  useFrame(({ clock }) => {
    const step = packetAt(reduced ? LOOP.keys[2].t : clock.elapsedTime, scratch);
    if (mesh.current) {
      mesh.current.position.set(scratch.x, scratch.y - CUBE / 2, scratch.z);
      mesh.current.rotation.y = reduced ? 0 : clock.elapsedTime * 0.9;
    }
    if (step !== last.current) {
      last.current = step;
      onStep(step);
    }
  });
  return <Solid ref={mesh} geometry={cube} family="accent" />;
}

/** The hero rack. `onStep` reports the step the packet is on. */
export function HeroScene({ className, onStep, span = 15.5 }: { className?: string; onStep?: (step: HeroStep) => void; span?: number }) {
  const [step, setStep] = useState<HeroStep>("ask");
  useEffect(() => {
    onStep?.(step);
  }, [step, onStep]);
  return (
    <Stage className={className} span={span} lift={0.5}>
      <Floor />
      <Route />
      <Hub on={step === "run"} />
      {DEVICES.map((device) => (
        <Device key={device.id} device={device} on={step === device.id} />
      ))}
      <Packet onStep={setStep} />
    </Stage>
  );
}

"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Dashed, Solid, Stage, useBox, useKit, usePlate, type Family } from "./kit";
import { DatabaseStack, Floor, Packet, Route, TunnelDevice, stackTop } from "./parts";

/*
 * Two small flows built from the same parts as the hero: boxes with real
 * doorways and shafts, and packets that only ever ride their route.
 */

const CUBE = 0.38;
const RIDE = CUBE / 2 + 0.02;
const ABOVE = CUBE / 2 + 0.12;
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Floor arrows on the straights. */
function Arrows({ marks }: { marks: [number, number, number][] }) {
  const chevron = usePlate("chevron", [0.56, 0.18], 0.05);
  return (
    <>
      {marks.map(([x, z, r]) => (
        <Solid key={`${x}:${z}`} geometry={chevron} position={[x, 0.02, z]} rotation={[0, r, 0]} family="sand" edges={false} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Connect: your Postgres and Noma                                          */
/* ------------------------------------------------------------------------ */

const C = { pg: -2.7, noma: 2.7, lane: 2.05, box: { w: 2.6, h: 1.15, lid: 0.42 } };

/** Two packets on one loop: out of Noma into your Postgres, up through the rings, back along the front lane, up through Noma. */
export function ConnectScene({ className, span = 12, packet = "accent" }: { className?: string; span?: number; packet?: Family }) {
  const loop = useMemo(() => {
    const top = stackTop(0.95, 3);
    const r = new Route().start(v(C.noma, RIDE, 0));
    r.to(v(C.pg, RIDE, 0), 2.6);
    r.to(v(C.pg, top + ABOVE, 0), 1.4, true)
      .hold(0.8)
      .to(v(C.pg, RIDE, 0), 1.4, true);
    r.to(v(C.pg, RIDE, C.lane), 2.6);
    r.to(v(C.noma, RIDE, C.lane), 2.6);
    r.to(v(C.noma, RIDE, 0), 2.6);
    r.to(v(C.noma, C.box.h + ABOVE, 0), 1.4, true)
      .hold(0.8)
      .to(v(C.noma, RIDE, 0), 1.4, true);
    return { keys: r.keys, cycle: r.cycle };
  }, []);
  const lines = useMemo(
    () => [
      [v(C.noma, 0.015, 0), v(C.pg, 0.015, 0)],
      [v(C.pg, 0.015, 0), v(C.pg, 0.015, C.lane), v(C.noma, 0.015, C.lane), v(C.noma, 0.015, 0)],
    ],
    [],
  );
  return (
    <Stage className={className} span={span} lift={0.4}>
      <group position={[0, -0.5, -0.6]}>
        <Floor cell={1.3} inner={1.8} outer={4.8} />
        {lines.map((points, i) => (
          <Dashed key={i} points={points} />
        ))}
        <Arrows
          marks={[
            [0, 0, Math.PI],
            [0, C.lane, 0],
          ]}
        />
        <DatabaseStack sides={["+x", "+z"]} position={[C.pg, 0, 0]} h={0.95} title="Your Postgres" w={2.6} radius={0.95} />
        <TunnelDevice w={C.box.w} h={C.box.h} lid={C.box.lid} sides={["-x", "+z"]} title="Noma" position={[C.noma, 0, 0]} />
        <Packet keys={loop.keys} cycle={loop.cycle} size={CUBE} family={packet} />
        <Packet keys={loop.keys} cycle={loop.cycle} size={CUBE} family={packet} phase={loop.cycle / 2} />
      </group>
    </Stage>
  );
}

/* ------------------------------------------------------------------------ */
/* Review gate: reads pass, writes wait                                     */
/* ------------------------------------------------------------------------ */

const GATE = { noma: 4.3, pg: -4.3, lane: 2.2, w: 2.4, h: 1.25, lid: 0.45, channel: 0.95 };
const DOOR_X = GATE.w / 2 + 0.05; // just outside the gate's front-right face
const STOP_X = DOOR_X + 0.5; // where a write waits
const WAIT = 2.2; // how long a write waits for its approval
const SPEED = 2.6;

function gateRoutes() {
  const pgTop = stackTop(0.95, 3);
  const build = (write: boolean, pad: number) => {
    const r = new Route().start(v(GATE.noma, RIDE, 0));
    let approvedAt = 0;
    if (write) {
      r.to(v(STOP_X, RIDE, 0), SPEED);
      r.hold(WAIT);
      approvedAt = r.cycle;
    }
    const crossAt = r.cycle + (write ? STOP_X - DOOR_X : GATE.noma - DOOR_X) / SPEED;
    r.to(v(GATE.pg, RIDE, 0), SPEED);
    r.to(v(GATE.pg, pgTop + ABOVE, 0), 1.4, true)
      .hold(0.8)
      .to(v(GATE.pg, RIDE, 0), 1.4, true);
    r.to(v(GATE.pg, RIDE, GATE.lane), SPEED);
    r.to(v(GATE.noma, RIDE, GATE.lane), SPEED);
    r.to(v(GATE.noma, RIDE, 0), SPEED);
    r.to(v(GATE.noma, GATE.h + ABOVE, 0), 1.4, true)
      .hold(0.8 + pad)
      .to(v(GATE.noma, RIDE, 0), 1.4, true);
    return { keys: r.keys, cycle: r.cycle, crossAt, approvedAt };
  };
  const write = build(true, 0);
  const plain = build(false, 0);
  const read = build(false, write.cycle - plain.cycle); // same cycle, the extra time spent above Noma
  const cycle = write.cycle;
  // Put the read half a cycle away from the write at the door.
  const readPhase = read.crossAt - (write.crossAt + cycle / 2);
  return { write, read, cycle, readPhase };
}

const inWindow = (t: number, at: number, before: number, after: number, cycle: number) => {
  const d = ((((t - at) % cycle) + cycle * 1.5) % cycle) - cycle / 2;
  return d > -before && d < after;
};

function GateWorks() {
  const routes = useMemo(() => gateRoutes(), []);
  const door = useRef<THREE.Mesh>(null);
  const lamp = useRef<THREE.Mesh>(null);
  const doorGeometry = useBox(GATE.channel + 0.12, GATE.h - GATE.lid, 0.08);
  const lampGeometry = useBox(0.34, 0.14, 0.34);
  const { material, reduced } = useKit();
  const tunnel = GATE.h - GATE.lid;
  useFrame(({ clock }, delta) => {
    const t = reduced ? routes.write.approvedAt - 0.5 : clock.elapsedTime % routes.cycle;
    const { write, cycle, readPhase } = routes;
    // Reads: the door drops as one arrives. Writes: only once approved.
    const readCross = (((routes.read.crossAt - readPhase) % cycle) + cycle) % cycle;
    const open = inWindow(t, readCross, 0.7, 0.45, cycle) || inWindow(t, write.approvedAt, 0.25, 0.6, cycle);
    const waiting = inWindow(t, write.approvedAt, WAIT - 0.1, 0, cycle);
    const approved = inWindow(t, write.approvedAt, 0.05, 1.2, cycle);
    if (door.current) door.current.position.y = THREE.MathUtils.damp(door.current.position.y, open ? -tunnel - 0.05 : 0, 14, delta);
    if (lamp.current) {
      const blink = Math.floor(clock.elapsedTime * 3) % 2 === 0;
      lamp.current.material = approved ? material("green") : waiting && blink ? material("accent") : material("sand");
    }
  });
  return (
    <>
      <Solid ref={door} geometry={doorGeometry} position={[DOOR_X, 0, 0]} rotation={[0, Math.PI / 2, 0]} family="ink" clipBelow={-0.5} />
      <Solid ref={lamp} geometry={lampGeometry} position={[0, GATE.h, 0]} />
      <Packet keys={routes.write.keys} cycle={routes.cycle} size={CUBE} family="accent" />
      <Packet keys={routes.read.keys} cycle={routes.cycle} size={CUBE} family="blue" phase={routes.readPhase} />
    </>
  );
}

/** Security: a blue read runs straight through the gate; an orange write waits at the door until it is approved. */
export function GateScene({ className, span = 12.6 }: { className?: string; span?: number }) {
  const lines = useMemo(
    () => [
      [v(GATE.noma, 0.015, 0), v(GATE.pg, 0.015, 0)],
      [v(GATE.pg, 0.015, 0), v(GATE.pg, 0.015, GATE.lane), v(GATE.noma, 0.015, GATE.lane), v(GATE.noma, 0.015, 0)],
    ],
    [],
  );
  const slot = useBox(0.12, 0.012, GATE.channel + 0.2);
  return (
    <Stage className={className} span={span} lift={0.5}>
      <group position={[0, -0.5, -0.7]}>
        <Floor cell={1.2} inner={2.4} outer={5.6} />
        {lines.map((points, i) => (
          <Dashed key={i} points={points} />
        ))}
        <Arrows
          marks={[
            [2.95, 0, Math.PI],
            [-2.95, 0, Math.PI],
            [0, GATE.lane, 0],
          ]}
        />
        <DatabaseStack sides={["+x", "+z"]} position={[GATE.pg, 0, 0]} h={0.95} w={2.6} radius={0.95} title="Your Postgres" />
        <TunnelDevice w={GATE.w} h={GATE.h} lid={GATE.lid} channel={GATE.channel} shaft={0} sides={["+x", "-x"]} title="Review gate" labelSize={0.27} />
        <TunnelDevice w={2.6} h={1.15} lid={0.42} sides={["-x", "+z"]} title="Noma" position={[GATE.noma, 0, 0]} />
        <Solid geometry={slot} position={[DOOR_X, 0.001, 0]} family="void" />
        <GateWorks />
      </group>
    </Stage>
  );
}

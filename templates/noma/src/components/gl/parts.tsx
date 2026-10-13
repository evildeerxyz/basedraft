"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Solid, useBox, useKit, type Family } from "./kit";
import { useRing, useTunnelBox, type Side } from "./holes";
import { PPU, UI, dot, rect, resolveFonts, text, useFontsReady, type G, type Painter, type Pal } from "./paint";

/*
 * Shared parts for the isometric scenes: printed decals, status lights, the
 * desk grid, tunnel devices and a database stack, plus a path follower so
 * anything that moves rides a fixed route and never jumps.
 */

/* ------------------------------------------------------------------------ */
/* Printed surfaces                                                         */
/* ------------------------------------------------------------------------ */

/** A transparent plane with a painted texture, laid onto a face. */
export function Decal<D>({
  w,
  h,
  paint,
  data,
  position,
  rotation = [0, 0, 0],
}: {
  w: number;
  h: number;
  paint: Painter<D>;
  data: D;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { theme } = useKit();
  const gl = useThree((state) => state.gl);
  const fontsReady = useFontsReady();
  const geometry = useMemo(() => new THREE.PlaneGeometry(w, h), [w, h]);
  const surface = useMemo(() => {
    const canvas = document.createElement("canvas");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    return {
      material,
      draw(fn: (g: G) => void, width: number, height: number, pal: G["pal"]) {
        canvas.width = Math.round(width * 128);
        canvas.height = Math.round(height * 128);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        fn({ ctx, pal, ...resolveFonts() });
        texture.needsUpdate = true;
      },
      dispose() {
        texture.dispose();
        material.dispose();
      },
    };
  }, [gl]);
  useEffect(() => () => surface.dispose(), [surface]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const key = JSON.stringify(data);
  useEffect(() => {
    surface.draw((g) => paint(g, w, h, JSON.parse(key) as D), w, h, UI[theme]);
  }, [surface, paint, key, w, h, theme, fontsReady]);
  return <mesh geometry={geometry} material={surface.material} position={position} rotation={rotation} />;
}

/** Lid: four screws, and a ring around the shaft that lights while the device works. */
export const paintLid: Painter<{ on: boolean; hole: number }> = (g, w, d, { on, hole }) => {
  const { pal, ctx } = g;
  const inset = Math.min(0.24, w * 0.08);
  [
    [inset, inset],
    [w - inset, inset],
    [inset, d - inset],
    [w - inset, d - inset],
  ].forEach(([x, y]) => dot(g, x, y, 0.05, pal.ink4));
  if (hole <= 0) return;
  ctx.strokeStyle = on ? pal.accent : pal.lineStrong;
  ctx.lineWidth = 0.035 * 128;
  ctx.beginPath();
  ctx.arc((w / 2) * 128, (d / 2) * 128, (hole + 0.08) * 128, 0, Math.PI * 2);
  ctx.stroke();
  if (on) {
    ctx.lineWidth = 0.025 * 128;
    ctx.setLineDash([0.07 * 128, 0.07 * 128]);
    ctx.beginPath();
    ctx.arc((w / 2) * 128, (d / 2) * 128, (hole + 0.3) * 128, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
};

/** A slab whose top face is painted UI and whose sides are dithered like the rest of the scene. */
export function UiSlab<D>({ w, d, h, family = "paper", paint, data, position }: { w: number; d: number; h: number; family?: Family; paint: Painter<D>; data: D; position: [number, number, number] }) {
  const { material, edge, theme } = useKit();
  const gl = useThree((state) => state.gl);
  const geometry = useBox(w, h, d);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 20), [geometry]);
  const fontsReady = useFontsReady();
  const surface = useMemo(() => {
    const canvas = document.createElement("canvas");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = gl.capabilities.getMaxAnisotropy();
    const top = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    return {
      top,
      draw(fn: (g: G) => void, width: number, depth: number, pal: Pal) {
        canvas.width = Math.round(width * PPU);
        canvas.height = Math.round(depth * PPU);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        fn({ ctx, pal, ...resolveFonts() });
        texture.needsUpdate = true;
      },
      dispose() {
        texture.dispose();
        top.dispose();
      },
    };
  }, [gl]);
  useEffect(() => () => surface.dispose(), [surface]);
  useEffect(() => () => edges.dispose(), [edges]);

  const key = JSON.stringify(data);
  useEffect(() => {
    surface.draw((g) => paint(g, w, d, JSON.parse(key) as D), w, d, UI[theme]);
  }, [surface, paint, key, w, d, theme, fontsReady]);

  const side = material(family);
  const materials = useMemo(() => [side, side, surface.top, side, side, side], [side, surface]);
  return (
    <mesh geometry={geometry} material={materials} position={position}>
      <lineSegments geometry={edges} material={edge} />
    </mesh>
  );
}

/** A printed name: a mono number (optional) and a title. */
export const paintLabel: Painter<{ n?: string; title: string; on: boolean; size: number }> = (g, _w, h, { n, title, on, size }) => {
  if (n) text(g, n, 0.04, h / 2, size * 0.78, on ? g.pal.accent : g.pal.ink3, { mono: true });
  text(g, title, n ? 0.04 + size * 1.55 : 0.04, h / 2, size, g.pal.ink, { weight: 550 });
};

export const paintVent: Painter<null> = (g, _w, h) => {
  for (let i = 0; i < 5; i++) rect(g, 0.06 + i * 0.13, 0.04, 0.035, h - 0.08, g.pal.ink4);
};

/* ------------------------------------------------------------------------ */
/* Pieces                                                                   */
/* ------------------------------------------------------------------------ */

/** Status lights on a +x face, running along -z. Power is always on; the rest chase while `on`. */
export function Leds({ on, position, count = 4, power = "green" }: { on: boolean; position: [number, number, number]; count?: number; power?: Family }) {
  const led = useBox(0.05, 0.12, 0.12);
  const { material } = useKit();
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const lit = Math.floor(clock.elapsedTime * 8) % Math.max(1, count - 1);
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.material = i === 0 ? material(power) : on && i - 1 <= lit ? material("accent") : material("sand");
    });
  });
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <Solid key={i} ref={(m) => void (refs.current[i] = m)} geometry={led} position={[0, 0, -i * 0.22]} edges={false} />
      ))}
    </group>
  );
}

/** A box with doorways on `sides`, a shaft through its lid, a printed name and status lights. */
export function TunnelDevice({
  w,
  h,
  lid,
  channel = 0.95,
  shaft = 0.34,
  sides,
  n,
  title,
  on = false,
  family = "paper",
  labelSize = 0.3,
  vent = true,
  position = [0, 0, 0],
}: {
  w: number;
  h: number;
  lid: number;
  channel?: number;
  shaft?: number;
  sides: Side[];
  n?: string;
  title?: string;
  on?: boolean;
  family?: Family;
  labelSize?: number;
  vent?: boolean;
  position?: [number, number, number];
}) {
  const { body, lid: top } = useTunnelBox(w, h, lid, channel, sides, shaft);
  const a = w / 2;
  const band = h - lid / 2;
  return (
    <group position={position}>
      <Solid geometry={body} family={family} />
      <Solid geometry={top} family={family} />
      <Decal w={w} h={w} paint={paintLid} data={{ on, hole: shaft }} position={[0, h + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} />
      {title && (
        <Decal
          w={Math.min(2.4, w - 0.4)}
          h={Math.min(0.44, lid * 0.95)}
          paint={paintLabel}
          data={{ n, title, on, size: labelSize }}
          position={[-a + 0.22 + Math.min(2.4, w - 0.4) / 2, band, a + 0.003]}
        />
      )}
      {vent && h > 0.9 && <Decal w={0.75} h={0.42} paint={paintVent} data={null} position={[a - 0.55, 0.36, a + 0.003]} />}
      {lid > 0.25 && <Leds on={on} position={[a + 0.02, band, a - 0.42]} count={w > 2.6 ? 4 : 3} />}
    </group>
  );
}

/** Your Postgres: a plinth with doorways and a stack of rings, shaft straight through. */
export function DatabaseStack({
  sides,
  on = false,
  w = 2.9,
  h = 1.0,
  lid = 0.35,
  radius = 1.02,
  rings = 3,
  title = "Postgres",
  n,
  position = [0, 0, 0],
}: {
  sides: Side[];
  on?: boolean;
  w?: number;
  h?: number;
  lid?: number;
  radius?: number;
  rings?: number;
  title?: string;
  n?: string;
  position?: [number, number, number];
}) {
  const { body, lid: top } = useTunnelBox(w, h, lid, 0.95, sides, 0.34);
  const ring = useRing(radius, 0.34, 0.38, 56);
  const a = w / 2;
  return (
    <group position={position}>
      <Solid geometry={body} family="sand" />
      <Solid geometry={top} family="sand" />
      <Decal w={2.3} h={0.32} paint={paintLabel} data={{ n, title, on, size: 0.25 }} position={[-a + 0.22 + 1.15, h - lid / 2, a + 0.003]} />
      <Leds on={on} position={[a + 0.02, h - lid / 2, a - 0.38]} count={3} />
      {Array.from({ length: rings }, (_, i) => (
        <Solid key={i} geometry={ring} position={[0, h + i * 0.44, 0]} family={on ? "blue" : "paper"} threshold={30} />
      ))}
    </group>
  );
}

/** Height of a DatabaseStack's top ring. */
export const stackTop = (h = 1.0, rings = 3) => h + rings * 0.38 + (rings - 1) * 0.06;

/** A dark square hole in a surface, the mouth of a tunnel. */
export function Hole({ size, position }: { size: number; position: [number, number, number] }) {
  const hole = useBox(size, 0.012, size);
  return <Solid geometry={hole} position={position} family="void" />;
}

/** Faint desk grid that fades out well inside the frame. */
export function Floor({ cell = 1.725, inner = 2.5, outer = 7.2 }: { cell?: number; inner?: number; outer?: number }) {
  const { theme } = useKit();
  const material = useMemo(() => {
    const size = 30;
    const ppu = 40;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size * ppu;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = UI[theme].lineStrong;
      ctx.lineWidth = 1.5;
      for (let i = (size / 2) % cell; i <= size; i += cell) {
        ctx.beginPath();
        ctx.moveTo(i * ppu, 0);
        ctx.lineTo(i * ppu, size * ppu);
        ctx.moveTo(0, i * ppu);
        ctx.lineTo(size * ppu, i * ppu);
        ctx.stroke();
      }
      // fade the grid out from the middle (a mask, not a colour)
      ctx.globalCompositeOperation = "destination-in";
      const c = (size * ppu) / 2;
      const fade = ctx.createRadialGradient(c, c, inner * ppu, c, c, outer * ppu);
      fade.addColorStop(0, "rgba(0,0,0,0.9)");
      fade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, size * ppu, size * ppu);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false, depthWrite: false });
  }, [theme, cell, inner, outer]);
  useEffect(() => () => material.dispose(), [material]);
  const plane = useMemo(() => new THREE.PlaneGeometry(30, 30), []);
  return <mesh geometry={plane} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} />;
}

/* ------------------------------------------------------------------------ */
/* Paths                                                                    */
/* ------------------------------------------------------------------------ */

/** A route key. `lift` names a live height (see `sample`) that replaces p.y while the route runs. */
export type Key = { p: THREE.Vector3; t: number; ease: boolean; tag?: string; lift?: number };

/** Builds a keyframed route: straight runs at a speed, eased climbs, and holds. */
export class Route {
  keys: Key[] = [];
  private t = 0;
  start(p: THREE.Vector3, tag?: string) {
    this.keys.push({ p: p.clone(), t: 0, ease: false, tag });
    return this;
  }
  to(p: THREE.Vector3, speed: number, ease = false, tag?: string, lift?: number) {
    const last = this.keys[this.keys.length - 1];
    this.t += last.p.distanceTo(p) / speed;
    this.keys.push({ p: p.clone(), t: this.t, ease, tag, lift });
    return this;
  }
  hold(seconds: number, tag?: string) {
    const last = this.keys[this.keys.length - 1];
    this.t += seconds;
    this.keys.push({ p: last.p.clone(), t: this.t, ease: false, tag, lift: last.lift });
    return this;
  }
  /** Mark the most recent key so `sample` reports this tag from here on. */
  tag(tag: string) {
    this.keys[this.keys.length - 1].tag = tag;
    return this;
  }
  get cycle() {
    return this.t;
  }
}

const smooth = (k: number) => k * k * (3 - 2 * k);

const pa = new THREE.Vector3();
const pb = new THREE.Vector3();

/** Position on a route at time t (looping), and the latest tag passed. `heights` resolves keys with a `lift`. */
export function sample(keys: Key[], cycle: number, time: number, out: THREE.Vector3, heights?: (lift: number) => number) {
  const t = ((time % cycle) + cycle) % cycle;
  const at = (key: Key, v: THREE.Vector3) => {
    v.copy(key.p);
    if (key.lift !== undefined && heights) v.y = heights(key.lift);
    return v;
  };
  let tag = "";
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (a.tag) tag = a.tag;
    if (t > b.t) continue;
    const k = b.t > a.t ? (t - a.t) / (b.t - a.t) : 1;
    out.copy(at(a, pa)).lerp(at(b, pb), b.ease || a.ease ? smooth(k) : k);
    return tag;
  }
  at(keys[keys.length - 1], out);
  return tag;
}

/** The packet: a cube that rides `keys` forever, offset by `phase` seconds. */
export function Packet({
  keys,
  cycle,
  phase = 0,
  size = 0.4,
  family = "accent",
  clipBelow,
  onTag,
  heights,
  spin = true,
}: {
  keys: Key[];
  cycle: number;
  phase?: number;
  size?: number;
  family?: Family;
  clipBelow?: number;
  onTag?: (tag: string) => void;
  heights?: (lift: number) => number;
  spin?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const cube = useBox(size, size, size);
  const at = useMemo(() => new THREE.Vector3(), []);
  const last = useRef("");
  const { reduced } = useKit();
  useFrame(({ clock }) => {
    const tag = sample(keys, cycle, reduced ? phase + cycle * 0.12 : clock.elapsedTime + phase, at, heights);
    if (mesh.current) {
      mesh.current.position.set(at.x, at.y - size / 2, at.z);
      mesh.current.rotation.y = spin && !reduced ? clock.elapsedTime * 0.9 : 0;
    }
    if (onTag && tag !== last.current) {
      last.current = tag;
      onTag(tag);
    }
  });
  return <Solid ref={mesh} geometry={cube} family={family} clipBelow={clipBelow} />;
}

"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

/*
 * The Earth as dots on a canvas: the land drawn on an even grid, lit from the upper left, and
 * shaded the way the rest of basedraft is, by an ordered dither, so the night side thins out dot
 * by dot instead of fading. It turns slowly; drag it and it spins with your hand and coasts to a
 * stop. Markers pulse where they are, arcs rise between them with a light running along, and
 * choosing a marker turns the globe to face it. With dither off, the dots are round and fade.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const RAD = Math.PI / 180;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export type GlobeTone = "ink" | "ok" | "warn" | "stop";
export type GlobeMarker = {
  id: string;
  /** Latitude, -90 to 90. */
  lat: number;
  /** Longitude, -180 to 180. */
  lon: number;
  /** Its name, shown when it's pointed at or chosen. */
  label?: string;
  /** A second line under the name: a figure, a status. */
  detail?: string;
  tone?: GlobeTone;
};
/** A line between two markers, by their ids. */
export type GlobeArc = { from: string; to: string; tone?: GlobeTone };

/* ---------- Land ---------- */

/*
 * Where there's land, one bit per degree: 360 across from 180°W, 180 down from 90°N. Made from
 * Natural Earth's 1:50m land (public domain), so the coastlines are the real ones.
 */
const LAND_BITS =
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP//8AAb///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA///+h//////6fAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/gD/5////////gAAAAAAAAACwBgAAAAPgAAAAAAAAAAAAAAAAAAAAAAAAAAA///+Af//////+AAAABrvwAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAeHznn/w////////4AAAAB3sAAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAEcIA5M3AI///////4AAAAAPFAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAABoCGc+r+AH///////wAAAAAAAAAAAAAB4AAAAA/+AAAAAAAAAAAAAAAAAAAAAD/wPz78AAAP/////+AAAAAAAAAAAAD4AAAA////AAAB9oAAAAAAAAAAAAAACAwACAIAAAAD/////+AAAAAAAAAAAAOAAAAH///6AAAAAAAAAAAAAAAAAAAAP+AY8+M/gAAD////+4AAAAAAAAAAAA4AAGH///+O+HQAOAAAAAAAAAAAAAAAfv+4/Q944AAB////+wAAAAAAAAAAABgAHlH///////4AHwAAAAAwAAAAAAAAON/8EY//9AABf///7gAAAAAAAAAAABwAPZ+///////4nv/gAAAAAAAP8gAAAAAP+A8f//8AA3///ogAAAAAABvgAAAAAfv+////////////8AAAAAB///+BfWH/+CuBhf8AA3////AAAAAABf/wAAAA8Pv///////////////H8wAP////////Q8BOzwD+AAf///wAAAAAAF///wMBe/3+/////////////////+AD////////+//f34Y/wA///4AAAAAAAD///+I////P//////////////////4EP///////////5gD/8A///gAAAAAAAf//5+P///8//////////////////jw/////////////qAD+YAf/wAAv8AAAA/8f+D///////////////////////AwAf///////////zwx/gAH/wAAP8AAAB/4/+f//////////////////////4AMAf//////////+DAAbgAH/gAADAAAAN/z/////////////////////////+AAH///////////4AwgGQAD/AAAAAAAA//H///////////////////////n/6AAP///////////wAA/AAAB/AAAAAAAB/+D//////////////////////jP+AAAH/9z////////gAA/wAAAMAAAAAACB//D1////////////////////+A/YAAAA/wAD///////gAA/wQAAAAAAAAAAB9/Ab///////////////////+uDgAAAAAB0AAf//////4AA/94AAAAAAAAAYA5+C///////////////////4AAHAAAAAABcAAP//////4AAf/8AAAAAAAAB8AA+i///////////////////wAAfgAAAAAMAAAC///////wAf/8AAAAAAAAAYAOeH///////////////////AAA/gAAAAAAAAAC///////8Af//AAAAAAAAAcAPQH//////////////////8AAA/AAAAAEAAAAAP///////z///wAAAAAAADuAETv//////////////////+AAA+AAAAAAAAAABP///////x///8AAAAAAAPHAX/////////////////////4AA8AAAAAAAAAAAj///////x///8AAAAAAAPPx//////////////////////6AAwAAAAAAAAAAAD///////////6AAAAAAAAPj//////////////////////6AAwAAAAAAAAAAACf//////////EAAAAAAAAQP//////////////////////zAAAAAAAAAAAAAABv////////+MNAAAAAAAAC///////////////////////zAAAAAAAAAAAAAAAP////////7wPgAAAAAAAf///////////////////////yAAAAAAAAAAAAAAAL/////////gCgAAAAAAAD///////////////////////iAAAAAAAAAAAAAAAP/////////pAAAAAAAAAD/////vP/h//////////////BAAAAAAAAAAAAAAAP/////////+AAAAAAAAAB//v//GP/B/////////////+AAAAAAAAAAAAAAAAP////////8wAAAAAAAAAB//H/+AP+P/////////////8CAAAAAAAAAAAAAAAP////////wAAAAAAAAADj/jx/+AD/H/////////////4HgAAAAAAAAAAAAAAP////////gAAAAAAAAAH/4Fw/8AA/B////////////+ACAAAAAAAAAAAAAAAP////////gAAAAAAAAAH/wAcf8PB/g////////////8AAAAAAAAAAAAAAAAAP///////8AAAAAAAAAAH/gMHfB///x///////////v4AMAAAAAAAAAAAAAAAP///////8AAAAAAAAAAH/IMCOH///h//////////+ZwAMAAAAAAAAAAAAAAAH///////4AAAAAAAQAAH/AACHP///g//////////8BwAMAAAAAAAAAAAAAAAD///////wAAAAAAAAAAH+AAYCH///g//////////+wYAYAAAAAAAAAAAAAAAD///////wAAAAAAAAAAAgf+AABs//////////////gYD4AAAAAAAAAAAAAAAB///////wAAAAAAAAAAAh/+AAAA//////////////A4PwAAAAAAAAAAAAAAAB///////gAAAAAAAAAAB//8AAAA//////////////Ah2AAAAAAAAAAAAAAAAAP/////+AAAAAAAAAAAD//+AAAB//////////////gjwAAAAAAAAAAAAAAAAAH/////4AAAAAAAAAAAH///4OAB//////////////gBAAAAAAAAAAAAAAAAAAG/////4AAAAAAAAAAAP///8P4D//////////////gCAAAAAAAAAAAAAAAAAACf////4AAAAAAAAAAAP////v////////////////gAAAAAAAAAAAAAAAAAAABv//hAYAAAAAAAAAAAP//////3//H///////////wAAAAAAAAAAAAAAAAAAAAv/+AAYAAAAAAAAAAAf/////////H///////////wAAAAAAAAAAAAAAAAAAAB3/+AAcAAAAAAAAAAB///////8//h///////////gAAAAAAAAAAAAAAAAAAAAZ/+AAMAAAAAAAAAAD///////8//wH//////////AAAAAAAAAAAAAAAAAAAAAJ/+AAEAAAAAAAAAAH///////+f/wB/f////////AAAAAAAAAAAAAAAAAAAAAI/8AAAAAAAAAAAAAH///////+f/4YAf///////8QAAAAAAAAAAAAAAAAAAAACf8AAAAAAAAAAAAAP////////H//+AP///////4gAAAAAAAAAAAAAAAAAAAAAP8AAvAAAAAAAAAAP////////H///AD///////AgAAAAAAAAAAAAAAAAAAAAAH8AQBgAAAAAAAAAf////////n//+ADf/4P//IAAAAAAAAAAAAAAAAAAAAAAAP+A4AYAAAAAAAAAP////////j//+AAf/4H/+IAAAAAAAAAAAAAAAgAAAAAAAH/B4ABwAAAAAAAAP////////h//8AAf/gD/8YAAAAAAAAAAAAAAAAAAAAAAAD/lwAD8AAAAAAAAP////////x//4AAf/AD/8QAAAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAP////////4//gAAf+AB/+AAwAAAAAAAAAAAAAAAAAAAAAAH/wAAAAAAAAAAAP////////4f+AAAf8ADP/AAwAAAAAAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAf////////8f8AAAPwAAP/gAgAAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAf////////+fgAAAPwAAP/gAwAAAAAAAAAAAAAAAAAAAAAAAAfAAAAAAAAAAAf/////////eAAAAHwAAN/gAsAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAf/////////gBAAAHwAAE/gACAAAAAAAAAAAAAAAAAAAAAAAADABIAAAAAAAAH/////////gIAAADwAAEfgALAAAAAAAAAAAAAAAAAAAAAAAADgPfIAAAAAAAH/////////34AAADwAAIOABAAAAAAAAAAAAAAAAAAAAAAAAAAyPf+AAAAAAAD//////////4AAADoAAIEACBAAAAAAAAAAAAAAAAAAAAAAAAA8///AAAAAAAB//////////wAAABIAAMAAAHAAAAAAAAAAAAAAAAAAAAAAAAAE///gAAAAAAA//////////wAAAAMAAEAAADgAAAAAAAAAAAAAAAAAAAAAAAAAf//wAAAAAAAf/7///////gAAAAMAADAAMDAAAAAAAAAAAAAAAAAAAAAAAAAAf///gAAAAAAP/B///////gAAAAAABDgAeAAAAAAAAAAAAAAAAAAAAAAAAAAAf///wAAAAAACAAn//////AAAAAAAAxgA+AAAAAAAAAAAAAAAAAAAAAAAAAAAf///4AAAAAAAAAD/////+AAAAAAAAZgB4AAAAAAAAAAAAAAAAAAAAAAAAAAA////4AAAAAAAAAD/////8AAAAAAAAMwH8AIAAAAAAAAAAAAAAAAAAAAAAAAB////8AAAAAAAAAD/////wAAAAAAAAHQf8AIAAAAAAAAAAAAAAAAAAAAAAAAD////4AAAAAAAAAH/////gAAAAAAAAHgf8cIAAAAAAAAAAAAAAAAAAAAAAAAD/////AAAAAAAAAH/////AAAAAAAAADof8ASgAAAAAAAAAAAAAAAAAAAAAAAH////u4AAAAAAAAH/////AAAAAAAAABwP5wQwAAAAAAAAAAAAAAAAAAAAAAAH////94AAAAAAAAD////+AAAAAAAAAB+P5wAD4AAAAAAAAAAAAAAAAAAAAAAH//////4AAAAAAAB////8AAAAAAAAAA8ARQif/AAAAAAAAAAAAAAAAAAAAAAH//////8AAAAAAAA////4AAAAAAAAAAcAAAAD/gAAAAAAAAAAAAAAAAAAAAAH///////gAAAAAAA////4AAAAAAAAAAMABAAI/ywAAAAAAAAAAAAAAAAAAAAD///////gAAAAAAA////4AAAAAAAAAADgAAAIf8BAAAAAAAAAAAAAAAAAAAAD///////gAAAAAAAf///4AAAAAAAAAAB+AABA/4AAAAAAAAAAAAAAAAAAAAAB///////gAAAAAAAf///4AAAAAAAAAAAAfsgAOMAAAAAAAAAAAAAAAAAAAAAA///////AAAAAAAAf///8AAAAAAAAAAAABCAAAGgAAAAAAAAAAAAAAAAAAAAA///////AAAAAAAAP///8AAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAf/////+AAAAAAAAP///8AAAAAAAAAAAAAACgCAEAAAAAAAAAAAAAAAAAAAAAf/////8AAAAAAAAf///+AQAAAAAAAAAAAAB+CAAAAAAAQAAAAAAAAAAAAAAAP/////4AAAAAAAAf///+AwAAAAAAAAAAAAD8DAAAAAAAAAAAAAAAAAAAAAAAP/////4AAAAAAAA////+AwAAAAAAAAAAAAz8DgAAAAAAAAAAAAAAAAAAAAAAH/////4AAAAAAAA////+DwAAAAAAAAAAAD/8HgAAAAAAAAAAAAAAAAAAAAAAB/////4AAAAAAAA////8PwAAAAAAAAAAAH//XgAABABAAAAAgAAAAAAAAAAAAf////4AAAAAAAA////wPgAAAAAAAAAAAP//3wAAAAAAAAAAAAAAAAAAAAAAAP////wAAAAAAAA////gPgAAAAAAAAAAAP///wAAAAAAAAAAAAAAAAAAAAAAAP////wAAAAAAAAf//+APgAAAAAAAAAAAf///8AAAAAAAAAAAAAAAAAAAAAAAP////wAAAAAAAAf//+APgEAAAAAAAAAD////+AAIAAAAAAAAAAAAAAAAAAAAP////gAAAAAAAAP//+AfAAAAAAAAAAAf////+AAEAAAAAAAAAAAAAAAAAAAAP////AAAAAAAAAP///AfAAAAAAAAAAA//////AAAAAAAAAAAAAAAAAAAAAAAP///4AAAAAAAAAP//+APAAAAAAAAAAA//////gAAAAAAAAAAAAAAAAAAAAAAf///gAAAAAAAAAH//+AOAAAAAAAAAAB//////wAAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAAAH//4AEAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAAAH//4AAAAAAAAAAAAB//////4AAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//4AAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAAAD//wAAAAAAAAAAAAAf/////8AAAAAAAAAAAAAAAAAAAAAAf//8AAAAAAAAAAB//gAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///8AAAAAAAAAAB//gAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAA//AAAAAAAAAAAAAAP/////4AAAAAAAAAAAAAAAAAAAAAAf//wAAAAAAAAAAA/+AAAAAAAAAAAAAAP/AP//wAAAAAAAAAAAAAAAAAAAAAA//vgAAAAAAAAAAA/4AAAAAAAAAAAAAAP8AG//gAAAAAAAAAAAAAAAAAAAAAA//3AAAAAAAAAAAAQAAAAAAAAAAAAAAAOAAF//gAAAAAAAAAAAAAAAAAAAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//AAABAAAAAAAAAAAAAAAAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAgAAAAAAAAAAAAAAAAAD//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAQAAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAAAcAAAAAAAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAADQAAAAAAAAAAAAAAAAAB/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAHAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAOAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAP4AAAAAAD+HgBj/AAAAgAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAACf/gAAB//////////AAAAAAAAAAAAAAAAAAAAAAAABoAAAAAAAAAAAAAAAAB////8Af///////////gAAAAAAAAAAAAAAAAAAAAAB34AAAAAAAAAAAAAAAGD////4D/////////////8AAAAAAAAAAAAAAAAAAAAAb8AAAAAAAAAAAc/kB//////4f/////////////+gAAAAAAAAAAAAAAAAAAAB98AAAAAAAA7+///////////x////////////////4AAAAAAAAAAAAAAHAAAB5+AAAAAAAA/////////////n////////////////gAAAAAAAAABAAAAP/+Gl/+AAAAAAAP/////////////////////////////+AAAAAAAAAAiAfsAP/////+AAAAAAA//////////////////////////////oAAAAAAAAH////////////wAAAAAAF//////////////////////////////AAAAAAAAH////////////wAAAAAAf///////////////////////////////gAAAAAD+P///////////8AAAAAAP////////////////////////////////zgAAAAA////////////PgCAAD8A/////////////////////////////////+AAAAB4B////////////wwAAD+AA///////////////////////////////8AAAAAAAA////////////wA/A/gAH///////////////////////////////+AAAAABgf//////////////gAAA/////////////////////////////////+AAAAAAAH//////////////4D////////////////////////////////////4AAAB/X//////////////////////////////////////////////////////4A/gD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";

/* An ordered-dither matrix: each dot's place in it decides how much light it needs to show. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

let bits: Uint8Array | null = null;
const isLand = (lat: number, lon: number) => {
  if (!bits) bits = Uint8Array.from(atob(LAND_BITS), (c) => c.charCodeAt(0));
  const r = Math.min(179, Math.max(0, Math.floor(90 - lat)));
  const c = Math.min(359, Math.max(0, Math.floor(lon + 180)));
  const i = r * 360 + c;
  return (bits[i >> 3] & (1 << (7 - (i & 7)))) !== 0;
};

type Dots = { x: Float32Array; y: Float32Array; z: Float32Array; b: Uint8Array; n: number };
/** Points on an even grid over the sphere, as unit vectors with their dither value: every step degrees, on land (or off it). */
function grid(step: number, land: boolean): Dots {
  const out: number[][] = [];
  for (let r = 0, lat = -90 + step / 2; lat < 90; r++, lat += step) {
    const cols = Math.max(1, Math.round((360 * Math.cos(lat * RAD)) / step));
    for (let c = 0; c < cols; c++) {
      const lon = -180 + ((c + 0.5) * 360) / cols;
      if (isLand(lat, lon) !== land) continue;
      out.push([Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD), BAYER[(r % 4) * 4 + (c % 4)]]);
    }
  }
  return { x: new Float32Array(out.map((d) => d[0])), y: new Float32Array(out.map((d) => d[1])), z: new Float32Array(out.map((d) => d[2])), b: new Uint8Array(out.map((d) => d[3])), n: out.length };
}
let landDots: Dots | null = null;

const vec = (lat: number, lon: number): [number, number, number] => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];
const TONE_VAR: Record<GlobeTone, string> = { ink: "--bd-fg", ok: "--bd-ui-ok", warn: "--bd-ui-wait", stop: "--bd-ui-stop" };
/* Where the light comes from, in the view: up, left and in front. */
const LIGHT = (() => {
  const l = [-0.55, 0.6, 0.62];
  const m = Math.hypot(...l);
  return l.map((v) => v / m);
})();

export type GlobeProps = {
  markers?: GlobeMarker[];
  arcs?: GlobeArc[];
  /** The chosen marker's id: the globe turns to face it and shows its name. */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelect?: (marker: GlobeMarker | null) => void;
  /** Where it faces to start. */
  center?: { lat: number; lon: number };
  /** How fast it turns on its own, in degrees a second. 0 holds it still. */
  autoRotate?: number;
  /** Shades the land with an ordered dither of square dots; false draws round dots that fade. */
  dither?: boolean;
  /** What it shows, for screen readers. */
  label?: string;
  className?: string;
};

export function Globe({ markers = [], arcs = [], selected: selectedProp, defaultSelected = null, onSelect, center = { lat: 20, lon: 0 }, autoRotate = 6, dither = true, label = "Globe", className }: GlobeProps) {
  const [own, setOwn] = useState<string | null>(defaultSelected);
  const selected = selectedProp === undefined ? own : selectedProp;
  const [hover, setHover] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const id = useId();

  // Everything the frame loop reads, kept current without restarting it.
  const live = useRef({ markers, arcs, selected, hover, dither, autoRotate, still: !!still });
  useEffect(() => {
    live.current = { markers, arcs, selected, hover, dither, autoRotate, still: !!still };
  });
  // The view: where it faces, how it's moving, and where it's turning to.
  const view = useRef({ lat: center.lat, lon: center.lon, vLon: 0, vLat: 0, drag: null as null | { x: number; y: number; moved: number; t: number }, idleAt: 0, to: null as null | { lat: number; lon: number; fromLat: number; fromLon: number; t0: number } });

  const choose = (m: GlobeMarker | null) => {
    if (selectedProp === undefined) setOwn(m?.id ?? null);
    onSelect?.(m);
  };

  // Turning to face the chosen marker, the short way round.
  useEffect(() => {
    const m = markers.find((x) => x.id === selected);
    if (!m) return;
    const v = view.current;
    const dLon = ((((m.lon - v.lon) % 360) + 540) % 360) - 180;
    v.to = { lat: clamp(m.lat, -60, 60), lon: v.lon + dLon, fromLat: v.lat, fromLon: v.lon, t0: performance.now() };
    v.vLon = v.vLat = 0;
  }, [selected, markers]);

  useEffect(() => {
    const cv = canvas.current;
    const box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    landDots ??= grid(1.4, true);
    const land = landDots;
    let size = 0;
    let dpr = 1;
    let raf = 0;
    let shown = true;
    let last = performance.now();
    const born = last;
    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      size = box.clientWidth;
      cv.width = Math.round(size * dpr);
      cv.height = Math.round(size * dpr);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => (shown = e.isIntersecting));
    io.observe(box);
    requestAnimationFrame(() => setReady(true));

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(64, now - last);
      last = now;
      if (!shown || document.hidden || !size) return;
      const L = live.current;
      const v = view.current;
      // Where it faces this frame: turning to a marker, coasting, or drifting on its own.
      if (v.to) {
        const k = Math.min(1, (now - v.to.t0) / (L.still ? 1 : 950));
        const e = 1 - Math.pow(1 - k, 3);
        v.lat = v.to.fromLat + (v.to.lat - v.to.fromLat) * e;
        v.lon = v.to.fromLon + (v.to.lon - v.to.fromLon) * e;
        if (k >= 1) v.to = null;
      } else if (!v.drag) {
        v.lon += v.vLon * dt;
        v.lat = clamp(v.lat + v.vLat * dt, -60, 60);
        v.vLon *= Math.pow(0.94, dt / 16);
        v.vLat *= Math.pow(0.94, dt / 16);
        if (!L.still && !L.selected && now - v.idleAt > 1600 && Math.abs(v.vLon) < 0.002) v.lon += (L.autoRotate * dt) / 1000;
      }

      const css = getComputedStyle(cv);
      const color = (name: string) => css.getPropertyValue(name).trim() || "#888";
      const ink = css.getPropertyValue("--bd-ink").trim() || "0 0 0";
      const fg = color("--bd-fg");
      const W = cv.width;
      const R = W * 0.4;
      const c0 = W / 2;
      const cl = Math.cos(v.lon * RAD);
      const sl = Math.sin(v.lon * RAD);
      const cp = Math.cos(v.lat * RAD);
      const sp = Math.sin(v.lat * RAD);
      // A point on the unit sphere, turned to the view: [x, y, z], z toward you.
      const turn = (x: number, y: number, z: number): [number, number, number] => {
        const x1 = x * cl - z * sl;
        const z1 = x * sl + z * cl;
        return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
      };

      ctx.clearRect(0, 0, W, W);
      // The air around it.
      const glow = ctx.createRadialGradient(c0, c0, R * 0.92, c0, c0, R * 1.2);
      glow.addColorStop(0, `rgb(${ink} / 0.08)`);
      glow.addColorStop(1, `rgb(${ink} / 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, W);
      // The sea: lit from the upper left, in shadow toward the lower right.
      ctx.beginPath();
      ctx.arc(c0, c0, R, 0, Math.PI * 2);
      const sea0 = ctx.createRadialGradient(c0 - R * 0.42, c0 - R * 0.46, R * 0.05, c0, c0, R * 1.02);
      sea0.addColorStop(0, `rgb(${ink} / 0.02)`);
      sea0.addColorStop(0.7, `rgb(${ink} / 0.06)`);
      sea0.addColorStop(1, `rgb(${ink} / 0.13)`);
      ctx.fillStyle = sea0;
      ctx.fill();
      // The rim: a fine light along the lit edge, and the outline.
      const rim = ctx.createLinearGradient(c0 - R, c0 - R, c0 + R, c0 + R);
      rim.addColorStop(0, "rgb(255 255 255 / 0.55)");
      rim.addColorStop(0.5, "rgb(255 255 255 / 0)");
      ctx.lineWidth = Math.max(1, 1.5 * dpr);
      ctx.strokeStyle = rim;
      ctx.stroke();
      ctx.lineWidth = Math.max(1, dpr);
      ctx.strokeStyle = `rgb(${ink} / 0.08)`;
      ctx.stroke();

      const s = R * 0.0115;
      ctx.fillStyle = fg;
      // The land: every dot by day; toward night the dither drops them in its order (or they fade).
      const paths = Array.from({ length: 6 }, () => new Path2D());
      for (let i = 0; i < land.n; i++) {
        const [x, y, z] = turn(land.x[i], land.y[i], land.z[i]);
        if (z <= 0.02) continue;
        const lit = Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]);
        const shade = (0.4 + 0.8 * lit) * (0.55 + 0.45 * z);
        if (L.dither && shade * 16 <= land.b[i] + 0.5) continue;
        const r = s * 0.5 * (0.55 + 0.45 * z);
        const p = L.dither ? paths[Math.min(5, Math.floor(clamp(0.45 + 0.55 * z, 0, 1) * 6))] : paths[Math.min(5, Math.floor(clamp(shade, 0, 1) * 6))];
        p.moveTo(c0 + x * R + r, c0 - y * R);
        p.arc(c0 + x * R, c0 - y * R, r, 0, Math.PI * 2);
      }
      paths.forEach((p, k) => {
        ctx.globalAlpha = 0.25 + (k / 5) * 0.7;
        ctx.fill(p);
      });
      ctx.globalAlpha = 1;

      const at = new Map(L.markers.map((m) => [m.id, m]));
      // Arcs: up off the surface along the great circle, drawn in, with a light running along.
      L.arcs.forEach((a, k) => {
        const A = at.get(a.from);
        const B = at.get(a.to);
        if (!A || !B) return;
        const pa = vec(A.lat, A.lon);
        const pb = vec(B.lat, B.lon);
        const w = Math.acos(clamp(pa[0] * pb[0] + pa[1] * pb[1] + pa[2] * pb[2], -1, 1));
        if (w < 1e-3) return;
        const lift = 0.035 + 0.15 * (w / Math.PI);
        const N = 56;
        const reveal = L.still ? 1 : clamp((now - born - 500 - k * 180) / 1100, 0, 1);
        const pts: Array<[number, number, boolean]> = [];
        for (let j = 0; j <= N * reveal; j++) {
          const t = j / N;
          const f1 = Math.sin((1 - t) * w) / Math.sin(w);
          const f2 = Math.sin(t * w) / Math.sin(w);
          const h = 1 + lift * Math.sin(Math.PI * t);
          const [x, y, z] = turn((pa[0] * f1 + pb[0] * f2) * h, (pa[1] * f1 + pb[1] * f2) * h, (pa[2] * f1 + pb[2] * f2) * h);
          pts.push([c0 + x * R, c0 - y * R, z > 0 || x * x + y * y > 1]);
        }
        const tone = color(TONE_VAR[a.tone ?? "ink"]);
        ctx.strokeStyle = tone;
        ctx.lineWidth = Math.max(1, 1.3 * dpr);
        ctx.lineCap = "round";
        // The line itself, faint at its ends and strongest midway.
        for (let j = 1; j < pts.length; j++) {
          if (!pts[j][2] || !pts[j - 1][2]) continue;
          ctx.globalAlpha = 0.12 + 0.45 * Math.sin((Math.PI * j) / N);
          ctx.beginPath();
          ctx.moveTo(pts[j - 1][0], pts[j - 1][1]);
          ctx.lineTo(pts[j][0], pts[j][1]);
          ctx.stroke();
        }
        if (reveal >= 1 && !L.still) {
          // The running light: a short bright stretch with a tail.
          const head = ((now / 2600 + k * 0.37) % 1) * N;
          for (let j = Math.max(1, Math.floor(head - 12)); j <= Math.min(N, Math.floor(head)); j++) {
            if (!pts[j][2] || !pts[j - 1][2]) continue;
            ctx.globalAlpha = Math.pow(1 - (head - j) / 12, 2);
            ctx.lineWidth = Math.max(1, 2 * dpr);
            ctx.beginPath();
            ctx.moveTo(pts[j - 1][0], pts[j - 1][1]);
            ctx.lineTo(pts[j][0], pts[j][1]);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      });

      // Markers: a dot ringed in the surface color, a pulse, and the chosen one larger.
      const surface = color("--bd-surface");
      let tagAt: { x: number; y: number; z: number } | null = null;
      L.markers.forEach((m, k) => {
        const [x, y, z] = turn(...vec(m.lat, m.lon));
        if (z < -0.02) return;
        const px = c0 + x * R;
        const py = c0 - y * R;
        const on = m.id === L.selected || m.id === L.hover;
        const fade = clamp(z * 6, 0, 1);
        const tone = color(TONE_VAR[m.tone ?? "ink"]);
        if (!L.still) {
          const t = ((now / 2000 + k * 0.23) % 1);
          ctx.globalAlpha = (1 - t) * 0.5 * fade;
          ctx.strokeStyle = tone;
          ctx.lineWidth = Math.max(1, 1.2 * dpr);
          ctx.beginPath();
          ctx.arc(px, py, (3 + t * 11) * dpr, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = fade;
        ctx.fillStyle = surface;
        ctx.beginPath();
        ctx.arc(px, py, (on ? 5.5 : 4) * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = tone;
        ctx.beginPath();
        ctx.arc(px, py, (on ? 3.6 : 2.6) * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (m.id === (L.hover ?? L.selected)) tagAt = { x: px / dpr, y: py / dpr, z };
      });

      // The name tag follows its marker; it's moved here, not re-rendered, every frame.
      const el = tag.current;
      if (el) {
        const p = tagAt as { x: number; y: number; z: number } | null;
        el.style.opacity = p && p.z > 0.05 ? "1" : "0";
        if (p) el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, calc(-100% - 12px))`;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  /* ---------- Pointer and keys ---------- */

  const nearest = (clientX: number, clientY: number) => {
    const box = wrap.current;
    if (!box) return null;
    const r = box.getBoundingClientRect();
    const v = view.current;
    const R = r.width * 0.4;
    const c0 = r.width / 2;
    const cl = Math.cos(v.lon * RAD);
    const sl = Math.sin(v.lon * RAD);
    const cp = Math.cos(v.lat * RAD);
    const sp = Math.sin(v.lat * RAD);
    let best: { m: GlobeMarker; d: number } | null = null;
    for (const m of markers) {
      const [x, y, z] = vec(m.lat, m.lon);
      const x1 = x * cl - z * sl;
      const z1 = x * sl + z * cl;
      const y2 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      if (z2 < 0.05) continue;
      const d = Math.hypot(clientX - r.left - (c0 + x1 * R), clientY - r.top - (c0 - y2 * R));
      if (d < 16 && (!best || d < best.d)) best = { m, d };
    }
    return best?.m ?? null;
  };

  const keys = (e: KeyboardEvent) => {
    const v = view.current;
    const step = e.shiftKey ? 30 : 10;
    const d = { ArrowLeft: [0, -step], ArrowRight: [0, step], ArrowUp: [step, 0], ArrowDown: [-step, 0] }[e.key];
    if (!d) return;
    e.preventDefault();
    v.to = { lat: clamp(v.lat + d[0], -60, 60), lon: v.lon + d[1], fromLat: v.lat, fromLon: v.lon, t0: performance.now() };
    v.idleAt = performance.now();
  };

  const shownMarker = markers.find((m) => m.id === (hover ?? selected));

  return (
    <div className={cx("relative select-none", className)}>
      <div
        ref={wrap}
        role="img"
        aria-label={`${label}${markers.length ? `, with ${markers.length} places` : ""}. Drag or use the arrow keys to turn it.`}
        tabIndex={0}
        onKeyDown={keys}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const v = view.current;
          v.drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
          v.to = null;
          v.vLon = v.vLat = 0;
        }}
        onPointerMove={(e) => {
          const v = view.current;
          const box = wrap.current;
          if (v.drag && box) {
            const R = box.clientWidth * 0.4;
            const dx = e.clientX - v.drag.x;
            const dy = e.clientY - v.drag.y;
            const now = performance.now();
            const dt = Math.max(1, now - v.drag.t);
            const dLon = (-dx / R) * (180 / Math.PI) * 0.9;
            const dLat = (dy / R) * (180 / Math.PI) * 0.9;
            v.lon += dLon;
            v.lat = clamp(v.lat + dLat, -60, 60);
            v.vLon = dLon / dt;
            v.vLat = dLat / dt;
            v.drag = { x: e.clientX, y: e.clientY, moved: v.drag.moved + Math.abs(dx) + Math.abs(dy), t: now };
            return;
          }
          const m = nearest(e.clientX, e.clientY);
          if ((m?.id ?? null) !== hover) setHover(m?.id ?? null);
        }}
        onPointerUp={(e) => {
          const v = view.current;
          const tap = v.drag && v.drag.moved < 5;
          v.drag = null;
          v.idleAt = performance.now();
          if (tap) {
            const m = nearest(e.clientX, e.clientY);
            if (m) choose(m.id === selected ? null : m);
          }
        }}
        onPointerLeave={() => setHover(null)}
        className={cx("relative aspect-square w-full touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--bd-ui-focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent", hover ? "cursor-pointer" : "cursor-grab active:cursor-grabbing")}
      >
        <canvas ref={canvas} aria-hidden className={cx("absolute inset-0 size-full transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")} />
        <div ref={tag} aria-hidden className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-[10px] bg-[var(--bd-surface)] px-2.5 py-1.5 text-center opacity-0 shadow-[var(--bd-shadow-float),0_0_0_1px_rgb(var(--bd-ink)/0.08)] transition-opacity duration-200">
          {shownMarker && (
            <>
              <span className="block text-[12.5px] font-medium leading-tight text-[var(--bd-fg)]">{shownMarker.label ?? shownMarker.id}</span>
              {shownMarker.detail && <span className="block text-[11.5px] leading-tight tabular-nums text-[var(--bd-muted)]">{shownMarker.detail}</span>}
            </>
          )}
        </div>
      </div>
      {/* The places, for keys and screen readers: focusing one turns the globe to it. */}
      {markers.length > 0 && (
        <ul aria-label={`Places on the ${label.toLowerCase()}`} className="sr-only">
          {markers.map((m) => (
            <li key={m.id}>
              <button type="button" id={`${id}-${m.id}`} aria-pressed={m.id === selected} onFocus={() => choose(m)} onClick={() => choose(m)}>
                {m.label ?? m.id}
                {m.detail ? `, ${m.detail}` : ""}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

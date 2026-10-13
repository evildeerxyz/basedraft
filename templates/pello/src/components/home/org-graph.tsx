"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Avatar } from "@/components/site/ui";
import { happening, type Happening, type Tone } from "@/lib/happenings";
import { paletteOf, type Palette } from "@/lib/palette";
import { PEOPLE, TEAMS, initials, type Person, type TeamId } from "@/lib/people";

/*
 * Fieldwork, drawn as the people it is: pello in the middle, a hub for each team, everyone around
 * their team. A request travels from a person to pello and the answer travels back. Everyone can
 * be dragged (their team comes along), the pointer nudges people out of its way, and a click sends
 * a request for whoever was clicked. Team names are page text, moved with their hubs. It only
 * runs while it's on screen.
 */

export interface OrgGraphHandle {
  /** Sends a request for the next person in line. */
  send: () => void;
}

interface Node {
  kind: "core" | "team" | "person";
  team?: TeamId;
  person?: Person;
  /** Where it rests, and where it is. */
  rx: number;
  ry: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** A ring that flashes when a request lands, in its color. */
  flash: number;
  tone: Tone;
  /** How much the pointer is on it, eased. */
  hot: number;
  phase: number;
}

interface Pulse {
  path: Node[];
  t: number;
  tone: Tone;
  then: () => void;
}

const TEAM_INDEX = new Map(TEAMS.map((t, i) => [t.id, i]));

export function OrgGraph({ onStart, onDone, ref }: { onStart: (h: Happening) => void; onDone: (h: Happening) => void; ref?: Ref<OrgGraphHandle> }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const labels = useRef<Array<HTMLSpanElement | null>>([]);
  const send = useRef<(p?: Person) => void>(() => {});
  const calls = useRef({ onStart, onDone });
  const [hover, setHover] = useState<Person | null>(null);
  const still = useReducedMotion() ?? false;

  useEffect(() => {
    calls.current = { onStart, onDone };
  });
  useImperativeHandle(ref, () => ({ send: () => send.current() }), []);

  useEffect(() => {
    const wrap = box.current!;
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    const pal: Palette = paletteOf(wrap);
    const font = getComputedStyle(wrap).fontFamily;
    const hueOf = (team: TeamId) => (team === "people" ? pal.accent : TEAMS[TEAM_INDEX.get(team)!].hue);
    const toneOf = (t: Tone) => ({ good: pal.good, accent: pal.accent, bad: pal.bad, wait: pal.ink2 })[t];

    const make = (kind: Node["kind"], extra: Partial<Node> = {}): Node => ({ kind, rx: 0, ry: 0, x: 0, y: 0, vx: 0, vy: 0, r: 0, flash: 0, tone: "accent", hot: 0, phase: Math.random() * Math.PI * 2, ...extra });
    const core = make("core");
    const hubs = TEAMS.map((t) => make("team", { team: t.id }));
    const people = PEOPLE.map((p) => make("person", { person: p, team: p.team }));
    const hubOf = (team: TeamId) => hubs[TEAM_INDEX.get(team)!];
    const all = [core, ...hubs, ...people];

    let w = 0;
    let h = 0;
    let s = 1;
    let placed = false;
    // The orbit the teams sit on.
    let ox = 0;
    let oy = 0;
    const layout = () => {
      const r = wrap.getBoundingClientRect();
      w = r.width;
      h = r.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s = Math.max(0.62, Math.min(1, w / 860));
      // A little above the middle: the hint and the button sit along the bottom.
      const cx = w / 2;
      const cy = h * 0.46;
      const ax = w * (w < 640 ? 0.3 : 0.335);
      const ay = h * 0.28;
      [ox, oy] = [ax, ay];
      core.rx = cx;
      core.ry = cy;
      core.r = 32 * s;
      hubs.forEach((n, i) => {
        const a = (i / hubs.length) * Math.PI * 2;
        n.rx = cx + Math.cos(a) * ax;
        n.ry = cy + Math.sin(a) * ay;
        n.r = 21 * s;
        const members = people.filter((p) => p.team === n.team);
        const out = Math.atan2(n.ry - cy, n.rx - cx);
        members.forEach((m, j) => {
          const a2 = out + (j - (members.length - 1) / 2) * 0.46;
          const d = (j % 2 ? 64 : 92) * s;
          m.rx = n.rx + Math.cos(a2) * d;
          m.ry = n.ry + Math.sin(a2) * d;
          m.r = 16.5 * s;
        });
      });
      if (!placed) for (const n of all) [n.x, n.y] = [n.rx, n.ry];
      placed = true;
      draw(0);
    };

    // The pointer, in the box's coordinates, and whoever it's dragging.
    let px: number | null = null;
    let py = 0;
    let drag: Node | null = null;
    let down: { x: number; y: number; node: Node | null } | null = null;
    let hovered: Node | null = null;
    const hit = (x: number, y: number) => {
      for (const list of [people, hubs, [core]]) for (const n of list) if ((n.x - x) ** 2 + (n.y - y) ** 2 < (n.r + 5) ** 2) return n;
      return null;
    };

    const pulses: Pulse[] = [];
    let count = 5;
    let quietUntil = 0;
    const fire = (who?: Person) => {
      const i = count++;
      const ev = happening(i, who, true);
      const p = people[PEOPLE.indexOf(ev.person)];
      const hub = hubOf(ev.person.team);
      calls.current.onStart(ev);
      const back = () => {
        p.flash = 1;
        p.tone = ev.tone;
        calls.current.onDone(ev);
      };
      if (still) return void setTimeout(back, 500);
      pulses.push({
        path: [p, hub, core],
        t: 0,
        tone: "accent",
        then: () => {
          core.flash = 1;
          core.tone = ev.tone;
          pulses.push({ path: [core, hub, p], t: 0, tone: ev.tone, then: back });
        },
      });
    };
    send.current = (who?: Person) => {
      quietUntil = performance.now() + 6000;
      fire(who);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      // A field of dots, a little bigger where the pointer is.
      const gap = 26;
      ctx.fillStyle = pal.line;
      for (let y = gap / 2; y < h; y += gap)
        for (let x = gap / 2; x < w; x += gap) {
          let r = 1.1;
          if (px !== null) {
            const d = Math.hypot(x - px, y - py);
            if (d < 130) r += (1 - d / 130) ** 2 * 1.6;
          }
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }

      // Two orbits through the teams, so it reads as one company.
      ctx.strokeStyle = pal.line;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 7]);
      for (const k of [1, 0.5]) {
        ctx.beginPath();
        ctx.ellipse(core.x, core.y, ox * k, oy * k, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Links: pello to each team, each team to its people.
      ctx.lineCap = "round";
      ctx.strokeStyle = pal.line;
      for (const n of hubs) {
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(core.x, core.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }
      ctx.lineWidth = 1.1;
      for (const n of people) {
        const hub = hubOf(n.team!);
        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }

      // Requests on their way.
      for (const p of pulses) {
        const at = (u: number) => {
          const k = Math.max(0, Math.min(p.path.length - 1.0001, u));
          const i = Math.floor(k);
          const f = k - i;
          const a = p.path[i];
          const b = p.path[i + 1];
          return [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f];
        };
        ctx.strokeStyle = toneOf(p.tone);
        for (let k = 0; k < 6; k++) {
          const [x1, y1] = at(p.t - k * 0.05);
          const [x2, y2] = at(p.t - (k + 1) * 0.05);
          ctx.globalAlpha = 1 - k / 6;
          ctx.lineWidth = 3.4 * s;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        const [x, y] = at(p.t);
        ctx.fillStyle = toneOf(p.tone);
        ctx.beginPath();
        ctx.arc(x, y, 4.2 * s, 0, Math.PI * 2);
        ctx.fill();
      }

      const ripple = (n: Node, r: number) => {
        if (n.flash <= 0) return;
        ctx.strokeStyle = toneOf(n.tone);
        ctx.globalAlpha = n.flash * 0.55;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + (1 - n.flash) * r * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      // People.
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const n of people) {
        const r = n.r * (1 + n.hot * 0.2 + n.flash * 0.12);
        ripple(n, r);
        ctx.fillStyle = n.hot > 0.01 ? pal.surface : pal.sunken;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = n.flash > 0.02 ? toneOf(n.tone) : hueOf(n.team!);
        ctx.lineWidth = 1.8 + n.flash * 2;
        ctx.stroke();
        ctx.fillStyle = pal.ink2;
        ctx.font = `600 ${Math.round(13 * s * (1 + n.hot * 0.15))}px ${font}`;
        ctx.fillText(initials(n.person!.name), n.x, n.y + 0.5);
      }

      // Teams.
      for (const n of hubs) {
        ctx.fillStyle = pal.surface;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (1 + n.hot * 0.12), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = hueOf(n.team!);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = hueOf(n.team!);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }

      // pello: its mark, in the middle.
      const cr = core.r * (1 + core.hot * 0.08 + core.flash * 0.1 + (still ? 0 : Math.sin(t / 700) * 0.02));
      ripple(core, cr);
      ctx.fillStyle = pal.ink;
      ctx.beginPath();
      ctx.arc(core.x, core.y, cr, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.page;
      ctx.beginPath();
      ctx.arc(core.x - cr * 0.19, core.y, cr * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.arc(core.x + cr * 0.19, core.y, cr * 0.46, 0, Math.PI * 2);
      ctx.fill();

      // The team names, which are on the page, follow their hubs: on the side toward pello.
      hubs.forEach((n, i) => {
        const label = labels.current[i];
        if (!label) return;
        const dx = core.x - n.x;
        const dy = core.y - n.y;
        const d = Math.hypot(dx, dy) || 1;
        label.style.transform = `translate(${n.x + (dx / d) * (n.r + 22)}px, ${n.y + (dy / d) * (n.r + 22)}px) translate(-50%, -50%)`;
      });

      // The card for whoever the pointer is on.
      if (hovered && card.current) {
        const cw = card.current.offsetWidth;
        const ch = card.current.offsetHeight;
        const x = Math.max(8, Math.min(w - cw - 8, hovered.x - cw / 2));
        const above = hovered.y - hovered.r - 14 - ch;
        const y = above > 8 ? above : hovered.y + hovered.r + 14;
        card.current.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    // Springs: each node pulls back to where it rests, a team follows its hub, the pointer pushes.
    const step = (dt: number, t: number) => {
      const K = 90;
      const C = 13;
      for (const n of all) {
        n.hot += ((n === hovered ? 1 : 0) - n.hot) * Math.min(1, dt * 14);
        n.flash = Math.max(0, n.flash - dt * 1.4);
        if (n === drag) {
          n.vx = (px! - n.x) / Math.max(dt, 1 / 120);
          n.vy = (py - n.y) / Math.max(dt, 1 / 120);
          n.x = px!;
          n.y = py;
          continue;
        }
        let tx = n.rx + Math.sin(t / 1300 + n.phase) * 2.2 * s;
        let ty = n.ry + Math.cos(t / 1700 + n.phase) * 2.2 * s;
        if (n.kind === "person") {
          const hub = hubOf(n.team!);
          tx += (hub.x - hub.rx) * 0.9;
          ty += (hub.y - hub.ry) * 0.9;
        } else if (n.kind === "team") {
          tx += (core.x - core.rx) * 0.6;
          ty += (core.y - core.ry) * 0.6;
        }
        let fx = (tx - n.x) * K;
        let fy = (ty - n.y) * K;
        if (px !== null && !drag && n !== hovered) {
          const dx = n.x - px;
          const dy = n.y - py;
          const d = Math.hypot(dx, dy) || 1;
          const R = 120 * s;
          if (d < R) {
            const f = (1 - d / R) ** 2 * 2600;
            fx += (dx / d) * f;
            fy += (dy / d) * f;
          }
        }
        n.vx += (fx - C * n.vx) * dt;
        n.vy += (fy - C * n.vy) * dt;
        n.x += n.vx * dt;
        n.y += n.vy * dt;
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += dt * 3.4;
        if (p.t >= p.path.length - 1) {
          pulses.splice(i, 1);
          p.then();
        }
      }
    };

    let raf = 0;
    let last = 0;
    let visible = false;
    const frame = (t: number) => {
      const dt = Math.min(1 / 30, (t - (last || t)) / 1000);
      last = t;
      if (!still) step(dt, t);
      else {
        for (const n of all) n.flash = Math.max(0, n.flash - dt * 1.4);
      }
      draw(t);
      raf = visible ? requestAnimationFrame(frame) : 0;
    };
    const run = () => {
      if (visible && !raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    io.observe(wrap);
    const ro = new ResizeObserver(layout);
    ro.observe(wrap);
    layout();

    const auto = still
      ? 0
      : window.setInterval(() => {
          if (visible && !document.hidden && performance.now() > quietUntil) fire();
        }, 2600);

    const local = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    const move = (e: PointerEvent) => {
      [px, py] = local(e);
      if (!drag) {
        const n = hit(px, py);
        if (n !== hovered) {
          hovered = n;
          setHover(n?.person ?? null);
        }
        el.style.cursor = n ? "grab" : "default";
      }
      if (still) draw(performance.now());
    };
    const press = (e: PointerEvent) => {
      const [x, y] = local(e);
      const n = hit(x, y);
      down = { x, y, node: n };
      if (n && e.pointerType !== "touch" && !still) {
        drag = n;
        [px, py] = [x, y];
        el.setPointerCapture(e.pointerId);
        el.style.cursor = "grabbing";
      }
    };
    const release = (e: PointerEvent) => {
      const [x, y] = local(e);
      if (down && Math.hypot(x - down.x, y - down.y) < 6) {
        const n = down.node;
        if (n?.person) send.current(n.person);
        else if (n?.kind === "team") send.current(PEOPLE.find((p) => p.team === n.team && !p.lead));
        else if (n) send.current();
      }
      drag = null;
      down = null;
      el.style.cursor = hit(x, y) ? "grab" : "default";
    };
    const leave = () => {
      if (drag) return;
      px = null;
      hovered = null;
      setHover(null);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", press);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(auto);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", press);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("pointercancel", release);
      el.removeEventListener("pointerleave", leave);
    };
  }, [still]);

  return (
    <div ref={box} className="absolute inset-0">
      <canvas ref={canvas} className="absolute inset-0 size-full touch-pan-y" aria-label="Fieldwork's teams and people. Requests travel from a person to pello and back." role="img" />
      {TEAMS.map((t, i) => (
        <span
          key={t.id}
          ref={(n) => {
            labels.current[i] = n;
          }}
          className="pointer-events-none absolute left-0 top-0 hidden whitespace-nowrap rounded-full bg-surface px-2.5 py-0.5 text-[15px] font-medium text-ink-2 sm:block"
        >
          {t.name}
        </span>
      ))}
      <div
        ref={card}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-10 w-[264px] rounded-[18px] bg-surface p-4 shadow-[0_18px_44px_-14px_rgb(12_14_20/0.28),inset_0_0_0_1px_var(--pl-line)] transition-opacity duration-150"
        style={{ opacity: hover ? 1 : 0 }}
      >
        {hover && (
          <>
            <div className="flex items-center gap-3">
              <Avatar person={hover} size={40} />
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold leading-tight text-ink">{hover.name}</p>
                <p className="truncate text-[15px] text-mute">{hover.role}</p>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between text-[15px]">
              <span className="text-ink-2">{hover.location}</span>
              <span className="tabular text-ink">{hover.daysLeft} of 25 days left</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(hover.daysLeft / 25) * 100}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

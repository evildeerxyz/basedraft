"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { svgShapes } from "@/site/figma-geometry";
import type { FGradient } from "@/site/figma-paint";
import type { FFrame, FNode, RGBA } from "@/site/figma-tree";
import { toFigmaTree } from "@/site/design-export";
import { openLive } from "@/site/live-export";

const css = (c: RGBA) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${c.a})`;
const grad = (g: FGradient) => {
  const stops = g.stops.map((s) => `${css(s.color)} ${(s.at * 100).toFixed(2)}%`).join(", ");
  if (g.type === "LINEAR" && g.from && g.to) {
    // Not exact for every box, but close: the angle the from/to points make on a square.
    return null;
  }
  if (g.type === "RADIAL" && g.center && g.radius) return `radial-gradient(${(g.radius[0] * 100).toFixed(2)}% ${(g.radius[1] * 100).toFixed(2)}% at ${(g.center[0] * 100).toFixed(2)}% ${(g.center[1] * 100).toFixed(2)}%, ${stops})`;
  return null;
};

function linearCss(g: FGradient, w: number, h: number) {
  const [fx, fy] = [g.from![0] * w, g.from![1] * h];
  const [tx, ty] = [g.to![0] * w, g.to![1] * h];
  const angle = (Math.atan2(tx - fx, -(ty - fy)) * 180) / Math.PI;
  const t = (angle * Math.PI) / 180;
  const L = Math.abs(w * Math.sin(t)) + Math.abs(h * Math.cos(t));
  const len = Math.hypot(tx - fx, ty - fy);
  // Stops along the CSS gradient line, which runs through the center.
  const startOff = ((fx - w / 2) * Math.sin(t) - (fy - h / 2) * Math.cos(t) + L / 2) / L;
  const stops = g.stops.map((s) => `${css(s.color)} ${((startOff + (s.at * len) / L) * 100).toFixed(2)}%`).join(", ");
  return `linear-gradient(${angle.toFixed(2)}deg, ${stops})`;
}

function background(n: FFrame) {
  const layers = (n.gradients ?? []).map((g) => (g.type === "LINEAR" ? linearCss(g, n.w, n.h) : grad(g))).filter(Boolean);
  return layers.length ? layers.join(", ") : undefined;
}

function Sim({ n, parent }: { n: FNode; parent: FFrame | null }): ReactNode {
  const L = parent?.layout ?? null;
  const st: CSSProperties = { boxSizing: "border-box", flexShrink: 0 };
  if (!parent) Object.assign(st, { position: "absolute", left: 0, top: 0 });
  else if (!L || n.abs) Object.assign(st, { position: "absolute", left: n.x, top: n.y });
  else st.position = "relative";
  if (n.rotation) Object.assign(st, { transform: `rotate(${n.rotation}deg)`, transformOrigin: "0 0" });
  if (n.opacity !== undefined) st.opacity = n.opacity;
  const along = L && !n.abs ? (L.mode === "H" ? "w" : "h") : null;
  const size = (axis: "w" | "h", sizing: string, hugs: boolean) => {
    const prop = axis === "w" ? "width" : "height";
    if (!L || n.abs) {
      (st as Record<string, unknown>)[prop] = hugs && sizing === "HUG" ? "auto" : n[axis];
      return;
    }
    if (sizing === "FILL") {
      if (along === axis) Object.assign(st, { flex: "1 1 0", [axis === "w" ? "minWidth" : "minHeight"]: 0 });
      else st.alignSelf = "stretch";
    } else if (sizing === "HUG" && hugs) (st as Record<string, unknown>)[prop] = "auto";
    else (st as Record<string, unknown>)[prop] = n[axis];
  };
  if (n.t === "text") {
    const wraps = n.wrap || n.boxed || n.sizeH === "FILL";
    size("w", wraps ? (n.sizeH === "FILL" ? "FILL" : "FIXED") : "HUG", true);
    if (wraps && n.sizeH !== "FILL") st.width = n.w + 2;
    size("h", "HUG", true);
    Object.assign(st, { fontFamily: `"${n.family}"`, fontWeight: n.weight, fontStyle: n.italic ? "italic" : undefined, fontSize: n.size, lineHeight: `${n.lh}px`, letterSpacing: n.ls, color: css(n.color), textAlign: n.align.toLowerCase() as CSSProperties["textAlign"], whiteSpace: wraps ? "pre-wrap" : "pre", margin: 0 });
    if (n.gradient) Object.assign(st, { backgroundImage: n.gradient.type === "LINEAR" ? linearCss(n.gradient, n.w, n.h) : grad(n.gradient) ?? undefined, WebkitBackgroundClip: "text", color: "transparent" });
    const parts: ReactNode[] = [];
    let at = 0;
    for (const r of [...n.ranges].sort((a, b) => a.s - b.s)) {
      if (r.s > at) parts.push(n.chars.slice(at, r.s));
      parts.push(<span key={r.s} style={{ color: r.color ? css(r.color) : undefined, fontWeight: r.weight }}>{n.chars.slice(r.s, r.e)}</span>);
      at = r.e;
    }
    parts.push(n.chars.slice(at));
    return <div style={st}>{parts}</div>;
  }
  if (n.t === "image") {
    size("w", "FIXED", false);
    size("h", "FIXED", false);
    st.borderRadius = n.radius.map((r) => `${r}px`).join(" ");
    st.overflow = "hidden";
    if (n.dots) {
      st.background = n.dots.base ? css(n.dots.base) : undefined;
      return (
        <div style={st}>
          <svg width={n.w} height={n.h} style={{ position: "absolute", inset: 0 }}>
            {n.dots.inks.map((ink, i) => (
              <path key={i} fill={css(ink.color)} d={rectsPath(ink.rects)} />
            ))}
          </svg>
        </div>
      );
    }
    if (n.tints?.length)
      return (
        <div style={st}>
          {n.tints.map((t, i) => (
            <div key={i} style={{ position: "absolute", inset: 0, background: css(t.color), maskImage: `url(${t.mask})`, maskSize: "100% 100%" }} />
          ))}
        </div>
      );
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" src={n.src} style={{ ...st, objectFit: n.fit === "FIT" ? "contain" : "cover" }} />;
  }
  if (n.t === "svg") {
    size("w", "FIXED", false);
    size("h", "FIXED", false);
    const vector = Boolean(svgShapes(n.svg, n.w, n.h));
    return <div data-raster={vector ? undefined : "1"} style={{ ...st, outline: vector ? undefined : "2px solid magenta" }} dangerouslySetInnerHTML={{ __html: n.svg }} />;
  }
  const f = n;
  const top = !parent;
  size("w", top ? "FIXED" : f.sizeH, Boolean(f.layout));
  size("h", top ? (f.layout ? "HUG" : "FIXED") : f.sizeV, Boolean(f.layout));
  if (f.fill) st.backgroundColor = css(f.fill);
  const bg = background(f);
  if (bg) st.backgroundImage = bg;
  st.borderRadius = f.radius.map((r) => `${r}px`).join(" ");
  if (f.clip) st.overflow = "hidden";
  if (f.shape) st.clipPath = `polygon(${f.shape.map(([x, y]) => `${x}px ${y}px`).join(", ")})`;
  const shadows: string[] = [];
  if (f.stroke) {
    const [t, r, b, l] = f.stroke.w;
    const c = css(f.stroke.c);
    if (f.stroke.outside) shadows.push(`0 0 0 ${t}px ${c}`);
    else {
      if (t) shadows.push(`inset 0 ${t}px 0 0 ${c}`);
      if (b) shadows.push(`inset 0 -${b}px 0 0 ${c}`);
      if (l) shadows.push(`inset ${l}px 0 0 0 ${c}`);
      if (r) shadows.push(`inset -${r}px 0 0 0 ${c}`);
    }
  }
  for (const e of f.effects ?? []) {
    if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") shadows.push(`${e.type === "INNER_SHADOW" ? "inset " : ""}${e.x}px ${e.y}px ${e.radius}px ${e.spread}px ${css(e.color!)}`);
    if (e.type === "FOREGROUND_BLUR") st.filter = `blur(${e.radius / 2}px)`;
    if (e.type === "BACKGROUND_BLUR") st.backdropFilter = `blur(${e.radius / 2}px)`;
  }
  if (shadows.length) st.boxShadow = shadows.join(", ");
  if (f.layout) {
    const lay = f.layout;
    Object.assign(st, {
      display: "flex",
      flexDirection: lay.mode === "H" ? "row" : "column",
      flexWrap: lay.wrap ? "wrap" : "nowrap",
      [lay.mode === "H" ? "columnGap" : "rowGap"]: lay.main === "SPACE_BETWEEN" ? 0 : lay.gap,
      ...(lay.wrap ? { rowGap: lay.counterGap ?? 0 } : {}),
      padding: `${lay.pad[0]}px ${lay.pad[1]}px ${lay.pad[2]}px ${lay.pad[3]}px`,
      justifyContent: { MIN: "flex-start", CENTER: "center", MAX: "flex-end", SPACE_BETWEEN: "space-between" }[lay.main],
      alignItems: { MIN: "flex-start", CENTER: "center", MAX: "flex-end", BASELINE: "baseline" }[lay.cross],
    });
  } else if (!st.position) st.position = "relative";
  return (
    <div style={st} data-name={f.name}>
      {(f.patterns ?? []).map((p, i) =>
        p.rects ? (
          <svg key={i} width={f.w} height={f.h} style={{ position: "absolute", left: 0, top: 0 }}>
            <path fill={css(p.color)} d={rectsPath(p.rects)} />
          </svg>
        ) : p.tile ? (
          <div key={i} style={{ position: "absolute", inset: 0, backgroundImage: `url(${p.tile.src})`, backgroundSize: `${p.tile.w}px ${p.tile.h}px` }} />
        ) : null,
      )}
      {f.children.map((c, i) => (
        <Sim key={i} n={c} parent={f} />
      ))}
    </div>
  );
}

const rectsPath = (r: number[]) => {
  let d = "";
  for (let i = 0; i < r.length; i += 4) d += `M${r[i]} ${r[i + 1]}h${r[i + 2]}v${r[i + 3]}h${-r[i + 2]}z`;
  return d;
};

function stats(n: FNode, out: Record<string, number> = {}) {
  const add = (k: string, v = 1) => (out[k] = (out[k] ?? 0) + v);
  add(n.t);
  if (n.rotation) add("rotated");
  if (n.effects?.length) add("effects", n.effects.length);
  if (n.t === "image") add(n.dots ? "image:dots" : n.tints ? "image:tints" : n.src.startsWith("data:image/png") ? "image:canvas" : "image:photo");
  if (n.t === "image" && n.dots) add("squares", n.dots.inks.reduce((t, i) => t + i.rects.length / 4, 0));
  if (n.t === "svg") {
    const ok = svgShapes(n.svg, n.w, n.h);
    add(ok ? "svg:vector" : "svg:raster");
    if (!ok) ((window as unknown as { __raster: string[] }).__raster ??= []).push(n.svg.replace(/ style="[^"]*"/g, ""));
  }
  if (n.t === "frame") {
    if (n.gradients?.length) add("gradients", n.gradients.length);
    for (const p of n.patterns ?? []) {
      add(p.rects ? "texture:dots" : "texture:tile");
      if (p.rects) add("squares", p.rects.length / 4);
    }
    if (n.layout) add("autolayout");
    n.children.forEach((c) => stats(c, out));
  }
  if (n.t === "text" && n.gradient) add("text:gradient");
  return out;
}

export function FigmaCheck() {
  const q = useSearchParams();
  const [tree, setTree] = useState<FFrame | null>(null);
  useEffect(() => {
    const url = q.get("u") ?? "/live/zuno/bd/section/hero";
    const w = Number(q.get("w") ?? 1440);
    let gone = false;
    void (async () => {
      // The page itself to the right, and its layers redrawn to the left, from the same moment.
      const edits = q.get("e") ? JSON.parse(q.get("e")!) : undefined;
      const f = await openLive(url, w, {}, { left: w + 40 }, { edits });
      const t = toFigmaTree(f.root, "Check");
      if (gone) return f.done();
      setTree(t);
      const st = stats(t);
      // The same tree through Figma's clipboard encoder, to catch anything it can't carry.
      try {
        const { figmaClipboardHtml } = await import("@/site/figma-clipboard");
        const t0 = performance.now();
        const html = await figmaClipboardHtml([{ name: "Desktop", tree: structuredClone(t) }]);
        st.clipboardKB = Math.round(html.length / 1024);
        st.encodeMs = Math.round(performance.now() - t0);
      } catch (e) {
        (st as Record<string, unknown>).clipboardError = String(e);
      }
      (window as unknown as { __bd: unknown }).__bd = { ready: true, h: t.h, w: t.w, stats: st, tree: t };
    })();
    return () => {
      gone = true;
    };
  }, [q]);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&family=Mona+Sans:wdth,wght@75..125,200..900&family=Doto:wght@100..900&display=swap" />
      <div style={{ position: "absolute", left: 0, top: 0, background: "#fff" }}>{tree && <Sim n={tree} parent={null} />}</div>
    </>
  );
}

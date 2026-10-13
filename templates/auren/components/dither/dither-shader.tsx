"use client";

import { useEffect, useRef } from "react";
import { THEME_EVENT, cn } from "@/lib/site";
import { prefersReducedMotion } from "@/lib/hooks";
import { PRELUDE } from "./shaders";

type Props = {
  /** GLSL body; has access to the uniforms and helpers in PRELUDE. */
  fragment: string;
  /** Size of one dither dot in CSS pixels (snapped to whole device pixels). */
  pixel?: number;
  className?: string;
  /** Palette inks, darkest to lightest. Accepts CSS values like var(--accent). */
  inks?: [string, string, string, string];
  label?: string;
};

const VERT = `attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

function toRgb(value: string): [number, number, number] {
  const hex = value.trim().replace("#", "");
  const full = hex.length === 3 ? hex.replace(/./g, "$&$&") : hex.padEnd(6, "0");
  const n = parseInt(full.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * A WebGL canvas that renders a fragment shader at low resolution and scales
 * it up with nearest-neighbour sampling, so every dither dot stays crisp.
 */
export function DitherShader({
  fragment,
  pixel = 3,
  className,
  inks = ["var(--ink)", "var(--accent-deep)", "var(--accent)", "var(--paper)"],
  label,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) {
      wrap.dataset.fallback = "";
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, PRELUDE + fragment);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(prog, name);
    const uRes = u("u_res");
    const uTime = u("u_time");
    const uMouse = u("u_mouse");
    const uHover = u("u_hover");
    const uInks = [u("u_c0"), u("u_c1"), u("u_c2"), u("u_c3")];

    const applyInks = () => {
      const cs = getComputedStyle(wrap);
      uInks.forEach((loc, i) => gl.uniform3fv(loc, toRgb(cs.getPropertyValue(`--dither-${i}`))));
    };
    applyInks();

    // keep every dot an integer number of device pixels
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const css = Math.max(1, Math.round(pixel * dpr)) / dpr;
      const { width, height } = wrap.getBoundingClientRect();
      const w = Math.max(1, Math.ceil(width / css));
      const h = Math.max(1, Math.ceil(height / css));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w * css}px`;
      canvas.style.height = `${h * css}px`;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    resize();

    const reduced = prefersReducedMotion();
    const mouse = { x: 0.62, y: 0.42, tx: 0.62, ty: 0.42, hover: 0, th: 0 };
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      mouse.th = inside ? 1 : 0;
      if (inside) {
        mouse.tx = x;
        mouse.ty = y;
      }
    };
    const onLeave = () => (mouse.th = 0);

    let visible = false;
    let raf = 0;
    let time = 7;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      if (dt < 1 / 62) return; // cap at ~60fps on high refresh displays
      last = now;
      if (!reduced) time += dt;
      const k = 1 - Math.pow(0.0025, dt);
      mouse.x += (mouse.tx - mouse.x) * k;
      mouse.y += (mouse.ty - mouse.y) * k;
      mouse.hover += (mouse.th - mouse.hover) * k * 0.6;
      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uHover, mouse.hover);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // draw once immediately so there is never an empty frame
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uHover, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(wrap);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const onVis = () => (document.hidden ? stop() : start());

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(THEME_EVENT, applyInks);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(THEME_EVENT, applyInks);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [fragment, pixel]);

  return (
    <div
      ref={wrapRef}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("dither-canvas overflow-hidden", className)}
      style={
        {
          "--dither-0": inks[0],
          "--dither-1": inks[1],
          "--dither-2": inks[2],
          "--dither-3": inks[3],
        } as React.CSSProperties
      }
    >
      <canvas ref={canvasRef} className="block [image-rendering:pixelated]" />
    </div>
  );
}

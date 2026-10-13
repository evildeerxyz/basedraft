"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { cn, hexToRgb } from "@/lib/utils";
import { fragmentShader, VERTEX_SHADER, type DitherShape } from "./shaders";

type Orb = [x: number, y: number, radius: number];

export interface DitherShaderProps {
  shape: DitherShape;
  className?: string;
  /** CSS pixels per dither cell. */
  pixelSize?: number;
  color?: string;
  opacity?: number;
  secondColor?: string;
  secondOpacity?: number;
  speed?: number;
  scale?: number;
  intensity?: number;
  /** Orb centre (0 to 1, y from top) and radius (fraction of the short side). */
  orb?: Orb | ((width: number, height: number) => Orb);
  ring?: boolean;
  /** Amount of flow field drawn around the planet. */
  flow?: number;
  text?: string;
  /** Chart heights (0 to 1 of the canvas, bottom-up) for the "chart" shape. */
  data?: number[];
  /** 0 to 1 left-to-right reveal for the "chart" shape. */
  reveal?: MotionValue<number>;
  interactive?: boolean;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const premultiplied = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  return [(r / 255) * alpha, (g / 255) * alpha, (b / 255) * alpha, alpha] as const;
};

/**
 * Real-time ordered dithering on the GPU. Each fragment is one dither cell; the
 * canvas is upscaled with `image-rendering: pixelated` so pixels stay crisp.
 * Pauses offscreen and renders a single still frame for reduced-motion users.
 */
export function DitherShader(props: DitherShaderProps) {
  const { shape, className, pixelSize = 3, text, data } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (!gl || gl.isContextLost()) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader(shape));
    if (!vs || !fs) return;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const loc = {
      res: u("u_res"),
      time: u("u_time"),
      mouse: u("u_mouse"),
      mouseActive: u("u_mouseActive"),
      front: u("u_front"),
      second: u("u_second"),
      scale: u("u_scale"),
      intensity: u("u_intensity"),
      orb: u("u_orb"),
      ring: u("u_ring"),
      flow: u("u_flow"),
      tex: u("u_tex"),
      reveal: u("u_reveal"),
      count: u("u_count"),
    };

    let texture: WebGLTexture | null = null;
    const paintText = (w: number, h: number) => {
      if (shape !== "text" || !text) return;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const ctx = off.getContext("2d")!;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      const family = getComputedStyle(host).fontFamily || "sans-serif";
      const setFont = (px: number) => {
        ctx.font = `700 ${px}px ${family}`;
        if ("letterSpacing" in ctx) ctx.letterSpacing = `${-px * 0.06}px`;
      };
      // Fit the glyphs' real ink box to the canvas, by width and by height.
      const base = 100;
      setFont(base);
      const probe = ctx.measureText(text);
      const glyphH = probe.actualBoundingBoxAscent + probe.actualBoundingBoxDescent || base * 0.7;
      setFont(base * Math.min((w * 0.94) / probe.width, (h * 0.84) / glyphH));
      const metrics = ctx.measureText(text);
      const ascent = metrics.actualBoundingBoxAscent;
      const descent = metrics.actualBoundingBoxDescent;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, w / 2, h / 2 + (ascent - descent) / 2);

      if (!texture) texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(loc.tex, 0);
    };

    if (shape === "chart" && data?.length) {
      // One texel per data point; linear filtering interpolates between them.
      const bytes = new Uint8Array(data.length * 4);
      data.forEach((v, i) => {
        bytes[i * 4] = Math.round(Math.max(0, Math.min(1, v)) * 255);
        bytes[i * 4 + 3] = 255;
      });
      texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, data.length, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(loc.tex, 0);
      gl.uniform1f(loc.count, data.length);
    }

    let cssW = 0;
    let cssH = 0;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      const w = Math.max(1, Math.ceil(rect.width / pixelSize));
      const h = Math.max(1, Math.ceil(rect.height / pixelSize));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = `${w * pixelSize}px`;
        canvas.style.height = `${h * pixelSize}px`;
        gl.viewport(0, 0, w, h);
        paintText(w, h);
      }
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, inside: false };
    const mouse = { x: 0, y: 0, active: 0 };
    let time = 6 + Math.random() * 20;
    let last = 0;
    let raf = 0;
    let visible = false;
    let shown = false;
    let disposed = false;

    const draw = () => {
      const p = propsRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const rect = canvas.getBoundingClientRect();

      const tx = (pointer.x - rect.left) / pixelSize;
      const ty = (rect.bottom - pointer.y) / pixelSize;
      const margin = 0.15;
      const within =
        pointer.inside &&
        pointer.x > rect.left - rect.width * margin &&
        pointer.x < rect.right + rect.width * margin &&
        pointer.y > rect.top - rect.height * margin &&
        pointer.y < rect.bottom + rect.height * margin;
      const target = p.interactive !== false && within ? 1 : 0;
      if (within) {
        mouse.x += (tx - mouse.x) * 0.09;
        mouse.y += (ty - mouse.y) * 0.09;
      }
      mouse.active += (target - mouse.active) * 0.05;

      const orb = typeof p.orb === "function" ? p.orb(cssW, cssH) : (p.orb ?? [0.5, 0.5, 0.35]);
      gl.uniform2f(loc.res, w, h);
      gl.uniform1f(loc.time, time);
      gl.uniform2f(loc.mouse, mouse.x, mouse.y);
      gl.uniform1f(loc.mouseActive, mouse.active);
      gl.uniform4fv(loc.front, premultiplied(p.color ?? "#c8ff3e", p.opacity ?? 1));
      gl.uniform4fv(loc.second, premultiplied(p.secondColor ?? "#ffffff", p.secondOpacity ?? 0.18));
      gl.uniform1f(loc.scale, p.scale ?? 1.4);
      gl.uniform1f(loc.intensity, p.intensity ?? 1);
      gl.uniform3f(loc.orb, orb[0], 1 - orb[1], orb[2]);
      gl.uniform1f(loc.ring, p.ring ? 1 : 0);
      gl.uniform1f(loc.flow, p.flow ?? 0);
      gl.uniform1f(loc.reveal, p.reveal ? p.reveal.get() * 1.04 : 1.04);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
      }
    };

    const loop = (now: number) => {
      if (!visible) {
        raf = 0;
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      time += dt * (propsRef.current.speed ?? 1);
      draw();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduceMotion) {
        draw();
        return;
      }
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    if (shape === "text") {
      // Repaint once the brand font has loaded so the mask uses real glyphs.
      document.fonts?.ready.then(() => {
        if (disposed) return;
        paintText(canvas.width, canvas.height);
        if (reduceMotion || !visible) draw();
      });
    }
    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion || !visible) draw();
    });
    ro.observe(host);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && document.visibilityState === "visible";
        if (visible) start();
      },
      { rootMargin: "120px" },
    );
    io.observe(host);

    const onVisibility = () => {
      visible = document.visibilityState === "visible" && visible;
      if (document.visibilityState === "visible") {
        const r = host.getBoundingClientRect();
        visible = r.bottom > -120 && r.top < window.innerHeight + 120;
        if (visible) start();
      }
    };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      // Free GPU resources but keep the context: StrictMode remounts reuse it.
      if (texture) gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [shape, pixelSize, text, data]);

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <canvas
        ref={canvasRef}
        className="pixelated absolute left-0 top-0 block opacity-0 transition-opacity duration-1000"
      />
    </div>
  );
}

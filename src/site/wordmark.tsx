"use client";

import { useEffect, useRef } from "react";

/*
 * The name at the foot of every page, drawn the way Zuno draws its own name: an ordered dither on
 * the GPU, one fragment per pixel of the dither, upscaled with nearest-neighbour so the pixels stay
 * sharp. The letters drift with a slow flow field, and wobble and flare where the pointer passes.
 * Here they take the hero's three lights across their width, blue to lilac to mint, and break up
 * into pixels as they sink toward the card's foot. Pauses off screen; one still frame for anyone
 * who asks for less motion.
 */

const WORD = "basedraft";
/* CSS pixels per dither cell. */
const CELL = 4;
/* The three lights, left to right, premultiplied as the canvas wants them, for each mode. */
const LIGHTS = {
  light: ["#7d96f0", "#b08be6", "#63c3ae"],
  dark: ["#5f78ea", "#8f68d8", "#3fa596"],
};

const VERTEX = /* glsl */ `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouseActive;
uniform vec4 u_c1;
uniform vec4 u_c2;
uniform vec4 u_c3;
uniform sampler2D u_tex;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * snoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return v;
}
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
float flowField(vec2 p, float t) {
  vec2 q = p * 1.4;
  float n1 = fbm(vec3(q * 0.85, t * 0.05));
  float n2 = fbm(vec3(q * 1.25 + vec2(n1 * 1.6, -n1 * 1.1), t * 0.07 + 7.0));
  return 0.5 + 0.5 * n2;
}

void main() {
  float minRes = min(u_res.x, u_res.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / minRes;
  vec2 m = (u_mouse - 0.5 * u_res) / minRes;
  float t = u_time;
  float th = bayer8(gl_FragCoord.xy) + 1.0 / 128.0;
  float md = length(p - m);
  vec2 uv = gl_FragCoord.xy / u_res;

  // The glyphs, wobbling with the noise and more under the pointer.
  float infl = u_mouseActive * exp(-md * md * 7.0);
  vec2 warp = vec2(snoise(vec3(p * 3.5, t * 0.35)), snoise(vec3(p * 3.5 + 9.0, t * 0.35)));
  vec2 suv = uv + warp * (0.003 + infl * 0.022);
  vec2 px = 1.6 / u_res;
  float mask = texture2D(u_tex, suv).r * 0.4;
  mask += texture2D(u_tex, suv + vec2(px.x, 0.0)).r * 0.15;
  mask += texture2D(u_tex, suv - vec2(px.x, 0.0)).r * 0.15;
  mask += texture2D(u_tex, suv + vec2(0.0, px.y)).r * 0.15;
  mask += texture2D(u_tex, suv - vec2(0.0, px.y)).r * 0.15;

  float n = flowField(p * 0.9, t * 1.4);
  float v = mask * (0.5 + 0.55 * n + infl * 0.6);
  // A faint drift of pixels around the letters, brighter near the pointer.
  float halo = (1.0 - mask) * (smoothstep(0.55, 1.0, n) * 0.16 + infl * 0.3);
  // Sinking toward the card's foot: thinner the lower it goes.
  float sink = smoothstep(0.0, 0.62, uv.y);
  v *= mix(0.25, 1.0, sink);
  halo *= sink;

  // The three lights across the width.
  vec4 light = uv.x < 0.5 ? mix(u_c1, u_c2, uv.x * 2.0) : mix(u_c2, u_c3, uv.x * 2.0 - 1.0);
  vec4 col = vec4(0.0);
  if (v > th) col = light;
  else if (halo > th) col = light * 0.45;
  gl_FragColor = col;
}
`;

const rgba = (hex: string): [number, number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

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

export function Wordmark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
    if (!gl || gl.isContextLost()) return;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return;
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    const loc = { res: u("u_res"), time: u("u_time"), mouse: u("u_mouse"), mouseActive: u("u_mouseActive"), c1: u("u_c1"), c2: u("u_c2"), c3: u("u_c3"), tex: u("u_tex") };

    // The word, white on black at the canvas's size, fitted by its ink box: the shader reads it as a mask.
    let texture: WebGLTexture | null = null;
    const paintText = (w: number, h: number) => {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const ctx = off.getContext("2d")!;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      const family = getComputedStyle(host).fontFamily || "sans-serif";
      const setFont = (size: number) => {
        ctx.font = `600 ${size}px ${family}`;
        if ("letterSpacing" in ctx) ctx.letterSpacing = `${-size * 0.055}px`;
      };
      setFont(100);
      const probe = ctx.measureText(WORD);
      const inkH = probe.actualBoundingBoxAscent + probe.actualBoundingBoxDescent || 70;
      setFont(100 * Math.min((w * 0.96) / probe.width, (h * 0.9) / inkH));
      const metrics = ctx.measureText(WORD);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(WORD, w / 2, h / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2);
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

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.ceil(rect.width / CELL));
      const h = Math.max(1, Math.ceil(rect.height / CELL));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = `${w * CELL}px`;
        canvas.style.height = `${h * CELL}px`;
        gl.viewport(0, 0, w, h);
        paintText(w, h);
      }
    };

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, inside: false };
    const mouse = { x: 0, y: 0, active: 0 };
    let time = 6 + Math.random() * 20;
    let last = 0;
    let raf = 0;
    let visible = false;
    let disposed = false;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const within = pointer.inside && pointer.x > rect.left && pointer.x < rect.right && pointer.y > rect.top - rect.height * 0.2 && pointer.y < rect.bottom;
      if (within) {
        mouse.x += ((pointer.x - rect.left) / CELL - mouse.x) * 0.09;
        mouse.y += ((rect.bottom - pointer.y) / CELL - mouse.y) * 0.09;
      }
      mouse.active += ((within ? 1 : 0) - mouse.active) * 0.05;
      const dark = document.documentElement.dataset.theme === "dark" && !canvas.closest(".bd-light");
      const [c1, c2, c3] = LIGHTS[dark ? "dark" : "light"].map(rgba);
      gl.uniform2f(loc.res, canvas.width, canvas.height);
      gl.uniform1f(loc.time, time);
      gl.uniform2f(loc.mouse, mouse.x, mouse.y);
      gl.uniform1f(loc.mouseActive, mouse.active);
      gl.uniform4fv(loc.c1, c1);
      gl.uniform4fv(loc.c2, c2);
      gl.uniform4fv(loc.c3, c3);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      canvas.style.opacity = "1";
    };
    const loop = (now: number) => {
      if (!visible) {
        raf = 0;
        return;
      }
      time += last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (still) return draw();
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    // Drawn again once basedraft's display face has loaded, so the mask has its real letters.
    document.fonts?.ready.then(() => {
      if (disposed) return;
      paintText(canvas.width, canvas.height);
      if (still || !visible) draw();
    });
    const ro = new ResizeObserver(() => {
      resize();
      if (still || !visible) draw();
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
    // A switch of light and dark between frames, for the still frame.
    const mo = new MutationObserver(() => (still || !visible) && draw());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      if (texture) gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <div aria-hidden className="relative h-[clamp(9rem,24vw,26rem)] select-none overflow-hidden font-display">
      <canvas ref={canvasRef} className="pixelated absolute left-0 top-0 block opacity-0 transition-opacity duration-1000" />
    </div>
  );
}

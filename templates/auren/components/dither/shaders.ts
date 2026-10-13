/**
 * Fragment shaders render a scalar "light" field, then `dither()` quantises it
 * to four palette inks (--dither-0…3) with an 8×8 Bayer matrix.
 */

export const PRELUDE = /* glsl */ `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_hover;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;

float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

vec3 dither(float v) {
  float t = bayer8(gl_FragCoord.xy) + 0.0078125;
  float s = clamp(v, 0.0, 1.0) * 3.0;
  float b = floor(s);
  float i = b + step(t, s - b);
  if (i < 0.5) return u_c0;
  if (i < 1.5) return u_c1;
  if (i < 2.5) return u_c2;
  return u_c3;
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}
`;

/** Aurora curtains hanging over a horizon; the cursor bends and lights them. */
export const AURORA = /* glsl */ `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * ar, uv.y);
  vec2 m = vec2(u_mouse.x * ar, u_mouse.y);
  float t = u_time;

  vec2 w = vec2(fbm(p * 0.7 + vec2(t * 0.020, 0.0)), fbm(p * 0.7 + vec2(4.1, t * 0.016)));
  float near = exp(-pow((p.x - m.x) * 1.6, 2.0)) * u_hover;

  // the light lives to the right; a thin glow runs along the whole horizon
  float env = mix(0.14, 1.0, smoothstep(0.3, 0.95, uv.x));
  env *= mix(0.45, 1.0, smoothstep(0.7, 1.3, ar));

  // primary curtain: a bright hem with fine rays; its height drifts slowly along x
  float hem = 0.1 + 0.03 * sin(p.x * 1.3 + t * 0.16 + w.x * 4.0)
                  + 0.012 * sin(p.x * 3.4 - t * 0.11)
                  + 0.08 * near * (m.y - 0.1);
  float d = uv.y - hem;
  float rays = fbm(vec2(p.x * 13.0 + w.y * 6.0, t * 0.05));
  float tall = env * (0.45 + 0.75 * fbm(vec2(p.x * 1.6 + w.x * 1.5, t * 0.03)));
  float reach = mix(12.0, 1.5, tall);
  float a = smoothstep(-0.01, 0.015, d) * exp(-max(d, 0.0) * reach) * (0.4 + 2.6 * rays * rays);

  // a fainter fold behind it, on the far right
  float hem2 = 0.3 + 0.05 * sin(p.x * 0.85 - t * 0.12 + w.y * 3.0);
  float d2 = uv.y - hem2;
  float rays2 = fbm(vec2(p.x * 16.0 - w.x * 4.0, t * 0.04 + 9.0));
  float a2 = 0.5 * smoothstep(-0.01, 0.02, d2) * exp(-max(d2, 0.0) * 5.0)
           * (0.1 + rays2 * rays2) * smoothstep(0.55, 0.98, uv.x);

  float md = distance(p, m);
  float glow = u_hover * 0.38 * exp(-md * md * 20.0);

  float v = a * env + a2 + glow;
  v *= smoothstep(0.0, 0.05, uv.y);
  gl_FragColor = vec4(dither(v), 1.0);
}
`;

/** A raymarched torus lit from the cursor. */
export const TORUS = /* glsl */ `
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float map(vec3 p) {
  p.yz *= rot(0.9 + (u_mouse.y - 0.5) * 0.6 + u_time * 0.11);
  p.xz *= rot(u_time * 0.17 + (u_mouse.x - 0.5) * 0.8);
  vec2 q = vec2(length(p.xz) - 0.86, p.y);
  return length(q) - 0.32;
}

vec3 normal(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy),
                        map(p + e.yxy) - map(p - e.yxy),
                        map(p + e.yyx) - map(p - e.yyx)));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec3 ro = vec3(0.0, 0.0, 4.4);
  vec3 rd = normalize(vec3(uv, -1.6));
  float dist = 0.0;
  float hit = 0.0;
  for (int i = 0; i < 72; i++) {
    float d = map(ro + rd * dist);
    if (d < 0.001) { hit = 1.0; break; }
    dist += d;
    if (dist > 8.0) break;
  }

  vec3 lp = vec3((u_mouse.x - 0.5) * 6.0, (u_mouse.y - 0.5) * 6.0, 3.0);
  float v;
  if (hit > 0.5) {
    vec3 p = ro + rd * dist;
    vec3 n = normal(p);
    vec3 l = normalize(lp - p);
    float diff = max(dot(n, l), 0.0);
    float spec = pow(max(dot(reflect(-l, n), -rd), 0.0), 28.0);
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    v = 0.04 + 0.78 * diff + 0.55 * spec + 0.18 * rim;
  } else {
    // a soft pool of light on the "floor" behind the object
    v = 0.12 * exp(-dot(uv - vec2(0.0, -0.05), uv - vec2(0.0, -0.05)) * 3.5);
  }
  gl_FragColor = vec4(dither(v), 1.0);
}
`;

/**
 * The mark, alive: a sun on the horizon with a rippling, dithered reflection.
 * SUN_X places the sun so each page gets its own sunrise.
 */
const HORIZON = /* glsl */ `
float sunField(vec2 q, vec2 sun) {
  float R = 0.27;
  float d = length(q - sun);
  float disc = smoothstep(R + 0.004, R - 0.004, d) * mix(1.0, 0.62, smoothstep(0.0, R, d));
  float halo = 0.42 * exp(-max(d - R, 0.0) * 6.5);
  return max(disc, halo);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  vec2 p = vec2((uv.x - 0.5) * ar, uv.y);
  vec2 m = vec2((u_mouse.x - 0.5) * ar, u_mouse.y);
  float t = u_time;
  float horizon = 0.36;

  // the sun leans toward the cursor
  float sx = SUN_X * ar;
  vec2 sun = vec2(sx + (m.x - sx) * 0.12 * u_hover, horizon + 0.07 + 0.012 * sin(t * 0.3));

  float v;
  if (uv.y > horizon) {
    v = sunField(p, sun) + 0.1 * exp(-(uv.y - horizon) * 5.0);
  } else {
    float depth = horizon - uv.y;
    float wob = sin(depth * 150.0 - t * 1.4) * 0.008 * (0.3 + depth * 4.0)
              + (noise(vec2(depth * 26.0, t * 0.4)) - 0.5) * 0.16 * depth;
    vec2 q = vec2(p.x + wob, horizon + depth * 1.3);
    float streak = smoothstep(0.3, 0.7, noise(vec2(p.x * 2.5 + t * 0.12, depth * 60.0)));
    v = sunField(q, sun) * max(0.0, 0.9 - depth * 1.6) * (0.25 + 0.75 * streak);
  }
  // a clean horizon line, like the gap in the logo
  v *= smoothstep(0.004, 0.012, abs(uv.y - horizon));
  float md = distance(p, m);
  v += u_hover * 0.22 * exp(-md * md * 30.0);
  gl_FragColor = vec4(dither(v), 1.0);
}
`;

export const horizon = (sunX: number) => HORIZON.replaceAll("SUN_X", sunX.toFixed(3));

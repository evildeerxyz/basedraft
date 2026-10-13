export const VERTEX_SHADER = /* glsl */ `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/*
 * Every effect runs at "cell" resolution: one fragment = one dither pixel.
 * The canvas is then upscaled with nearest-neighbour filtering, so the GPU
 * only shades a fraction of the screen and the pixels stay razor sharp.
 */
const COMMON = /* glsl */ `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouseActive;
uniform vec4 u_front;
uniform vec4 u_second;
uniform float u_scale;
uniform float u_intensity;
uniform vec3 u_orb;
uniform float u_ring;
uniform float u_flow;
uniform sampler2D u_tex;
uniform float u_reveal;
uniform float u_count;

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
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
    i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
    i.x + vec4(0.0, i1.x, i2.x, 1.0));
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
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v;
}

float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

float flowField(vec2 p, float t) {
  vec2 q = p * u_scale;
  float n1 = fbm(vec3(q * 0.85, t * 0.05));
  float n2 = fbm(vec3(q * 1.25 + vec2(n1 * 1.6, -n1 * 1.1), t * 0.07 + 7.0));
  return 0.5 + 0.5 * n2;
}
`;

const MAIN = /* glsl */ `
void main() {
  float minRes = min(u_res.x, u_res.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / minRes;
  vec2 m = (u_mouse - 0.5 * u_res) / minRes;
  float t = u_time;
  float th = bayer8(gl_FragCoord.xy) + 1.0 / 128.0;
  float md = length(p - m);
  vec4 col = vec4(0.0);

#if SHAPE == 0
  // Flow: domain-warped fbm that blooms around the cursor.
  float v = smoothstep(0.32, 0.95, flowField(p, t));
  v += u_mouseActive * 0.5 * exp(-md * md * 9.0);
  v *= u_intensity;
  if (v > th) col = u_front;

#elif SHAPE == 1
  // Planet: lit sphere + optional ring + optional flow field around it.
  vec2 c = (u_orb.xy * u_res - 0.5 * u_res) / minRes;
  float r = u_orb.z;
  vec2 d = (p - c) / r;
  float dl = length(d);
  vec2 md2 = (m - c) / r;
  vec3 L = normalize(mix(vec3(-0.6, 0.55, 0.62), vec3(clamp(md2, -1.8, 1.8), 0.7), u_mouseActive));

  float orbV = 0.0;
  bool insideOrb = dl < 1.0;
  if (insideOrb) {
    vec3 N = vec3(d, sqrt(1.0 - dl * dl));
    float diff = clamp(dot(N, L), 0.0, 1.0);
    float a = t * 0.09;
    vec3 Nr = vec3(N.x * cos(a) - N.z * sin(a), N.y, N.x * sin(a) + N.z * cos(a));
    float surf = fbm(Nr * 1.9 + vec3(0.0, 0.0, t * 0.02));
    float bands = sin(N.y * 20.0 + surf * 3.5);
    orbV = diff * (0.82 + 0.4 * surf) + 0.1 * bands * diff;
    orbV += pow(1.0 - N.z, 3.5) * 0.4 * (0.4 + 0.6 * clamp(dot(normalize(d + 1e-4), L.xy), 0.0, 1.0));
    orbV = clamp(orbV, 0.0, 1.0);
  } else {
    orbV = exp(-(dl - 1.0) * 8.0) * 0.28;
  }

  float ringV = 0.0;
  if (u_ring > 0.5) {
    float tilt = -0.32;
    vec2 dr = vec2(d.x * cos(tilt) - d.y * sin(tilt), d.x * sin(tilt) + d.y * cos(tilt));
    float e = length(vec2(dr.x, dr.y / 0.2));
    float band = smoothstep(1.32, 1.42, e) * (1.0 - smoothstep(1.86, 2.0, e));
    float gap = 1.0 - 0.75 * smoothstep(0.03, 0.0, abs(e - 1.62));
    float ang = atan(dr.y / 0.2, dr.x);
    float grain = 0.65 + 0.35 * snoise(vec3(cos(ang - t * 0.15) * 2.0, sin(ang - t * 0.15) * 2.0, e * 5.0));
    ringV = band * gap * grain * 0.85;
    // The back half of the ring disappears behind the sphere.
    if (insideOrb && dr.y > 0.0) ringV = 0.0;
  }

  float flowV = 0.0;
  if (u_flow > 0.0) {
    flowV = smoothstep(0.2, 0.92, flowField(p, t));
    flowV *= smoothstep(1.05, 2.1, dl) * u_flow * u_intensity;
    flowV += u_mouseActive * 0.4 * exp(-md * md * 14.0) * step(1.0, dl);
  }

  if (max(orbV, ringV) > th) col = u_front;
  else if (flowV > th) col = u_second;

#elif SHAPE == 2
  // Ripple: concentric sonar rings with a noisy wavefront.
  vec2 c = (u_orb.xy * u_res - 0.5 * u_res) / minRes;
  vec2 dd = p - c;
  float d = length(dd);
  float n = fbm(vec3(dd * 2.4, t * 0.15));
  float waves = 0.5 + 0.5 * sin(d * 22.0 - t * 1.6 + n * 1.6);
  waves = smoothstep(0.35, 1.0, waves);
  float v = waves * exp(-d * 2.6) * 1.05;
  v += exp(-d * d * 22.0) * 0.5;
  v += u_mouseActive * 0.55 * exp(-md * md * 10.0) * (0.5 + 0.5 * sin(md * 44.0 - t * 5.0));
  v *= u_intensity;
  if (v > th) col = u_front;

#elif SHAPE == 3
  // Text: a glyph mask that wobbles and flares under the cursor.
  vec2 uv = gl_FragCoord.xy / u_res;
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
  v += (1.0 - mask) * smoothstep(0.55, 1.0, n) * 0.22;
  v += (1.0 - mask) * infl * 0.3;
  v *= u_intensity;
  if (v > th) col = (mask > 0.5) ? u_front : u_second;

#elif SHAPE == 4
  // Chart: a dithered terrain under a price series (heights in u_tex.r).
  vec2 uv = gl_FragCoord.xy / u_res;
  float tx = (uv.x * (u_count - 1.0) + 0.5) / u_count;
  float h = texture2D(u_tex, vec2(tx, 0.5)).r;
  float mx = u_mouse.x / u_res.x;
  float cellY = 1.0 / u_res.y;
  float v = 0.0;
  if (uv.y < h) {
    float depth = (h - uv.y) / max(h, 0.001);
    v = mix(0.82, 0.03, pow(depth, 0.5));
    float n = fbm(vec3(uv.x * 7.0, uv.y * 4.0, t * 0.06));
    v += n * 0.14;
    // slow light sweep travelling along the time axis
    float sweep = exp(-pow((fract(uv.x - t * 0.035) - 0.5) * 9.0, 2.0));
    v += sweep * 0.12 * (1.0 - depth);
  } else {
    v = exp(-(uv.y - h) / (cellY * 5.0)) * 0.45;
  }
  // cursor: a bright scan column; the "future" right of it dims
  float band = exp(-pow((uv.x - mx) * u_res.x / 10.0, 2.0));
  float below = step(uv.y, h);
  v += u_mouseActive * band * 0.45 * below;
  v *= mix(1.0, uv.x > mx ? 0.32 : 1.0, u_mouseActive);
  // reveal from the left with a dithered edge
  v *= smoothstep(u_reveal + 0.002, u_reveal - 0.03, uv.x);
  v *= u_intensity;
  if (v > th) col = (uv.y < h + cellY * 0.5) ? u_front : u_second;
#endif

  gl_FragColor = col;
}
`;

export const SHAPES = { flow: 0, planet: 1, ripple: 2, text: 3, chart: 4 } as const;
export type DitherShape = keyof typeof SHAPES;

export function fragmentShader(shape: DitherShape) {
  return `#define SHAPE ${SHAPES[shape]}\n${COMMON}\n${MAIN}`;
}

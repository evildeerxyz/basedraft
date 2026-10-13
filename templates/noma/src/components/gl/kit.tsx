"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { MotionValue } from "motion/react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber";

/**
 * Noma's WebGL kit: isometric scenes rendered like a printed technical
 * engraving. Surfaces are shaded in three tones with ordered (Bayer)
 * dithering, every solid gets crisp ink edges, and colours follow the theme.
 */

export type Family = "paper" | "sand" | "ink" | "void" | "accent" | "green" | "blue" | "pink";

type Tones = [string, string, string]; // light, mid, dark

const LIGHT: Record<Family, Tones> & { edge: string } = {
  paper: ["#ffffff", "#eee6d8", "#d2c5ae"],
  sand: ["#efe7d8", "#ddd0b9", "#bfb094"],
  ink: ["#4a4238", "#2b261f", "#16130f"],
  void: ["#3a332b", "#2b261f", "#16130f"],
  accent: ["#ffbb4d", "#ff9e00", "#cf7a00"],
  green: ["#6fdcb6", "#00b383", "#007a59"],
  blue: ["#7cc6ff", "#2fa8ff", "#0071c2"],
  pink: ["#ffb3f6", "#f762f4", "#b52fb2"],
  edge: "#2c2722",
};

const DARK: Record<Family, Tones> & { edge: string } = {
  paper: ["#615749", "#433c33", "#2a2520"],
  sand: ["#4d453b", "#37312a", "#221e1a"],
  ink: ["#fbfaf7", "#e3dbcd", "#b8ad99"],
  void: ["#16130f", "#0f0d0b", "#090807"],
  accent: ["#ffc46b", "#ff9e00", "#b06c00"],
  green: ["#6fd8b2", "#00a678", "#006b4e"],
  blue: ["#8ccfff", "#1f9cf5", "#0067b0"],
  pink: ["#ffa8f3", "#ea55e7", "#a12a9e"],
  edge: "#bdb2a0",
};

const VERTEX = /* glsl */ `
  #include <clipping_planes_pars_vertex>
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
    #include <clipping_planes_vertex>
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uMid;
  uniform vec3 uDark;
  uniform vec3 uDir;
  uniform float uPixel;
  varying vec3 vNormal;
  #include <clipping_planes_pars_fragment>

  float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

  void main() {
    #include <clipping_planes_fragment>
    float i = clamp(dot(normalize(vNormal), normalize(uDir)), 0.0, 1.0);
    float s = clamp((i - 0.12) / 0.72, 0.0, 1.0) * 2.0;
    float t = bayer4(gl_FragCoord.xy / uPixel);
    vec3 c = s < 1.0 ? (s > t ? uMid : uDark) : ((s - 1.0) > t ? uLight : uMid);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;

function makeMaterial(tones: Tones, pixel: number) {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uLight: { value: new THREE.Color(tones[0]) },
      uMid: { value: new THREE.Color(tones[1]) },
      uDark: { value: new THREE.Color(tones[2]) },
      uDir: { value: new THREE.Vector3(0.32, 1, 0.62) },
      uPixel: { value: pixel },
    },
    clipping: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

type Kit = { material: (family: Family) => THREE.ShaderMaterial; edge: THREE.LineBasicMaterial; dashed: THREE.LineDashedMaterial; reduced: boolean; theme: "light" | "dark" };
const KitContext = createContext<Kit | null>(null);

export function useKit() {
  const kit = useContext(KitContext);
  if (!kit) throw new Error("useKit must be used inside <Stage>");
  return kit;
}

/** Resolve the theme that applies to an element (respects scoped data-theme). */
function themeOf(el: Element | null) {
  const scoped = el?.closest("[data-theme]") as HTMLElement | null;
  return (scoped?.dataset.theme ?? document.documentElement.dataset.theme) === "dark" ? "dark" : "light";
}

function useTheme(host: RefObject<HTMLElement | null>) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const update = () => setTheme(themeOf(host.current));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [host]);
  return theme;
}

const FAMILIES: Family[] = ["paper", "sand", "ink", "void", "accent", "green", "blue", "pink"];

function Materials({ theme, children }: { theme: "light" | "dark"; children: ReactNode }) {
  const dpr = useThree((state) => state.viewport.dpr);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const kit = useMemo<Kit & { dispose: () => void }>(() => {
    const palette = theme === "dark" ? DARK : LIGHT;
    const materials = Object.fromEntries(FAMILIES.map((family) => [family, makeMaterial(palette[family], 2 * dpr)])) as Record<Family, THREE.ShaderMaterial>;
    const edge = new THREE.LineBasicMaterial({ color: palette.edge });
    const dashed = new THREE.LineDashedMaterial({ color: palette.edge, dashSize: 0.28, gapSize: 0.2 });
    return {
      material: (family: Family) => materials[family],
      edge,
      dashed,
      reduced,
      theme,
      dispose: () => {
        FAMILIES.forEach((family) => materials[family].dispose());
        edge.dispose();
        dashed.dispose();
      },
    };
  }, [theme, dpr, reduced]);

  useEffect(() => () => kit.dispose(), [kit]);

  return <KitContext.Provider value={kit}>{children}</KitContext.Provider>;
}

/** Isometric camera: looks at the origin from (1, 1, 1); `span` is the world width that fits the canvas. */
function IsoCamera({ span, lift = 0 }: { span: number; lift?: number }) {
  const get = useThree((state) => state.get);
  const width = useThree((state) => state.size.width);
  useLayoutEffect(() => {
    const camera = get().camera as THREE.OrthographicCamera;
    camera.position.set(30, 30 + lift, 30);
    camera.lookAt(0, lift, 0);
    camera.zoom = width / span;
    camera.updateProjectionMatrix();
  }, [get, width, span, lift]);
  return null;
}

/** WebGL stage: transparent canvas, fixed isometric camera, pauses when off-screen. Not interactive. */
export function Stage({ className, span = 18, lift = 0, children, overlay }: { className?: string; span?: number; lift?: number; children: ReactNode; overlay?: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const theme = useTheme(host);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={host} className={className ?? "absolute inset-0"}>
      <Canvas
        orthographic
        dpr={[1, 2]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ near: -200, far: 400 }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
        }}
      >
        <IsoCamera span={span} lift={lift} />
        <Materials theme={theme}>{children}</Materials>
      </Canvas>
      {overlay}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Solids                                                                   */
/* ------------------------------------------------------------------------ */

type MeshProps = Omit<ThreeElements["mesh"], "geometry" | "material">;

/** A mesh with the dither material and crisp ink edges. `clipBelow` hides everything under that world height, so a solid can slide into a hole. */
export function Solid({
  geometry,
  family = "paper",
  edges = true,
  threshold = 20,
  clipBelow,
  children,
  ...props
}: { geometry: THREE.BufferGeometry; family?: Family; edges?: boolean; threshold?: number; clipBelow?: number; children?: ReactNode } & MeshProps) {
  const { material, edge } = useKit();
  const edgeGeometry = useMemo(() => (edges ? new THREE.EdgesGeometry(geometry, threshold) : null), [geometry, edges, threshold]);
  useEffect(() => () => edgeGeometry?.dispose(), [edgeGeometry]);
  const base = material(family);
  const clipped = useMemo(() => {
    if (clipBelow === undefined) return null;
    const planes = [new THREE.Plane(new THREE.Vector3(0, 1, 0), -clipBelow)];
    const fill = base.clone();
    fill.clippingPlanes = planes;
    const line = edge.clone();
    line.clippingPlanes = planes;
    return { fill, line };
  }, [base, edge, clipBelow]);
  useEffect(
    () => () => {
      clipped?.fill.dispose();
      clipped?.line.dispose();
    },
    [clipped],
  );
  return (
    <mesh geometry={geometry} material={clipped?.fill ?? base} {...props}>
      {edgeGeometry && <lineSegments geometry={edgeGeometry} material={clipped?.line ?? edge} />}
      {children}
    </mesh>
  );
}

/** Box geometry that sits on y = 0 (its base at the origin). */
export function useBox(w: number, h: number, d: number) {
  return useMemo(() => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0);
    return g;
  }, [w, h, d]);
}

export function useCylinder(r: number, h: number, segments = 40) {
  return useMemo(() => {
    const g = new THREE.CylinderGeometry(r, r, h, segments);
    g.translate(0, h / 2, 0);
    return g;
  }, [r, h, segments]);
}

/** Extrude one of the path-built `shapes` into a solid (drawn in x/y, extruded along z, centred). */
export function useShape<K extends keyof typeof shapes>(kind: K, args: Parameters<(typeof shapes)[K]>, depth: number, anchor: "base" | "middle" = "base") {
  const key = JSON.stringify(args);
  return useMemo(() => {
    const build = shapes[kind] as (...a: number[]) => THREE.Shape;
    const g = new THREE.ExtrudeGeometry(build(...(JSON.parse(key) as number[])), { depth, bevelEnabled: false, curveSegments: 24 });
    g.computeBoundingBox();
    const box = g.boundingBox!;
    const dy = anchor === "base" ? -box.min.y : -(box.min.y + box.max.y) / 2;
    g.translate(-(box.min.x + box.max.x) / 2, dy, -depth / 2);
    return g;
  }, [kind, key, depth, anchor]);
}

/** A path shape laid flat as a plate of thickness `h`, centred on the origin, base at y = 0. */
export function usePlate<K extends keyof typeof shapes>(kind: K, args: Parameters<(typeof shapes)[K]>, h: number) {
  const g = useShape(kind, args, h, "middle");
  return useMemo(() => {
    const plate = g.clone();
    plate.rotateX(-Math.PI / 2);
    plate.translate(0, h / 2, 0);
    return plate;
  }, [g, h]);
}

/** Dashed line through points (the Noma dashed-triangle language). */
export function Dashed({ points, closed = false }: { points: THREE.Vector3[]; closed?: boolean }) {
  const { dashed } = useKit();
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(closed ? [...points, points[0]] : points);
    const l = new THREE.Line(geometry, dashed);
    l.computeLineDistances();
    return l;
  }, [points, closed, dashed]);
  return <primitive object={line} />;
}

/* ------------------------------------------------------------------------ */
/* Path-built shapes                                                        */
/* ------------------------------------------------------------------------ */

export const shapes = {
  /** Stage plate: a long octagon with one notched corner. */
  stage(w = 16, d = 11, cut = 1.6, notch = 2.4) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + cut, -d / 2);
    s.lineTo(w / 2 - notch, -d / 2);
    s.lineTo(w / 2 - notch, -d / 2 + notch * 0.6);
    s.lineTo(w / 2, -d / 2 + notch * 0.6);
    s.lineTo(w / 2, d / 2 - cut);
    s.lineTo(w / 2 - cut, d / 2);
    s.lineTo(-w / 2 + cut, d / 2);
    s.lineTo(-w / 2, d / 2 - cut);
    s.lineTo(-w / 2, -d / 2 + cut);
    s.lineTo(-w / 2 + cut, -d / 2);
    return s;
  },
  /** Chevron arrow (direction markers on the track). */
  chevron(w = 0.9, t = 0.3) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(t, 0);
    s.lineTo(w, w / 2);
    s.lineTo(t, w);
    s.lineTo(0, w);
    s.lineTo(w - t, w / 2);
    s.lineTo(0, 0);
    return s;
  },
};

const scratch = new THREE.Vector3();

/** Publishes the screen position of a 3D point to motion values (for DOM labels). */
export function Pin({ x, y, position }: { x: MotionValue<number>; y: MotionValue<number>; position: [number, number, number] }) {
  const get = useThree((state) => state.get);
  const anchor = useRef<THREE.Object3D>(null);
  useFrame(() => {
    if (!anchor.current) return;
    const { camera, size } = get();
    anchor.current.getWorldPosition(scratch);
    scratch.project(camera);
    x.set(((scratch.x + 1) / 2) * size.width);
    y.set(((1 - scratch.y) / 2) * size.height);
  });
  return <object3D ref={anchor} position={position} />;
}

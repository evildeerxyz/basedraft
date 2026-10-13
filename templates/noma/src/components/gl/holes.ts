"use client";

import { useMemo } from "react";
import * as THREE from "three";

/*
 * Solids with real openings, so anything that moves can travel through them
 * instead of popping in or out. A tunnel body is a box whose lower part has
 * channels cut from chosen sides to the centre, with a lid on top that has a
 * round shaft through it.
 */

export type Side = "+x" | "-x" | "+z" | "-z";

/** Extrude footprint shapes (drawn in x/z) upward from y = 0 to y = h. */
function extrudeUp(shapes: THREE.Shape[], h: number, segments = 32) {
  const g = new THREE.ExtrudeGeometry(shapes, { depth: h, bevelEnabled: false, curveSegments: segments });
  // shape (u, v) → world (u, ·, v); extrusion runs down, so lift it back up
  g.rotateX(Math.PI / 2);
  g.translate(0, h, 0);
  return g;
}

/**
 * The lower part of a tunnel body: a w × w footprint split into a 3 × 3 grid
 * (channel width in the middle). The centre cell and the arm towards each open
 * side are cut away; the remaining cells are traced into outline polygons.
 */
function tunnelFootprint(w: number, channel: number, sides: Side[]) {
  const a = w / 2;
  const c = channel / 2;
  const bands = [-a, -c, c, a];
  const open = new Set<string>(["1,1"]);
  if (sides.includes("+x")) open.add("2,1");
  if (sides.includes("-x")) open.add("0,1");
  if (sides.includes("+z")) open.add("1,2");
  if (sides.includes("-z")) open.add("1,0");
  const solid = (i: number, j: number) => i >= 0 && i < 3 && j >= 0 && j < 3 && !open.has(`${i},${j}`);

  // Boundary edges of the solid cells, walked counter-clockwise; shared edges cancel out.
  const next = new Map<string, string>();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (!solid(i, j)) continue;
      const corners: [number, number][] = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ];
      const neighbours: [number, number][] = [
        [i, j - 1],
        [i + 1, j],
        [i, j + 1],
        [i - 1, j],
      ];
      for (let k = 0; k < 4; k++) {
        if (solid(...neighbours[k])) continue;
        const [x0, y0] = corners[k];
        const [x1, y1] = corners[(k + 1) % 4];
        next.set(`${x0},${y0}`, `${x1},${y1}`);
      }
    }
  }

  const shapes: THREE.Shape[] = [];
  const seen = new Set<string>();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const loop: THREE.Vector2[] = [];
    let at = start;
    while (!seen.has(at)) {
      seen.add(at);
      const [gi, gj] = at.split(",").map(Number);
      loop.push(new THREE.Vector2(bands[gi], bands[gj]));
      at = next.get(at)!;
    }
    shapes.push(new THREE.Shape(loop));
  }
  return shapes;
}

/** A square plate with a round hole through its middle (u, v centred). */
function holedPlate(w: number, radius: number) {
  const a = w / 2;
  const shape = new THREE.Shape([new THREE.Vector2(-a, -a), new THREE.Vector2(a, -a), new THREE.Vector2(a, a), new THREE.Vector2(-a, a)]);
  if (radius > 0) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, radius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  return shape;
}

/**
 * Geometry for a box with doorways on `sides` and a round shaft through the lid.
 * Both pieces sit on y = 0: `body` fills 0 to h - lid, `lid` fills h - lid to h.
 */
export function useTunnelBox(w: number, h: number, lid: number, channel: number, sides: Side[], shaft: number) {
  const key = sides.join("|");
  return useMemo(() => {
    const body = extrudeUp(tunnelFootprint(w, channel, key ? (key.split("|") as Side[]) : []), h - lid);
    const top = extrudeUp([holedPlate(w, shaft)], lid, 40);
    top.translate(0, h - lid, 0);
    return { body, lid: top };
  }, [w, h, lid, channel, key, shaft]);
}

/** A ring (a disc with a round hole), base at y = 0. */
export function useRing(radius: number, hole: number, h: number, segments = 48) {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    const inner = new THREE.Path();
    inner.absarc(0, 0, hole, 0, Math.PI * 2, true);
    shape.holes.push(inner);
    return extrudeUp([shape], h, segments);
  }, [radius, hole, h, segments]);
}

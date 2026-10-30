"use client";

import { useState, type ComponentProps } from "react";

/*
 * A person's picture, or a face drawn from their name: two colors, one dithered into the other, so
 * the same person always looks the same. A dot in the corner says whether they're here, busy or
 * away. In a group they overlap, with a count for the rest, and fan out when you point at them.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SIZES = { sm: "size-7 text-[10px]", md: "size-9 text-xs", lg: "size-12 text-sm" } as const;
const DOT = { sm: "size-2", md: "size-2.5", lg: "size-3" } as const;
const STATUS = { online: "bg-[var(--bd-ui-ok)]", busy: "bg-[var(--bd-ui-stop)]", away: "bg-[var(--bd-ui-wait)]" } as const;
/* How far each one in a group tucks under the one before, and how far apart they fan when pointed at. */
const STACK = {
  sm: "[&>*+*]:-ml-2 hover:[&>*+*]:ml-0.5",
  md: "[&>*+*]:-ml-2 hover:[&>*+*]:ml-1",
  lg: "[&>*+*]:-ml-3.5 hover:[&>*+*]:ml-1",
} as const;

export type AvatarProps = ComponentProps<"span"> & { src?: string; name: string; size?: keyof typeof SIZES; status?: keyof typeof STATUS };

/*
 * A face for someone without a picture, the way Vercel draws them: two colors picked by their name,
 * one dithered into the other through a 4 by 4 ordered matrix, so the same name always gets the
 * same face.
 */
const FACE_BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const FACE_CELLS = 12;
/** The second color's cells, as one path, for each way the gradient can run. */
const FACE_RAMPS = [0, 1, 2, 3].map((dir) => {
  const n = FACE_CELLS - 1;
  let d = "";
  for (let y = 0; y < FACE_CELLS; y++)
    for (let x = 0; x < FACE_CELLS; x++) {
      const t = dir === 0 ? x / n : dir === 1 ? y / n : dir === 2 ? (x + y) / (2 * n) : (x + n - y) / (2 * n);
      if ((FACE_BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16 < t * 1.25 - 0.12) d += `M${x} ${y}h1v1h-1z`;
    }
  return d;
});
/** Light and deep, in the muted colors basedraft uses: ocean, pine, moss, ochre, clay, rose, plum, slate. */
const FACE_COLORS: Array<[string, string]> = [
  ["oklch(0.86 0.07 235)", "oklch(0.47 0.13 252)"],
  ["oklch(0.87 0.07 170)", "oklch(0.46 0.09 172)"],
  ["oklch(0.9 0.08 128)", "oklch(0.55 0.12 138)"],
  ["oklch(0.91 0.09 88)", "oklch(0.64 0.14 62)"],
  ["oklch(0.87 0.07 45)", "oklch(0.55 0.14 35)"],
  ["oklch(0.87 0.08 8)", "oklch(0.52 0.16 2)"],
  ["oklch(0.86 0.09 330)", "oklch(0.48 0.15 318)"],
  ["oklch(0.89 0.02 255)", "oklch(0.44 0.04 258)"],
];
const faceSeed = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/** Someone's dithered face, filling its box; give it colors to draw it in theirs. */
function Face({ name, colors }: { name: string; colors?: [string, string] }) {
  const seed = faceSeed(name);
  const [light, deep] = colors ?? FACE_COLORS[seed % FACE_COLORS.length];
  return (
    <svg viewBox={`0 0 ${FACE_CELLS} ${FACE_CELLS}`} shapeRendering="crispEdges" aria-hidden className="block size-full">
      <rect width={FACE_CELLS} height={FACE_CELLS} style={{ fill: light }} />
      <path d={FACE_RAMPS[(seed >>> 5) % 4]} style={{ fill: deep }} />
    </svg>
  );
}


export function Avatar({ src, name, size = "md", status, className, ...props }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cx("relative inline-flex shrink-0", SIZES[size], className)} title={name} {...props}>
      <span className="relative grid size-full place-items-center overflow-hidden rounded-full after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]">
        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} onError={() => setFailed(true)} className="size-full object-cover" />
        ) : (
          <span role="img" aria-label={name} className="size-full">
            <Face name={name} />
          </span>
        )}
      </span>
      {status && <span role="img" aria-label={status} className={cx("absolute bottom-0 right-0 rounded-full ring-2 ring-[var(--bd-surface)]", DOT[size], STATUS[status])} />}
    </span>
  );
}

export function AvatarGroup({ people, max = 4, size = "md", className }: { people: Array<{ name: string; src?: string; status?: keyof typeof STATUS }>; max?: number; size?: keyof typeof SIZES; className?: string }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className={cx("flex items-center [&>*]:transition-[margin] [&>*]:duration-300 [&>*]:ease-[var(--bd-ease)]", STACK[size], className)}>
      {shown.map((p) => (
        <Avatar key={p.name} {...p} size={size} className="rounded-full ring-2 ring-[var(--bd-surface)]" />
      ))}
      {rest > 0 && (
        <span className={cx("relative inline-grid shrink-0 place-items-center rounded-full bg-[var(--bd-ui-track)] font-semibold text-[var(--bd-muted)] shadow-[var(--bd-ui-well)] ring-2 ring-[var(--bd-surface)]", SIZES[size])} title={people.slice(max).map((p) => p.name).join(", ")}>
          +{rest}
        </span>
      )}
    </span>
  );
}

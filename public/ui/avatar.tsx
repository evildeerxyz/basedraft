"use client";

import { useState, type ComponentProps } from "react";

/*
 * A person's picture, or their initials on a soft stone tint drawn from their name, so the same
 * person always looks the same. A dot in the corner says whether they're here, busy or away. In a
 * group they overlap, with a count for the rest, and fan out when you point at them.
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

/** A hue from 0 to 359 for a name, the same every time. */
const hue = (name: string) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export function Avatar({ src, name, size = "md", status, className, ...props }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const h = hue(name);
  return (
    <span className={cx("relative inline-flex shrink-0", SIZES[size], className)} title={name} {...props}>
      <span
        className="grid size-full place-items-center overflow-hidden rounded-full font-semibold tracking-[0.02em] shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_0_0_1px_rgb(0_0_0/0.06)]"
        style={{ backgroundImage: `linear-gradient(150deg, oklch(0.94 0.022 ${h}), oklch(0.82 0.035 ${h + 40}))`, color: `oklch(0.34 0.03 ${h})` }}
      >
        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} onError={() => setFailed(true)} className="size-full object-cover" />
        ) : (
          <span role="img" aria-label={name}>
            {initials}
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

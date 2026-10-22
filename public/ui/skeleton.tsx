import type { ComponentProps } from "react";

/*
 * Where something will be, while it loads: solid gray blocks, lines and circles, a clear step
 * darker than any card so they read on white and on gray alike, with a shimmer
 * that isn't a gloss but a band of fine dots passing through them, like grain catching the light.
 * They're only shapes, hidden from screen readers; mark the region they fill aria-busy instead.
 * With reduced motion the band stays out of sight.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/*
 * The band of dots and its sweep, set once for every skeleton on the page (React 19 hoists a
 * style with an href and keeps one copy).
 */
const SWEEP = `@keyframes bd-ui-skeleton{from{-webkit-mask-position:100% 0;mask-position:100% 0}to{-webkit-mask-position:0% 0;mask-position:0% 0}}.bd-ui-skeleton-sweep{background-image:radial-gradient(circle,rgb(var(--bd-ink)/.22) .7px,transparent 1.1px);background-size:4px 4px;-webkit-mask-image:linear-gradient(90deg,transparent 38%,#000 50%,transparent 62%);mask-image:linear-gradient(90deg,transparent 38%,#000 50%,transparent 62%);-webkit-mask-size:300% 100%;mask-size:300% 100%;animation:bd-ui-skeleton 1.9s cubic-bezier(.45,0,.55,1) infinite}@media (prefers-reduced-motion:reduce){.bd-ui-skeleton-sweep{animation:none;opacity:0}}`;

const SHAPES = { block: "rounded-[12px]", line: "h-3 rounded-full", circle: "rounded-full" } as const;

export type SkeletonProps = ComponentProps<"span"> & {
  /** A block for pictures and cards, a line for text, a circle for avatars and icons. Size it with className. */
  shape?: keyof typeof SHAPES;
};

export function Skeleton({ shape = "block", className, ...props }: SkeletonProps) {
  return (
    <span aria-hidden className={cx("relative block overflow-hidden bg-[var(--bd-ui-track)]", SHAPES[shape], className)} {...props}>
      <style href="bd-ui-skeleton" precedence="medium">
        {SWEEP}
      </style>
      <span className="bd-ui-skeleton-sweep absolute inset-0" />
    </span>
  );
}

export type SkeletonTextProps = Omit<ComponentProps<"span">, "children"> & {
  /** How many lines. The last is shorter, the way a paragraph ends. */
  lines?: number;
};

export function SkeletonText({ lines = 3, className, ...props }: SkeletonTextProps) {
  return (
    <span aria-hidden className={cx("grid w-full gap-2.5", className)} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} shape="line" className={i === lines - 1 && lines > 1 ? "w-[62%]" : "w-full"} />
      ))}
    </span>
  );
}

const AVATARS = { sm: "size-7", md: "size-9", lg: "size-12" } as const;

export type SkeletonAvatarProps = Omit<ComponentProps<"span">, "children"> & { size?: keyof typeof AVATARS };

export function SkeletonAvatar({ size = "md", className, ...props }: SkeletonAvatarProps) {
  return <Skeleton shape="circle" className={cx("shrink-0", AVATARS[size], className)} {...props} />;
}

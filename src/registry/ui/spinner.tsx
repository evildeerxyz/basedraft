import type { ComponentProps } from "react";

/*
 * A loader drawn as a ring of dots, the way the Button's loading dots are: a bright crest sweeps
 * around the ring, and each dot's turn is nudged by an ordered-dither matrix, so the crest's tail
 * dissolves the way a printed gradient does rather than fading smoothly. It takes the text's color.
 * With reduced motion it holds still, as a ring that fades around once.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* A 4 by 4 ordered-dither matrix: how much each dot's turn is nudged. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/* How wide it is, and how many dots across: more dots as it grows, so they stay fine. */
const SIZES = { sm: { px: 16, n: 5 }, md: { px: 24, n: 7 }, lg: { px: 40, n: 11 } } as const;
/* One trip round the ring, in seconds: the same as the animation's length below. */
const TURN = 1.1;

export type SpinnerProps = Omit<ComponentProps<"span">, "children"> & {
  size?: keyof typeof SIZES;
  /** What a screen reader hears. Say what's loading when you can. */
  label?: string;
};

export function Spinner({ size = "md", label = "Loading", className, ...props }: SpinnerProps) {
  const { px, n } = SIZES[size];
  const c = (n - 1) / 2;
  const gap = n > 7 ? 1.5 : 1;
  const dot = (px - gap * (n - 1)) / n;
  return (
    <span role="status" aria-label={label} className={cx("inline-grid shrink-0 place-items-center", className)} style={{ width: px, height: px }} {...props}>
      <span aria-hidden className="grid" style={{ gridTemplateColumns: `repeat(${n}, ${dot}px)`, gap }}>
        {Array.from({ length: n * n }, (_, i) => {
          const x = (i % n) - c;
          const y = Math.floor(i / n) - c;
          const d = Math.hypot(x, y);
          // Only the dots that make a ring: inside the edge, and out of the middle.
          if (d > c + 0.25 || d < c * 0.45) return <span key={i} style={{ width: dot, height: dot }} />;
          // Where it sits round the ring, from the top going clockwise, as a share of a turn.
          const turn = (Math.atan2(x, -y) / (2 * Math.PI) + 1) % 1;
          const nudge = (BAYER[(Math.floor(i / n) % 4) * 4 + ((i % n) % 4)] / 16) * 0.18;
          const delay = -(1 - turn) * TURN + nudge;
          return (
            <span
              key={i}
              className="rounded-full bg-current animate-[bd-ui-dither_1.1s_linear_infinite] motion-reduce:animate-none"
              style={{ width: dot, height: dot, animationDelay: `${delay.toFixed(3)}s`, opacity: 0.18 + turn * 0.7 }}
            />
          );
        })}
      </span>
    </span>
  );
}

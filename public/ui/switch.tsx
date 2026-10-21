"use client";

import { motion } from "motion/react";
import { useState, type ComponentProps } from "react";

/*
 * An on and off switch: a track pressed into the page, filling with ink when it's on, and a bead
 * for a knob that stretches while you press it and springs across when you let go.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

const SIZES = {
  sm: { track: "h-5 w-[34px]", knob: 14, stretch: 4 },
  md: { track: "h-[26px] w-11", knob: 20, stretch: 5 },
} as const;

export type SwitchProps = Omit<ComponentProps<"button">, "onChange"> & { checked?: boolean; defaultChecked?: boolean; onCheckedChange?: (checked: boolean) => void; size?: keyof typeof SIZES };

export function Switch({ checked, defaultChecked = false, onCheckedChange, size = "md", className, disabled, ...props }: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked);
  const [pressed, setPressed] = useState(false);
  const on = checked ?? inner;
  const s = SIZES[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => {
        setInner(!on);
        onCheckedChange?.(!on);
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      className={cx(
        "relative inline-flex shrink-0 items-center rounded-full p-[3px] shadow-[var(--bd-ui-well)] transition-[background-color] duration-300 disabled:cursor-not-allowed disabled:opacity-45",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--bd-ui-focus)]",
        on ? "justify-end [background:var(--bd-ui-ink)]" : "justify-start bg-[var(--bd-surface-2)]",
        s.track,
        className,
      )}
      {...props}
    >
      <motion.span
        layout="position"
        animate={{ width: pressed ? s.knob + s.stretch : s.knob }}
        transition={{ type: "spring", stiffness: 640, damping: 34 }}
        className={cx("block rounded-full shadow-[0_1px_1px_rgb(var(--bd-shade)/0.2),0_2px_6px_-1px_rgb(var(--bd-shade)/0.28),inset_0_-1px_0_rgb(var(--bd-ink)/0.06)]", on ? "[background:var(--bd-ui-bead-on)]" : "[background:var(--bd-ui-bead)]")}
        style={{ height: s.knob, width: s.knob }}
      />
    </button>
  );
}

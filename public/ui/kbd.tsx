"use client";

import { useEffect, useState, type ComponentProps } from "react";

/*
 * A keyboard key drawn as a real keycap, a raised face on a darker edge. It listens for its own
 * key: press that key on your keyboard (or click the cap) and it goes down, the way the key under
 * your finger does. Write the key as you'd see it on a Mac: ⌘, ⇧, ⌥, ⌃, ↵, or a letter.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* The symbol on a cap, as the key the browser reports. */
const KEYS: Record<string, string> = { "⌘": "Meta", "⇧": "Shift", "⌥": "Alt", "⌃": "Control", "↵": "Enter", "⌫": "Backspace", Esc: "Escape", Tab: "Tab", Space: " ", "←": "ArrowLeft", "→": "ArrowRight", "↑": "ArrowUp", "↓": "ArrowDown" };

const SIZES = {
  sm: "h-5 min-w-5 rounded-[5px] px-1 text-[10.5px]",
  md: "h-7 min-w-7 rounded-[7px] px-1.5 text-xs",
} as const;

export type KbdProps = ComponentProps<"kbd"> & { size?: keyof typeof SIZES; /** Go down when this key is pressed on the keyboard. */ listen?: boolean };

export function Kbd({ size = "md", listen = true, className, children, ...props }: KbdProps) {
  const label = typeof children === "string" ? children : "";
  const key = KEYS[label] ?? label;
  const [down, setDown] = useState(false);
  useEffect(() => {
    if (!listen || !key) return;
    const match = (e: KeyboardEvent) => (key.length === 1 ? e.key.toLowerCase() === key.toLowerCase() : e.key === key);
    const press = (e: KeyboardEvent) => match(e) && setDown(true);
    // On a Mac, keys let go while ⌘ is held never say so; letting go of ⌘ lets go of them all.
    const lift = (e: KeyboardEvent) => (match(e) || e.key === "Meta") && setDown(false);
    const reset = () => setDown(false);
    window.addEventListener("keydown", press);
    window.addEventListener("keyup", lift);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", press);
      window.removeEventListener("keyup", lift);
      window.removeEventListener("blur", reset);
    };
  }, [listen, key]);
  return (
    <kbd
      onPointerDown={() => setDown(true)}
      onPointerUp={() => setDown(false)}
      onPointerLeave={() => setDown(false)}
      className={cx(
        "inline-flex select-none items-center justify-center font-sans font-medium text-[var(--bd-fg)] [background:var(--bd-ui-raised)] transition-[translate,box-shadow] duration-100 ease-out",
        down
          ? "translate-y-[1.5px] shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_0_0_1px_rgb(var(--bd-ink)/0.12),0_0.5px_0_rgb(var(--bd-ink)/0.2)]"
          : "shadow-[inset_0_1px_0_rgb(255_255_255/0.7),inset_0_0_0_1px_rgb(var(--bd-ink)/0.1),0_2px_0_rgb(var(--bd-ink)/0.16),0_3px_6px_-2px_rgb(var(--bd-shade)/0.22)]",
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export function KbdGroup({ className, ...props }: ComponentProps<"span">) {
  return <span className={cx("inline-flex items-center gap-1", className)} {...props} />;
}

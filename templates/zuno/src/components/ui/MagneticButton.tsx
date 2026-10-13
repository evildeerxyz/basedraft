"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, type PointerEvent, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  strength?: number;
  onClick?: () => void;
  type?: "button" | "submit";
}

/** Pulls toward the cursor; the label lags behind for a parallax wobble. */
export function MagneticButton({ children, className, href, strength = 0.35, onClick, type = "button" }: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 14, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 220, damping: 14, mass: 0.5 });
  const ix = useTransform(sx, (v) => v * 0.45);
  const iy = useTransform(sy, (v) => v * 0.45);

  const onMove = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const content = (
    <motion.span style={{ x: ix, y: iy }} className="relative z-10 inline-flex items-center gap-2.5">
      {children}
    </motion.span>
  );

  const shared = {
    onPointerMove: onMove,
    onPointerLeave: reset,
    style: { x: sx, y: sy },
    whileTap: { scale: 0.96 },
    className: cn(
      "group relative inline-flex select-none items-center justify-center overflow-hidden font-medium",
      className,
    ),
  };

  if (href) {
    return (
      <motion.a ref={ref as Ref<HTMLAnchorElement>} href={href} onClick={onClick} {...shared}>
        {content}
      </motion.a>
    );
  }
  return (
    <motion.button ref={ref as Ref<HTMLButtonElement>} type={type} onClick={onClick} {...shared}>
      {content}
    </motion.button>
  );
}

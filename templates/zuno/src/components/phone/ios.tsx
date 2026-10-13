"use client";

import { BackspaceIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { pal } from "@/lib/palette";

/* iOS dark-mode system colours, tinted with the Zuno accent. */
export const C = {
  label: "#ffffff",
  secondary: "rgba(235,235,245,0.6)",
  tertiary: "rgba(235,235,245,0.5)",
  separator: "rgba(84,84,88,0.65)",
  card: "#1c1c1e",
  card2: "#2c2c2e",
  fill: "rgba(120,120,128,0.24)",
  get accent() {
    return pal.accent;
  },
  red: "#ff453a",
  onAccent: "#0a0a0a",
};

export const glass =
  "bg-[rgba(30,30,32,0.66)] backdrop-blur-[24px] backdrop-saturate-150 shadow-[inset_0_0.5px_0_rgba(255,255,255,0.2),0_10px_30px_rgba(0,0,0,0.45)] ring-[0.5px] ring-white/[0.1]";

/** Scrollable screen with an iOS large title that collapses into the nav bar. */
export function Screen({
  title,
  right,
  left,
  children,
  bottomInset = 120,
}: {
  title?: string;
  right?: ReactNode;
  left?: ReactNode;
  children: ReactNode;
  bottomInset?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="absolute inset-0 bg-black">
      <div
        className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain"
        style={{ paddingTop: 62, paddingBottom: bottomInset }}
        onScroll={(e) => setCollapsed(e.currentTarget.scrollTop > 34)}
      >
        {title && (
          <div className="flex h-[52px] items-end justify-between px-[20px] pb-[2px]">
            <div className="text-[34px] font-bold leading-none tracking-[-0.035em]">{title}</div>
            {right}
          </div>
        )}
        {children}
      </div>
      {/* inline nav bar that fades in once the large title scrolls away */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[106px] items-end justify-center rounded-t-[62px] border-b-[0.5px] pb-[12px] backdrop-blur-xl"
        initial={false}
        animate={{
          opacity: collapsed ? 1 : 0,
          backgroundColor: collapsed ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0)",
          borderColor: collapsed ? "rgba(84,84,88,0.5)" : "rgba(84,84,88,0)",
        }}
        transition={{ duration: 0.2 }}
      >
        {left && <span className="pointer-events-auto absolute bottom-[8px] left-[12px]">{left}</span>}
        <span className="text-[17px] font-semibold tracking-[-0.02em]">{title}</span>
      </motion.div>
    </div>
  );
}

export function SectionHeader({ children, action, onAction }: { children: ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-baseline justify-between px-[20px] pb-[8px] pt-[26px]">
      <span className="text-[20px] font-semibold tracking-[-0.025em]">{children}</span>
      {action && (
        <button onClick={onAction} className="text-[15px]" style={{ color: C.accent }}>
          {action}
        </button>
      )}
    </div>
  );
}

export function Group({ children, footer, className }: { children: ReactNode; footer?: string; className?: string }) {
  return (
    <div className={cn("px-[16px]", className)}>
      <div className="overflow-hidden rounded-[22px]" style={{ background: C.card }}>
        {children}
      </div>
      {footer && (
        <p className="px-[16px] pt-[8px] text-[13px] leading-[1.35]" style={{ color: C.secondary }}>
          {footer}
        </p>
      )}
    </div>
  );
}

export function Row({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  valueColor,
  chevron,
  onClick,
  last,
  children,
  titleColor,
}: {
  icon?: ReactNode;
  iconBg?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  valueColor?: string;
  chevron?: boolean;
  onClick?: () => void;
  last?: boolean;
  children?: ReactNode;
  titleColor?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={cn("flex w-full items-center gap-[12px] pl-[16px] text-left", onClick && "active:bg-white/[0.06]")}>
      {icon && (
        <span className="grid size-[30px] shrink-0 place-items-center rounded-[8px] text-white" style={{ background: iconBg ?? C.card2 }}>
          {icon}
        </span>
      )}
      <span
        className="flex min-h-[52px] min-w-0 flex-1 items-center gap-[10px] py-[10px] pr-[16px]"
        style={{ borderBottom: last ? "none" : `0.5px solid ${C.separator}` }}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] tracking-[-0.02em]" style={{ color: titleColor }}>
            {title}
          </span>
          {subtitle && (
            <span className="block truncate text-[13px]" style={{ color: C.secondary }}>
              {subtitle}
            </span>
          )}
        </span>
        {value !== undefined && (
          <span className="shrink-0 text-[17px] tabular-nums tracking-[-0.02em]" style={{ color: valueColor ?? C.secondary }}>
            {value}
          </span>
        )}
        {children}
        {chevron && <CaretRightIcon size={14} weight="bold" style={{ color: C.tertiary }} />}
      </span>
    </Tag>
  );
}

/** UISwitch: 51 × 31 with a spring-loaded knob. */
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200"
      style={{ background: on ? C.accent : C.fill }}
    >
      <motion.span
        className="absolute left-[2px] top-[2px] block size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.25)]"
        initial={false}
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
      />
    </button>
  );
}

export function Segmented<T extends string>({ options, value, onChange, id }: { options: readonly T[]; value: T; onChange: (v: T) => void; id: string }) {
  return (
    <div className="flex rounded-[10px] p-[2px]" style={{ background: C.fill }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} aria-pressed={o === value} className="relative h-[30px] flex-1 text-[13px] font-semibold">
          {o === value && (
            <motion.span
              layoutId={id}
              className="absolute inset-0 rounded-[8px] shadow-[0_3px_8px_rgba(0,0,0,0.12)]"
              style={{ background: "#636366" }}
              transition={{ type: "spring", stiffness: 500, damping: 36 }}
            />
          )}
          <span className="relative">{o}</span>
        </button>
      ))}
    </div>
  );
}

export function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-[2px] text-[17px]" style={{ color: C.accent }}>
      <CaretLeftIcon size={22} weight="bold" />
      {label}
    </button>
  );
}

export function Button({
  children,
  onClick,
  kind = "primary",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "secondary";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={disabled ? undefined : onClick}
      className={cn("flex h-[52px] items-center justify-center gap-[8px] rounded-full text-[17px] font-semibold tracking-[-0.02em] transition-opacity", disabled && "opacity-40", className)}
      style={kind === "primary" ? { background: C.accent, color: C.onAccent } : { background: C.card2, color: C.label }}
    >
      {children}
    </motion.button>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;

/** Cash App-style amount keypad. */
export function Keypad({ onKey }: { onKey: (k: (typeof KEYS)[number]) => void }) {
  return (
    <div className="grid grid-cols-3 px-[24px]">
      {KEYS.map((k) => (
        <motion.button
          key={k}
          whileTap={{ scale: 0.86, backgroundColor: "rgba(255,255,255,0.08)" }}
          onClick={() => onKey(k)}
          className="grid h-[58px] place-items-center rounded-full text-[28px] font-medium"
          aria-label={k === "del" ? "Delete" : k}
        >
          {k === "del" ? <BackspaceIcon size={26} /> : k}
        </motion.button>
      ))}
    </div>
  );
}

export function applyKey(current: string, k: string) {
  if (k === "del") return current.length > 1 ? current.slice(0, -1) : "0";
  if (k === ".") return current.includes(".") ? current : `${current}.`;
  const [, dec] = current.split(".");
  if (dec !== undefined && dec.length >= 2) return current;
  if (current === "0") return k;
  if (current.replace(".", "").length >= 7) return current;
  return current + k;
}

export function TickerLogo({ h, size = 40 }: { h: { logo: { bg: string; fg: string; text: string } }; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold"
      style={{ background: h.logo.bg, color: h.logo.fg, width: size, height: size, fontSize: size * 0.4 }}
    >
      {h.logo.text}
    </span>
  );
}

"use client";

import { ArrowsClockwiseIcon, ChartPieSliceIcon, HouseIcon, UserCircleIcon, WalletIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoMark } from "../ui/Logo";
import { C, glass } from "./ios";
import { AccountScreen, CashScreen, HomeScreen, InvestScreen, StockScreen } from "./screens";
import { SheetHost } from "./sheets";
import { STATUS_BAR } from "./statusBar";
import { PhoneScope, usePhone, type Tab } from "./store";

/* The screen is laid out in real iPhone points (402 × 874) and scaled to fit. */
const SCREEN_W = 402;
const SCREEN_H = 874;
const SPRING = { type: "spring", stiffness: 380, damping: 40 } as const;

/* ---------- system chrome ---------- */

function StatusBar() {
  return (
    <svg
      viewBox={`0 0 ${STATUS_BAR.width} ${STATUS_BAR.height}`}
      width={STATUS_BAR.width}
      height={STATUS_BAR.height}
      className="pointer-events-none absolute left-0 top-0 z-30 text-white"
      aria-hidden
    >
      {STATUS_BAR.glyphs.map((g) => (
        <path key={g.name} d={g.d} fill="currentColor" fillRule={g.evenOdd ? "evenodd" : undefined} clipRule={g.evenOdd ? "evenodd" : undefined} />
      ))}
    </svg>
  );
}

/** The island at its exact position; widens into a compact Live Activity for trades. */
function DynamicIsland() {
  const { x, y, width, height, radius } = STATUS_BAR.island;
  const [live, setLive] = useState(false);

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout>;
    const show = () => {
      setLive(true);
      hide = setTimeout(() => setLive(false), 4200);
    };
    const first = setTimeout(show, 2600);
    const loop = setInterval(show, 9000);
    return () => {
      clearTimeout(first);
      clearTimeout(hide);
      clearInterval(loop);
    };
  }, []);

  const centre = x + width / 2;
  return (
    <motion.div
      className="absolute z-40 overflow-hidden bg-black"
      style={{ top: y, height, borderRadius: radius }}
      initial={false}
      // Compact presentation: grows sideways but stays clear of the clock and signal glyphs.
      animate={live ? { width: 164, left: centre - 82 } : { width, left: x }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
    >
      <AnimatePresence>
        {live && (
          <motion.div
            className="flex h-full items-center justify-between pl-[6px] pr-[12px]"
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)", transition: { delay: 0.14 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <span className="grid size-[24px] place-items-center rounded-full" style={{ background: C.accent, color: C.onAccent }}>
              <ArrowsClockwiseIcon size={14} weight="bold" />
            </span>
            <span className="text-[14px] font-semibold tabular-nums" style={{ color: C.accent }}>
              +$240
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const TABS: Array<{ id: Tab; label: string; icon: typeof HouseIcon }> = [
  { id: "home", label: "Home", icon: HouseIcon },
  { id: "invest", label: "Invest", icon: ChartPieSliceIcon },
  { id: "cash", label: "Cash", icon: WalletIcon },
  { id: "account", label: "Account", icon: UserCircleIcon },
];

/** iOS 26 floating tab bar, plus the Zuno button that opens Copilot. */
function TabBar({ hidden }: { hidden: boolean }) {
  const p = usePhone();
  return (
    <motion.div
      className="absolute inset-x-[16px] bottom-[25px] z-30 flex gap-[10px]"
      initial={false}
      animate={{ y: hidden ? 130 : 0 }}
      transition={SPRING}
    >
      <div className={cn("grid h-[62px] flex-1 grid-cols-4 rounded-full p-[4px]", glass)}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const on = p.tab === id;
          return (
            <button key={id} onClick={() => p.setTab(id)} aria-current={on ? "page" : undefined} className="relative flex flex-col items-center justify-center gap-[2px]">
              {on && <motion.span layoutId="phone-tab-pill" className="absolute inset-0 rounded-full bg-white/[0.13]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
              <Icon size={24} weight={on ? "fill" : "regular"} className="relative" style={{ color: on ? C.accent : "rgba(255,255,255,0.9)" }} />
              <span className="relative text-[10.5px] font-medium tracking-[-0.01em]" style={{ color: on ? C.accent : "rgba(255,255,255,0.9)" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => p.openSheet({ kind: "copilot" })}
        aria-label="Ask Copilot"
        className={cn("grid size-[62px] place-items-center rounded-full", glass)}
      >
        <LogoMark size={34} animated={false} />
      </motion.button>
    </motion.div>
  );
}

function TabScreen({ tab, play }: { tab: Tab; play: boolean }) {
  if (tab === "invest") return <InvestScreen />;
  if (tab === "cash") return <CashScreen />;
  if (tab === "account") return <AccountScreen />;
  return <HomeScreen play={play} />;
}

function PhoneApp({ play }: { play: boolean }) {
  const p = usePhone();
  const edge = useDragControls();
  const sheetOpen = Boolean(p.sheet);

  return (
    <>
      {/* everything behind a sheet recedes like an iOS page sheet */}
      <motion.div
        className="absolute inset-0 overflow-hidden bg-black"
        style={{ transformOrigin: "50% 0%" }}
        initial={false}
        animate={sheetOpen ? { scale: 0.92, y: 22, borderRadius: 40 } : { scale: 1, y: 0, borderRadius: 0 }}
        transition={SPRING}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={p.tab}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: p.stock ? -100 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.16 }, x: SPRING }}
          >
            <TabScreen tab={p.tab} play={play} />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {p.stock && (
            <motion.div
              key={p.stock}
              className="absolute inset-0 z-20 shadow-[-14px_0_36px_rgba(0,0,0,0.6)]"
              initial={{ x: SCREEN_W }}
              animate={{ x: 0 }}
              exit={{ x: SCREEN_W }}
              transition={SPRING}
              drag="x"
              dragListener={false}
              dragControls={edge}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0, right: 1 }}
              onDragEnd={(_, info) => {
                if (info.offset.x > 110 || info.velocity.x > 500) p.closeStock();
              }}
            >
              <StockScreen sym={p.stock} play={play} />
              {/* iOS edge swipe: drag from the left edge to go back */}
              <div className="absolute inset-y-0 left-0 z-30 w-[22px] touch-none" onPointerDown={(e) => edge.start(e)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* scroll-edge fade behind the floating tab bar (stock screens bring their own) */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[140px] bg-gradient-to-t from-black via-black/80 to-transparent"
          initial={false}
          animate={{ opacity: p.stock ? 0 : 1 }}
        />
        <TabBar hidden={Boolean(p.stock)} />
      </motion.div>

      <SheetHost />
      <StatusBar />
      <DynamicIsland />
      <span className="pointer-events-none absolute bottom-[8px] left-1/2 z-[60] h-[5px] w-[139px] -translate-x-1/2 rounded-full bg-white" />
    </>
  );
}

/* ---------- device ---------- */

export function PhoneMockup({ play = true, width = 320 }: { play?: boolean; width?: number }) {
  const scale = width / SCREEN_W;
  const screenH = Math.round(SCREEN_H * scale);
  const radius = Math.round(62 * scale);
  const bezel = 7;
  const edge = 3;

  return (
    <div className="theme-dark relative select-none" style={{ width: width + (bezel + edge) * 2 }}>
      {/* action, volume, side and camera-control buttons */}
      {[
        { side: "left", top: 118, h: 28 },
        { side: "left", top: 170, h: 50 },
        { side: "left", top: 232, h: 50 },
        { side: "right", top: 192, h: 78 },
        { side: "right", top: 430, h: 42 },
      ].map((b) => (
        <span
          key={`${b.side}-${b.top}`}
          className={cn("absolute w-[3px] bg-[#3c3c3e]", b.side === "left" ? "-left-[2px] rounded-l" : "-right-[2px] rounded-r")}
          style={{ top: Math.round((b.top * width) / 320), height: Math.round((b.h * width) / 320) }}
        />
      ))}
      <div
        className="bg-gradient-to-b from-[#626264] via-[#2c2c2e] to-[#4e4e50] shadow-[0_40px_80px_-30px_var(--zn-shadow)]"
        style={{ padding: edge, borderRadius: radius + bezel + edge }}
      >
        <div className="bg-black" style={{ padding: bezel, borderRadius: radius + bezel }}>
          {/* clip-path (not just overflow) so blurred nav bars can't leak past the rounded display */}
          <div
            className="relative isolate overflow-hidden bg-black text-white"
            style={{ width, height: screenH, borderRadius: radius, clipPath: `inset(0 round ${radius}px)` }}
          >
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale.toFixed(4)})` }}>
              <PhoneScope>
                <PhoneApp play={play} />
              </PhoneScope>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

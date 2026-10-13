"use client";

import {
  ArrowDownIcon,
  ArrowsClockwiseIcon,
  ArrowUpIcon,
  BankIcon,
  BellIcon,
  BellRingingIcon,
  CaretDownIcon,
  CarIcon,
  CoffeeIcon,
  CoinsIcon,
  FileTextIcon,
  ForkKnifeIcon,
  LeafIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  PercentIcon,
  ReceiptIcon,
  RepeatIcon,
  ScalesIcon,
  ScanSmileyIcon,
  ShoppingBagIcon,
  StarIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { linePath, makeSeries } from "@/lib/chart";
import { cn, formatUSD } from "@/lib/utils";
import { LogoMark } from "../ui/Logo";
import { RollingNumber } from "../ui/RollingNumber";
import { ACTIVITY, CASH_ACTIVITY, CLASS_COLORS, RISK_TARGETS, type AssetClass, type Holding } from "./data";
import { BackButton, Button, C, glass, Group, Row, Screen, SectionHeader, Segmented, TickerLogo, Toggle } from "./ios";
import { PriceBlock } from "./PriceBlock";
import { usePhone } from "./store";

function Sparkline({ seed, up }: { seed: number; up: boolean }) {
  const d = useMemo(() => linePath(makeSeries(seed, 20, up ? 0.6 : -0.6), 52, 22, 2), [seed, up]);
  return (
    <svg viewBox="0 0 52 22" className="h-[22px] w-[52px] shrink-0" aria-hidden>
      <path d={d} fill="none" stroke={up ? C.accent : C.red} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function HoldingRow({ h, last, onClick }: { h: Holding; last: boolean; onClick: () => void }) {
  const up = h.chg >= 0;
  return (
    <button onClick={onClick} className="flex w-full items-center gap-[12px] pl-[16px] text-left active:bg-white/[0.06]">
      <TickerLogo h={h} />
      <span className="flex h-[66px] min-w-0 flex-1 items-center gap-[10px] pr-[16px]" style={{ borderBottom: last ? "none" : `0.5px solid ${C.separator}` }}>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[17px] font-semibold tracking-[-0.02em]">{h.sym}</span>
          <span className="block truncate text-[13px]" style={{ color: C.secondary }}>
            {h.shares < 1 ? h.shares.toFixed(3) : h.shares.toFixed(1)} {h.cls === "Crypto" ? h.sym : "shares"}
          </span>
        </span>
        <Sparkline seed={h.seed} up={up} />
        <span className="w-[100px] text-right leading-tight">
          <span className="block text-[17px] tabular-nums tracking-[-0.02em]">{formatUSD(h.shares * h.price)}</span>
          <span className="block text-[13px] tabular-nums" style={{ color: up ? C.accent : C.red }}>
            {up ? "+" : "−"}
            {Math.abs(h.chg).toFixed(2)}%
          </span>
        </span>
      </span>
    </button>
  );
}

/* ---------------- Home ---------------- */

export function HomeScreen({ play }: { play: boolean }) {
  const p = usePhone();
  return (
    <Screen bottomInset={130}>
      <div className="flex h-[52px] items-center justify-between px-[20px]">
        <button onClick={() => p.setTab("account")} className="flex items-center gap-[10px]">
          <span className="grid size-[36px] place-items-center rounded-full text-[14px] font-semibold" style={{ background: C.card2 }}>
            MC
          </span>
          <span className="flex items-center gap-[4px] text-[17px] font-semibold tracking-[-0.02em]">
            Individual <CaretDownIcon size={13} weight="bold" style={{ color: C.secondary }} />
          </span>
        </button>
        <div className="flex gap-[10px]">
          <span className={cn("grid size-[40px] place-items-center rounded-full", glass)}>
            <MagnifyingGlassIcon size={19} weight="bold" />
          </span>
          <span className={cn("relative grid size-[40px] place-items-center rounded-full", glass)}>
            <BellIcon size={19} weight="bold" />
            <span className="absolute right-[10px] top-[9px] size-[8px] rounded-full" style={{ background: C.red }} />
          </span>
        </div>
      </div>

      <div className="mt-[14px]">
        <PriceBlock
          gradientId="home-chart"
          seed={5}
          value={p.total}
          play={play}
          label={
            <>
              Total value
              <span className="flex items-center gap-[5px] rounded-full px-[8px] py-[2px] text-[12px] font-semibold" style={{ background: "rgba(200,255,62,0.12)", color: C.accent }}>
                <span className="size-[6px] rounded-full" style={{ background: p.autopilot ? C.accent : C.secondary }} />
                {p.autopilot ? "Autopilot on" : "Autopilot paused"}
              </span>
            </>
          }
        />
      </div>

      <Group className="mt-[22px]">
        <Row title="Buying power" value={formatUSD(p.cash)} chevron onClick={() => p.setTab("cash")} />
        <Row title="Autopilot" subtitle={p.autopilot ? "Last rebalance today, 9:32 AM" : "Paused. No automatic trades"} chevron last onClick={() => p.setTab("invest")} />
      </Group>

      <SectionHeader>From Copilot</SectionHeader>
      <Group>
        <button onClick={() => p.openSheet({ kind: "copilot", prompt: 0 })} className="flex w-full gap-[12px] p-[16px] text-left active:bg-white/[0.06]">
          <LogoMark size={30} animated={false} />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[15px] font-semibold tracking-[-0.01em]">Trimmed NVDA, added VXUS</span>
              <span className="shrink-0 text-[13px]" style={{ color: C.secondary }}>
                9:32 AM
              </span>
            </span>
            <span className="mt-[3px] block text-[15px] leading-[1.35]" style={{ color: C.secondary }}>
              NVIDIA reached 9.3% of your portfolio, over your 7% cap. Tap to see the reasoning.
            </span>
          </span>
        </button>
      </Group>

      <SectionHeader action="Invest" onAction={() => p.setTab("invest")}>
        Holdings
      </SectionHeader>
      <Group>
        {p.holdings.map((h, i) => (
          <HoldingRow key={h.sym} h={h} last={i === p.holdings.length - 1} onClick={() => p.openStock(h.sym)} />
        ))}
      </Group>
      <p className="pt-[16px] text-center text-[12px]" style={{ color: C.tertiary }}>
        Market open · closes 4:00 PM ET
      </p>
    </Screen>
  );
}

/* ---------------- Invest ---------------- */

const CLASSES: AssetClass[] = ["US stocks", "International", "Bonds", "Crypto", "Cash"];
const RISKS = ["Conservative", "Balanced", "Growth"] as const;
const RISK_NOTES: Record<string, string> = {
  Conservative: "Expected return 5.2% a year. Typical worst year −8%.",
  Balanced: "Expected return 6.8% a year. Typical worst year −16%.",
  Growth: "Expected return 8.1% a year. Typical worst year −27%.",
};

export function InvestScreen() {
  const p = usePhone();
  const current = useMemo(() => {
    const out = Object.fromEntries(CLASSES.map((c) => [c, 0])) as Record<AssetClass, number>;
    p.holdings.forEach((h) => (out[h.cls] += h.shares * h.price));
    out.Cash = p.cash;
    return CLASSES.map((c) => ({ c, pct: (out[c] / p.total) * 100 }));
  }, [p.holdings, p.cash, p.total]);
  const target = RISK_TARGETS[p.risk];

  return (
    <Screen title="Invest" bottomInset={130}>
      <Group className="mt-[16px]" footer={p.autopilot ? "Zuno rebalances when any asset class drifts more than 2% from target, and harvests losses daily." : "Autopilot is paused. Deposits will sit in cash until you turn it back on."}>
        <Row
          icon={<ArrowsClockwiseIcon size={17} weight="bold" style={{ color: C.onAccent }} />}
          iconBg={C.accent}
          title="Autopilot"
          subtitle={p.autopilot ? "Rebalancing daily" : "Paused"}
          last
        >
          <Toggle on={p.autopilot} onChange={p.setAutopilot} />
        </Row>
      </Group>

      <SectionHeader>Allocation</SectionHeader>
      <div className="px-[16px]">
        <div className="rounded-[22px] p-[16px]" style={{ background: C.card }}>
          <div className="text-[13px]" style={{ color: C.secondary }}>
            Current
          </div>
          <div className="mt-[6px] flex h-[12px] gap-[2px] overflow-hidden rounded-full">
            {current.map(({ c, pct }) => (
              <motion.span key={c} className="h-full" style={{ background: CLASS_COLORS[c] }} initial={false} animate={{ width: `${pct}%` }} />
            ))}
          </div>
          <div className="mt-[12px] text-[13px]" style={{ color: C.secondary }}>
            Target · {p.risk}
          </div>
          <div className="mt-[6px] flex h-[12px] gap-[2px] overflow-hidden rounded-full opacity-60">
            {CLASSES.map((c) => (
              <motion.span key={c} className="h-full" style={{ background: CLASS_COLORS[c] }} initial={false} animate={{ width: `${target[c]}%` }} transition={{ type: "spring", stiffness: 200, damping: 26 }} />
            ))}
          </div>
          <div className="mt-[14px]">
            {current.map(({ c, pct }, i) => {
              const drift = pct - target[c];
              return (
                <div key={c} className="flex h-[40px] items-center gap-[10px] text-[15px]" style={{ borderTop: i ? `0.5px solid ${C.separator}` : "none" }}>
                  <span className="size-[10px] rounded-full" style={{ background: CLASS_COLORS[c] }} />
                  <span className="flex-1">{c}</span>
                  <span className="w-[56px] text-right tabular-nums">{pct.toFixed(1)}%</span>
                  <span className="w-[62px] text-right text-[13px] tabular-nums" style={{ color: Math.abs(drift) > 2 ? C.red : C.secondary }}>
                    {Math.abs(drift) < 0.05 ? "0.0" : `${drift > 0 ? "+" : "−"}${Math.abs(drift).toFixed(1)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SectionHeader>Strategy</SectionHeader>
      <div className="px-[16px]">
        <Segmented id="risk" options={RISKS} value={p.risk as (typeof RISKS)[number]} onChange={p.setRisk} />
        <p className="px-[16px] pt-[8px] text-[13px]" style={{ color: C.secondary }}>
          {RISK_NOTES[p.risk]}
        </p>
      </div>

      <SectionHeader>Recurring</SectionHeader>
      <Group>
        <Row icon={<RepeatIcon size={17} weight="bold" />} iconBg="#0a84ff" title="$250 every Monday" subtitle="From Chase Checking ••4417" chevron last />
      </Group>

      <SectionHeader>Recent activity</SectionHeader>
      <Group>
        {ACTIVITY.map((a, i) => (
          <Row
            key={a.title + a.when}
            icon={a.amt < 0 ? <TrendDownIcon size={16} weight="bold" /> : a.amt === 0 ? <LeafIcon size={16} weight="fill" /> : <TrendUpIcon size={16} weight="bold" />}
            iconBg={C.card2}
            title={a.title}
            subtitle={`${a.detail} · ${a.when}`}
            value={a.amt === 0 ? "" : formatUSD(Math.abs(a.amt))}
            valueColor={C.label}
            last={i === ACTIVITY.length - 1}
          />
        ))}
      </Group>
    </Screen>
  );
}

/* ---------------- Cash ---------------- */

const CASH_ICONS = { coffee: CoffeeIcon, percent: PercentIcon, car: CarIcon, bank: BankIcon, food: ForkKnifeIcon, bag: ShoppingBagIcon };

function LiveInterest() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    // ~$0.54 a day on this balance, sped up so the accrual is visible.
    let v = 14.621803;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      v += (now - last) * 0.0000004;
      last = now;
      if (ref.current) ref.current.textContent = v.toFixed(6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <span className="tabular-nums" style={{ color: C.label }}>
      +$<span ref={ref}>14.621803</span>
    </span>
  );
}

export function CashScreen() {
  const p = usePhone();
  return (
    <Screen title="Cash" bottomInset={130}>
      <div className="px-[20px] pt-[12px]">
        <div className="text-[15px]" style={{ color: C.secondary }}>
          Available to invest or withdraw
        </div>
        <div className="mt-[4px] text-[46px] font-semibold leading-none tracking-[-0.04em]">
          <RollingNumber value={formatUSD(p.cash)} />
        </div>
        <div className="mt-[12px] flex items-center gap-[10px] text-[14px]">
          <span className="rounded-full px-[9px] py-[3px] font-semibold" style={{ background: "rgba(200,255,62,0.12)", color: C.accent }}>
            4.10% APY
          </span>
          <span style={{ color: C.secondary }}>
            This month <LiveInterest />
          </span>
        </div>
      </div>

      <div className="mt-[22px] grid grid-cols-2 gap-[10px] px-[16px]">
        <Button onClick={() => p.openSheet({ kind: "transfer", dir: "deposit" })}>
          <ArrowDownIcon size={18} weight="bold" /> Deposit
        </Button>
        <Button kind="secondary" onClick={() => p.openSheet({ kind: "transfer", dir: "withdraw" })}>
          <ArrowUpIcon size={18} weight="bold" /> Withdraw
        </Button>
      </div>

      <Group className="mt-[24px]" footer="Card purchases round up to the next dollar and the spare change is invested into your portfolio.">
        <Row icon={<CoinsIcon size={17} weight="fill" />} iconBg="#30d158" title="Round-ups" subtitle={p.roundUps ? "$6.42 this week" : "Off"} last>
          <Toggle on={p.roundUps} onChange={p.setRoundUps} />
        </Row>
      </Group>

      {CASH_ACTIVITY.map((day) => (
        <div key={day.day}>
          <div className="px-[36px] pb-[6px] pt-[22px] text-[13px] font-medium uppercase tracking-[0.02em]" style={{ color: C.secondary }}>
            {day.day}
          </div>
          <Group>
            {day.items.map((t, i) => {
              const Icon = CASH_ICONS[t.icon as keyof typeof CASH_ICONS];
              return (
                <Row
                  key={t.title + t.detail}
                  icon={<Icon size={16} weight="fill" />}
                  title={t.title}
                  subtitle={t.detail}
                  value={`${t.amt > 0 ? "+" : "−"}${formatUSD(Math.abs(t.amt))}`}
                  valueColor={t.amt > 0 ? C.accent : C.label}
                  last={i === day.items.length - 1}
                />
              );
            })}
          </Group>
        </div>
      ))}
      <p className="px-[36px] pt-[14px] text-[12px] leading-[1.4]" style={{ color: C.tertiary }}>
        Cash is swept to program banks and eligible for FDIC insurance up to $2.5M. APY is variable.
      </p>
    </Screen>
  );
}

/* ---------------- Account ---------------- */

export function AccountScreen() {
  const [faceId, setFaceId] = useState(true);
  const [alerts, setAlerts] = useState(true);
  return (
    <Screen title="Account" bottomInset={130}>
      <Group className="mt-[16px]">
        <div className="flex items-center gap-[14px] p-[16px]">
          <span className="grid size-[60px] place-items-center rounded-full text-[22px] font-semibold" style={{ background: C.card2 }}>
            MC
          </span>
          <div className="leading-tight">
            <div className="text-[20px] font-semibold tracking-[-0.02em]">Maya Collins</div>
            <div className="mt-[3px] text-[15px]" style={{ color: C.secondary }}>
              Plus member since 2023
            </div>
          </div>
        </div>
      </Group>

      <Group className="mt-[24px]">
        <Row icon={<FileTextIcon size={17} weight="fill" />} iconBg="#0a84ff" title="Statements & documents" chevron />
        <Row icon={<ReceiptIcon size={17} weight="fill" />} iconBg="#30d158" title="Tax center" value="2025 forms" chevron last />
      </Group>

      <Group className="mt-[24px]">
        <Row icon={<ScanSmileyIcon size={17} weight="bold" />} iconBg="#30d158" title="Face ID">
          <Toggle on={faceId} onChange={setFaceId} />
        </Row>
        <Row icon={<BellRingingIcon size={17} weight="fill" />} iconBg="#ff453a" title="Trade notifications">
          <Toggle on={alerts} onChange={setAlerts} />
        </Row>
        <Row icon={<BankIcon size={17} weight="fill" />} iconBg="#5e5ce6" title="Linked accounts" value="Chase ••4417" chevron last />
      </Group>

      <Group className="mt-[24px]">
        <Row icon={<LifebuoyIcon size={17} weight="fill" />} iconBg="#64d2ff" title="Help & support" chevron />
        <Row icon={<ScalesIcon size={17} weight="fill" />} iconBg="#8e8e93" title="Legal & disclosures" chevron last />
      </Group>

      <Group className="mt-[24px]">
        <Row title={<span className="block text-center">Sign out</span>} titleColor={C.red} last />
      </Group>
      <p className="pt-[16px] text-center text-[13px]" style={{ color: C.tertiary }}>
        Zuno 4.2 (1180)
      </p>
    </Screen>
  );
}

/* ---------------- Stock detail (pushed) ---------------- */

const TAB_LABEL = { home: "Home", invest: "Invest", cash: "Cash", account: "Account" };

export function StockScreen({ sym, play }: { sym: string; play: boolean }) {
  const p = usePhone();
  const [fav, setFav] = useState(false);
  const h = p.holdings.find((x) => x.sym === sym)!;
  const value = h.shares * h.price;
  const ret = (h.price - h.avgCost) * h.shares;
  const retPct = (h.price / h.avgCost - 1) * 100;

  return (
    <div className="absolute inset-0 bg-black">
      <div className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain" style={{ paddingTop: 62, paddingBottom: 150 }}>
        <div className="flex h-[44px] items-center justify-between px-[8px]">
          <BackButton label={TAB_LABEL[p.tab]} onClick={p.closeStock} />
          <button onClick={() => setFav((f) => !f)} className={cn("mr-[8px] grid size-[36px] place-items-center rounded-full", glass)} aria-label="Watchlist">
            <motion.span key={String(fav)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
              <StarIcon size={18} weight={fav ? "fill" : "bold"} style={{ color: fav ? C.accent : C.label }} />
            </motion.span>
          </button>
        </div>
        <div className="mt-[8px] flex items-center gap-[12px] px-[20px]">
          <TickerLogo h={h} size={44} />
          <div className="min-w-0 leading-tight">
            <div className="text-[22px] font-bold tracking-[-0.03em]">{h.sym}</div>
            <div className="truncate text-[13px]" style={{ color: C.secondary }}>
              {h.name}
            </div>
          </div>
        </div>
        <div className="mt-[18px]">
          <PriceBlock gradientId={`stock-${sym}`} seed={h.seed} value={h.price} play={play} label="Price" />
        </div>

        <SectionHeader>Your position</SectionHeader>
        <Group>
          <Row title="Market value" value={formatUSD(value)} valueColor={C.label} />
          <Row title={h.cls === "Crypto" ? "Quantity" : "Shares"} value={h.shares < 1 ? h.shares.toFixed(4) : h.shares.toFixed(2)} />
          <Row title="Average cost" value={formatUSD(h.avgCost)} />
          <Row title="Total return" value={`${ret >= 0 ? "+" : "−"}${formatUSD(Math.abs(ret))} (${retPct.toFixed(1)}%)`} valueColor={ret >= 0 ? C.accent : C.red} />
          <Row title="Portfolio diversity" value={`${((value / p.total) * 100).toFixed(1)}%`} last />
        </Group>

        <SectionHeader>About</SectionHeader>
        <p className="px-[20px] text-[15px] leading-[1.4]" style={{ color: C.secondary }}>
          {h.about}
        </p>
        <Group className="mt-[14px]">
          {h.stats.map(([k, v], i) => (
            <Row key={k} title={k} value={v} last={i === h.stats.length - 1} />
          ))}
        </Group>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/95 to-transparent px-[16px] pb-[34px] pt-[24px]">
        <div className="grid grid-cols-2 gap-[10px]">
          <Button kind="secondary" onClick={() => p.openSheet({ kind: "order", sym, side: "sell" })}>
            Sell
          </Button>
          <Button onClick={() => p.openSheet({ kind: "order", sym, side: "buy" })}>Buy</Button>
        </div>
      </div>
    </div>
  );
}

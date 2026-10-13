"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { HOLDINGS, type Holding } from "./data";

export type Tab = "home" | "invest" | "cash" | "account";
export type Sheet =
  | { kind: "copilot"; prompt?: number }
  | { kind: "transfer"; dir: "deposit" | "withdraw" }
  | { kind: "order"; sym: string; side: "buy" | "sell" };

interface PhoneState {
  tab: Tab;
  stock: string | null;
  sheet: Sheet | null;
  holdings: Holding[];
  cash: number;
  invested: number;
  total: number;
  autopilot: boolean;
  risk: string;
  roundUps: boolean;
  setTab: (t: Tab) => void;
  openStock: (sym: string) => void;
  closeStock: () => void;
  openSheet: (s: Sheet) => void;
  closeSheet: () => void;
  setAutopilot: (v: boolean) => void;
  setRisk: (v: string) => void;
  setRoundUps: (v: boolean) => void;
  transfer: (dir: "deposit" | "withdraw", amount: number) => void;
  trade: (sym: string, side: "buy" | "sell", dollars: number) => void;
}

const PhoneContext = createContext<PhoneState | null>(null);

export function usePhone() {
  const ctx = useContext(PhoneContext);
  if (!ctx) throw new Error("usePhone must be used inside <PhoneProvider>");
  return ctx;
}

/** Reuses an outer provider (e.g. the guided tour) or creates one for a standalone phone. */
export function PhoneScope({ children }: { children: ReactNode }) {
  const outer = useContext(PhoneContext);
  return outer ? <>{children}</> : <PhoneProvider>{children}</PhoneProvider>;
}

/** All prototype state lives here so every screen shows the same live numbers. */
export function PhoneProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<Tab>("home");
  const [stock, setStock] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [holdings, setHoldings] = useState(HOLDINGS);
  const [cash, setCash] = useState(4812.4);
  const [autopilot, setAutopilot] = useState(true);
  const [risk, setRisk] = useState("Growth");
  const [roundUps, setRoundUps] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setHoldings((list) => list.map((h) => ({ ...h, price: h.price * (1 + (Math.random() - 0.48) * 0.0016) })));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const setTab = useCallback((t: Tab) => {
    setStock(null);
    setTabState(t);
  }, []);

  const transfer = useCallback((dir: "deposit" | "withdraw", amount: number) => {
    setCash((c) => Math.max(0, c + (dir === "deposit" ? amount : -amount)));
  }, []);

  const trade = useCallback((sym: string, side: "buy" | "sell", dollars: number) => {
    setHoldings((list) =>
      list.map((h) => (h.sym === sym ? { ...h, shares: Math.max(0, h.shares + ((side === "buy" ? 1 : -1) * dollars) / h.price) } : h)),
    );
    setCash((c) => Math.max(0, c + (side === "buy" ? -dollars : dollars)));
  }, []);

  const invested = holdings.reduce((s, h) => s + h.shares * h.price, 0);

  const value = useMemo<PhoneState>(
    () => ({
      tab,
      stock,
      sheet,
      holdings,
      cash,
      invested,
      total: invested + cash,
      autopilot,
      risk,
      roundUps,
      setTab,
      openStock: setStock,
      closeStock: () => setStock(null),
      openSheet: setSheet,
      closeSheet: () => setSheet(null),
      setAutopilot,
      setRisk,
      setRoundUps,
      transfer,
      trade,
    }),
    [tab, stock, sheet, holdings, cash, invested, autopilot, risk, roundUps, setTab, transfer, trade],
  );

  return <PhoneContext.Provider value={value}>{children}</PhoneContext.Provider>;
}

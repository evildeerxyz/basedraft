"use client";

import { ArrowUpIcon, BankIcon, ScanSmileyIcon, XIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { cn, formatUSD } from "@/lib/utils";
import { LogoMark } from "../ui/Logo";
import { COPILOT_CONVOS } from "./data";
import { applyKey, Button, C, glass, Keypad, Row, TickerLogo } from "./ios";
import { usePhone, type Sheet } from "./store";

/* ---------- shared bits ---------- */

function SheetHeader({ left, title, right }: { left?: ReactNode; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="relative flex h-[56px] items-center justify-center px-[16px]">
      <span className="absolute left-[16px]">{left}</span>
      <span className="text-[17px] font-semibold tracking-[-0.02em]">{title}</span>
      <span className="absolute right-[16px]">{right}</span>
    </div>
  );
}

function CloseButton() {
  const p = usePhone();
  return (
    <button onClick={p.closeSheet} aria-label="Close" className={cn("grid size-[32px] place-items-center rounded-full", glass)}>
      <XIcon size={15} weight="bold" />
    </button>
  );
}

function Success({ title, body }: { title: string; body: string }) {
  const p = usePhone();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col items-center px-[24px] pb-[40px] pt-[150px] text-center">
      <svg viewBox="0 0 96 96" className="size-[96px]">
        <motion.circle cx="48" cy="48" r="44" fill="none" stroke={C.accent} strokeWidth="5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
        <motion.path d="M30 49 L43 62 L67 36" fill="none" stroke={C.accent} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.45 }} />
      </svg>
      <div className="mt-[28px] text-[24px] font-bold tracking-[-0.03em]">{title}</div>
      <p className="mt-[8px] max-w-[300px] text-[16px] leading-[1.4]" style={{ color: C.secondary }}>
        {body}
      </p>
      <Button className="mt-auto w-full" onClick={p.closeSheet}>
        Done
      </Button>
    </motion.div>
  );
}

function FaceId({ onDone }: { onDone: () => void }) {
  // Price ticks re-render the sheet; keep the latest callback without restarting the timer.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const t = setTimeout(() => done.current(), 1100);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="flex h-full flex-col items-center justify-center pb-[120px]">
      <motion.span
        className="grid size-[96px] place-items-center rounded-[26px]"
        style={{ background: C.card2 }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      >
        <ScanSmileyIcon size={56} style={{ color: C.accent }} />
      </motion.span>
      <div className="mt-[18px] text-[17px] font-semibold">Face ID</div>
    </div>
  );
}

/* ---------- amount entry (transfers + orders) ---------- */

function AmountFlow({
  title,
  max,
  quick,
  row,
  hint,
  review,
  onConfirm,
  success,
}: {
  title: string;
  max: number;
  quick: Array<[string, number]>;
  row: ReactNode;
  hint: (v: number) => ReactNode;
  review: string;
  onConfirm: (v: number) => void;
  success: (v: number) => { title: string; body: string };
}) {
  const p = usePhone();
  const [amt, setAmt] = useState("0");
  const [step, setStep] = useState<"enter" | "auth" | "done">("enter");
  const [shake, setShake] = useState(0);
  const value = parseFloat(amt) || 0;
  const over = value > max;

  const press = (k: string) => {
    const next = applyKey(amt, k);
    if ((parseFloat(next) || 0) > max && k !== "del") setShake((s) => s + 1);
    setAmt(next);
  };
  const [int, dec] = amt.split(".");
  const pretty = Number(int).toLocaleString("en-US") + (dec !== undefined ? `.${dec}` : "");

  if (step === "auth")
    return (
      <FaceId
        onDone={() => {
          onConfirm(value);
          setStep("done");
        }}
      />
    );
  if (step === "done") return <Success {...success(value)} />;

  return (
    <div className="flex h-full flex-col">
      <SheetHeader
        left={
          <button onClick={p.closeSheet} className="text-[17px]" style={{ color: C.accent }}>
            Cancel
          </button>
        }
        title={title}
      />
      <div className="px-[16px]">
        <div className="overflow-hidden rounded-[18px]" style={{ background: C.card2 }}>
          {row}
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <motion.div
          key={shake}
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
          transition={{ duration: 0.35 }}
          className={cn("text-[64px] font-semibold leading-none tracking-[-0.045em] tabular-nums", value === 0 && "opacity-40")}
          style={{ color: over ? C.red : C.label }}
        >
          ${pretty}
        </motion.div>
        <div className="mt-[12px] h-[20px] text-[15px]" style={{ color: over ? C.red : C.secondary }}>
          {over ? `Maximum is ${formatUSD(max)}` : hint(value)}
        </div>
        <div className="mt-[18px] flex gap-[8px]">
          {quick.map(([label, v]) => (
            <button key={label} onClick={() => setAmt(String(Math.min(v, max).toFixed(2)).replace(/\.00$/, ""))} className="rounded-full px-[14px] py-[7px] text-[14px] font-medium" style={{ background: C.card2 }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <Keypad onKey={press} />
      <div className="px-[16px] pb-[40px] pt-[12px]">
        <Button className="w-full" disabled={value <= 0 || over} onClick={() => setStep("auth")}>
          {review}
        </Button>
      </div>
    </div>
  );
}

function TransferSheet({ dir }: { dir: "deposit" | "withdraw" }) {
  const p = usePhone();
  const deposit = dir === "deposit";
  return (
    <AmountFlow
      title={deposit ? "Deposit" : "Withdraw"}
      max={deposit ? 25000 : p.cash}
      quick={deposit ? [["$100", 100], ["$250", 250], ["$500", 500]] : [["$100", 100], ["$500", 500], ["Max", p.cash]]}
      row={<Row icon={<BankIcon size={16} weight="fill" />} iconBg="#5e5ce6" title={deposit ? "From" : "To"} value="Chase ••4417" last />}
      hint={() => (deposit ? "Arrives instantly · no fees" : `${formatUSD(p.cash)} available`)}
      review={deposit ? "Review deposit" : "Review withdrawal"}
      onConfirm={(v) => p.transfer(dir, v)}
      success={(v) =>
        deposit
          ? { title: "Deposit complete", body: `${formatUSD(v)} is in your Zuno cash and ready to invest.` }
          : { title: "Withdrawal started", body: `${formatUSD(v)} will reach Chase ••4417 in 1 to 2 business days.` }
      }
    />
  );
}

function OrderSheet({ sym, side }: { sym: string; side: "buy" | "sell" }) {
  const p = usePhone();
  const h = p.holdings.find((x) => x.sym === sym)!;
  const buy = side === "buy";
  const position = h.shares * h.price;
  return (
    <AmountFlow
      title={`${buy ? "Buy" : "Sell"} ${sym}`}
      max={buy ? p.cash : position}
      quick={buy ? [["$50", 50], ["$100", 100], ["$500", 500]] : [["25%", position / 4], ["50%", position / 2], ["All", position]]}
      row={<Row icon={<TickerLogo h={h} size={30} />} iconBg="transparent" title={h.name} value={formatUSD(h.price)} valueColor={C.label} last />}
      hint={(v) => (v > 0 ? `≈ ${(v / h.price).toFixed(4)} shares at market` : buy ? `${formatUSD(p.cash)} buying power` : `${formatUSD(position)} available to sell`)}
      review="Review order"
      onConfirm={(v) => p.trade(sym, side, v)}
      success={(v) => ({
        title: buy ? "Order filled" : "Shares sold",
        body: `${buy ? "Bought" : "Sold"} ${(v / h.price).toFixed(4)} ${sym} for ${formatUSD(v)} at ${formatUSD(h.price)}.`,
      })}
    />
  );
}

/* ---------- Copilot ---------- */

type Msg = { id: number; role: "ai" | "me"; text: string; stream?: boolean };

function Streamed({ text, onTick }: { text: string; onTick: () => void }) {
  const words = text.split(" ");
  const [n, setN] = useState(0);
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });
  useEffect(() => {
    if (n >= words.length) return;
    const t = setTimeout(() => setN(n + 1), 28);
    return () => clearTimeout(t);
  }, [n, words.length]);
  useEffect(() => tick.current(), [n]);
  return <>{words.slice(0, n).join(" ")}</>;
}

function matchConvo(q: string) {
  const s = q.toLowerCase();
  if (/nvda|nvidia|sell|sold|trim/.test(s)) return 0;
  if (/retire|55|goal|track/.test(s)) return 1;
  if (/spend|afford|month|budget/.test(s)) return 2;
  return -1;
}

const FALLBACK = "I can explain any trade Autopilot made, check your goals, or work out what you can safely spend. Try one of the suggestions below.";

function CopilotSheet({ prompt }: { prompt?: number }) {
  const listRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(2);
  const [asked, setAsked] = useState<number[]>(prompt !== undefined ? [prompt] : []);
  const [typing, setTyping] = useState(prompt !== undefined);
  const [draft, setDraft] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    { id: 0, role: "ai", text: "Morning, Maya. You're up 2.1% this week and every asset class is on target. What would you like to look at?" },
    ...(prompt !== undefined ? [{ id: 1, role: "me" as const, text: COPILOT_CONVOS[prompt].q }] : []),
  ]);

  const scrollDown = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const reply = (text: string) => {
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { id: idRef.current++, role: "ai", text, stream: true }]);
    }, 1000);
  };

  useEffect(() => {
    if (prompt === undefined) return;
    const t = setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { id: idRef.current++, role: "ai", text: COPILOT_CONVOS[prompt].a, stream: true }]);
    }, 1000);
    return () => clearTimeout(t);
  }, [prompt]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, typing]);

  const ask = (q: string, i: number) => {
    setMsgs((m) => [...m, { id: idRef.current++, role: "me", text: q }]);
    if (i >= 0) setAsked((a) => [...a, i]);
    setTyping(true);
    reply(i >= 0 ? COPILOT_CONVOS[i].a : FALLBACK);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = draft.trim();
    if (!q) return;
    setDraft("");
    ask(q, matchConvo(q));
  };

  const suggestions = COPILOT_CONVOS.map((c, i) => ({ ...c, i })).filter((c) => !asked.includes(c.i));

  return (
    <div className="flex h-full flex-col">
      <SheetHeader
        left={<LogoMark size={28} animated={false} />}
        title={
          <span className="flex flex-col items-center leading-tight">
            Copilot
            <span className="text-[12px] font-normal" style={{ color: C.secondary }}>
              Reads your accounts · never trades without you
            </span>
          </span>
        }
        right={<CloseButton />}
      />
      <div ref={listRef} className="no-scrollbar flex-1 space-y-[12px] overflow-y-auto px-[16px] pb-[12px] pt-[8px]">
        {msgs.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "max-w-[86%] rounded-[20px] px-[14px] py-[10px] text-[16px] leading-[1.38] tracking-[-0.01em]",
              m.role === "me" ? "ml-auto rounded-br-[6px]" : "rounded-bl-[6px]",
            )}
            style={m.role === "me" ? { background: C.accent, color: C.onAccent } : { background: C.card2, color: C.label }}
          >
            {m.stream ? <Streamed text={m.text} onTick={scrollDown} /> : m.text}
          </motion.div>
        ))}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-fit gap-[5px] rounded-[20px] rounded-bl-[6px] px-[14px] py-[14px]" style={{ background: C.card2 }}>
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="size-[8px] rounded-full bg-white/60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {suggestions.length > 0 && (
        <div className="no-scrollbar flex gap-[8px] overflow-x-auto px-[16px] pb-[10px]">
          {suggestions.map((s) => (
            <button key={s.i} onClick={() => ask(s.q, s.i)} className="shrink-0 rounded-full px-[14px] py-[9px] text-[14px] font-medium" style={{ background: C.card2 }}>
              {s.q}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-[8px] px-[16px] pb-[38px]">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about your money"
          aria-label="Ask Copilot a question"
          className="h-[44px] min-w-0 flex-1 rounded-full px-[18px] text-[16px] outline-none transition-shadow placeholder:text-[rgba(235,235,245,0.35)] focus:ring-2 focus:ring-[#c8ff3e]/60"
          style={{ background: C.card2, color: C.label }}
        />
        <button type="submit" aria-label="Send" className="grid size-[44px] shrink-0 place-items-center rounded-full transition-opacity" style={{ background: C.accent, color: C.onAccent, opacity: draft.trim() ? 1 : 0.4 }}>
          <ArrowUpIcon size={20} weight="bold" />
        </button>
      </form>
    </div>
  );
}

/* ---------- host ---------- */

function SheetBody({ sheet }: { sheet: Sheet }) {
  if (sheet.kind === "copilot") return <CopilotSheet prompt={sheet.prompt} />;
  if (sheet.kind === "transfer") return <TransferSheet dir={sheet.dir} />;
  return <OrderSheet sym={sheet.sym} side={sheet.side} />;
}

/** iOS page sheet: slides up, drag the grabber down to dismiss. */
export function SheetHost() {
  const p = usePhone();
  const controls = useDragControls();
  return (
    <AnimatePresence>
      {p.sheet && (
        <motion.div key="backdrop" className="absolute inset-0 z-40 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={p.closeSheet} />
      )}
      {p.sheet && (
        <motion.div
          key={`sheet-${p.sheet.kind}`}
          className="absolute inset-x-0 bottom-0 top-[56px] z-50 overflow-hidden rounded-t-[38px]"
          style={{ background: C.card }}
          initial={{ y: 820 }}
          animate={{ y: 0 }}
          exit={{ y: 820 }}
          transition={{ type: "spring", stiffness: 320, damping: 36 }}
          drag="y"
          dragListener={false}
          dragControls={controls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.7 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 130 || info.velocity.y > 600) p.closeSheet();
          }}
        >
          <div className="absolute inset-x-0 top-0 z-10 h-[24px] cursor-grab touch-none" onPointerDown={(e) => controls.start(e)}>
            <span className="absolute left-1/2 top-[6px] h-[5px] w-[36px] -translate-x-1/2 rounded-full bg-white/30" />
          </div>
          <div className="h-full pt-[10px]">
            <SheetBody sheet={p.sheet} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

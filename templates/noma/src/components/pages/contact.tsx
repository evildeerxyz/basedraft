"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretDownIcon, CheckIcon, CircleNotchIcon, CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/site/ui";

const SIZES = ["1 to 10", "11 to 50", "51 to 200", "201 to 1,000", "1,000+"];

function TeamSizeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-11 w-full items-center justify-between  border bg-surface px-3.5 text-left text-[14px] transition-colors",
          open ? "border-(--focus-border) shadow-[var(--focus-ring)]" : "border-line",
          value ? "text-ink" : "text-ink-3",
        )}
      >
        {value || "Select team size"}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="grid place-items-center text-ink-3">
          <CaretDownIcon size={13} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, clipPath: "inset(0% 0% 100% 0% round 14px)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(-10% -10% -30% -10% round 14px)", transitionEnd: { clipPath: "none" } }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 border border-line bg-surface p-1"
          >
            {SIZES.map((size, index) => (
              <motion.li key={size} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === size}
                  onClick={() => {
                    onChange(size);
                    setOpen(false);
                  }}
                  className="flex h-9 w-full items-center justify-between px-3 text-[14px] text-ink hover:bg-hover"
                >
                  {size} people
                  {value === size && <CheckIcon size={13} weight="bold" />}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

const field = "h-11 w-full  border border-line bg-surface px-3.5 text-[14px] text-ink placeholder:text-ink-3";

export function DemoForm() {
  const [size, setSize] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [slot, setSlot] = useState<string | null>(null);

  return (
    <div className="relative border border-line bg-surface p-6 md:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {status === "done" ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex min-h-[440px] flex-col items-center justify-center gap-5 text-center">
            <span className="relative grid size-14 place-items-center bg-ok text-white">
              <CheckIcon size={26} weight="bold" />
            </span>
            <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-ink">You are booked in.</h3>
            <p className="max-w-sm text-[14.5px] text-ink-2">Pick a slot and a solutions engineer will bring a demo on your own schema.</p>
            <div className="grid w-full max-w-sm grid-cols-3 gap-2">
              {["Tue 10:00", "Tue 14:30", "Wed 09:00", "Wed 16:00", "Thu 11:30", "Fri 13:00"].map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSlot(time)}
                  className={cn("h-10  border text-[13px] transition-colors", slot === time ? "border-inverse bg-inverse text-inverse-fg" : "border-line text-ink hover:bg-hover")}
                >
                  {time}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {slot && (
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-[13px] text-ink-2">
                  <CalendarCheckIcon size={15} weight="duotone" className="text-ok" />
                  Invite sent for {slot}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, scale: 0.98 }}
            onSubmit={(event) => {
              event.preventDefault();
              setStatus("sending");
              window.setTimeout(() => {
                setStatus("done");
              }, 900);
            }}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-[13px] text-ink-2">
                Full name
                <input required className={field} placeholder="Ada Lovelace" />
              </label>
              <label className="grid gap-1.5 text-[13px] text-ink-2">
                Work email
                <input required type="email" className={field} placeholder="ada@company.com" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-[13px] text-ink-2">
                Company
                <input required className={field} placeholder="Analytical Engines Inc." />
              </label>
              <div className="grid gap-1.5 text-[13px] text-ink-2">
                Team size
                <TeamSizeSelect value={size} onChange={setSize} />
              </div>
            </div>
            <label className="grid gap-1.5 text-[13px] text-ink-2">
              What would you ask your database first?
              <textarea
                rows={4}
                className="w-full resize-none border border-line bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-ink-3"
                placeholder="Which customers churned after the price change?"
              />
            </label>
            <motion.button type="submit" whileTap={{ scale: 0.98 }} disabled={status === "sending"} className={cn(buttonClass("primary", "lg"), "mt-2 w-full")}>
              {status === "sending" ? (
                <>
                  <CircleNotchIcon size={16} className="animate-spin" />
                  Booking…
                </>
              ) : (
                <>Book my demo</>
              )}
            </motion.button>
            <p className="text-center text-[12px] text-ink-3">30 minutes · your schema · no slides</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

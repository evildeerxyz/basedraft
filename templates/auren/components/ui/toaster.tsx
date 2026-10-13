"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { TOAST_EVENT } from "@/lib/site";

export function Toaster() {
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);

  useEffect(() => {
    let timer = 0;
    const onToast = (e: Event) => {
      const text = (e as CustomEvent<string>).detail;
      setMessage({ text, id: performance.now() });
      clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(null), 2200);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 rounded-md border border-paper/10 bg-ink-3 px-3.5 py-2 font-mono text-[12px] text-paper shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
          >
            <CheckIcon size={14} weight="bold" className="text-accent" />
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

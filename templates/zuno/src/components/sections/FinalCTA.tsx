"use client";

import { AppleLogoIcon, ArrowRightIcon, CheckIcon, GooglePlayLogoIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { pal } from "@/lib/palette";
import { EASE_OUT } from "@/lib/utils";
import { DitherShader } from "../dither/DitherShader";
import { MagneticButton } from "../ui/MagneticButton";
import { SectionTitle } from "../ui/Section";

export function FinalCTA() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    setSent(true);
  };

  return (
    <section className="relative overflow-hidden pt-32">
      <div className="mx-auto flex max-w-[1000px] flex-col items-center px-5 text-center">
        <SectionTitle className="text-[clamp(2.6rem,6vw,5.5rem)]" lead="Your future self is" tail="already grateful." />
        <p className="mt-7 max-w-[520px] text-[19px] leading-relaxed text-white/65 sm:text-[20px]">
          Join 380,000+ people letting Zuno do the heavy lifting. Start with $1, cancel anytime.
        </p>

        <div className="mt-11 h-[64px] w-full max-w-[520px]">
          <AnimatePresence mode="wait" initial={false}>
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
                className="flex h-full items-center justify-center gap-3 rounded-[14px] border border-lime/40 bg-lime/10 text-[16px] text-accent"
              >
                <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.15 }} className="grid size-7 place-items-center rounded-full bg-lime text-ink">
                  <CheckIcon size={14} weight="bold" />
                </motion.span>
                Check your inbox. Your download link is on its way.
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={submit}
                exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                className="flex h-full items-center gap-2 rounded-[14px] border border-white/12 bg-white/[0.04] p-1.5 pl-5 transition-[border-color,box-shadow] duration-200 focus-within:border-lime focus-within:ring-4 focus-within:ring-lime/30"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  aria-label="Email address"
                  className="min-w-0 flex-1 bg-transparent text-[17px] text-white outline-none placeholder:text-white/55"
                />
                <MagneticButton type="submit" strength={0.2} className="h-full rounded-[10px] bg-lime px-6 text-[16px] font-medium text-ink">
                  Get the app <ArrowRightIcon size={15} weight="bold" />
                </MagneticButton>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {[
            { icon: AppleLogoIcon, top: "Download on the", label: "App Store" },
            { icon: GooglePlayLogoIcon, top: "Get it on", label: "Google Play" },
          ].map(({ icon: Icon, top, label }) => (
            <motion.a
              key={label}
              href="#"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="flex h-14 items-center gap-3 rounded-[12px] border border-white/12 bg-ink-2 px-5 text-left transition-colors hover:border-white/25"
            >
              <Icon size={26} weight="fill" />
              <span className="leading-tight">
                <span className="block text-[12px] text-white/60">{top}</span>
                <span className="block text-[17px] font-semibold tracking-tight">{label}</span>
              </span>
            </motion.a>
          ))}
        </div>
      </div>

      <div className="relative mt-20 h-[clamp(170px,30vw,460px)] w-full">
        <DitherShader shape="text" text="zuno" color={pal.dither} secondColor={pal.soft} secondOpacity={0.16} pixelSize={4} intensity={1} interactive />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
      </div>
    </section>
  );
}

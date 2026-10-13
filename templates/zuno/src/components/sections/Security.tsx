"use client";

import { CertificateIcon, EyeSlashIcon, FingerprintIcon, LockKeyIcon, ShieldCheckIcon, VaultIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { pal } from "@/lib/palette";
import { EASE_OUT } from "@/lib/utils";
import { DitherShader } from "../dither/DitherShader";
import { SectionTitle } from "../ui/Section";

const ITEMS = [
  { icon: VaultIcon, t: "SIPC protection", d: "Securities protected up to $500,000, including $250,000 for cash claims." },
  { icon: LockKeyIcon, t: "256-bit encryption", d: "Data encrypted at rest and in transit with AES-256 and TLS 1.3." },
  { icon: FingerprintIcon, t: "Biometric + 2FA", d: "Face ID, passkeys and hardware keys. New devices always re-verify." },
  { icon: CertificateIcon, t: "SOC 2 Type II", d: "Independently audited every year. Penetration-tested every quarter." },
  { icon: EyeSlashIcon, t: "Never sold. Ever.", d: "We don't sell your data or your orders. No payment for order flow." },
];

const BADGES = ["AES-256", "SOC 2", "SIPC", "FINRA", "2FA", "TLS 1.3"];

export function Security() {
  return (
    <section id="security" className="relative mx-auto max-w-[1280px] scroll-mt-20 px-5 py-28 lg:px-8 lg:py-36">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionTitle lead="Bank-grade by default." tail="Paranoid by design." />
          <p className="mt-7 max-w-[500px] text-[19px] leading-relaxed text-white/65">
            Your money is held at a regulated, independent custodian in your name, not on Zuno&apos;s balance sheet. If we ever
            disappeared tomorrow, your investments wouldn&apos;t.
          </p>
          <div className="mt-10 space-y-1">
            {ITEMS.map(({ icon: Icon, t, d }, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: EASE_OUT }}
                className="group flex gap-4 py-4"
              >
                <span className="mt-0.5 shrink-0 text-accent">
                  <Icon size={24} />
                </span>
                <div>
                  <div className="text-[19px] font-semibold tracking-[-0.015em]">{t}</div>
                  <div className="mt-1 text-[17px] leading-relaxed text-white/65">{d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.1, ease: EASE_OUT }}
          className="relative aspect-square w-full overflow-hidden rounded-[20px] border border-white/[0.08] bg-ink-2"
        >
          <DitherShader shape="ripple" orb={[0.5, 0.5, 0]} color={pal.dither} opacity={0.8} pixelSize={4} intensity={0.85} interactive />
          <motion.div className="absolute inset-[14%]" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
            {BADGES.map((b, i) => {
              const a = (i / BADGES.length) * Math.PI * 2;
              return (
                <div key={b} className="absolute" style={{ left: `${(50 + Math.cos(a) * 50).toFixed(2)}%`, top: `${(50 + Math.sin(a) * 50).toFixed(2)}%` }}>
                  <motion.span
                    animate={{ rotate: -360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="block -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[8px] bg-ink px-2.5 py-1.5 text-[15px] tabular-nums text-white/85"
                  >
                    {b}
                  </motion.span>
                </div>
              );
            })}
          </motion.div>
          <div className="absolute inset-0 grid place-items-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="grid size-28 place-items-center rounded-[24px] bg-ink"
            >
              <ShieldCheckIcon size={52} weight="fill" className="text-accent" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

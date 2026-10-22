"use client";

import { useState, type ComponentType } from "react";
import { FileDrop } from "../../ui/file-drop";

/*
 * A pretend upload: it fills over a second or two, by the file's size. A file named storefront
 * fails partway the first time, so trying again can be seen to work.
 */
const tried = new Set<string>();
const send = (file: File, report: (progress: number) => void, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const fails = file.name.includes("storefront") && !tried.has(file.name);
    const takes = 900 + Math.min(file.size / 900, 1800);
    const began = Date.now();
    const tick = setInterval(() => {
      const p = (Date.now() - began) / takes;
      if (fails && p > 0.64) {
        clearInterval(tick);
        tried.add(file.name);
        reject(new Error("The connection dropped."));
        return;
      }
      report(Math.min(1, p));
      if (p >= 1) {
        clearInterval(tick);
        resolve();
      }
    }, 60);
    signal.addEventListener("abort", () => clearInterval(tick));
  });

/* Files to start with, made in the browser: a name, a kind and a size. */
const fake = (name: string, type: string, size: number) => new File([new Uint8Array(size)], name, { type });
const useFiles = (make: () => File[]) => useState(() => (typeof File === "undefined" ? [] : make()))[0];

export function Demo() {
  const files = useFiles(() => [fake("zuno-logo.svg", "image/svg+xml", 14_300), fake("storefront.jpg", "image/jpeg", 1_240_000)]);
  return (
    <div className="w-full max-w-[340px]">
      <FileDrop label="Images for your site" title="Drop images for your site" accept="image/*,.svg" maxSize={5 * 1024 * 1024} maxFiles={4} upload={send} defaultFiles={files} />
    </div>
  );
}

function Images() {
  return <FileDrop label="Images for your site" accept="image/*,.svg" maxSize={5 * 1024 * 1024} maxFiles={4} hint="PNG, JPG or SVG, up to 5 MB" upload={send} className="max-w-[360px]" />;
}

function Retry() {
  const files = useFiles(() => [fake("storefront.png", "image/png", 860_000)]);
  return <FileDrop label="Hero image" title="Drop a hero image" upload={send} defaultFiles={files} className="max-w-[360px]" />;
}

function Refused() {
  const files = useFiles(() => [fake("pricing-hero.png", "image/png", 7_800_000), fake("brief.pdf", "application/pdf", 220_000), fake("logo-dark.svg", "image/svg+xml", 9_100)]);
  return <FileDrop label="Images for your site" accept="image/*,.svg" maxSize={5 * 1024 * 1024} defaultFiles={files} className="max-w-[360px]" />;
}

function Single() {
  return <FileDrop multiple={false} label="Favicon" title="Drop a favicon" hint="One SVG, square" accept=".svg" upload={send} className="max-w-[300px]" />;
}

export const examples: Record<string, ComponentType> = { images: Images, retry: Retry, refused: Refused, single: Single };

"use client";

import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { GLYPH_PATH } from "@/lib/dither";
import { copyText, toast } from "@/lib/site";
import { LogoGlyph } from "../ui/logo";

const svgFor = (fg: string, bg: string | null) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2.5 15 15" width="512" height="512" shape-rendering="crispEdges">` +
  (bg ? `<rect x="-2" y="-2.5" width="15" height="15" fill="${bg}"/>` : "") +
  `<path fill="${fg}" d="${GLYPH_PATH}"/></svg>`;

function download(name: string, svg: string) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  toast(`Saved ${name}`);
}

const MARKS = [
  { name: "auren-mark-aurum.svg", label: "Aurum on ink", fg: "#f2a23a", bg: "#0a0a09", tile: "bg-ink text-[#f2a23a]" },
  { name: "auren-mark-ink.svg", label: "Ink on paper", fg: "#0a0a09", bg: "#efebe2", tile: "bg-paper-2 text-ink" },
  { name: "auren-mark-paper.svg", label: "Paper, transparent", fg: "#efebe2", bg: null, tile: "bg-ink-3 text-paper" },
];

export function MarkDownloads() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {MARKS.map((m) => (
        <div key={m.name} className="overflow-hidden rounded-[10px] border border-ink/12">
          <div className={`grid aspect-[4/3] place-items-center ${m.tile}`}>
            <LogoGlyph size={88} />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-ink/12 bg-paper px-4 py-3">
            <span className="text-[14px] text-ink/70">{m.label}</span>
            <button
              type="button"
              onClick={() => download(m.name, svgFor(m.fg, m.bg))}
              className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-ink/15 px-2.5 font-mono text-[11.5px] text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
            >
              <DownloadSimpleIcon size={13} />
              SVG
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Swatch({ name, value, token, dark }: { name: string; value: string; token: string; dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(value)) toast(`Copied ${value}`);
      }}
      className="group overflow-hidden rounded-[10px] border border-ink/12 text-left"
    >
      <div className="relative h-28" style={{ background: value }}>
        <span
          className={`absolute right-3 top-3 font-mono text-[11px] opacity-0 transition-opacity group-hover:opacity-100 ${dark ? "text-paper/70" : "text-ink/60"}`}
        >
          Click to copy
        </span>
      </div>
      <div className="bg-paper px-4 py-3">
        <div className="text-[14.5px] text-ink">{name}</div>
        <div className="mt-0.5 flex justify-between font-mono text-[11.5px] text-ink/50">
          <span>{value}</span>
          <span>{token}</span>
        </div>
      </div>
    </button>
  );
}

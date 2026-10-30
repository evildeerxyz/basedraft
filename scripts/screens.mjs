/*
 * Screens: whole pages of an app, built from basedraft UI. Each is a folder in src/screens/<slug>/
 * with its meta.json and screen.tsx, which imports the components straight from src/registry. Writes
 *   src/screens/catalog.ts       every screen's facts, with the components it uses, read from its imports
 *   src/screens/renders.tsx      the screens themselves, for their live previews
 *   src/screens/sources.ts       a free screen's file as a project would have it, from @basedraft/ui
 *   src/screens/pro-sources.ts   a Pro screen's file the same way, for the gated route only
 *   public/ui/screens/<slug>.tsx a free screen's file, to download
 * A screen is one file: it may import React, motion, Phosphor and basedraft's components, nothing
 * else of ours. A free screen may use only free components; this stops if one reaches for a Pro one.
 * Run by scripts/registry.mjs, or on its own:
 *   node scripts/screens.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const DIR = "src/screens";
const PACKAGE = "@basedraft/ui";
const proComponents = new Set(readdirSync("src/registry/pro-ui").map((f) => f.replace(/\.tsx$/, "")));
const freeComponents = new Set(readdirSync("src/registry/ui").map((f) => f.replace(/\.tsx$/, "")));

const slugs = readdirSync(DIR).filter((d) => existsSync(`${DIR}/${d}/meta.json`) && existsSync(`${DIR}/${d}/screen.tsx`)).sort();
const IMPORT = /^import\s*\{([^}]*)\}\s*from\s*"@\/registry\/(ui|pro-ui)\/([\w-]+)";\n/gm;

/** A screen's imports of our components, gathered into the lines a project would write. */
function rewrite(slug, src) {
  const free = [];
  const pro = [];
  const uses = [];
  let first = -1;
  const body = src.replace(IMPORT, (line, names, kind, name, at) => {
    if (first < 0) first = at;
    if (!(kind === "ui" ? freeComponents : proComponents).has(name)) throw new Error(`${slug}: there's no ${kind}/${name}`);
    if (!uses.includes(name)) uses.push(name);
    const list = names.split(",").map((n) => n.trim()).filter(Boolean);
    (kind === "ui" ? free : pro).push(...list.map((n) => ({ n, from: name })));
    return "";
  });
  const other = body.match(/from "(\.{1,2}\/|@\/)[^"]*"/);
  if (other) throw new Error(`${slug}: a screen is one file; it can't import ${other[0]}`);
  const sortKey = (n) => n.replace(/^type\s+/, "").toLowerCase();
  const line = (names, from) => {
    const one = `import { ${names.join(", ")} } from "${from}";`;
    return one.length <= 100 ? one : `import {\n${names.map((n) => `  ${n},`).join("\n")}\n} from "${from}";`;
  };
  const freeNames = [...new Set(free.map((f) => f.n))].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const proLines = [...new Set(pro.map((p) => p.from))].map((from) => line(pro.filter((p) => p.from === from).map((p) => p.n), `@/components/basedraft/${from}`));
  const ours = [freeNames.length ? line(freeNames, PACKAGE) : "", ...proLines].filter(Boolean).join("\n");
  const source = first < 0 ? body : `${body.slice(0, first)}${ours}\n${body.slice(first)}`;
  return { source: source.replace(/\n{3,}/g, "\n\n"), uses };
}

const screens = slugs.map((slug) => {
  const meta = JSON.parse(readFileSync(`${DIR}/${slug}/meta.json`, "utf8"));
  const raw = readFileSync(`${DIR}/${slug}/screen.tsx`, "utf8");
  const name = raw.match(/^export default function (\w+)/m)?.[1];
  if (!name) throw new Error(`${slug}: screen.tsx needs an export default function`);
  const { source, uses } = rewrite(slug, raw);
  const usesPro = uses.filter((u) => proComponents.has(u) && !freeComponents.has(u));
  if (!meta.pro && usesPro.length) throw new Error(`${slug}: a free screen can't use Pro components (${usesPro.join(", ")})`);
  return { meta: { slug, order: 100, ...meta, name, uses, lines: source.split("\n").length }, source };
});
screens.sort((a, b) => a.meta.order - b.meta.order || a.meta.slug.localeCompare(b.meta.slug));

const id = (slug) => `s_${slug.replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())}`;
writeFileSync(
  `${DIR}/catalog.ts`,
  `/* Written by scripts/screens.mjs from src/screens/<slug>: each screen's facts and the components it uses. Don't edit by hand. */
import type { ScreenMeta } from "./types";

export const SCREEN_META: ScreenMeta[] = ${JSON.stringify(
    screens.map((s) => s.meta),
    null,
    2,
  )};
`,
);
writeFileSync(
  `${DIR}/renders.tsx`,
  `"use client";

/* Written by scripts/screens.mjs from src/screens/<slug>: each screen, live, for its previews. Don't edit by hand. */
import type { ComponentType } from "react";
${screens.map((s) => `import ${id(s.meta.slug)} from "./${s.meta.slug}/screen";`).join("\n")}

export const SCREEN_RENDERS: Record<string, ComponentType> = {${screens.map((s) => `\n  ${JSON.stringify(s.meta.slug)}: ${id(s.meta.slug)},`).join("")}
};
`,
);
const free = Object.fromEntries(screens.filter((s) => !s.meta.pro).map((s) => [s.meta.slug, s.source]));
const pro = Object.fromEntries(screens.filter((s) => s.meta.pro).map((s) => [s.meta.slug, s.source]));
writeFileSync(`${DIR}/sources.ts`, `/* Written by scripts/screens.mjs: each free screen's file, as a project would have it. Don't edit by hand. */\nexport const SCREEN_SOURCES: Record<string, string> = ${JSON.stringify(free, null, 2)};\n`);
writeFileSync(
  `${DIR}/pro-sources.ts`,
  `/*
 * Written by scripts/screens.mjs: each Pro screen's file. Only the gated route
 * (src/app/api/screens/[slug]) may import this, so it stays on the server and goes only to Pro
 * accounts. Never import it into a page or a client component. Don't edit by hand.
 */
export const SCREEN_PRO_SOURCES: Record<string, string> = ${JSON.stringify(pro, null, 2)};
`,
);
rmSync("public/ui/screens", { recursive: true, force: true });
mkdirSync("public/ui/screens", { recursive: true });
for (const [slug, source] of Object.entries(free)) writeFileSync(`public/ui/screens/${slug}.tsx`, source);

console.log(`${screens.length} screens (${Object.keys(pro).length} Pro): src/screens/catalog.ts, renders.tsx, sources.ts, pro-sources.ts, public/ui/screens`);

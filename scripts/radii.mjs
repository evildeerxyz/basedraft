/*
 * Every corner radius a template's code writes as a class (rounded-[12px], lg:rounded-t-[20px],
 * rounded-xl), so Studio's corner control can scale them all: the template's code never changes,
 * the classes are given new values after its own. Run it again when a template changes:
 *
 *   node scripts/radii.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SKIP_DIRS } from "./template-source.mjs";

const SLUGS = ["zuno", "noma", "auren"];
const DIRS = ["src", "app", "components", "lib"];
const CLASS = /(?<![\w-])((?:(?:sm|md|lg|xl|2xl):)?rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?(?:-\[\d+(?:\.\d+)?(?:px|rem)\]|-(?:xs|sm|md|lg|xl|2xl|3xl|4xl))?)(?![\w[-])/g;

function files(dir) {
  let out = [];
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    if (SKIP_DIRS.has(name) || name === "bd") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(files(p));
    else if (/\.(tsx|ts|jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

const map = {};
for (const slug of SLUGS) {
  const found = new Set();
  for (const d of DIRS) for (const f of files(join("templates", slug, d))) for (const m of readFileSync(f, "utf8").matchAll(CLASS)) found.add(m[1]);
  map[slug] = [...found].sort();
}
writeFileSync("src/site/radii.json", JSON.stringify(map, null, 2) + "\n");
console.log(Object.entries(map).map(([s, l]) => `${s}: ${l.length}`).join(", "));

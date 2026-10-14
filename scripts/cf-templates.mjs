#!/usr/bin/env node
/*
 * The templates as plain files, for Cloudflare: each is built as a static export (BD_STATIC=1,
 * see its next.config.ts) and copied to .open-next/assets/live/<slug>, where Cloudflare serves it
 * straight from its asset store. No worker runs for them, so they cost nothing on the free plan.
 *
 * A static export needs its metadata routes (sitemap, robots, generated social images) marked
 * force-static, which the templates' normal builds (Cache Components) don't allow, and it builds
 * without Cache Components, which a page's `instant` setting needs. So the mark is added and the
 * setting taken out for this build only, and every file is put back as it was afterwards.
 *
 *   node scripts/cf-templates.mjs [out-dir]     (default .open-next/assets)
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { RELEASED, ZONES } from "./zones.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dest = path.resolve(root, process.argv[2] ?? ".open-next/assets");
const METADATA = /^(sitemap|robots|manifest|opengraph-image|twitter-image|icon|apple-icon)\.(ts|tsx)$/;
const MARK = '\nexport const dynamic = "force-static"; // added by basedraft for its static build only\n';
const INSTANT = /^export const instant = [^\n]*\n/m;
const ROUTE = /^(page|layout)\.(ts|tsx)$/;

function walk(dir, test, out = []) {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".next" || e === "out") continue;
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p, test, out);
    else if (test.test(e)) out.push(p);
  }
  return out;
}

// An unreleased template isn't built, and nothing of it is left from an earlier build: not its
// preview, and not its screenshots (public/shots, which the app's build copied in).
for (const z of ZONES.filter((z) => !RELEASED.includes(z))) {
  rmSync(path.join(dest, "live", z.slug), { recursive: true, force: true });
  rmSync(path.join(dest, "shots", `${z.slug}.jpg`), { force: true });
  const sections = path.join(dest, "shots", "sections");
  if (existsSync(sections)) for (const f of readdirSync(sections).filter((f) => f.startsWith(`${z.slug}-`))) rmSync(path.join(sections, f));
}

for (const z of RELEASED) {
  const dir = path.join(root, z.dir);
  const app = existsSync(path.join(dir, "src/app")) ? path.join(dir, "src/app") : path.join(dir, "app");
  const marked = walk(app, METADATA).filter((f) => !/export const dynamic/.test(readFileSync(f, "utf8")));
  const instant = walk(app, ROUTE).filter((f) => INSTANT.test(readFileSync(f, "utf8")));
  const originals = new Map([...marked, ...instant].map((f) => [f, readFileSync(f, "utf8")]));
  try {
    for (const f of marked) writeFileSync(f, originals.get(f) + MARK);
    for (const f of instant) writeFileSync(f, originals.get(f).replace(INSTANT, ""));
    rmSync(path.join(dir, "out"), { recursive: true, force: true });
    console.log(`building ${z.slug} (${marked.length} metadata routes marked static)`);
    execSync("npx next build", { cwd: dir, stdio: "inherit", env: { ...process.env, BD_STATIC: "1" } });
  } finally {
    for (const [f, src] of originals) writeFileSync(f, src);
  }
  const to = path.join(dest, "live", z.slug);
  rmSync(to, { recursive: true, force: true });
  cpSync(path.join(dir, "out"), to, { recursive: true });
  console.log(`${z.slug} -> ${path.relative(root, to)}`);
}

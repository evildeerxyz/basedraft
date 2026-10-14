#!/usr/bin/env node
/*
 * basedraft to Cloudflare Workers, on the free plan. Run it with Node 22 (wrangler needs it):
 *
 *   node scripts/cf-deploy.mjs              build everything and deploy
 *   node scripts/cf-deploy.mjs --dry-run    build everything, check the worker's size, don't deploy
 *
 * 1. The Next app, built for Workers by OpenNext with the public settings in .env.cloudflare.
 *    src/proxy.ts is set aside for this build: on Cloudflare the previews are plain files and
 *    cloudflare/worker.ts guards them (and Next's proxy bundle alone is bigger than the plan allows).
 * 2. The templates, as plain files in the asset store (scripts/cf-templates.mjs).
 * 3. The templates' code as their buyers get it, in the private KV namespace TEMPLATES, for
 *    Download project and Send to GitHub (src/server/site.ts reads it there).
 * 4. Wrangler deploys it all. The templates are then rebuilt as usual, for local next start.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { SKIP_DIRS, skipFile, TEMPLATE_DIRS, TEMPLATE_FILES } from "./template-source.mjs";
import { RELEASED, ZONES } from "./zones.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dry = process.argv.includes("--dry-run");
const run = (cmd, env = {}) => execSync(cmd, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });

const publicEnv = Object.fromEntries(
  readFileSync(path.join(root, ".env.cloudflare"), "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

// OpenNext (1.20.10) inlines Next's manifests into the worker, which has no disk, but its list
// predates Next 16.4's preview-props.json, and every page then fails. Added here until OpenNext
// knows it; harmless once it does.
const manifests = path.join(root, "node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/load-manifest.js");
const known = "{*-manifest,required-server-files,prefetch-hints}.json";
const src = readFileSync(manifests, "utf8");
if (src.includes(known)) writeFileSync(manifests, src.replace(known, "{*-manifest,required-server-files,prefetch-hints,preview-props}.json"));

// 1. The app.
const proxy = path.join(root, "src/proxy.ts");
const aside = path.join(root, "src/proxy.ts.cloudflare-off");
// Set aside for the template builds too: nested in this repo, their static builds pick it up.
renameSync(proxy, aside);
try {
  run("npx opennextjs-cloudflare build", { ...publicEnv, BD_CF: "1" });
  // OpenNext's patch for loading the instrumentation hook doesn't match Next 16.4, so the bundle
  // still require()s .next/server/instrumentation.js at run time, which workerd can't, and every
  // page fails. basedraft has no server instrumentation: the load is made to find none.
  const handler = path.join(root, ".open-next/server-functions/default/handler.mjs");
  const code = readFileSync(handler, "utf8");
  const load = /cachedInstrumentationModule\s*=\s*\(0,\s*_interopdefault\.interopDefault\)\(await require\([^;]*?INSTRUMENTATION_HOOK_FILENAME\}\.js`\)\)\)/g;
  const loads = code.match(load)?.length ?? 0;
  if (loads) writeFileSync(handler, code.replace(load, "cachedInstrumentationModule=null"));
  console.log(`instrumentation hook loads made static: ${loads}`);
  // 2. The templates, as files.
  run("node scripts/cf-templates.mjs .open-next/assets");
} finally {
  renameSync(aside, proxy);
}

// 3. Their code, for buyers.
function walk(dir, rel = "", out = []) {
  for (const name of readdirSync(dir)) {
    const r = rel ? `${rel}/${name}` : name;
    const p = path.join(dir, name);
    const isDir = statSync(p).isDirectory();
    if (!rel && !(isDir ? TEMPLATE_DIRS : TEMPLATE_FILES).includes(name)) continue;
    if (isDir) {
      if (!SKIP_DIRS.has(name)) walk(p, r, out);
    } else if (!skipFile(name)) out.push(r);
  }
  return out;
}
const tmp = mkdtempSync(path.join(os.tmpdir(), "bd-sources-"));
const bundles = RELEASED.map((z) => {
  const dir = path.join(root, z.dir);
  const files = Object.fromEntries(walk(dir).map((rel) => [rel, readFileSync(path.join(dir, rel)).toString("base64")]));
  const file = path.join(tmp, `${z.slug}.json`);
  writeFileSync(file, JSON.stringify({ files }));
  console.log(`${z.slug}: ${Object.keys(files).length} files, ${Math.round(statSync(file).size / 1024)} KB`);
  return { slug: z.slug, file };
});

// 4. Deploy.
if (dry) run("npx wrangler deploy --dry-run --outdir .open-next/dry-run");
else {
  for (const b of bundles) run(`npx wrangler kv key put "source:${b.slug}" --binding TEMPLATES --path "${b.file}" --remote`);
  run("npx wrangler deploy");
}

// Local next start serves the templates' normal builds, which the static builds replaced.
for (const z of ZONES) execSync("npx next build", { cwd: path.join(root, z.dir), stdio: "inherit", env: { ...process.env, BD_STATIC: "" } });
console.log("Rebuilt the templates for local next start: restart the zones (4101 to 4104) to serve them.");

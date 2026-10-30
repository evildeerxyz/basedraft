/*
 * Each template as its Astro version, made the way Download project makes it, then built: run it
 * after changing a template, to see its Astro version still builds. Needs Node.js 22.12 or newer.
 *
 *   npx tsx --tsconfig tsconfig.json scripts/astro-check.ts            all of them
 *   npx tsx --tsconfig tsconfig.json scripts/astro-check.ts noma       one
 *
 * The projects are left in your temp folder (printed below) to look at or run with npm run dev.
 */
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { siteFiles } from "../src/server/site";
import { newProject } from "../src/studio/state";

const pages = (dir: string): number => readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? pages(path.join(dir, e.name)) : e.name.endsWith(".html") ? 1 : 0), 0);

async function main() {
  for (const slug of (process.argv[2] ?? "zuno,noma,auren").split(",")) {
    const { files } = await siteFiles(newProject(slug as never), "astro");
    const dir = path.join(os.tmpdir(), "basedraft-astro", slug);
    // Installed packages stay between runs.
    mkdirSync(dir, { recursive: true });
    for (const e of readdirSync(dir, { withFileTypes: true }).filter((e) => e.name !== "node_modules")) rmSync(path.join(dir, e.name), { recursive: true, force: true });
    for (const [rel, v] of files) {
      mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      writeFileSync(path.join(dir, rel), v);
    }
    execSync("npm install --no-audit --no-fund && npx astro build", { cwd: dir, stdio: "inherit" });
    console.log(`\n${slug}: ${pages(path.join(dir, "dist"))} pages built, in ${dir}\n`);
  }
}

void main();

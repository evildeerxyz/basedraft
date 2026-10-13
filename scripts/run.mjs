/*
 * Runs basedraft and its three template zones together.
 *   node scripts/run.mjs dev     every app in dev mode, and Convex watching convex/
 *   node scripts/run.mjs build   build the zones, then basedraft
 *   node scripts/run.mjs start   serve every production build
 * basedraft is on 3400; the zones on the ports in scripts/zones.mjs.
 */
import { spawn } from "node:child_process";
import { ZONES } from "./zones.mjs";

const mode = process.argv[2];
if (!["dev", "build", "start"].includes(mode)) {
  console.error("Usage: node scripts/run.mjs dev | build | start");
  process.exit(1);
}

const npx = (cwd, args, label) =>
  new Promise((done, fail) => {
    const child = spawn("npx", args, { cwd, stdio: ["ignore", "pipe", "pipe"], env: process.env });
    const tag = (chunk) => chunk.toString().split("\n").filter(Boolean).forEach((line) => console.log(`[${label}] ${line}`));
    child.stdout.on("data", tag);
    child.stderr.on("data", tag);
    child.on("exit", (code) => (code === 0 ? done() : fail(new Error(`${label} exited with ${code}`))));
  });
const next = (cwd, args, label) => npx(cwd, ["next", ...args], label);

if (mode === "build") {
  // One at a time: each build is already parallel inside, and the logs stay readable.
  for (const z of ZONES) await next(z.dir, ["build"], z.slug);
  await next(".", ["build"], "basedraft");
} else {
  const apps = [...ZONES.map((z) => next(z.dir, [mode, "-p", String(z.port)], z.slug)), next(".", [mode, "-p", "3400"], "basedraft")];
  // Accounts run in Convex (convex/): in dev, its functions redeploy as you save them.
  if (mode === "dev") apps.push(npx(".", ["convex", "dev"], "convex"));
  await Promise.race(apps).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

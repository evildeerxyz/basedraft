#!/usr/bin/env node
/*
 * Regenerates every social card (src/app/<route>/opengraph-image.png) from the
 * live scenes, plus its alt text.
 *
 *   npx playwright@1 install chromium        # once
 *   OG_STUDIO=1 npm run build && OG_STUDIO=1 npm run start
 *   npm run og                               # in a second terminal
 *   npm run og -- pricing security           # or just some cards
 *
 * Set BASE_URL if the studio is not on http://localhost:3001.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const cards = JSON.parse(readFileSync(new URL("../src/components/og/cards.json", import.meta.url), "utf8"));
const base = (process.env.BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const only = process.argv.slice(2);

try {
  const res = await fetch(`${base}/og/${cards[0].id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (error) {
  console.error(`Could not reach the card studio at ${base}/og (${error.message}).`);
  console.error("Start it first:  OG_STUDIO=1 npm run build && OG_STUDIO=1 npm run start");
  process.exit(1);
}

for (const card of cards) {
  if (only.length && !only.includes(card.id)) continue;
  const dir = join("src", "app", card.route);
  const out = join(dir, "opengraph-image.png");
  try {
    execFileSync(
      "npx",
      [
        "--yes",
        "playwright@1",
        "screenshot",
        "--browser",
        "chromium",
        "--color-scheme",
        "light",
        "--viewport-size",
        "1200, 630",
        "--wait-for-timeout",
        String(card.wait),
        `${base}/og/${card.id}`,
        out,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    if (output.includes("playwright install")) console.error("Playwright needs its browser once:  npx playwright@1 install chromium");
    else console.error(output || error.message);
    process.exit(1);
  }
  writeFileSync(join(dir, "opengraph-image.alt.txt"), card.alt);
  console.log(`✓ ${card.id.padEnd(10)} ${out}`);
}

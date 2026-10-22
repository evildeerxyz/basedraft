"use client";

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Meter } from "../../ui/meter";

const TOTAL = 61;

/** A push to GitHub, a few files at a time. Again starts a fresh one. */
function Push({ onAgain }: { onAgain: () => void }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((x) => Math.min(TOTAL, x + 1 + Math.floor(Math.random() * 4))), 140);
    return () => clearInterval(t);
  }, []);
  const done = n >= TOTAL;
  return (
    <div className="w-full max-w-[340px]">
      <Meter value={n} max={TOTAL} label={done ? "Pushed to GitHub" : "Pushing to GitHub"} valueLabel={`${n} of ${TOTAL} files`} />
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <Badge variant="outline" dot={done ? "ok" : "wait"} live={!done}>
          fieldwork/zuno-site
        </Badge>
        <Button variant="ghost" size="sm" onClick={onAgain}>
          <ArrowCounterClockwiseIcon weight="regular" /> Again
        </Button>
      </div>
    </div>
  );
}

export function Demo() {
  const [run, setRun] = useState(0);
  return <Push key={run} onAgain={() => setRun((r) => r + 1)} />;
}

function Basic() {
  return <Meter value={64} label="Storage" className="max-w-[320px]" />;
}

function Labeled() {
  return <Meter value={3.2} max={5} label="Images in this draft" valueLabel="3.2 of 5 GB" className="max-w-[320px]" />;
}

function Compact() {
  return <Meter value={7} max={10} label="Seats" valueLabel="7 of 10" cols={20} rows={2} className="max-w-[240px]" />;
}

function Seats() {
  const [used, setUsed] = useState(6);
  return (
    <div className="grid w-full max-w-[320px] gap-3">
      <Meter value={used} max={10} label="Seats on your Team license" valueLabel={`${used} of 10`} cols={30} rows={3} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setUsed((n) => Math.max(0, n - 1))}>
          Remove one
        </Button>
        <Button size="sm" onClick={() => setUsed((n) => Math.min(10, n + 1))}>
          Invite one
        </Button>
      </div>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, labeled: Labeled, compact: Compact, live: Seats };

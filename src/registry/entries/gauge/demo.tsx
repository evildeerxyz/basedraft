"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { Gauge, type GaugeZone } from "../../ui/gauge";
import { hint } from "../_shared/kit";

const LOAD: GaugeZone[] = [
  { from: 0, tone: "ok" },
  { from: 70, tone: "warn" },
  { from: 90, tone: "stop" },
];

/* A busy afternoon on zuno.site: the readings it steps through, round and round. */
const READINGS = [34, 52, 61, 78, 93, 71, 48];

export function Demo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % READINGS.length), 1700);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="grid justify-items-center gap-3">
      <Gauge value={READINGS[i]} unit="%" label="CPU, zuno.site" zones={LOAD} size={240} />
      <p className={hint}>Amber from 70, red from 90.</p>
    </div>
  );
}

function Basic() {
  return <Gauge value={64} unit="%" label="Storage" />;
}

function Zones() {
  const [used, setUsed] = useState(640);
  return (
    <div className="grid justify-items-center gap-3">
      <Gauge
        value={used}
        max={1000}
        label="Build minutes"
        zones={[
          { from: 0, tone: "ok" },
          { from: 700, tone: "warn" },
          { from: 900, tone: "stop" },
        ]}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setUsed((m) => Math.min(1000, m + 90))}>
          Run a build
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setUsed(120)}>
          New month
        </Button>
      </div>
    </div>
  );
}

function Vitals() {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      <Gauge size={150} value={38} unit="%" label="CPU" />
      <Gauge size={150} value={5.1} max={8} unit="GB" format={(v) => v.toFixed(1)} label="Memory" dither={false} />
      <Gauge size={150} value={182} max={500} unit="ms" label="Response" dither={false} />
    </div>
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, zones: Zones, vitals: Vitals };

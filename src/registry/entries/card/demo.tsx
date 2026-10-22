"use client";

import type { ComponentType } from "react";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardMedia, CardTitle } from "../../ui/card";

/* Zuno's cover: its dark page and the dithered portfolio chart it's known for. */
function ZunoCover() {
  const line = "M0,62 C18,58 26,48 40,50 S62,60 76,44 S98,30 112,36 S134,22 150,18 S172,24 186,12 L200,8";
  return (
    <CardMedia className="aspect-[16/8] bg-[oklch(17%_0.012_150)]">
      <svg viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden className="absolute inset-x-0 bottom-0 h-[72%] w-full">
        <defs>
          <pattern id="zuno-dots" width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.7" fill="#c8ff3e" />
          </pattern>
          <linearGradient id="zuno-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="zuno-mask">
            <rect width="200" height="80" fill="url(#zuno-fade)" />
          </mask>
        </defs>
        <path d={`${line} L200,80 L0,80 Z`} fill="url(#zuno-dots)" mask="url(#zuno-mask)" />
        <path d={line} fill="none" stroke="#c8ff3e" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="absolute left-3 top-3 font-mono text-[10px] tracking-[0.08em] text-white/55">PORTFOLIO +18.4%</span>
    </CardMedia>
  );
}

/** A template, on a shell card that lifts when it's pointed at. */
export function Demo() {
  return (
    <Card interactive className="w-full max-w-[320px]">
      <ZunoCover />
      <CardHeader className="pt-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#c8ff3e] font-mono text-[15px] font-bold text-black shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]">
            Z
          </span>
          <span className="min-w-0 flex-1">
            <CardTitle>Zuno</CardTitle>
            <CardDescription>Fintech, 25 pages</CardDescription>
          </span>
          <Badge>Pro</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-3 text-[13px] leading-relaxed text-[var(--bd-muted)]">A dark, calm investing site with a dithered portfolio chart.</CardContent>
      <CardFooter className="justify-between">
        <span className="pl-1.5 text-sm font-medium tabular-nums">$79</span>
        <Button size="sm">Open in Studio</Button>
      </CardFooter>
    </Card>
  );
}

function Surface() {
  return (
    <Card variant="surface" className="w-full max-w-[300px]">
      <CardHeader>
        <CardTitle>Autosave</CardTitle>
        <CardDescription>Last saved 2 minutes ago</CardDescription>
      </CardHeader>
      <CardContent className="text-[13px] text-[var(--bd-muted)]">Every change to this draft is kept in your account.</CardContent>
      <CardFooter className="justify-end">
        <Button size="sm" variant="ghost">
          History
        </Button>
        <Button size="sm">Save now</Button>
      </CardFooter>
    </Card>
  );
}

function Paper() {
  return (
    <Card variant="paper" className="w-full max-w-[300px]">
      <CardHeader>
        <CardTitle>Every update, included</CardTitle>
        <CardDescription>With Pro, once</CardDescription>
      </CardHeader>
      <CardContent className="text-[13px] text-[var(--bd-paper-muted)]">New templates and sections land on your Purchases page as they ship.</CardContent>
    </Card>
  );
}

function Edge() {
  return (
    <Card edge className="w-full max-w-[300px]">
      <CardHeader>
        <CardTitle>Pro</CardTitle>
        <CardDescription>Every template and section</CardDescription>
      </CardHeader>
      <CardContent className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight">$149</span>
        <span className="text-sm text-[var(--bd-muted)]">once</span>
      </CardContent>
      <CardFooter>
        <Button variant="metal" size="sm" className="w-full">
          Get Pro
        </Button>
      </CardFooter>
    </Card>
  );
}

export const examples: Record<string, ComponentType> = { surface: Surface, paper: Paper, edge: Edge };

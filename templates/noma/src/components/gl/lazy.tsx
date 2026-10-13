"use client";

import dynamic from "next/dynamic";

/*
 * WebGL scenes, loaded after first paint so three.js stays out of the
 * initial bundle. Give each one a sized parent; the scene fills it.
 */

export const StackScene = dynamic(() => import("./scenes").then((m) => m.StackScene), { ssr: false });
export const CityScene = dynamic(() => import("./scenes").then((m) => m.CityScene), { ssr: false });
export const FundingScene = dynamic(() => import("./scenes").then((m) => m.FundingScene), { ssr: false });
export const ReleaseScene = dynamic(() => import("./scenes").then((m) => m.ReleaseScene), { ssr: false });
export const TrayScene = dynamic(() => import("./scenes").then((m) => m.TrayScene), { ssr: false });

export const HeroScene = dynamic(() => import("./devices").then((m) => m.HeroScene), { ssr: false });
export const PlansScene = dynamic(() => import("./rack").then((m) => m.PlansScene), { ssr: false });
export const StatusScene = dynamic(() => import("./rack").then((m) => m.StatusScene), { ssr: false });
export const ConnectScene = dynamic(() => import("./flows").then((m) => m.ConnectScene), { ssr: false });
export const GateScene = dynamic(() => import("./flows").then((m) => m.GateScene), { ssr: false });
export const StepsScene = dynamic(() => import("./steps").then((m) => m.StepsScene), { ssr: false });

export type { LayerKey } from "./scenes";
export type { StepIndex } from "./steps";
export type { HeroStep } from "./devices";

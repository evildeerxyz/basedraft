"use client";

import { useSyncExternalStore } from "react";
import { PLATFORMS, type PlatformId } from "@/lib/content/downloads";
import { CopyCommand } from "../ui/copy-command";
import { buttonClass } from "../ui/primitives";
import { SmartLink } from "../ui/smart-link";
import { PLATFORM_ICONS } from "./platform-icons";

const detect = (): PlatformId => {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "linux";
  return "macos";
};

const noop = () => () => {};

/** Primary download for the visitor's OS; server renders macOS. */
export function DetectedDownload() {
  const id = useSyncExternalStore(noop, detect, () => "macos" as PlatformId);
  const platform = PLATFORMS.find((p) => p.id === id)!;
  const primary = platform.artifacts[0];
  const Icon = PLATFORM_ICONS[id];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <SmartLink href={primary.href} className={buttonClass("light", "lg")}>
          <Icon size={17} weight="fill" />
          Download for {platform.name}
        </SmartLink>
        <CopyCommand command={platform.command} />
      </div>
      <p className="mt-3.5 font-mono text-[11.5px] text-mute">
        {primary.file} · {primary.size} ·{" "}
        <SmartLink href="#platforms" className="text-fog underline decoration-paper/25 underline-offset-4 hover:text-paper">
          Other platforms
        </SmartLink>
      </p>
    </div>
  );
}

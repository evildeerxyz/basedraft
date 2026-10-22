"use client";

import { ArrowClockwiseIcon, ArrowCounterClockwiseIcon, ChatCircleTextIcon, CornersOutIcon, LinkSimpleIcon, MagnifyingGlassPlusIcon, TextAlignCenterIcon, TextAlignLeftIcon, TextAlignRightIcon, TextBIcon, TextItalicIcon, TextUnderlineIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Slider } from "../../ui/slider";
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator, ToolbarToggle } from "../../ui/toolbar";

const ALIGN = [
  { value: "left", label: "Align left", icon: <TextAlignLeftIcon weight="duotone" />, keys: ["⌘", "⇧", "L"] },
  { value: "center", label: "Align center", icon: <TextAlignCenterIcon weight="duotone" />, keys: ["⌘", "⇧", "E"] },
  { value: "right", label: "Align right", icon: <TextAlignRightIcon weight="duotone" />, keys: ["⌘", "⇧", "R"] },
];

/* Studio's text tools over a line of Zuno's hero, which takes each change as you make it. */
export function Demo() {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState("left");
  return (
    <div className="grid w-full max-w-[400px] gap-5">
      <div className="flex justify-center">
        <Toolbar label="Text">
          <ToolbarToggle label="Bold" keys={["⌘", "B"]} icon={<TextBIcon weight="bold" />} pressed={bold} onPressedChange={setBold} />
          <ToolbarToggle label="Italic" keys={["⌘", "I"]} icon={<TextItalicIcon weight="duotone" />} pressed={italic} onPressedChange={setItalic} />
          <ToolbarToggle label="Underline" keys={["⌘", "U"]} icon={<TextUnderlineIcon weight="duotone" />} pressed={underline} onPressedChange={setUnderline} />
          <ToolbarSeparator />
          <ToolbarGroup label="Alignment" options={ALIGN} value={align} onValueChange={setAlign} />
          <ToolbarSeparator />
          <ToolbarButton label="Link" keys={["⌘", "K"]} icon={<LinkSimpleIcon weight="duotone" />} />
          <ToolbarButton label="Comment" keys={["C"]} icon={<ChatCircleTextIcon weight="duotone" />} />
        </Toolbar>
      </div>
      <p className="text-[17px] leading-snug text-[var(--bd-fg)]" style={{ fontWeight: bold ? 600 : 400, fontStyle: italic ? "italic" : "normal", textDecoration: underline ? "underline" : "none", textAlign: align as "left" | "center" | "right" }}>
        Money that manages itself.
      </p>
    </div>
  );
}

function Basic() {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  return (
    <Toolbar label="Text">
      <ToolbarToggle label="Bold" keys={["⌘", "B"]} icon={<TextBIcon weight="bold" />} pressed={bold} onPressedChange={setBold} />
      <ToolbarToggle label="Italic" keys={["⌘", "I"]} icon={<TextItalicIcon weight="duotone" />} pressed={italic} onPressedChange={setItalic} />
      <ToolbarSeparator />
      <ToolbarButton label="Link" keys={["⌘", "K"]} icon={<LinkSimpleIcon weight="duotone" />} />
    </Toolbar>
  );
}

function Group() {
  const [align, setAlign] = useState("center");
  return (
    <div className="grid justify-items-center gap-3">
      <Toolbar label="Alignment">
        <ToolbarGroup label="Alignment" options={ALIGN} value={align} onValueChange={setAlign} />
      </Toolbar>
      <p className="text-xs text-[var(--bd-subtle)]">Aligned {align}</p>
    </div>
  );
}

function Overflow() {
  const [room, setRoom] = useState(300);
  return (
    <div className="grid w-full max-w-[380px] justify-items-center gap-5">
      {/* Narrow the room: the tools at the end fold into More. */}
      <div className="flex h-12 max-w-full items-center justify-center" style={{ width: room }}>
        <Toolbar label="Text">
          <ToolbarToggle label="Bold" keys={["⌘", "B"]} icon={<TextBIcon weight="bold" />} />
          <ToolbarToggle label="Italic" keys={["⌘", "I"]} icon={<TextItalicIcon weight="duotone" />} />
          <ToolbarToggle label="Underline" keys={["⌘", "U"]} icon={<TextUnderlineIcon weight="duotone" />} />
          <ToolbarSeparator />
          <ToolbarGroup label="Alignment" options={ALIGN} />
          <ToolbarSeparator />
          <ToolbarButton label="Link" keys={["⌘", "K"]} icon={<LinkSimpleIcon weight="duotone" />} />
          <ToolbarButton label="Comment" keys={["C"]} icon={<ChatCircleTextIcon weight="duotone" />} />
        </Toolbar>
      </div>
      <Slider label="Room" min={120} max={380} step={4} value={room} onValueChange={setRoom} format={(v) => `${v}px`} className="w-full max-w-[280px]" />
    </div>
  );
}

function Below() {
  return (
    <Toolbar label="Canvas" side="bottom">
      <ToolbarButton label="Undo" keys={["⌘", "Z"]} icon={<ArrowCounterClockwiseIcon weight="regular" />} />
      <ToolbarButton label="Redo" keys={["⌘", "⇧", "Z"]} icon={<ArrowClockwiseIcon weight="regular" />} />
      <ToolbarSeparator />
      <ToolbarButton label="Zoom in" keys={["⌘", "+"]} icon={<MagnifyingGlassPlusIcon weight="duotone" />} />
      <ToolbarButton label="Fit to screen" keys={["⇧", "1"]} icon={<CornersOutIcon weight="duotone" />} />
      <ToolbarButton label="Comment" keys={["C"]} disabled icon={<ChatCircleTextIcon weight="duotone" />} />
    </Toolbar>
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, group: Group, overflow: Overflow, below: Below };

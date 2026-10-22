"use client";

import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, CopyIcon, DotsThreeIcon, GearSixIcon, ReceiptIcon, SignOutIcon, TrashIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Button } from "../../ui/button";
import { Menu, MenuCheckboxItem, MenuContent, MenuGroup, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "../../ui/menu";
import { hint } from "../_shared/kit";

/** A section's menu in Studio: what to do with it, how it shows, and deleting it, apart in red. */
export function Demo() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="grid justify-items-center gap-3">
      <Menu>
        <MenuTrigger asChild>
          <Button variant="outline" size="lg">
            Hero section <CaretDownIcon weight="regular" />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuGroup label="Section">
            <MenuLabel>Section</MenuLabel>
            <MenuItem icon={<CopyIcon weight="duotone" />} shortcut={["⌘", "D"]} onSelect={() => setLast("Duplicated the hero")}>
              Duplicate
            </MenuItem>
            <MenuItem icon={<ArrowUpIcon weight="regular" />} shortcut={["⌥", "↑"]} onSelect={() => setLast("Moved it up")}>
              Move up
            </MenuItem>
            <MenuItem icon={<ArrowDownIcon weight="regular" />} shortcut={["⌥", "↓"]} onSelect={() => setLast("Moved it down")}>
              Move down
            </MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup label="Show">
            <MenuLabel>Show</MenuLabel>
            <MenuCheckboxItem defaultChecked>On phones</MenuCheckboxItem>
            <MenuCheckboxItem defaultChecked>Animate on scroll</MenuCheckboxItem>
            <MenuCheckboxItem>In the navigation</MenuCheckboxItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuItem icon={<TrashIcon weight="duotone" />} shortcut={["⌫"]} tone="stop" onSelect={() => setLast("Deleted the hero")}>
            Delete section
          </MenuItem>
        </MenuContent>
      </Menu>
      <p className={hint}>{last ?? "Arrows move, a letter jumps to an action, Enter does it."}</p>
    </div>
  );
}

function Account() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">
          <span className="grid size-6 place-items-center rounded-full bg-[var(--bd-ui-track)] text-[11px] font-semibold">MO</span>
          Maya Okafor
        </Button>
      </MenuTrigger>
      <MenuContent align="end">
        <MenuLabel>maya@fieldwork.co</MenuLabel>
        <MenuItem icon={<ReceiptIcon weight="duotone" />}>Purchases</MenuItem>
        <MenuItem icon={<UsersThreeIcon weight="duotone" />}>Team</MenuItem>
        <MenuItem icon={<GearSixIcon weight="duotone" />} shortcut={["⌘", ","]}>
          Settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<SignOutIcon weight="duotone" />}>Sign out</MenuItem>
      </MenuContent>
    </Menu>
  );
}

function View() {
  const [grid, setGrid] = useState(true);
  const [rulers, setRulers] = useState(false);
  const [outlines, setOutlines] = useState(true);
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline">View</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuCheckboxItem checked={grid} onCheckedChange={setGrid} shortcut={["⌘", "'"]}>
          Layout grid
        </MenuCheckboxItem>
        <MenuCheckboxItem checked={rulers} onCheckedChange={setRulers} shortcut={["⌘", "R"]}>
          Rulers
        </MenuCheckboxItem>
        <MenuCheckboxItem checked={outlines} onCheckedChange={setOutlines}>
          Section outlines
        </MenuCheckboxItem>
      </MenuContent>
    </Menu>
  );
}

function Compact() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="More for this draft">
          <DotsThreeIcon weight="bold" />
        </Button>
      </MenuTrigger>
      <MenuContent align="end">
        <MenuItem>Rename</MenuItem>
        <MenuItem>Duplicate</MenuItem>
        <MenuItem disabled>Move to team (Team plan)</MenuItem>
        <MenuSeparator />
        <MenuItem tone="stop">Delete draft</MenuItem>
      </MenuContent>
    </Menu>
  );
}

export const examples: Record<string, ComponentType> = { account: Account, checkable: View, icon: Compact };

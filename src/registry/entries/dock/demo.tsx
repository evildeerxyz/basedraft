"use client";

import { BookOpenTextIcon, CalendarBlankIcon, CompassIcon, GithubLogoIcon, HouseIcon, ImageIcon, MusicNotesIcon, NotePencilIcon, TrashIcon, TrayIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { Dock, DockDivider, DockItem } from "../../ui/dock";
import { hint } from "../_shared/kit";

const APPS = [
  { id: "home", label: "Home", icon: <HouseIcon weight="duotone" /> },
  { id: "mail", label: "Mail", icon: <TrayIcon weight="duotone" />, badge: 3 },
  { id: "calendar", label: "Calendar", icon: <CalendarBlankIcon weight="duotone" /> },
  { id: "notes", label: "Notes", icon: <NotePencilIcon weight="duotone" /> },
  { id: "music", label: "Music", icon: <MusicNotesIcon weight="duotone" /> },
  { id: "photos", label: "Photos", icon: <ImageIcon weight="duotone" /> },
];

export function Demo() {
  const [open, setOpen] = useState<string[]>(["mail", "music"]);
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  return (
    <div className="grid w-full justify-items-center gap-8 pt-14">
      <Dock label="Apps">
        {APPS.map((a) => (
          <DockItem key={a.id} label={a.label} icon={a.icon} badge={a.badge} active={open.includes(a.id)} onClick={() => toggle(a.id)} />
        ))}
        <DockDivider />
        <DockItem label="Trash" icon={<TrashIcon weight="duotone" />} />
      </Dock>
      <p className={`${hint} text-center`}>Run your pointer along it, or press a key to open and close it.</p>
    </div>
  );
}

/* As a site's few links, smaller and closer. */
function Links() {
  return (
    <div className="pt-12">
      <Dock size={38} magnify={54} reach={110} label="Site">
        <DockItem label="Home" icon={<HouseIcon weight="duotone" />} href="#home" active />
        <DockItem label="Docs" icon={<BookOpenTextIcon weight="duotone" />} href="#docs" />
        <DockItem label="Explore" icon={<CompassIcon weight="duotone" />} href="#explore" />
        <DockDivider />
        <DockItem label="GitHub" icon={<GithubLogoIcon weight="duotone" />} href="#github" />
      </Dock>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { links: Links };

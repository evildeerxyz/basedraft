"use client";

import { BrowserIcon, ChartBarIcon, EyeIcon, EyeSlashIcon, QuestionIcon, SealCheckIcon, SquareHalfBottomIcon, SquaresFourIcon, TagIcon, TextHOneIcon, type Icon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { SortableList } from "../../ui/sortable-list";

/* A template's home page, a section a row, the way Studio's outline lists them. */
type Section = { id: string; name: string; note: string; icon: Icon };
const SECTIONS: Section[] = [
  { id: "nav", name: "Navigation", note: "The bar across the top", icon: BrowserIcon },
  { id: "hero", name: "Hero", note: "One promise, one action", icon: TextHOneIcon },
  { id: "logos", name: "Logos", note: "Who uses it", icon: SealCheckIcon },
  { id: "features", name: "Features", note: "What it does, shown", icon: SquaresFourIcon },
  { id: "stats", name: "Stats", note: "Numbers that matter", icon: ChartBarIcon },
  { id: "pricing", name: "Pricing", note: "Plans side by side", icon: TagIcon },
  { id: "faq", name: "FAQ", note: "Before they buy", icon: QuestionIcon },
  { id: "footer", name: "Footer", note: "Links and legal", icon: SquareHalfBottomIcon },
];

/** One section's row: its icon, its name and a line, and a button that hides it from the page. */
function SectionRow({ s, hidden, onHide }: { s: Section; hidden?: boolean; onHide?: () => void }) {
  const I = s.icon;
  return (
    <span className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--bd-ui-track)] text-[var(--bd-fg)]">
        <I size={16} weight="duotone" />
      </span>
      <span className={`min-w-0 flex-1 leading-tight transition-opacity ${hidden ? "opacity-45" : ""}`}>
        <span className="block truncate text-sm font-medium">{s.name}</span>
        <span className="block truncate text-[12px] text-[var(--bd-subtle)]">{s.note}</span>
      </span>
      {onHide && (
        <button type="button" onClick={onHide} aria-label={hidden ? `Show ${s.name}` : `Hide ${s.name}`} className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--bd-subtle)] transition-colors hover:bg-[var(--bd-ui-track)] hover:text-[var(--bd-fg)]">
          {hidden ? <EyeSlashIcon size={15} weight="duotone" /> : <EyeIcon size={15} weight="duotone" />}
        </button>
      )}
    </span>
  );
}

export function Demo() {
  const [sections, setSections] = useState(SECTIONS.slice(0, 5));
  const [hidden, setHidden] = useState<string[]>([]);
  return (
    <SortableList
      label="Home page sections"
      items={sections}
      itemKey={(s) => s.id}
      itemLabel={(s) => s.name}
      onReorder={setSections}
      className="w-full max-w-[340px]"
      renderItem={(s) => <SectionRow s={s} hidden={hidden.includes(s.id)} onHide={() => setHidden((h) => (h.includes(s.id) ? h.filter((x) => x !== s.id) : [...h, s.id]))} />}
    />
  );
}

function Row() {
  const [sections, setSections] = useState(SECTIONS.slice(0, 5));
  return <SortableList label="Home page sections" items={sections} itemKey={(s) => s.id} itemLabel={(s) => s.name} onReorder={setSections} className="w-full max-w-[340px]" renderItem={(s) => <SectionRow s={s} />} />;
}

function Handle() {
  const [sections, setSections] = useState(SECTIONS.slice(0, 5));
  return (
    <SortableList
      label="Home page sections"
      items={sections}
      itemKey={(s) => s.id}
      itemLabel={(s) => s.name}
      onReorder={setSections}
      handle
      className="w-full max-w-[380px]"
      renderItem={(s) => (
        <span className="block leading-tight">
          <span className="block text-sm font-medium">{s.name}</span>
          <span className="block text-[12px] text-[var(--bd-subtle)]">{s.note}. Select this text; only the grip drags.</span>
        </span>
      )}
    />
  );
}

/* Thirty pages of a long template, to drag near the edges of a short box. */
const PAGES = ["Home", "Pricing", "Security", "About", "Careers", "Press", "Blog", "Changelog", "Help center", "Contact", "Customers", "Integrations", "Status", "Privacy", "Terms", "Cookies", "Docs", "API", "Partners", "Events", "Webinars", "Guides", "Templates", "Compare", "Enterprise", "Startups", "Education", "Brand", "Sitemap", "404"].map((name, i) => ({ id: `p${i}`, name }));

function Long() {
  const [pages, setPages] = useState(PAGES);
  return (
    <div className="h-[280px] w-full max-w-[340px] overflow-y-auto rounded-[20px]">
      <SortableList
        label="Pages"
        items={pages}
        itemKey={(p) => p.id}
        itemLabel={(p) => p.name}
        onReorder={setPages}
        renderItem={(p, { index }) => (
          <span className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{p.name}</span>
            <span className="text-[12px] tabular-nums text-[var(--bd-subtle)]">{index + 1}</span>
          </span>
        )}
      />
    </div>
  );
}

function Keyboard() {
  const [sections, setSections] = useState(SECTIONS.slice(3, 7));
  return (
    <div className="grid w-full max-w-[340px] gap-2.5">
      <SortableList label="Home page sections" items={sections} itemKey={(s) => s.id} itemLabel={(s) => s.name} onReorder={setSections} renderItem={(s) => <SectionRow s={s} />} />
      <p className="px-1 text-[12px] text-[var(--bd-subtle)]">Tab to a row, Space to pick it up, the arrows to move it, Space to put it down.</p>
    </div>
  );
}

export const examples: Record<string, ComponentType> = {
  row: Row,
  handle: Handle,
  long: Long,
  keyboard: Keyboard,
};

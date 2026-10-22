"use client";

import { ArrowCounterClockwiseIcon, DownloadSimpleIcon, MagnifyingGlassIcon, ReceiptIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { DataTable, type DataTableColumn } from "../../pro-ui/data-table";
import { Input } from "../../ui/input";
import { Segmented } from "../../ui/segmented";

/* A store's purchases: who bought which template, for how much, and where it stands. */
type Status = "Paid" | "Refunded" | "Pending";
type Order = { id: string; name: string; email: string; product: string; amount: number; date: string; status: Status };

const ORDERS: Order[] = [
  { id: "BD-1048", name: "Maya Okafor", email: "maya@fieldwork.co", product: "Pro", amount: 149, date: "2026-10-21", status: "Paid" },
  { id: "BD-1047", name: "Jonah Park", email: "jonah@northbeam.io", product: "Zuno", amount: 79, date: "2026-10-21", status: "Paid" },
  { id: "BD-1046", name: "Lea Moreau", email: "lea@parcelworks.fr", product: "Team", amount: 399, date: "2026-10-20", status: "Pending" },
  { id: "BD-1045", name: "Sami Ito", email: "sami@quanta.jp", product: "Noma", amount: 79, date: "2026-10-19", status: "Paid" },
  { id: "BD-1044", name: "Ana Ruiz", email: "ana@helio.studio", product: "Auren", amount: 79, date: "2026-10-18", status: "Refunded" },
  { id: "BD-1043", name: "Ben Adeyemi", email: "ben@mosaic.dev", product: "Pro", amount: 149, date: "2026-10-17", status: "Paid" },
];

/* Status as a tinted pill with a dot, in the theme's status colors. */
const TONE: Record<Status, string> = {
  Paid: "bg-[color-mix(in_oklab,var(--bd-ui-ok)_13%,var(--bd-surface))] text-[color-mix(in_oklab,var(--bd-ui-ok)_75%,var(--bd-fg))] [--dot:var(--bd-ui-ok)]",
  Pending: "bg-[color-mix(in_oklab,var(--bd-ui-wait)_16%,var(--bd-surface))] text-[color-mix(in_oklab,var(--bd-ui-wait)_60%,var(--bd-fg))] [--dot:var(--bd-ui-wait)]",
  Refunded: "bg-[var(--bd-ui-track)] text-[var(--bd-muted)] [--dot:var(--bd-subtle)]",
};
/* Each customer's initials on a tint of one of the data colors, the same one every time. */
const TINTS = ["--bd-ui-viz-1", "--bd-ui-viz-2", "--bd-ui-viz-3", "--bd-ui-viz-4", "--bd-ui-viz-5"];
const tint = (name: string) => TINTS[[...name].reduce((t, c) => t + c.charCodeAt(0), 0) % TINTS.length];
const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const CUSTOMER: DataTableColumn<Order> = {
  key: "name",
  header: "Customer",
  cell: (o) => (
    <span className="flex items-center gap-3">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full text-[11.5px] font-semibold" style={{ background: `color-mix(in oklab, var(${tint(o.name)}) 18%, var(--bd-surface))`, color: `color-mix(in oklab, var(${tint(o.name)}) 70%, var(--bd-fg))` }}>
        {o.name.split(" ").map((w) => w[0]).join("")}
      </span>
      <span className="block leading-tight">
        <span className="block font-medium">{o.name}</span>
        <span className="block text-[12px] text-[var(--bd-subtle)]">{o.email}</span>
      </span>
    </span>
  ),
  sortBy: (o) => o.name,
};
const BOUGHT: DataTableColumn<Order> = {
  key: "product",
  header: "Bought",
  cell: (o) => <span className="inline-flex h-6 items-center rounded-[7px] px-2 text-[12.5px] font-medium shadow-[inset_0_0_0_1px_var(--bd-line)]">{o.product}</span>,
  sortBy: (o) => o.product,
};
const AMOUNT: DataTableColumn<Order> = { key: "amount", header: "Amount", cell: (o) => <span className="font-medium">{money(o.amount)}</span>, sortBy: (o) => o.amount, align: "end" };
const STATUS: DataTableColumn<Order> = {
  key: "status",
  header: "Status",
  cell: (o) => (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium ${TONE[o.status]}`}>
      <span className="size-1.5 rounded-full bg-[var(--dot)]" />
      {o.status}
    </span>
  ),
  sortBy: (o) => o.status,
};
const DATE: DataTableColumn<Order> = { key: "date", header: "Date", cell: (o) => <span className="text-[var(--bd-muted)]">{day(o.date)}</span>, sortBy: (o) => o.date };

const COLUMNS: DataTableColumn<Order>[] = [{ key: "id", header: "Order", cell: (o) => <span className="font-mono text-[12.5px]">{o.id}</span>, sortBy: (o) => o.id }, CUSTOMER, BOUGHT, AMOUNT, DATE, STATUS];

const FILTERS = [
  { value: "all", label: "All" },
  { value: "Paid", label: "Paid" },
  { value: "Refunded", label: "Refunded" },
];

/** Purchases as an admin page shows them: a search, a filter, and a bar for whatever's picked. */
export function Demo() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const q = query.trim().toLowerCase();
  const rows = ORDERS.filter((o) => (filter === "all" || o.status === filter) && (!q || `${o.name} ${o.email} ${o.product} ${o.id}`.toLowerCase().includes(q)));
  return (
    <div className="grid w-full max-w-[860px] gap-3">
      {/* The toolbar shows on the component's own stage; a gallery tile shows the table alone. */}
      <div className="hidden flex-wrap items-center justify-between gap-2.5 [[data-bd-stage]_&]:flex">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-[var(--bd-fg)]">
          Purchases <span className="rounded-full bg-[var(--bd-ui-track)] px-2 py-0.5 text-[11.5px] font-medium tabular-nums text-[var(--bd-muted)]">{rows.length}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search purchases" leading={<MagnifyingGlassIcon weight="duotone" />} className="h-9! w-[180px]! px-3.5" />
          <Segmented size="sm" label="Show" options={FILTERS} value={filter} onValueChange={setFilter} />
        </div>
      </div>
      <DataTable
        label="Purchases"
        rows={rows}
        columns={[CUSTOMER, BOUGHT, AMOUNT, STATUS, DATE]}
        rowKey={(o) => o.id}
        rowLabel={(o) => `order ${o.id}`}
        selectable
        stickyFirstColumn
        density="compact"
        defaultSort={{ key: "date", direction: "desc" }}
        empty={<span className="text-sm text-[var(--bd-muted)]">No purchases match.</span>}
        actions={(picked, clear) => (
          <>
            <button type="button" onClick={clear}>
              <ArrowCounterClockwiseIcon weight="regular" /> Refund
            </button>
            <button type="button" onClick={clear}>
              <DownloadSimpleIcon weight="duotone" /> Export
            </button>
          </>
        )}
      />
    </div>
  );
}

function Sorting() {
  return <DataTable label="Purchases" rows={ORDERS} columns={COLUMNS} rowKey={(o) => o.id} defaultSort={{ key: "amount", direction: "desc" }} />;
}

function Selection() {
  const [picked, setPicked] = useState<string[]>(["BD-1047"]);
  return (
    <div className="grid w-full gap-3">
      <div className="flex h-9 items-center justify-between gap-3 px-1 text-sm">
        <span className="text-[var(--bd-muted)] tabular-nums">{picked.length ? `${picked.length} picked. Shift-click to pick a run.` : "Pick rows, or shift-click a run of them."}</span>
        <button type="button" disabled={!picked.length} onClick={() => setPicked([])} className="h-8 rounded-full bg-[var(--bd-surface)] px-3.5 text-[13px] font-medium shadow-[0_0_0_1px_var(--bd-line)] transition-opacity disabled:opacity-40">
          Refund {picked.length || ""}
        </button>
      </div>
      <DataTable label="Purchases" rows={ORDERS} columns={COLUMNS} rowKey={(o) => o.id} rowLabel={(o) => `order ${o.id}`} selectable selected={picked} onSelectedChange={setPicked} density="compact" />
    </div>
  );
}

function Expand() {
  return (
    <DataTable
      label="Purchases"
      rows={ORDERS.slice(0, 4)}
      columns={COLUMNS.filter((c) => c.key !== "status")}
      rowKey={(o) => o.id}
      rowLabel={(o) => `order ${o.id}`}
      expand={(o) => (
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px]">
          <span className="inline-flex items-center gap-2 text-[var(--bd-muted)]">
            <ReceiptIcon size={15} weight="duotone" /> Paid by card ending 4242
          </span>
          <span className="text-[var(--bd-muted)]">{o.product === "Team" ? "10 seats" : "1 seat"}</span>
          <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--bd-surface)] px-3 font-medium shadow-[0_0_0_1px_var(--bd-line)]">
            <DownloadSimpleIcon size={14} weight="duotone" /> Receipt
          </button>
        </div>
      )}
    />
  );
}

/* Two hundred orders, made the same way each time, for the long table. */
const NAMES = ["Maya Okafor", "Jonah Park", "Lea Moreau", "Sami Ito", "Ana Ruiz", "Ben Adeyemi", "Ines Duarte", "Tomas Berg", "Priya Raman", "Kofi Mensah"];
const PRODUCTS: Array<[string, number]> = [
  ["Pro", 149],
  ["Zuno", 79],
  ["Noma", 79],
  ["Auren", 79],
  ["Team", 399],
];
const MANY: Order[] = Array.from({ length: 200 }, (_, i) => {
  const name = NAMES[i % NAMES.length];
  const [product, amount] = PRODUCTS[(i * 7) % PRODUCTS.length];
  const d = new Date(Date.UTC(2026, 9, 21) - Math.floor(i / 3) * 86400000);
  return { id: `BD-${1048 - i}`, name, email: `${name.split(" ")[0].toLowerCase()}@example.com`, product, amount, date: d.toISOString().slice(0, 10), status: i % 11 === 4 ? "Refunded" : i % 7 === 2 ? "Pending" : "Paid" };
});

function Long() {
  return <DataTable label="All purchases" rows={MANY} columns={COLUMNS} rowKey={(o) => o.id} rowLabel={(o) => `order ${o.id}`} selectable stickyFirstColumn density="compact" maxHeight={320} />;
}

function Empty() {
  return (
    <DataTable
      label="Refunds"
      rows={[]}
      columns={COLUMNS}
      rowKey={(o) => o.id}
      empty={
        <span className="inline-flex flex-col items-center gap-1 text-sm">
          <span className="font-medium text-[var(--bd-fg)]">No refunds this month</span>
          <span className="text-[var(--bd-muted)]">Refunded orders show up here.</span>
        </span>
      }
    />
  );
}

export const examples: Record<string, ComponentType> = {
  sorting: Sorting,
  selection: Selection,
  expand: Expand,
  long: Long,
  empty: Empty,
};

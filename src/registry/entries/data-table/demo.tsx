"use client";

import { ArrowCounterClockwiseIcon, DownloadSimpleIcon, MagnifyingGlassIcon, ReceiptIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import { DataTable, type DataTableColumn } from "../../pro-ui/data-table";
import { FilterBar, type Filter, type FilterField } from "../../pro-ui/filter-bar";
import { Avatar } from "../../ui/avatar";
import { Input } from "../../ui/input";

/* A store's purchases: who bought which template, for how much, and where it stands. */
type Status = "Paid" | "Refunded" | "Pending";
type Order = { id: string; name: string; email: string; product: string; amount: number; date: string; status: Status };

const ORDERS: Order[] = [
  { id: "BD-1048", name: "Emily Carter", email: "emily@larkspur.co", product: "Pro", amount: 149, date: "2026-10-21", status: "Paid" },
  { id: "BD-1047", name: "Jake Morrison", email: "jake@northbeam.io", product: "Zuno", amount: 79, date: "2026-10-21", status: "Paid" },
  { id: "BD-1046", name: "Sarah Mitchell", email: "sarah@parcelworks.fr", product: "Team", amount: 399, date: "2026-10-20", status: "Pending" },
  { id: "BD-1045", name: "Ryan Brooks", email: "ryan@quanta.jp", product: "Noma", amount: 79, date: "2026-10-19", status: "Paid" },
  { id: "BD-1044", name: "Ashley Cooper", email: "ashley@helio.studio", product: "Auren", amount: 79, date: "2026-10-18", status: "Refunded" },
  { id: "BD-1043", name: "Brandon Reed", email: "brandon@mosaic.dev", product: "Pro", amount: 149, date: "2026-10-17", status: "Paid" },
];

/* Status as a dot and a word: color only where it means something. */
const DOT: Record<Status, string> = {
  Paid: "bg-[var(--bd-ui-ok)]",
  Pending: "bg-[var(--bd-ui-wait)]",
  Refunded: "bg-[var(--bd-subtle)]",
};
const KIND: Record<string, string> = { Pro: "Plan, every template", Team: "Plan, 10 seats", Zuno: "Template", Noma: "Template", Auren: "Template" };
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const CUSTOMER: DataTableColumn<Order> = {
  key: "name",
  header: "Customer",
  cell: (o) => (
    <span className="flex items-center gap-3">
      <Avatar name={o.name} size="sm" />
      <span className="block min-w-0 leading-tight">
        <span className="block truncate text-[13.5px] font-medium">{o.name}</span>
        <span className="block truncate text-[12px] text-[var(--bd-subtle)]">{o.email}</span>
      </span>
    </span>
  ),
  sortBy: (o) => o.name,
};
const BOUGHT: DataTableColumn<Order> = {
  key: "product",
  header: "Bought",
  cell: (o) => (
    <span className="block leading-tight">
      <span className="block text-[13.5px]">{o.product}</span>
      <span className="block text-[12px] text-[var(--bd-subtle)]">{KIND[o.product]}</span>
    </span>
  ),
  sortBy: (o) => o.product,
};
const AMOUNT: DataTableColumn<Order> = {
  key: "amount",
  header: "Amount",
  cell: (o) => (
    <span className={`font-mono text-[13px] tabular-nums ${o.status === "Refunded" ? "text-[var(--bd-subtle)] line-through decoration-[var(--bd-line-strong)]" : ""}`}>
      {money(o.amount)}
      <span className="ml-1.5 text-[11px] text-[var(--bd-subtle)] no-underline">USD</span>
    </span>
  ),
  sortBy: (o) => o.amount,
  align: "end",
};
const STATUS: DataTableColumn<Order> = {
  key: "status",
  header: "Status",
  cell: (o) => (
    <span className="inline-flex items-center gap-2 text-[13px]">
      <span className={`size-1.5 rounded-full ${DOT[o.status]}`} />
      <span className={o.status === "Paid" ? "" : "text-[var(--bd-muted)]"}>{o.status}</span>
    </span>
  ),
  sortBy: (o) => o.status,
};
const DATE: DataTableColumn<Order> = { key: "date", header: "Date", cell: (o) => <span className="font-mono text-[12.5px] text-[var(--bd-muted)]">{day(o.date)}</span>, sortBy: (o) => o.date };

const COLUMNS: DataTableColumn<Order>[] = [{ key: "id", header: "Order", cell: (o) => <span className="font-mono text-[12.5px] text-[var(--bd-muted)]">{o.id}</span>, sortBy: (o) => o.id }, CUSTOMER, BOUGHT, AMOUNT, DATE, STATUS];

const FIELDS: FilterField[] = [
  { id: "status", label: "Status", plural: "statuses", options: (["Paid", "Pending", "Refunded"] as const).map((s) => ({ value: s, label: s, icon: <span className={`size-1.5 rounded-full ${DOT[s]}`} /> })) },
  { id: "product", label: "Product", plural: "products", options: ["Pro", "Team", "Zuno", "Noma", "Auren"].map((p) => ({ value: p, label: p })) },
];

/** Purchases as an admin page shows them: the total, a search, the filter as a sentence, and a bar for whatever's picked. */
export function Demo() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const q = query.trim().toLowerCase();
  const rows = ORDERS.filter((o) => filters.every((f) => f.values.includes(String(o[f.field as keyof Order])) !== !!f.not) && (!q || `${o.name} ${o.email} ${o.product} ${o.id}`.toLowerCase().includes(q)));
  const total = rows.filter((o) => o.status !== "Refunded").reduce((a, o) => a + o.amount, 0);
  return (
    <div className="grid w-full max-w-[860px] gap-3">
      {/* The toolbar shows on the component's own stage; a gallery tile shows the table alone. */}
      <div className="hidden gap-3 [[data-bd-stage]_&]:grid">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-[var(--bd-fg)]">Purchases</p>
            <p className="mt-0.5 font-mono text-[12px] tabular-nums text-[var(--bd-muted)]">
              {rows.length} {rows.length === 1 ? "order" : "orders"}, {money(total)} kept
            </p>
          </div>
          <div className="w-[220px]">
            <Input size="sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email or order" aria-label="Search purchases" leading={<MagnifyingGlassIcon weight="regular" />} />
          </div>
        </div>
        <FilterBar noun="purchases" fields={FIELDS} value={filters} onValueChange={setFilters} />
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
const NAMES = ["Emily Carter", "Jake Morrison", "Sarah Mitchell", "Ryan Brooks", "Ashley Cooper", "Brandon Reed", "Olivia Bennett", "Chris Coleman", "Megan Turner", "Tyler Hayes"];
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

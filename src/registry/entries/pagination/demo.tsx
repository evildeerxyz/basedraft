"use client";

import { useState, type ComponentProps, type ComponentType } from "react";
import { Pagination } from "../../ui/pagination";
import { hint } from "../_shared/kit";

const SECTIONS = 284;
const PER = 12;

export function Demo() {
  const [page, setPage] = useState(6);
  const total = Math.ceil(SECTIONS / PER);
  return (
    <div className="grid justify-items-center gap-4">
      <Pagination page={page} total={total} onPageChange={setPage} />
      <p className={`${hint} tabular-nums`}>
        Sections {(page - 1) * PER + 1} to {Math.min(page * PER, SECTIONS)} of {SECTIONS}
      </p>
    </div>
  );
}

function Basic() {
  const [page, setPage] = useState(2);
  return <Pagination page={page} total={6} onPageChange={setPage} />;
}

function Many() {
  const [page, setPage] = useState(9);
  return <Pagination page={page} total={40} siblings={2} onPageChange={setPage} />;
}

function Compact() {
  const [page, setPage] = useState(3);
  return <Pagination variant="compact" page={page} total={12} onPageChange={setPage} />;
}

/** A link that stays on this page, standing in for a router's. */
function Stay({ onClick, ...props }: ComponentProps<"a">) {
  return (
    <a
      {...props}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
      }}
    />
  );
}

function Links() {
  const [page, setPage] = useState(4);
  return (
    <div className="grid justify-items-center gap-3">
      <Pagination page={page} total={18} href={(p) => `/blocks?page=${p}`} link={Stay} onPageChange={setPage} />
      <p className={`${hint} font-mono`}>/blocks?page={page}</p>
    </div>
  );
}

export const examples: Record<string, ComponentType> = { basic: Basic, many: Many, compact: Compact, links: Links };

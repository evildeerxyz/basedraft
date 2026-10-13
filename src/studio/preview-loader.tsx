"use client";

import dynamic from "next/dynamic";

/* The preview reads the draft Studio saved in this browser, so it only runs there. */
const Preview = dynamic(() => import("./preview"), { ssr: false, loading: () => <div className="h-dvh bg-well" /> });

export function PreviewLoader() {
  return <Preview />;
}

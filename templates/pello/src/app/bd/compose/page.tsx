import type { Metadata } from "next";
import { Suspense } from "react";
import { Compose } from "@/bd/compose";

/* Studio's canvas for this template. */

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ComposePage() {
  return (
    <Suspense>
      <Compose />
    </Suspense>
  );
}

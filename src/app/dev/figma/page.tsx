import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FigmaCheck } from "./check";

/* Dev only: redraws a copy's Figma layers the way Figma lays them out, to compare with the page. */

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense>
      <FigmaCheck />
    </Suspense>
  );
}

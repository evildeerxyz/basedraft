"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Preloader } from "./preloader";

/* Studio reads the saved page and the URL on first render, so it only ever runs in the browser. */
const Studio = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => <Preloader title="Opening Studio" stage="Loading Studio" progress={0.18} />,
});

export function StudioLoader() {
  // Next keeps a page you've left alive, hidden, to bring it back as it was. Studio starts
  // again whenever a link opens it (it reads what to open from the address, like
  // ?template=noma), and comes back as it was with the back and forward buttons.
  const { bfcacheId } = useRouter();
  return <Studio key={bfcacheId} />;
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ColorModeSwitch } from "@/site/color-mode";
import { BaseDraftLogo } from "@/site/logo";
import { Invite } from "@/site/team";

export const metadata: Metadata = {
  title: "Join a team",
  description: "You've been invited to a team on basedraft.",
  robots: { index: false },
};

/* Joining a team, on its own page like signing in: the invite is all there is to do here. */
export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <header className="flex h-14 items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="basedraft home">
          <BaseDraftLogo />
        </Link>
        <ColorModeSwitch />
      </header>
      <main id="main" className="grid flex-1 place-items-center px-4 pb-14 pt-2">
        <div className="w-full max-w-[520px]">
          {/* The invite is in the address, which only the request knows. */}
          <Suspense fallback={<div className="h-[320px]" />}>
            <Token params={params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Token({ params }: { params: PageProps<"/invite/[token]">["params"] }) {
  return <Invite token={(await params).token} />;
}

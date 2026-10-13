import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@/components/pages/sign-in";
import { Band } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to pello with Google, Microsoft or a link by email.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Band inner="flex flex-col items-center py-20 lg:py-28">
        <SignIn />
        <p className="mt-6 text-center text-[15px] text-mute">
          New to pello?{" "}
          <Link href="/contact" className="rounded-[4px] font-medium text-ink underline underline-offset-4">
            Book a demo
          </Link>
        </p>
    </Band>
  );
}

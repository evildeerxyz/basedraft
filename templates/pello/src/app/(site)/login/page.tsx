import type { Metadata } from "next";
import Link from "next/link";
import { SignIn } from "@/components/pages/sign-in";
import { Container } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to pello with Google, Microsoft or a link by email.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <section className="py-20 lg:py-28">
      <Container className="flex flex-col items-center">
        <SignIn />
        <p className="mt-8 text-center text-[16px] text-ink-2">
          New to pello?{" "}
          <Link href="/contact" className="rounded-[2px] font-semibold text-accent underline-offset-4 hover:underline">
            Book a demo
          </Link>
        </p>
      </Container>
    </section>
  );
}

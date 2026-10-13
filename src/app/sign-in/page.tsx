import type { Metadata } from "next";
import { AuthPage } from "@/site/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  return <AuthPage mode="sign-in" />;
}

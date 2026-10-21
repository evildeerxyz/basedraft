import type { Metadata } from "next";
import { AuthPage } from "@/site/auth";

export const metadata: Metadata = { title: "Create your account", description: "A free basedraft account saves your drafts, so you can pick up where you left off on any device." };

export default function SignUpPage() {
  return <AuthPage mode="sign-up" />;
}

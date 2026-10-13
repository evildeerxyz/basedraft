import type { Metadata } from "next";
import { AuthPage } from "@/site/auth";

export const metadata: Metadata = { title: "Create your account", description: "A free basedraft account saves your drafts, keeps every version and lets you share pages with a link." };

export default function SignUpPage() {
  return <AuthPage mode="sign-up" />;
}

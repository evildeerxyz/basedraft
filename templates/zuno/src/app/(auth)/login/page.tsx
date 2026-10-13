import type { Metadata } from "next";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { LoginFlow } from "@/components/auth/LoginFlow";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Zuno to see your portfolio, statements and tax documents.",
};

export default function LoginPage() {
  return (
    <div className="grid items-center gap-16 lg:min-h-[calc(100dvh-220px)] lg:grid-cols-2">
      <LoginFlow />
      <AuthVisual />
    </div>
  );
}

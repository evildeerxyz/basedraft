import type { Metadata } from "next";
import { SignupFlow } from "@/components/auth/SignupFlow";

export const metadata: Metadata = {
  title: "Open an account",
  description: "Open a Zuno account in about two minutes. Start investing with $1.",
};

export default function SignupPage() {
  return <SignupFlow />;
}

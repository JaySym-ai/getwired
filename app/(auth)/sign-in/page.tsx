import type { Metadata } from "next";
import { SignInClient } from "./SignInClient";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to GetWired.dev — the all-in-one tech community platform.",
  openGraph: {
    title: "Sign In | GetWired.dev",
    description: "Sign in to GetWired.dev — the all-in-one tech community platform.",
  },
};

export default function SignInPage() {
  return <SignInClient />;
}


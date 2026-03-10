import type { Metadata } from "next";
import { SignUpClient } from "./SignUpClient";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your GetWired.dev account — join the tech community.",
  openGraph: {
    title: "Sign Up | GetWired.dev",
    description: "Create your GetWired.dev account — join the tech community.",
  },
};

export default function SignUpPage() {
  return <SignUpClient />;
}


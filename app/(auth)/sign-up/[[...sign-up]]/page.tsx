import type { Metadata } from "next";
import { SignUpClient } from "../SignUpClient";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your GetWired.dev account and provision your Convex profile.",
};

export default function SignUpPage() {
  return <SignUpClient />;
}

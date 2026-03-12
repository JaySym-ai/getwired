import type { Metadata } from "next";
import { SignInClient } from "../SignInClient";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to GetWired.dev with Clerk and sync your Convex profile.",
};

export default function SignInPage() {
  return <SignInClient />;
}

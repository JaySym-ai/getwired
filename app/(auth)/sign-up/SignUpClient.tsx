"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { APP_ENV } from "@/lib/env";

export function SignUpClient() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Create your <span className="text-[#3B82F6]">GetWired.dev</span> account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              New users are provisioned directly in the {APP_ENV} Convex instance.
            </p>
          </div>
          <span className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3B82F6]">
            {APP_ENV}
          </span>
        </div>

        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
          fallback={null}
          appearance={{
            elements: {
              card: "border-0 bg-transparent p-0 shadow-none",
              rootBox: "w-full",
            },
          }}
        />

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-[#3B82F6] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

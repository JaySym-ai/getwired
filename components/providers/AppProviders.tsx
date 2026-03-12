"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { WindowManagerProvider } from "@/components/desktop/WindowManager";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppAuthProvider } from "@/lib/auth";
import { getRequiredConvexUrl } from "@/lib/env";

const convex = new ConvexReactClient(getRequiredConvexUrl());

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AppAuthProvider>
          <TooltipProvider>
            <WindowManagerProvider>{children}</WindowManagerProvider>
            <Toaster />
          </TooltipProvider>
        </AppAuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

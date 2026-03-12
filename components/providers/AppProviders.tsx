"use client";

import { useEffect, useRef } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { WindowManagerProvider } from "@/components/desktop/WindowManager";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppAuthProvider } from "@/lib/auth";
import { getRequiredConvexUrl } from "@/lib/env";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(getRequiredConvexUrl());

function BootstrapData() {
  const ensureDefaults = useMutation(api.bootstrap.ensureDefaults);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }

    bootstrappedRef.current = true;
    void ensureDefaults({}).catch(() => {
      bootstrappedRef.current = false;
    });
  }, [ensureDefaults]);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" afterSignOutUrl="/">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <BootstrapData />
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

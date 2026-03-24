"use client";

import { useConvexAuth } from "convex/react";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated: isConvexAuthenticated, isLoading: isConvexLoading } = useConvexAuth();
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
  const { user } = useUser();
  const ensureUser = useMutation(api.users.ensureUser);
  const hasEnsuredUser = useRef(false);

  useEffect(() => {
    if (isConvexAuthenticated && user && !hasEnsuredUser.current) {
      hasEnsuredUser.current = true;
      ensureUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? undefined,
        imageUrl: user.imageUrl ?? undefined,
      });
    }
  }, [isConvexAuthenticated, user, ensureUser]);

  // Wait for both Clerk and Convex to finish loading before making any decision.
  // This prevents the redirect loop where Convex auth hasn't synced yet
  // but Clerk is already signed in.
  if (!isClerkLoaded || isConvexLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Only redirect if Clerk itself says the user is not signed in.
  // The middleware already protects these routes, so this is a fallback.
  // We intentionally do NOT redirect based on Convex auth state to avoid
  // a loop when the Clerk→Convex token handoff is still in progress.
  if (!isSignedIn) {
    // Middleware will handle the redirect; render nothing to avoid flash.
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 !h-4" />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}


"use client";

import { ProfilePageClient } from "@/app/profile/[userId]/ProfilePageClient";
import { useAppAuth } from "@/lib/auth";

export function ProfileApp() {
  const { user } = useAppAuth();

  if (!user) {
    return <div className="p-4 text-sm text-muted-foreground">Sign in to view your profile.</div>;
  }

  return (
    <div className="p-4">
      <ProfilePageClient userId={user.username} />
    </div>
  );
}

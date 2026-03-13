"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetId: string;
  targetType: "user" | "tag" | "category";
  initialFollowing?: boolean;
  className?: string;
}

const STORAGE_KEY = "getwired-follows";

function getFollows(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setFollows(follows: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(follows));
}

function getInitialFollowing(key: string, initialFollowing: boolean) {
  const stored = getFollows();
  if (key in stored) {
    return stored[key] ?? false;
  }

  return initialFollowing;
}

export function FollowButton({
  targetId,
  targetType,
  initialFollowing = false,
  className,
}: FollowButtonProps) {
  const key = `${targetType}:${targetId}`;
  const [following, setFollowing] = useState(() =>
    getInitialFollowing(key, initialFollowing),
  );

  const toggle = () => {
    const next = !following;
    setFollowing(next);
    const stored = getFollows();
    stored[key] = next;
    setFollows(stored);
  };

  return (
    <Button
      variant={following ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      data-testid="follow-button"
      aria-label={following ? "Unfollow" : "Follow"}
      aria-pressed={following}
      className={cn(
        "gap-1.5 transition-all",
        following
          ? "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/80"
          : "border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/10",
        className
      )}
    >
      {following ? (
        <>
          <UserCheck className="size-3.5" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="size-3.5" />
          Follow
        </>
      )}
    </Button>
  );
}

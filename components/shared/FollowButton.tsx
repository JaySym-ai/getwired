"use client";

import { useState, useEffect } from "react";
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

export function FollowButton({
  targetId,
  targetType,
  initialFollowing = false,
  className,
}: FollowButtonProps) {
  const key = `${targetType}:${targetId}`;
  const [following, setFollowing] = useState(initialFollowing);

  useEffect(() => {
    const stored = getFollows();
    if (key in stored) {
      setFollowing(stored[key] ?? false);
    }
  }, [key]);

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


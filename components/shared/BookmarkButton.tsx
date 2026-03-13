"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BookmarkButtonProps {
  targetId: string;
  targetType: "post" | "news" | "user";
  initialBookmarked?: boolean;
  className?: string;
}

const STORAGE_KEY = "getwired-bookmarks";

function getBookmarks(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function setBookmarks(bookmarks: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

function getInitialBookmarked(key: string, initialBookmarked: boolean) {
  const stored = getBookmarks();
  if (key in stored) {
    return stored[key] ?? false;
  }

  return initialBookmarked;
}

export function BookmarkButton({
  targetId,
  targetType,
  initialBookmarked = false,
  className,
}: BookmarkButtonProps) {
  const key = `${targetType}:${targetId}`;
  const [bookmarked, setBookmarked] = useState(() =>
    getInitialBookmarked(key, initialBookmarked),
  );

  const toggle = () => {
    const next = !bookmarked;
    setBookmarked(next);
    const stored = getBookmarks();
    stored[key] = next;
    setBookmarks(stored);
    toast.success(next ? "Bookmarked!" : "Bookmark removed");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn(
        "size-8 transition-colors",
        bookmarked
          ? "text-[#3B82F6] hover:text-[#3B82F6]/80"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
    </Button>
  );
}

"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagListProps {
  tags: string[];
  className?: string;
  size?: "sm" | "default";
}

export function TagList({ tags, className, size = "default" }: TagListProps) {
  if (!tags.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <Link key={tag} href={`/search?tag=${encodeURIComponent(tag)}`}>
          <Badge
            variant="secondary"
            className={cn(
              "cursor-pointer transition-colors hover:bg-[#00FF41]/10 hover:text-[#00FF41]",
              size === "sm" && "text-[10px] px-1.5 h-4"
            )}
          >
            #{tag}
          </Badge>
        </Link>
      ))}
    </div>
  );
}


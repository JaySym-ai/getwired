"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10",
  xl: "size-14",
} as const;

const textSizeClasses = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
  xl: "text-lg",
} as const;

const FALLBACK_COLORS = [
  "bg-emerald-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-teal-600",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length] ?? "#00FF41";
}

interface UserAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({ src, name, size = "md", className }: UserAvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorFromName(name);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} />}
      <AvatarFallback className={cn(bgColor, textSizeClasses[size], "text-white font-medium")}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}


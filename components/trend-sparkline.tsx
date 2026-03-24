"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendSparklineProps {
  direction?: "rising" | "stable" | "declining";
  className?: string;
}

export function TrendSparkline({ direction, className }: TrendSparklineProps) {
  if (!direction) {
    return <Minus className={cn("h-4 w-4 text-muted-foreground", className)} />;
  }

  if (direction === "rising") {
    return (
      <div className={cn("flex items-center gap-1 text-green-600", className)}>
        <TrendingUp className="h-4 w-4" />
        <span className="text-xs font-medium">Rising</span>
      </div>
    );
  }

  if (direction === "declining") {
    return (
      <div className={cn("flex items-center gap-1 text-red-500", className)}>
        <TrendingDown className="h-4 w-4" />
        <span className="text-xs font-medium">Declining</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 text-muted-foreground", className)}>
      <Minus className="h-4 w-4" />
      <span className="text-xs font-medium">Stable</span>
    </div>
  );
}


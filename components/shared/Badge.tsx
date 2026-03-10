"use client";

import { cn } from "@/lib/utils";
import { Shield, Star, Award, Zap, Crown, ShieldCheck } from "lucide-react";

type Rank = "newbie" | "active" | "contributor" | "expert" | "top" | "moderator";

const rankConfig: Record<Rank, { label: string; color: string; icon: React.ElementType }> = {
  newbie: { label: "Newbie", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: Shield },
  active: { label: "Active", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Zap },
  contributor: { label: "Contributor", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: Star },
  expert: { label: "Expert", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Award },
  top: { label: "Top", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Crown },
  moderator: { label: "Mod", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ShieldCheck },
};

interface RankBadgeProps {
  rank: Rank;
  className?: string;
}

export function RankBadge({ rank, className }: RankBadgeProps) {
  const config = rankConfig[rank];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        config.color,
        className
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}


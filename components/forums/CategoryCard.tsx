"use client";

import Link from "next/link";
import {
  Brain,
  Globe,
  Smartphone,
  Cpu,
  ShieldCheck,
  Rocket,
  TrendingUp,
  Coffee,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, LucideIcon> = {
  Brain,
  Globe,
  Smartphone,
  Cpu,
  ShieldCheck,
  Rocket,
  TrendingUp,
  Coffee,
};

interface CategoryCardProps {
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  postCount: number;
}

export function CategoryCard({
  name,
  slug,
  icon,
  color,
  description,
  postCount,
}: CategoryCardProps) {
  const Icon = iconMap[icon] ?? Brain;

  return (
    <Link href={`/forums/${slug}`} className="group block">
      <div
        className="glass rounded-xl p-5 transition-all duration-300 hover:glow-green-sm"
        style={{
          borderColor: `${color}20`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white group-hover:text-[#3B82F6] transition-colors">
                {name}
              </h3>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {postCount}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}


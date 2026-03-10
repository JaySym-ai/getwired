"use client";

import Link from "next/link";
import {
  Code2,
  Cpu,
  Globe,
  Shield,
  Gamepad2,
  Smartphone,
  Cloud,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { name: "Web Dev", icon: Globe, color: "text-blue-400" },
  { name: "Systems", icon: Cpu, color: "text-purple-400" },
  { name: "Security", icon: Shield, color: "text-red-400" },
  { name: "DevOps", icon: Cloud, color: "text-cyan-400" },
  { name: "Mobile", icon: Smartphone, color: "text-amber-400" },
  { name: "Gaming", icon: Gamepad2, color: "text-green-400" },
  { name: "Data", icon: Database, color: "text-pink-400" },
  { name: "Open Source", icon: Code2, color: "text-[#00FF41]" },
];

const TRENDING_TAGS = [
  "rust", "nextjs", "ai-ml", "webassembly", "kubernetes",
  "typescript", "linux", "cybersecurity",
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div className="sticky top-16 flex flex-col gap-4">
        {/* Forum Categories */}
        <div className="glass rounded-xl p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </h3>
          <nav className="flex flex-col gap-0.5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href={`/forums/${cat.name.toLowerCase().replace(" ", "-")}`}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
              >
                <cat.icon className={`size-4 ${cat.color}`} />
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Trending Tags */}
        <div className="glass rounded-xl p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trending Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {TRENDING_TAGS.map((tag) => (
              <Link key={tag} href={`/tags/${tag}`}>
                <Badge
                  variant="secondary"
                  className="cursor-pointer text-[11px] hover:bg-[#00FF41]/10 hover:text-[#00FF41] transition-colors"
                >
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="glass rounded-xl p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Links
          </h3>
          <nav className="flex flex-col gap-0.5">
            {[
              { label: "About", href: "/about" },
              { label: "Newsletter", href: "/newsletter" },
              { label: "Marketplace", href: "/marketplace" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}


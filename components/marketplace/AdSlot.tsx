"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const DEMO_ADS = [
  {
    title: "Build faster with Cursor AI",
    description: "The AI-first code editor. Write, edit, and debug code with AI assistance.",
    cta: "Try Free →",
    url: "#",
  },
  {
    title: "Ship your SaaS in days",
    description: "ShipFast — Next.js boilerplate with auth, payments, and email built-in.",
    cta: "Get Started →",
    url: "#",
  },
  {
    title: "Convex — the fullstack backend",
    description: "Real-time database, server functions, and file storage. Zero config.",
    cta: "Learn More →",
    url: "#",
  },
];

export function AdSlot() {
  const [clickCount, setClickCount] = useState(0);
  const ad = DEMO_ADS[Math.floor(Date.now() / 60000) % DEMO_ADS.length]!;

  return (
    <Card
      className="glass border-white/5 p-4 cursor-pointer transition-all hover:border-[#00FF41]/20"
      onClick={() => setClickCount((c) => c + 1)}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-white/10 px-1.5 py-0">
          Sponsored
        </Badge>
        <ExternalLink className="size-3 text-muted-foreground" />
      </div>

      <div className="aspect-[300/250] flex flex-col items-center justify-center rounded-md bg-gradient-to-br from-[#00FF41]/5 to-transparent border border-white/5 p-4 text-center">
        <h4 className="text-sm font-semibold text-white mb-1">{ad.title}</h4>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{ad.description}</p>
        <span className="text-xs font-medium text-[#00FF41]">{ad.cta}</span>
      </div>

      {clickCount > 0 && (
        <p className="mt-2 text-[10px] text-muted-foreground text-center">
          Demo clicks: {clickCount}
        </p>
      )}
    </Card>
  );
}


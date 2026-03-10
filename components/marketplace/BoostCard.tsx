"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BoostTier {
  name: string;
  price: string;
  duration: string;
  features: string[];
  popular?: boolean;
}

interface BoostCardProps {
  tier: BoostTier;
}

export function BoostCard({ tier }: BoostCardProps) {
  return (
    <Card
      className={cn(
        "glass relative flex flex-col p-6 transition-all hover:scale-[1.02]",
        tier.popular
          ? "border-[#00FF41]/40 glow-green"
          : "border-white/5 hover:border-white/10"
      )}
    >
      {tier.popular && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#00FF41] text-black font-semibold text-xs px-3">
          Popular
        </Badge>
      )}

      <h3 className="text-lg font-bold text-white">{tier.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{tier.duration}</p>

      <div className="mt-4 mb-6">
        <span className="text-3xl font-bold text-[#00FF41]">{tier.price}</span>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-[#00FF41]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => toast.info("Demo mode — payments not connected")}
        className={cn(
          "w-full font-semibold",
          tier.popular
            ? "bg-[#00FF41] text-black hover:bg-[#00CC33]"
            : "bg-white/10 text-white hover:bg-white/20"
        )}
      >
        Buy Now
      </Button>
    </Card>
  );
}


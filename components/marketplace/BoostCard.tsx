"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const openSales = () => {
    window.location.href = "mailto:sales@getwired.dev?subject=GetWired%20Boost%20Inquiry";
  };

  return (
    <Card
      className={cn(
        "glass relative flex flex-col p-6 transition-all hover:scale-[1.02]",
        tier.popular
          ? "border-[#3B82F6]/40 glow-green"
          : "border-border hover:border-border"
      )}
    >
      {tier.popular && (
        <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#3B82F6] text-white font-semibold text-xs px-3">
          Popular
        </Badge>
      )}

      <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{tier.duration}</p>

      <div className="mt-4 mb-6">
        <span className="text-3xl font-bold text-[#3B82F6]">{tier.price}</span>
      </div>

      <ul className="mb-6 flex-1 space-y-2">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-[#3B82F6]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={openSales}
        className={cn(
          "w-full font-semibold",
          tier.popular
            ? "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
            : "bg-muted text-foreground hover:bg-accent"
        )}
      >
        Contact Sales
      </Button>
    </Card>
  );
}

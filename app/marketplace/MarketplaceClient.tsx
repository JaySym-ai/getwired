"use client";

import {
  Rocket,
  Megaphone,
  Crown,
  Check,
  Zap,
  Image as ImageIcon,
  FileText,
  Star,
  ShieldCheck,
  Headphones,
  Infinity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BoostCard } from "@/components/marketplace/BoostCard";
import { toast } from "sonner";

const BOOST_TIERS = [
  {
    name: "Starter Boost",
    price: "$5",
    duration: "24 hours",
    features: [
      "Highlighted in feed for 24h",
      "Priority in category listing",
      "Boost badge on post",
    ],
  },
  {
    name: "Pro Boost",
    price: "$9",
    duration: "48 hours",
    popular: true,
    features: [
      "Highlighted in feed for 48h",
      "Priority in category listing",
      "Boost badge on post",
      "Featured in newsletter",
      "2x visibility algorithm weight",
    ],
  },
  {
    name: "Ultra Boost",
    price: "$19",
    duration: "1 week",
    features: [
      "Highlighted in feed for 7 days",
      "Top of category listing",
      "Boost badge on post",
      "Featured in newsletter",
      "3x visibility algorithm weight",
      "Analytics dashboard",
    ],
  },
];

const AD_OPTIONS = [
  {
    icon: ImageIcon,
    title: "Banner Ads",
    price: "$49/week",
    description: "300×250 banner displayed in sidebar across all pages. ~10K impressions/week.",
  },
  {
    icon: FileText,
    title: "Sponsored Posts",
    price: "$29/week",
    description: "Native post format in the feed with 'Sponsored' label. High engagement rates.",
  },
];

const PREMIUM_FEATURES = [
  { icon: Star, text: "Ad-free browsing experience" },
  { icon: Infinity, text: "Unlimited post boosts" },
  { icon: Crown, text: "Premium badge on profile" },
  { icon: ShieldCheck, text: "Priority support" },
  { icon: Headphones, text: "Access to exclusive channels" },
  { icon: Zap, text: "Early access to new features" },
];

export function MarketplaceClient() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Rocket className="size-8 text-[#00FF41]" />
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Amplify Your <span className="text-[#00FF41] text-glow">Reach</span>
          </h1>
        </div>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Promote your posts, advertise your products, and unlock premium features to get the most out of GetWired.dev.
        </p>
      </div>

      {/* Boost Section */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="size-5 text-[#00FF41]" />
          <h2 className="text-xl font-bold text-white">Boost Your Post</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {BOOST_TIERS.map((tier) => (
            <BoostCard key={tier.name} tier={tier} />
          ))}
        </div>
      </section>

      {/* Advertise Section */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <Megaphone className="size-5 text-[#00FF41]" />
          <h2 className="text-xl font-bold text-white">Advertise</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {AD_OPTIONS.map((opt) => (
            <Card key={opt.title} className="glass border-white/5 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[#00FF41]/10 p-2.5">
                  <opt.icon className="size-5 text-[#00FF41]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white">{opt.title}</h3>
                    <Badge className="bg-[#00FF41]/10 text-[#00FF41] border-0 text-xs">
                      {opt.price}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{opt.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:border-[#00FF41]/30 hover:text-[#00FF41]"
                    onClick={() => toast.info("Demo mode — payments not connected")}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Premium Section */}
      <section>
        <Card className="glass border-[#00FF41]/20 glow-green p-8">
          <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Crown className="size-6 text-[#00FF41]" />
                <h2 className="text-xl font-bold text-white">Premium Membership</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Unlock the full GetWired.dev experience with Premium.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 mb-6">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <f.icon className="size-4 text-[#00FF41] shrink-0" />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div>
                <span className="text-4xl font-bold text-[#00FF41]">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Button
                size="lg"
                className="bg-[#00FF41] text-black font-semibold hover:bg-[#00CC33] px-8"
                onClick={() => toast.info("Demo mode — payments not connected")}
              >
                Subscribe Now
              </Button>
              <p className="text-xs text-muted-foreground">Cancel anytime</p>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}


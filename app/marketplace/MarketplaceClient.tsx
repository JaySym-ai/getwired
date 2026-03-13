"use client";

import {
  Rocket,
  Megaphone,
  Crown,
  Zap,
  Image as ImageIcon,
  FileText,
  Star,
  ShieldCheck,
  Headphones,
  Infinity,
} from "lucide-react";
import { useQuery } from "convex/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BoostCard } from "@/components/marketplace/BoostCard";
import { api } from "../../convex/_generated/api";

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
  const summary = useQuery(api.marketplace.getSummary, {}) ?? {
    activePromotionCount: 0,
    counts: { boost: 0, banner: 0, sponsored: 0 },
    totalImpressions: 0,
    totalClicks: 0,
  };
  const openAdvertisingSales = () => {
    window.location.href =
      "mailto:sales@getwired.dev?subject=GetWired%20Advertising%20Inquiry";
  };
  const openPremiumSales = () => {
    window.location.href = "mailto:sales@getwired.dev?subject=GetWired%20Premium%20Inquiry";
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8" data-testid="marketplace-page">
      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Rocket className="size-8 text-[#3B82F6]" />
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Amplify Your <span className="text-[#3B82F6] text-glow">Reach</span>
          </h1>
        </div>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Promote your posts, advertise your products, and unlock premium features to get the most out of GetWired.dev.
        </p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-4">
          <Card className="glass border-border p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active campaigns</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {summary.activePromotionCount}
            </p>
          </Card>
          <Card className="glass border-border p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Boosts live</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{summary.counts.boost}</p>
          </Card>
          <Card className="glass border-border p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Impressions</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {summary.totalImpressions.toLocaleString()}
            </p>
          </Card>
          <Card className="glass border-border p-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Clicks</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {summary.totalClicks.toLocaleString()}
            </p>
          </Card>
        </div>
      </div>

      {/* Boost Section */}
      <section className="mb-14" data-testid="boost-section">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="size-5 text-[#3B82F6]" />
          <h2 className="text-xl font-bold text-foreground">Boost Your Post</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {BOOST_TIERS.map((tier) => (
            <BoostCard key={tier.name} tier={tier} />
          ))}
        </div>
      </section>

      {/* Advertise Section */}
      <section className="mb-14" data-testid="advertise-section">
        <div className="flex items-center gap-2 mb-6">
          <Megaphone className="size-5 text-[#3B82F6]" />
          <h2 className="text-xl font-bold text-foreground">Advertise</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {AD_OPTIONS.map((opt) => (
            <Card key={opt.title} className="glass border-border p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-[#3B82F6]/10 p-2.5">
                  <opt.icon className="size-5 text-[#3B82F6]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{opt.title}</h3>
                    <Badge className="bg-[#3B82F6]/10 text-[#3B82F6] border-0 text-xs">
                      {opt.price}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{opt.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border hover:border-[#3B82F6]/30 hover:text-[#3B82F6]"
                    onClick={openAdvertisingSales}
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
      <section data-testid="premium-section">
        <Card className="glass border-[#3B82F6]/20 glow-green p-8">
          <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <Crown className="size-6 text-[#3B82F6]" />
                <h2 className="text-xl font-bold text-foreground">Premium Membership</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Unlock the full GetWired.dev experience with Premium.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2 mb-6">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <f.icon className="size-4 text-[#3B82F6] shrink-0" />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div>
                <span className="text-4xl font-bold text-[#3B82F6]">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Button
                size="lg"
                className="bg-[#3B82F6] text-white font-semibold hover:bg-[#2563EB] px-8"
                onClick={openPremiumSales}
              >
                Contact Sales
              </Button>
              <p className="text-xs text-muted-foreground">Cancel anytime</p>
            </div>
          </div>
        </Card>
      </section>
    </main>
  );
}

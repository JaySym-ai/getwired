"use client";

import { useState } from "react";
import {
  Mail,
  Newspaper,
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const BENEFITS = [
  { icon: Newspaper, text: "Curated tech news" },
  { icon: TrendingUp, text: "Top community posts" },
  { icon: Users, text: "Exclusive interviews" },
  { icon: Briefcase, text: "Job opportunities" },
];

const PAST_ISSUES = [
  {
    date: "Mar 3, 2026",
    title: "GPT-5 Launch Reactions & What It Means for Developers",
    topics: ["AI", "LLMs", "Developer Tools"],
  },
  {
    date: "Feb 24, 2026",
    title: "The State of React in 2026 — RSC, Compiler & Beyond",
    topics: ["React", "Next.js", "Frontend"],
  },
  {
    date: "Feb 17, 2026",
    title: "Rust Hits #3 on TIOBE — Why Systems Devs Are Switching",
    topics: ["Rust", "Systems", "Performance"],
  },
];

export function NewsletterClient() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubscribed(true);
    toast.success("You're subscribed! Welcome to the Wired.");
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Hero */}
      <div className="mb-10 text-center">
        <Mail className="mx-auto mb-4 size-10 text-[#00FF41]" />
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Stay <span className="text-[#00FF41] text-glow">Wired</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Weekly digest of the best posts, trending news, and community highlights.
        </p>
      </div>

      {/* Subscribe Form */}
      {subscribed ? (
        <Card className="glass border-[#00FF41]/20 glow-green p-8 text-center mb-10">
          <CheckCircle2 className="mx-auto mb-3 size-12 text-[#00FF41]" />
          <h2 className="text-xl font-bold text-white mb-2">You&apos;re In! 🎉</h2>
          <p className="text-muted-foreground">
            Check your inbox for a confirmation. Your first issue arrives next Monday.
          </p>
        </Card>
      ) : (
        <Card className="glass border-white/5 p-6 mb-10">
          <form onSubmit={handleSubscribe} className="flex gap-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-black/40 border-white/10 focus-visible:ring-[#00FF41]/30"
            />
            <Button
              type="submit"
              className="bg-[#00FF41] text-black font-semibold hover:bg-[#00CC33] px-6 shrink-0"
            >
              Subscribe
            </Button>
          </form>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3" />
            <span>2,847 subscribers</span>
            <span>·</span>
            <span>Free, unsubscribe anytime</span>
          </div>
        </Card>
      )}

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-4 mb-10 sm:grid-cols-4">
        {BENEFITS.map((b) => (
          <Card key={b.text} className="glass border-white/5 p-4 text-center">
            <b.icon className="mx-auto mb-2 size-6 text-[#00FF41]" />
            <p className="text-sm font-medium text-white">{b.text}</p>
          </Card>
        ))}
      </div>

      {/* Past Issues */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-[#00FF41]" />
          <h2 className="text-lg font-bold text-white">Past Issues</h2>
        </div>
        <div className="space-y-3">
          {PAST_ISSUES.map((issue) => (
            <Card key={issue.date} className="glass border-white/5 p-4 hover:border-white/10 transition-colors">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-[#00FF41]/10 p-2 shrink-0">
                  <Calendar className="size-4 text-[#00FF41]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{issue.date}</p>
                  <h3 className="text-sm font-medium text-white">{issue.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {issue.topics.map((t) => (
                      <Badge key={t} variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}


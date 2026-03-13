"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { useAppAuth } from "@/lib/auth";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

const BENEFITS = [
  { icon: Newspaper, text: "Curated tech news" },
  { icon: TrendingUp, text: "Top community posts" },
  { icon: Users, text: "Exclusive interviews" },
  { icon: Briefcase, text: "Job opportunities" },
];

function formatDigestDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NewsletterClient() {
  const { user } = useAppAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const summary = useQuery(api.newsletter.getSummary, {}) ?? {
    activeSubscriberCount: 0,
    latestDigestItems: [],
  };
  const existingSubscription = useQuery(
    api.newsletter.isSubscribed,
    email.trim() ? { email } : "skip",
  );
  const subscribe = useMutation(api.newsletter.subscribe);

  useEffect(() => {
    if (user?.email) {
      setEmail((current) => current || user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    if (existingSubscription) {
      setSubscribed(true);
    }
  }, [existingSubscription]);

  const digestItems = useMemo(() => summary.latestDigestItems ?? [], [summary.latestDigestItems]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setIsSubmitting(true);
      await subscribe({
        email: normalizedEmail,
        userId: user?.convexUserId,
      });
      setSubscribed(true);
      setEmail(normalizedEmail);
      toast.success("Subscription updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to subscribe right now",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8" data-testid="newsletter-page">
      {/* Hero */}
      <div className="mb-10 text-center">
        <Mail className="mx-auto mb-4 size-10 text-[#3B82F6]" />
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          Stay <span className="text-[#3B82F6] text-glow">Wired</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Weekly digest of the best posts, trending news, and community highlights.
        </p>
      </div>

      {/* Subscribe Form */}
      {subscribed ? (
        <Card className="glass border-[#3B82F6]/20 glow-green p-8 text-center mb-10">
          <CheckCircle2 className="mx-auto mb-3 size-12 text-[#3B82F6]" />
          <h2 className="text-xl font-bold text-foreground mb-2">You&apos;re In! 🎉</h2>
          <p className="text-muted-foreground">
            Check your inbox for a confirmation. Your first issue arrives next Monday.
          </p>
        </Card>
      ) : (
        <Card className="glass border-border p-6 mb-10" data-testid="newsletter-form">
          <form onSubmit={handleSubscribe} className="flex gap-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-muted/50 border-border focus-visible:ring-[#3B82F6]/30"
              data-testid="newsletter-email-input"
              aria-label="Email address"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#3B82F6] text-white font-semibold hover:bg-[#2563EB] px-6 shrink-0"
              data-testid="newsletter-subscribe-button"
              aria-label="Subscribe to newsletter"
            >
              {isSubmitting ? "Saving..." : subscribed ? "Subscribed" : "Subscribe"}
            </Button>
          </form>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3" />
            <span>{summary.activeSubscriberCount.toLocaleString()} subscribers</span>
            <span>·</span>
            <span>Free, unsubscribe anytime</span>
          </div>
        </Card>
      )}

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-4 mb-10 sm:grid-cols-4">
        {BENEFITS.map((b) => (
          <Card key={b.text} className="glass border-border p-4 text-center">
            <b.icon className="mx-auto mb-2 size-6 text-[#3B82F6]" />
            <p className="text-sm font-medium text-foreground">{b.text}</p>
          </Card>
        ))}
      </div>

      {/* Past Issues */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-[#3B82F6]" />
          <h2 className="text-lg font-bold text-foreground">Latest In The Digest</h2>
        </div>
        <div className="space-y-3">
          {digestItems.map((issue) => (
            <Card key={issue._id} className="glass border-border p-4 transition-colors hover:border-border">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-[#3B82F6]/10 p-2 shrink-0">
                  <Calendar className="size-4 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {formatDigestDate(issue.publishedAt)} · {issue.source}
                  </p>
                  <h3 className="text-sm font-medium text-foreground">{issue.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {issue.tags.map((t: string) => (
                      <Badge key={t} variant="outline" className="text-[10px] border-border text-muted-foreground">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {digestItems.length === 0 && (
            <Card className="glass border-border p-4 text-sm text-muted-foreground">
              Digest items will appear after news feeds finish syncing.
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}

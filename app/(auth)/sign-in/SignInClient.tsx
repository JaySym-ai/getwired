"use client";

import { useRouter } from "next/navigation";
import { Github, Chrome, Twitter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/shared/Avatar";
import { useDemoAuth, DEMO_USERS } from "@/lib/demo-auth";
import { RANKS } from "@/lib/constants";
import { toast } from "sonner";

export function SignInClient() {
  const { signIn } = useDemoAuth();
  const router = useRouter();

  const handleSelectUser = (userId: string) => {
    signIn(userId);
    toast.success("Signed in!");
    router.push("/");
  };

  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">
          Sign in to <span className="text-[#00FF41]">GetWired.dev</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Select a demo user to continue</p>
      </div>

      {/* Demo User Cards */}
      <div className="grid gap-2 mb-6">
        {DEMO_USERS.map((u) => {
          const rankInfo = RANKS[u.rank];
          return (
            <Card
              key={u.id}
              className="glass border-white/5 p-3 cursor-pointer hover:border-[#00FF41]/30 transition-all"
              onClick={() => handleSelectUser(u.id)}
            >
              <div className="flex items-center gap-3">
                <UserAvatar src={u.avatarUrl} name={u.displayName} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{u.displayName}</span>
                    <Badge variant="outline" className="text-[10px] border-white/10" style={{ color: rankInfo?.color }}>
                      {rankInfo?.label ?? u.rank}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Separator className="my-6 bg-white/5" />

      {/* Social Login Buttons */}
      <div className="grid gap-2 mb-6">
        <Button variant="outline" className="border-white/10 w-full" onClick={() => toast.info("Demo mode — social login not connected")}>
          <Chrome className="mr-2 size-4" /> Continue with Google
        </Button>
        <Button variant="outline" className="border-white/10 w-full" onClick={() => toast.info("Demo mode — social login not connected")}>
          <Github className="mr-2 size-4" /> Continue with GitHub
        </Button>
        <Button variant="outline" className="border-white/10 w-full" onClick={() => toast.info("Demo mode — social login not connected")}>
          <Twitter className="mr-2 size-4" /> Continue with X
        </Button>
      </div>

      <Separator className="my-6 bg-white/5" />

      {/* Email/Password Form */}
      <form onSubmit={(e) => { e.preventDefault(); toast.info("Demo mode — select a user above"); }} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" className="mt-1 bg-black/40 border-white/10" />
        </div>
        <div>
          <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" className="mt-1 bg-black/40 border-white/10" />
        </div>
        <Button type="submit" className="w-full bg-[#00FF41] text-black font-semibold hover:bg-[#00CC33]">
          Sign In
        </Button>
      </form>
    </main>
  );
}


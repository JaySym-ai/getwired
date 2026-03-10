"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface DemoUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  rank: "newbie" | "active" | "contributor" | "expert" | "top" | "moderator";
  bio: string;
  joinedAt: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "user_001",
    username: "zeroday",
    displayName: "Alex Chen",
    email: "alex@getwired.dev",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
    rank: "expert",
    bio: "Full-stack dev. Rust enthusiast. Breaking things since '09.",
    joinedAt: "2024-01-15",
  },
  {
    id: "user_002",
    username: "bytequeen",
    displayName: "Sarah Kim",
    email: "sarah@getwired.dev",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
    rank: "moderator",
    bio: "Community mod & open-source advocate. TypeScript maximalist.",
    joinedAt: "2023-11-20",
  },
  {
    id: "user_003",
    username: "nullpointer",
    displayName: "Marcus Johnson",
    email: "marcus@getwired.dev",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus",
    rank: "top",
    bio: "Systems programmer. Linux kernel contributor. Coffee addict.",
    joinedAt: "2023-08-05",
  },
  {
    id: "user_004",
    username: "pixelpirate",
    displayName: "Emma Rodriguez",
    email: "emma@getwired.dev",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Emma",
    rank: "contributor",
    bio: "Frontend wizard. CSS art creator. Design systems nerd.",
    joinedAt: "2024-03-10",
  },
  {
    id: "user_005",
    username: "newwire",
    displayName: "Jordan Lee",
    email: "jordan@getwired.dev",
    avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan",
    rank: "newbie",
    bio: "Just getting started with web dev. Learning React!",
    joinedAt: "2026-02-28",
  },
];

interface DemoAuthContextType {
  user: DemoUser | null;
  isSignedIn: boolean;
  signIn: (userId?: string) => void;
  signOut: () => void;
  switchUser: (userId: string) => void;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

const STORAGE_KEY = "getwired-demo-user";

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const found = DEMO_USERS.find((u) => u.id === stored);
      const defaultUser = DEMO_USERS[0]!;
      setUser(found ?? defaultUser);
    } else {
      const defaultUser = DEMO_USERS[0]!;
      setUser(defaultUser);
      localStorage.setItem(STORAGE_KEY, defaultUser.id);
    }
    setMounted(true);
  }, []);

  const signIn = useCallback((userId?: string) => {
    const defaultUser = DEMO_USERS[0]!;
    const target = userId
      ? DEMO_USERS.find((u) => u.id === userId) ?? defaultUser
      : defaultUser;
    setUser(target);
    localStorage.setItem(STORAGE_KEY, target.id);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchUser = useCallback((userId: string) => {
    const target = DEMO_USERS.find((u) => u.id === userId);
    if (target) {
      setUser(target);
      localStorage.setItem(STORAGE_KEY, target.id);
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DemoAuthContext.Provider
      value={{ user, isSignedIn: !!user, signIn, signOut, switchUser }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (context === undefined) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider");
  }
  return context;
}


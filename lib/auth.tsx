"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type {
  Certification,
  Education,
  Experience,
  Project,
  UserRank,
  UserRole,
} from "./types";

export interface AppAuthUser {
  id: string;
  clerkId: string;
  convexUserId?: Id<"users">;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  rank: UserRank;
  role: UserRole;
  bio: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  techStack: string[];
  aiTools: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  karma: number;
  joinedAt: string;
}

interface AppAuthContextValue {
  user: AppAuthUser | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
}

interface ConvexUserRecord {
  _id: Id<"users">;
  clerkId: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  rank: UserRank;
  role: UserRole;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  techStack: string[];
  aiTools: string[];
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  karma: number;
  createdAt: number;
}

const AppAuthContext = createContext<AppAuthContextValue | undefined>(undefined);

function buildUsername(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "user";
}

function toJoinedAt(timestamp: number | undefined) {
  const safeTimestamp = timestamp ?? Date.now();
  return new Date(safeTimestamp).toISOString().slice(0, 10);
}

function mapClerkUser(clerkUser: NonNullable<ReturnType<typeof useUser>["user"]>): AppAuthUser {
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
  const fallbackName =
    clerkUser.fullName ??
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ??
    email.split("@")[0] ??
    "GetWired User";

  return {
    id: clerkUser.id,
    clerkId: clerkUser.id,
    username: buildUsername(clerkUser.username ?? email.split("@")[0] ?? clerkUser.id),
    displayName: fallbackName,
    email,
    avatarUrl: clerkUser.imageUrl,
    rank: "newbie",
    role: "user",
    bio: "",
    location: "",
    website: "",
    github: "",
    linkedin: "",
    twitter: "",
    techStack: [],
    aiTools: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    karma: 0,
    joinedAt: toJoinedAt(undefined),
  };
}

function mapConvexUser(user: ConvexUserRecord): AppAuthUser {
  return {
    id: user.clerkId,
    clerkId: user.clerkId,
    convexUserId: user._id,
    username: user.username,
    displayName: user.name,
    email: user.email,
    avatarUrl: user.avatar ?? "",
    rank: user.rank,
    role: user.role,
    bio: user.bio ?? "",
    location: user.location ?? "",
    website: user.website ?? "",
    github: user.github ?? "",
    linkedin: user.linkedin ?? "",
    twitter: user.twitter ?? "",
    techStack: user.techStack ?? [],
    aiTools: user.aiTools ?? [],
    experience: user.experience ?? [],
    projects: user.projects ?? [],
    education: user.education ?? [],
    certifications: user.certifications ?? [],
    karma: user.karma ?? 0,
    joinedAt: toJoinedAt(user.createdAt),
  };
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const { isAuthenticated, isLoading: convexAuthLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrent, isAuthenticated ? {} : "skip");
  const syncFromClerk = useMutation(api.users.syncFromClerk);
  const lastSyncedClerkIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      lastSyncedClerkIdRef.current = null;
      return;
    }

    if (!clerkLoaded || !clerkUser || currentUser === undefined) {
      return;
    }

    if (currentUser !== null) {
      lastSyncedClerkIdRef.current = clerkUser.id;
      return;
    }

    if (lastSyncedClerkIdRef.current === clerkUser.id) {
      return;
    }

    lastSyncedClerkIdRef.current = clerkUser.id;
    startTransition(() => {
      void syncFromClerk({
        clerkId: clerkUser.id,
        name: clerkUser.fullName ?? clerkUser.username ?? "GetWired User",
        username: clerkUser.username ?? undefined,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        avatar: clerkUser.imageUrl,
      }).catch(() => {
        lastSyncedClerkIdRef.current = null;
      });
    });
  }, [clerkLoaded, clerkUser, currentUser, isAuthenticated, syncFromClerk]);

  const user =
    currentUser && currentUser !== null
      ? mapConvexUser(currentUser)
      : clerkUser && isAuthenticated
        ? mapClerkUser(clerkUser)
        : null;

  const isLoaded =
    clerkLoaded &&
    !convexAuthLoading &&
    (!isAuthenticated || currentUser !== undefined);

  return (
    <AppAuthContext.Provider
      value={{
        user,
        isLoaded,
        isSignedIn: Boolean(user) && isAuthenticated,
        signIn: () => {
          window.location.assign("/sign-in");
        },
        signOut: async () => {
          await clerkSignOut({ redirectUrl: "/" });
        },
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used within an AppAuthProvider");
  }

  return context;
}

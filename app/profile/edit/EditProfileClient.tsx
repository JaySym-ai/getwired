"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAppAuth } from "@/lib/auth";
import { TECH_STACKS, AI_TOOLS } from "@/lib/constants";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Save, User, Link2, Code2, Briefcase, FolderGit2, X, Camera } from "lucide-react";
import { UserAvatar } from "@/components/shared/Avatar";

export function EditProfileClient() {
  const { user } = useAppAuth();
  const updateCurrentProfile = useMutation(api.users.updateCurrentProfile);
  const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const saveCurrentAvatar = useMutation(api.users.saveCurrentAvatar);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user?.displayName ?? "",
    username: user?.username ?? "",
    bio: user?.bio ?? "",
    location: user?.location ?? "",
    website: user?.website ?? "",
    github: user?.github ?? "",
    linkedin: user?.linkedin ?? "",
    twitter: user?.twitter ?? "",
    techStack: [...(user?.techStack ?? [])],
    aiTools: [...(user?.aiTools ?? [])],
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      name: user.displayName,
      username: user.username,
      bio: user.bio,
      location: user.location,
      website: user.website,
      github: user.github,
      linkedin: user.linkedin,
      twitter: user.twitter,
      techStack: [...user.techStack],
      aiTools: [...user.aiTools],
    });
  }, [user]);

  const updateField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleTech = (tech: string) => {
    setForm((current) => ({
      ...current,
      techStack: current.techStack.includes(tech)
        ? current.techStack.filter((item) => item !== tech)
        : [...current.techStack, tech],
    }));
  };

  const toggleAiTool = (tool: string) => {
    setForm((current) => ({
      ...current,
      aiTools: current.aiTools.includes(tool)
        ? current.aiTools.filter((item) => item !== tool)
        : [...current.aiTools, tool],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCurrentProfile(form);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const uploadUrl = await generateAvatarUploadUrl({});
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Avatar upload failed");
      }

      const { storageId } = (await response.json()) as { storageId?: string };
      if (!storageId) {
        throw new Error("Upload did not return a storage id");
      }

      await saveCurrentAvatar({ storageId: storageId as never });
      toast.success("Avatar updated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-[#3B82F6] text-white hover:bg-[#2563EB]">
          <Save className="mr-1 size-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="size-4" /> Avatar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <UserAvatar src={user.avatarUrl} name={user.displayName} size="xl" />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Upload a new avatar. Your previous Convex-stored avatar will be removed automatically.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleAvatarChange(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingAvatar ? "Uploading..." : "Change Avatar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" /> Basic Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={form.username} onChange={(event) => updateField("username", event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={form.bio} onChange={(event) => updateField("bio", event.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(event) => updateField("location", event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4" /> Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website} onChange={(event) => updateField("website", event.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Username</Label>
              <Input id="github" value={form.github} onChange={(event) => updateField("github", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={form.linkedin} onChange={(event) => updateField("linkedin", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">X / Twitter</Label>
              <Input id="twitter" value={form.twitter} onChange={(event) => updateField("twitter", event.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code2 className="size-4" /> Tech Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TECH_STACKS.map((tech) => (
              <Badge
                key={tech}
                variant={form.techStack.includes(tech) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  form.techStack.includes(tech)
                    ? "border-[#3B82F6]/30 bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30"
                    : "hover:border-[#3B82F6]/30"
                }`}
                onClick={() => toggleTech(tech)}
              >
                {tech}
                {form.techStack.includes(tech) && <X className="ml-1 size-3" />}
              </Badge>
            ))}
          </div>
          <Separator className="bg-muted/50" />
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Tools</p>
          <div className="flex flex-wrap gap-2">
            {AI_TOOLS.map((tool) => (
              <Badge
                key={tool}
                variant={form.aiTools.includes(tool) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  form.aiTools.includes(tool)
                    ? "border-[#3B82F6]/30 bg-[#3B82F6]/20 text-[#3B82F6] hover:bg-[#3B82F6]/30"
                    : "hover:border-[#3B82F6]/30"
                }`}
                onClick={() => toggleAiTool(tool)}
              >
                {tool}
                {form.aiTools.includes(tool) && <X className="ml-1 size-3" />}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="size-4" /> Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.experience.map((experience, index) => (
            <div key={index} className="border-b border-border py-3 last:border-0">
              <p className="font-medium text-foreground">{experience.title}</p>
              <p className="text-sm text-[#3B82F6]">{experience.company}</p>
              <p className="text-xs text-muted-foreground">{experience.period}</p>
            </div>
          ))}
          {user.experience.length === 0 && (
            <p className="text-sm text-muted-foreground">No experience entries yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderGit2 className="size-4" /> Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.projects.map((project, index) => (
            <div key={index} className="border-b border-border py-3 last:border-0">
              <p className="font-medium text-foreground">{project.name}</p>
              <p className="text-sm text-foreground/70">{project.description}</p>
            </div>
          ))}
          {user.projects.length === 0 && (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

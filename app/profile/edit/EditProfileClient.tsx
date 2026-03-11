"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useDemoAuth } from "@/lib/demo-auth";
import { DEMO_USERS } from "@/lib/demo-data";
import { TECH_STACKS, AI_TOOLS } from "@/lib/constants";
import { toast } from "sonner";
import { Save, User, Link2, Code2, Briefcase, FolderGit2, GraduationCap, Award, X } from "lucide-react";

export function EditProfileClient() {
  const { user: authUser } = useDemoAuth();
  const router = useRouter();

  // Find demo user data — always falls back to first user
  const demoUser = DEMO_USERS.find((u) => u.username === authUser?.username) ?? DEMO_USERS[0]!;

  const [form, setForm] = useState({
    name: demoUser.name,
    username: demoUser.username,
    bio: demoUser.bio ?? "",
    location: demoUser.location ?? "",
    website: demoUser.website ?? "",
    github: demoUser.github ?? "",
    linkedin: demoUser.linkedin ?? "",
    twitter: demoUser.twitter ?? "",
    techStack: [...demoUser.techStack],
    aiTools: [...demoUser.aiTools],
  });

  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTech = (tech: string) => {
    setForm((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter((t) => t !== tech)
        : [...prev.techStack, tech],
    }));
  };

  const toggleAiTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      aiTools: prev.aiTools.includes(tool)
        ? prev.aiTools.filter((t) => t !== tool)
        : [...prev.aiTools, tool],
    }));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile updated successfully!");
    }, 800);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-[#3B82F6] text-white hover:bg-[#2563EB]">
          <Save className="size-4 mr-1" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Basic Info */}
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="size-4" /> Basic Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={form.username} onChange={(e) => updateField("username", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={form.bio} onChange={(e) => updateField("bio", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => updateField("location", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4" /> Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website} onChange={(e) => updateField("website", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub Username</Label>
              <Input id="github" value={form.github} onChange={(e) => updateField("github", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={form.linkedin} onChange={(e) => updateField("linkedin", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter">X / Twitter</Label>
              <Input id="twitter" value={form.twitter} onChange={(e) => updateField("twitter", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Stack */}
      <Card className="glass border-white/5">
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
                    ? "bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30 hover:bg-[#3B82F6]/30"
                    : "hover:border-[#3B82F6]/30"
                }`}
                onClick={() => toggleTech(tech)}
              >
                {tech}
                {form.techStack.includes(tech) && <X className="size-3 ml-1" />}
              </Badge>
            ))}
          </div>
          <Separator className="bg-white/5" />
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">AI Tools</p>
          <div className="flex flex-wrap gap-2">
            {AI_TOOLS.map((tool) => (
              <Badge
                key={tool}
                variant={form.aiTools.includes(tool) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  form.aiTools.includes(tool)
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30"
                    : "hover:border-purple-500/30"
                }`}
                onClick={() => toggleAiTool(tool)}
              >
                {tool}
                {form.aiTools.includes(tool) && <X className="size-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Experience (read-only display in demo) */}
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="size-4" /> Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demoUser.experience.map((exp, i) => (
            <div key={i} className="py-3 border-b border-white/5 last:border-0">
              <p className="font-medium text-foreground">{exp.title}</p>
              <p className="text-sm text-[#3B82F6]">{exp.company}</p>
              <p className="text-xs text-muted-foreground">{exp.period}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-2 italic">Experience editing coming soon</p>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderGit2 className="size-4" /> Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demoUser.projects.map((proj, i) => (
            <div key={i} className="py-3 border-b border-white/5 last:border-0">
              <p className="font-medium text-foreground">{proj.name}</p>
              <p className="text-sm text-foreground/70">{proj.description}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-2 italic">Project editing coming soon</p>
        </CardContent>
      </Card>

      {/* Education */}
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="size-4" /> Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demoUser.education.map((edu, i) => (
            <div key={i} className="py-3 border-b border-white/5 last:border-0">
              <p className="font-medium text-foreground">{edu.school}</p>
              <p className="text-sm text-foreground/70">{edu.degree} in {edu.field} ({edu.year})</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground mt-2 italic">Education editing coming soon</p>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="size-4" /> Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demoUser.certifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certifications yet.</p>
          ) : (
            demoUser.certifications.map((cert, i) => (
              <div key={i} className="py-3 border-b border-white/5 last:border-0">
                <p className="font-medium text-foreground">{cert.name}</p>
                <p className="text-sm text-foreground/70">{cert.issuer} ({cert.year})</p>
              </div>
            ))
          )}
          <p className="text-xs text-muted-foreground mt-2 italic">Certification editing coming soon</p>
        </CardContent>
      </Card>

      {/* Bottom save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#3B82F6] text-white hover:bg-[#2563EB]">
          <Save className="size-4 mr-1" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </main>
  );
}


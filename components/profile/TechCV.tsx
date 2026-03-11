"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  FolderGit2,
  GraduationCap,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Experience, Project, Education, Certification } from "@/lib/types";

interface TechCVProps {
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
}

function CollapsibleSection({
  title,
  icon: Icon,
  children,
  count,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count: number;
}) {
  const [expanded, setExpanded] = useState(true);
  if (count === 0) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-[#3B82F6] transition-colors w-full"
      >
        <Icon className="size-5" />
        {title}
        <span className="text-xs text-muted-foreground font-normal">({count})</span>
        <span className="ml-auto">
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>
      {expanded && children}
    </div>
  );
}

export function TechCV({ experience, projects, education, certifications }: TechCVProps) {
  return (
    <div className="space-y-8">
      {/* Experience */}
      <CollapsibleSection title="Experience" icon={Briefcase} count={experience.length}>
        <div className="relative pl-6 space-y-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-[#3B82F6]/20" />
          {experience.map((exp, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[18px] top-1.5 size-2.5 rounded-full bg-[#3B82F6] ring-2 ring-background" />
              <div className="glass rounded-lg p-4 space-y-1">
                <h4 className="font-semibold text-foreground">{exp.title}</h4>
                <p className="text-sm text-[#3B82F6]">{exp.company}</p>
                <p className="text-xs text-muted-foreground">{exp.period}</p>
                <p className="text-sm text-foreground/70 mt-2">{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Projects */}
      <CollapsibleSection title="Projects" icon={FolderGit2} count={projects.length}>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((proj, i) => (
            <Card key={i} className="glass border-white/5">
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{proj.name}</h4>
                  {proj.url && (
                    <a href={proj.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-foreground/70">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {proj.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CollapsibleSection>

      {/* Education */}
      <CollapsibleSection title="Education" icon={GraduationCap} count={education.length}>
        <div className="space-y-3">
          {education.map((edu, i) => (
            <div key={i} className="glass rounded-lg p-4 flex items-start gap-3">
              <GraduationCap className="size-5 text-[#3B82F6] mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-foreground">{edu.school}</h4>
                <p className="text-sm text-foreground/70">
                  {edu.degree} in {edu.field}
                </p>
                <p className="text-xs text-muted-foreground">{edu.year}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Certifications */}
      <CollapsibleSection title="Certifications" icon={Award} count={certifications.length}>
        <div className="space-y-3">
          {certifications.map((cert, i) => (
            <div key={i} className="glass rounded-lg p-4 flex items-start gap-3">
              <Award className="size-5 text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{cert.name}</h4>
                <p className="text-sm text-foreground/70">{cert.issuer}</p>
                <p className="text-xs text-muted-foreground">{cert.year}</p>
              </div>
              {cert.url && (
                <a href={cert.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}


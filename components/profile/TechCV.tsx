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
    <div className="space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-[#3B82F6] transition-colors w-full focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded-lg px-1 -mx-1"
      >
        <Icon className="size-5 text-[#3B82F6]" />
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

function CompanyInitial({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  return (
    <div className="size-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-blue-500/10">
      {letter}
    </div>
  );
}

export function TechCV({ experience, projects, education, certifications }: TechCVProps) {
  return (
    <div className="space-y-10">
      {/* Experience */}
      <CollapsibleSection title="Experience" icon={Briefcase} count={experience.length}>
        <div className="relative pl-8 space-y-6">
          {/* Gradient timeline line */}
          <div
            className="absolute left-[15px] top-2 bottom-2 w-px"
            style={{
              background: "linear-gradient(to bottom, #3B82F6, rgba(59,130,246,0.1))",
            }}
          />
          {experience.map((exp, i) => (
            <div key={i} className="relative group">
              {/* Pulsing timeline dot */}
              <div className="absolute -left-[21px] top-3 flex items-center justify-center">
                <div className="size-2.5 rounded-full bg-[#3B82F6] ring-2 ring-zinc-900 relative">
                  <span className="absolute inset-0 rounded-full bg-[#3B82F6] animate-ping opacity-20" />
                </div>
              </div>
              <div className="glass rounded-xl p-4 space-y-1.5 transition-all duration-200 hover:border-white/[0.1] hover:shadow-lg hover:shadow-black/20">
                <div className="flex items-start gap-3">
                  <CompanyInitial name={exp.company} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{exp.title}</h4>
                    <p className="text-sm text-[#3B82F6] font-medium">{exp.company}</p>
                    <p className="text-xs text-muted-foreground">{exp.period}</p>
                  </div>
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed">{exp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Projects */}
      <CollapsibleSection title="Projects" icon={FolderGit2} count={projects.length}>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((proj, i) => (
            <Card
              key={i}
              className="glass border-white/5 group transition-all duration-200 hover:border-[#3B82F6]/20 hover:shadow-lg hover:shadow-blue-500/5"
            >
              <CardContent className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground group-hover:text-[#3B82F6] transition-colors">{proj.name}</h4>
                  {proj.url && (
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                      aria-label={`View ${proj.name} project`}
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed">{proj.description}</p>
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
            <div key={i} className="glass rounded-xl p-4 flex items-start gap-3 transition-all duration-200 hover:border-white/[0.1]">
              <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/10">
                <GraduationCap className="size-5" />
              </div>
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
            <div key={i} className="glass rounded-xl p-4 flex items-start gap-3 transition-all duration-200 hover:border-white/[0.1]">
              <div className="size-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/10">
                <Award className="size-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{cert.name}</h4>
                <p className="text-sm text-foreground/70">{cert.issuer}</p>
                <p className="text-xs text-muted-foreground">{cert.year}</p>
              </div>
              {cert.url && (
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center size-7 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
                  aria-label={`View ${cert.name} certification`}
                >
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


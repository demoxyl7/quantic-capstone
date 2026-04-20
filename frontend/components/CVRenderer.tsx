"use client";

import {
  User, Briefcase, GraduationCap, Wrench, FolderOpen,
  Award, Globe, Mail, Phone, MapPin, Link as LinkIcon,
} from "lucide-react";
import React from "react";

// ─────────────────────────────────────────────────────────────
// Section detection
// ─────────────────────────────────────────────────────────────

const SECTION_HEADERS = new Set([
  "summary", "profile", "about", "about me", "objective", "professional summary",
  "experience", "work experience", "professional experience", "employment", "employment history",
  "education", "academic background", "academic history",
  "skills", "technical skills", "core competencies", "technologies", "tools",
  "projects", "personal projects", "key projects", "side projects",
  "certifications", "certificates", "licenses", "training",
  "languages", "interests", "hobbies", "volunteer", "volunteering",
  "references", "awards", "achievements", "publications", "honors",
  "contact", "personal information", "personal details",
]);

const SECTION_ICONS: Record<string, React.ReactNode> = {
  summary: <User className="h-3.5 w-3.5" />,
  profile: <User className="h-3.5 w-3.5" />,
  about: <User className="h-3.5 w-3.5" />,
  "professional summary": <User className="h-3.5 w-3.5" />,
  objective: <User className="h-3.5 w-3.5" />,
  experience: <Briefcase className="h-3.5 w-3.5" />,
  "work experience": <Briefcase className="h-3.5 w-3.5" />,
  "professional experience": <Briefcase className="h-3.5 w-3.5" />,
  employment: <Briefcase className="h-3.5 w-3.5" />,
  "employment history": <Briefcase className="h-3.5 w-3.5" />,
  education: <GraduationCap className="h-3.5 w-3.5" />,
  "academic background": <GraduationCap className="h-3.5 w-3.5" />,
  skills: <Wrench className="h-3.5 w-3.5" />,
  "technical skills": <Wrench className="h-3.5 w-3.5" />,
  "core competencies": <Wrench className="h-3.5 w-3.5" />,
  technologies: <Wrench className="h-3.5 w-3.5" />,
  projects: <FolderOpen className="h-3.5 w-3.5" />,
  "personal projects": <FolderOpen className="h-3.5 w-3.5" />,
  "key projects": <FolderOpen className="h-3.5 w-3.5" />,
  certifications: <Award className="h-3.5 w-3.5" />,
  certificates: <Award className="h-3.5 w-3.5" />,
  languages: <Globe className="h-3.5 w-3.5" />,
  awards: <Award className="h-3.5 w-3.5" />,
  achievements: <Award className="h-3.5 w-3.5" />,
  honors: <Award className="h-3.5 w-3.5" />,
};

function getSectionIcon(header: string): React.ReactNode | null {
  const key = header.toLowerCase().replace(/:$/, "").trim();
  return SECTION_ICONS[key] ?? null;
}

// ─────────────────────────────────────────────────────────────
// Line classification
// ─────────────────────────────────────────────────────────────

type LineType = "name" | "header" | "contact" | "bullet" | "job-meta" | "text" | "empty";

interface ParsedLine {
  type: LineType;
  content: string;
  raw: string;
}

function classifyLine(line: string, index: number, allLines: string[]): ParsedLine {
  const trimmed = line.trim();

  if (!trimmed) return { type: "empty", content: "", raw: line };

  // ── Section header ───────────────────────────────────────────
  const headerKey = trimmed.replace(/:$/, "").toLowerCase();
  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length > 1;
  const shortAllCaps = isAllCaps && trimmed.split(/\s+/).length <= 5;
  if (SECTION_HEADERS.has(headerKey) || shortAllCaps) {
    return { type: "header", content: trimmed, raw: line };
  }

  // ── Contact / metadata (pipe-delimited, or has email+phone) ──
  const hasPipe = trimmed.includes("|");
  const hasEmail = /@[a-z0-9]+\./i.test(trimmed);
  const hasPhone = /\+?\d[\d\s\-().]{7,}/.test(trimmed);
  const hasUrl = /https?:\/\/|github\.com|linkedin\.com|\.io\/|\.com\//i.test(trimmed);
  const contactScore = [hasEmail, hasPhone, hasUrl].filter(Boolean).length;

  if (hasPipe || contactScore >= 2 || (contactScore >= 1 && trimmed.split(/\s+/).length <= 8)) {
    // Is it a job meta line (role | company | location | date) or a contact line?
    if (hasPipe && !hasEmail && !hasPhone && !hasUrl) {
      const parts = trimmed.split("|").map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2 && parts.length <= 5) {
        return { type: "job-meta", content: trimmed, raw: line };
      }
    }
    return { type: "contact", content: trimmed, raw: line };
  }

  // ── Bullet point ─────────────────────────────────────────────
  if (/^[•●○▪▸►\-–—]\s/.test(trimmed) || /^\d{1,2}[.)]\s/.test(trimmed)) {
    const bulletContent = trimmed
      .replace(/^[•●○▪▸►\-–—]\s*/, "")
      .replace(/^\d{1,2}[.)]\s*/, "")
      .trim();
    return { type: "bullet", content: bulletContent, raw: line };
  }

  // ── Candidate name — first meaningful line, few words, no numbers ──
  const isVeryEarly = index <= 3;
  const previousMeaningful = allLines.slice(0, index).filter(l => l.trim()).length === 0;
  const looksLikeName =
    isVeryEarly &&
    previousMeaningful &&
    trimmed.split(/\s+/).length >= 2 &&
    trimmed.split(/\s+/).length <= 5 &&
    !hasEmail && !hasPhone && !hasUrl && !hasPipe &&
    !/\d/.test(trimmed) &&
    trimmed === trimmed.split(/\s+/).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

  if (looksLikeName) {
    return { type: "name", content: trimmed, raw: line };
  }

  return { type: "text", content: trimmed, raw: line };
}

// ─────────────────────────────────────────────────────────────
// Renderer
// ─────────────────────────────────────────────────────────────

interface CVRendererProps {
  content: string;
}

export function CVRenderer({ content }: CVRendererProps) {
  const lines = content.split("\n");
  const parsed = lines.map((line, i) => classifyLine(line, i, lines));

  const elements: React.ReactNode[] = [];

  parsed.forEach((line, i) => {
    const key = `line-${i}`;
    const prev = parsed[i - 1];

    switch (line.type) {
      // ── Empty ────────────────────────────────────────────────
      case "empty": {
        if (prev && prev.type !== "empty" && prev.type !== "header") {
          elements.push(<div key={key} className="h-3" />);
        }
        break;
      }

      // ── Candidate Name ───────────────────────────────────────
      case "name": {
        elements.push(
          <h2 key={key} className="text-2xl font-bold tracking-tight text-foreground mb-1">
            {line.content}
          </h2>
        );
        break;
      }

      // ── Section Header ───────────────────────────────────────
      case "header": {
        const icon = getSectionIcon(line.content);
        const label = line.content.replace(/:$/, "");
        elements.push(
          <div key={key} className="flex items-center gap-2.5 mt-7 mb-3">
            {icon && (
              <span className="flex items-center justify-center h-5 w-5 rounded bg-primary/8 text-primary">
                {icon}
              </span>
            )}
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
              {label}
            </h3>
            <div className="flex-1 h-px bg-border" />
          </div>
        );
        break;
      }

      // ── Contact Bar ──────────────────────────────────────────
      case "contact": {
        // Split on pipe or common separators
        const raw = line.content;
        const segments = raw.includes("|")
          ? raw.split("|").map(s => s.trim()).filter(Boolean)
          : [raw];

        elements.push(
          <div key={key} className="flex flex-wrap items-center gap-x-1 gap-y-1.5 text-xs text-muted-foreground py-0.5">
            {segments.map((seg, si) => {
              let icon: React.ReactNode = null;
              if (/@[a-z]/i.test(seg)) icon = <Mail className="h-3 w-3 shrink-0 opacity-40" />;
              else if (/\+?\d[\d\s\-().]{7,}/.test(seg)) icon = <Phone className="h-3 w-3 shrink-0 opacity-40" />;
              else if (/github\.com|linkedin\.com|\.io|\.com/i.test(seg)) icon = <LinkIcon className="h-3 w-3 shrink-0 opacity-40" />;
              else if (/,|nigeria|lagos|london|new york|remote/i.test(seg)) icon = <MapPin className="h-3 w-3 shrink-0 opacity-40" />;

              return (
                <React.Fragment key={si}>
                  <span className="inline-flex items-center gap-1">
                    {icon}
                    <span>{seg}</span>
                  </span>
                  {si < segments.length - 1 && (
                    <span className="text-border/60 px-1 select-none">·</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        );
        break;
      }

      // ── Job / Role Meta Line ─────────────────────────────────
      case "job-meta": {
        const parts = line.content.split("|").map(s => s.trim()).filter(Boolean);
        elements.push(
          <div key={key} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mt-4 mb-1.5 pl-0">
            {parts.map((part, pi) => (
              <React.Fragment key={pi}>
                <span
                  className={
                    pi === 0
                      ? "text-sm font-semibold text-foreground"
                      : pi === parts.length - 1
                        ? "text-xs text-muted-foreground italic tabular-nums"
                        : "text-xs text-muted-foreground"
                  }
                >
                  {part}
                </span>
                {pi < parts.length - 1 && (
                  <span className="text-border text-xs select-none">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
        );
        break;
      }

      // ── Bullet Point ─────────────────────────────────────────
      case "bullet": {
        elements.push(
          <div key={key} className="flex gap-2.5 pl-0.5 py-[3px]">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary/35 shrink-0" />
            <span className="text-sm text-foreground/70 leading-relaxed">
              {line.content}
            </span>
          </div>
        );
        break;
      }

      // ── Plain Text / Paragraph ───────────────────────────────
      case "text": {
        elements.push(
          <p key={key} className="text-sm text-foreground/70 leading-relaxed">
            {line.content}
          </p>
        );
        break;
      }
    }
  });

  return (
    <div className="space-y-0 font-[var(--font-sans)]">
      {elements}
    </div>
  );
}

"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Check,
  CheckCircle2,
  Info,
  Copy,
} from "lucide-react";

interface Suggestion {
  id: string;
  target_id: string;
  type: string;
  issue: string;
  original_text: string;
  replacement_text: string;
  reason: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
}

interface CVData {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    location: string;
  };
  summary: string;
  experience: {
    id: string;
    title: string;
    company: string;
    location: string;
    dates: string;
    bullets: { id: string; text: string }[];
  }[];
  projects: Project[];
  education: {
    id?: string;
    degree: string;
    institution: string;
    dates: string;
    details: { id: string; text: string }[];
  }[];
  certifications: string[];
  skills: string[];
}

interface OptimizedCVEditorProps {
  initialCvData: CVData;
  suggestions: Suggestion[];
}

export function OptimizedCVEditor({
  suggestions,
}: OptimizedCVEditorProps) {
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setAppliedIds((prev) => new Set(prev).add(id));
  };

  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => !appliedIds.has(s.id)),
    [suggestions, appliedIds]
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Refinement Suggestions</h3>
          </div>
          <p className="text-muted-foreground">
            Copy AI-improved content to refine your document manually.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Remaining</span>
            <span className="text-xl font-mono font-bold text-primary">{pendingSuggestions.length}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {suggestions.map((s, i) => (
          <div
            key={s.id}
            className={`surface-elevated overflow-hidden border-l-4 transition-all duration-300 ${appliedIds.has(s.id)
              ? "border-success opacity-75 scale-[0.98]"
              : "border-primary hover:shadow-xl translate-y-0"
              }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded tracking-wider">
                    {s.type.replace("_", " ")}
                  </span>
                  {appliedIds.has(s.id) && (
                    <span className="flex items-center gap-1 text-success text-[10px] font-bold uppercase tracking-wider">
                      <CheckCircle2 className="h-3 w-3" />
                      Copied
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleCopy(s.replacement_text, s.id)}
                  disabled={appliedIds.has(s.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${appliedIds.has(s.id)
                    ? "bg-success/20 text-success cursor-default"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95"
                    }`}
                >
                  {appliedIds.has(s.id) ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied to Clipboard
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Improved Text
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-primary/5 rounded">
                    <Info className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h4 className="text-base font-bold leading-tight">{s.issue}</h4>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {s.original_text && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest px-1">Original Content</p>
                      <div className="p-4 bg-muted/30 border border-border rounded-xl min-h-[80px]">
                        <p className="text-[13px] text-muted-foreground line-through decoration-destructive/30 italic leading-relaxed">
                          {s.original_text}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className={`space-y-2 ${!s.original_text ? 'md:col-span-2' : ''}`}>
                    <p className="text-[10px] uppercase font-bold text-primary tracking-widest px-1">
                      {s.original_text ? "AI Improved Version" : "AI Recommended Addition"}
                    </p>
                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl min-h-[80px]">
                      <p className="text-[14px] font-medium leading-relaxed">
                        {s.replacement_text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary/30 p-3 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  <span className="font-bold not-italic mr-1 text-[10px] uppercase">AI Rationale:</span>
                  &ldquo;{s.reason}&rdquo;
                </p>
              </div>
            </div>
          </div>
        ))}

        {pendingSuggestions.length === 0 && (
          <div className="surface-elevated p-12 text-center animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h4 className="text-xl font-bold mb-2">All Improvements Reviewed!</h4>
            <p className="text-muted-foreground max-w-sm mx-auto">
              You&apos;ve reviewed and copied all suggested refinements. Your CV is now better aligned with the target role.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

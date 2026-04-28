"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Sparkles,
  Check,
  CheckCircle2,
  Download,
  ArrowDown,
  Info,
} from "lucide-react";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle,
} from "docx";

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
  skills: string[];
}

interface OptimizedCVEditorProps {
  initialCvData: CVData;
  suggestions: Suggestion[];
}

export function OptimizedCVEditor({
  initialCvData,
  suggestions,
}: OptimizedCVEditorProps) {
  const [cvData, setCvData] = useState<CVData>(initialCvData);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const handleApply = useCallback((suggestion: Suggestion) => {
    const nextData = { ...cvData };

    if (suggestion.type === "summary") {
      nextData.summary = suggestion.replacement_text;
    } else if (suggestion.type === "experience_bullet") {
      nextData.experience = nextData.experience.map((exp) => ({
        ...exp,
        bullets: exp.bullets.map((b) =>
          b.id === suggestion.target_id
            ? { ...b, text: suggestion.replacement_text }
            : b
        ),
      }));
    } else if (suggestion.type === "project_description") {
      nextData.projects = nextData.projects.map((proj) => 
        proj.id === suggestion.target_id 
          ? { ...proj, description: suggestion.replacement_text } 
          : proj
      );
    } else if (suggestion.type === "education_detail") {
      nextData.education = nextData.education.map((edu) => ({
        ...edu,
        details: edu.details.map((d) =>
          d.id === suggestion.target_id
            ? { ...d, text: suggestion.replacement_text }
            : d
        ),
      }));
    }

    setCvData(nextData);
    setAppliedIds((prev) => new Set(prev).add(suggestion.id));
  }, [cvData]);

  const handleDownload = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Name
              new Paragraph({
                alignment: AlignmentType.CENTER,
                heading: HeadingLevel.HEADING_1,
                children: [
                  new TextRun({
                    text: cvData.personal_info.name,
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              // Contact
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [
                  new TextRun({
                    text: `${cvData.personal_info.location} | ${cvData.personal_info.phone} | ${cvData.personal_info.email}`,
                    size: 20,
                  }),
                ],
              }),
              // Summary Title
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                children: [new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 24 })],
              }),
              new Paragraph({
                spacing: { before: 100, after: 200 },
                children: [new TextRun({ text: cvData.summary, size: 22 })],
              }),
              // Experience Title
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                children: [new TextRun({ text: "PROFESSIONAL EXPERIENCE", bold: true, size: 24 })],
              }),
              ...cvData.experience.flatMap((exp) => [
                new Paragraph({
                  spacing: { before: 200 },
                  children: [
                    new TextRun({ text: `${exp.company} | ${exp.location}`, bold: true, size: 22 }),
                    new TextRun({ text: `\t${exp.dates}`, bold: true, size: 22 }),
                  ],
                  tabStops: [{ type: "right", position: 9000 }],
                }),
                new Paragraph({
                  children: [new TextRun({ text: exp.title, italics: true, size: 22 })],
                }),
                ...exp.bullets.map(
                  (b) =>
                    new Paragraph({
                      text: b.text,
                      bullet: { level: 0 },
                      spacing: { before: 50 },
                    })
                ),
              ]),
              // Projects Title
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300 },
                border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                children: [new TextRun({ text: "PROJECTS", bold: true, size: 24 })],
              }),
              ...cvData.projects.flatMap((proj) => [
                new Paragraph({
                  spacing: { before: 200 },
                  children: [
                    new TextRun({ text: proj.name, bold: true, size: 22 }),
                    new TextRun({ text: `\t${proj.technologies.join(", ")}`, italics: true, size: 18 }),
                  ],
                  tabStops: [{ type: "right", position: 9000 }],
                }),
                new Paragraph({
                  spacing: { before: 50 },
                  children: [new TextRun({ text: proj.description, size: 22 })],
                }),
              ]),
              // Education Title
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300 },
                border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                children: [new TextRun({ text: "EDUCATION", bold: true, size: 24 })],
              }),
              ...cvData.education.flatMap((edu) => [
                new Paragraph({
                  spacing: { before: 200 },
                  children: [
                    new TextRun({ text: edu.institution, bold: true, size: 22 }),
                    new TextRun({ text: `\t${edu.dates}`, bold: true, size: 22 }),
                  ],
                  tabStops: [{ type: "right", position: 9000 }],
                }),
                new Paragraph({
                  children: [new TextRun({ text: edu.degree, italics: true, size: 22 })],
                }),
                ...edu.details.map(
                  (d) =>
                    new Paragraph({
                      text: d.text,
                      bullet: { level: 0 },
                      spacing: { before: 50 },
                    })
                ),
              ]),
              // Skills
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300 },
                border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
                children: [new TextRun({ text: "SKILLS", bold: true, size: 24 })],
              }),
              new Paragraph({
                spacing: { before: 100 },
                children: [new TextRun({ text: cvData.skills.join(", "), size: 22 })],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ATS_Optimized_CV.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const pendingSuggestions = useMemo(
    () => suggestions.filter((s) => !appliedIds.has(s.id)),
    [suggestions, appliedIds]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ATS Template Preview */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold">ATS Optimized Preview</h3>
            <span className="badge badge-primary text-[10px]">
              {appliedIds.size} change{appliedIds.size !== 1 ? "s" : ""} applied
            </span>
          </div>
          <button
            onClick={handleDownload}
            className="btn-secondary text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download DOCX
          </button>
        </div>

        {/* Informative Banner */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/15 rounded-xl">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            We&apos;ve safely ported your information into a clean ATS-friendly template. 
            All your original data is preserved. Review the AI&apos;s suggestions below to iteratively upgrade your bullets before downloading.
          </p>
        </div>

        {/* The Document */}
        <div className="surface-elevated p-12 min-h-[800px] bg-white text-slate-900 shadow-sm font-serif">
          <div className="max-w-[700px] mx-auto space-y-6">
            {/* Header */}
            <div className="text-center border-b pb-4 border-slate-200">
              <h1 className="text-2xl font-bold uppercase tracking-tight">{cvData.personal_info.name}</h1>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-center gap-2">
                <span>{cvData.personal_info.location}</span>
                <span>•</span>
                <span>{cvData.personal_info.phone}</span>
                <span>•</span>
                <span>{cvData.personal_info.email}</span>
              </div>
            </div>

            {/* Summary */}
            <section>
              <h2 className="text-[13px] font-bold border-b border-slate-900 pb-0.5 mb-2 uppercase">Professional Summary</h2>
              <p className="text-[12px] leading-relaxed text-slate-800">
                {cvData.summary}
              </p>
            </section>

            {/* Experience */}
            <section>
              <h2 className="text-[13px] font-bold border-b border-slate-900 pb-0.5 mb-2 uppercase">Professional Experience</h2>
              <div className="space-y-4">
                {cvData.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-[12px] font-bold">{exp.company}</h3>
                      <span className="text-[11px] font-medium">{exp.dates}</span>
                    </div>
                    <div className="flex justify-between items-baseline italic text-slate-600 mb-1.5">
                      <span className="text-[11px]">{exp.title}</span>
                      <span className="text-[10px]">{exp.location}</span>
                    </div>
                    <ul className="list-disc ml-4 space-y-1">
                      {exp.bullets.map((b) => (
                        <li key={b.id} className="text-[11px] leading-relaxed text-slate-800">
                          {b.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Projects */}
            <section>
              <h2 className="text-[13px] font-bold border-b border-slate-900 pb-0.5 mb-2 uppercase">Projects</h2>
              <div className="space-y-4">
                {cvData.projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-[12px] font-bold">{proj.name}</h3>
                      <span className="text-[10px] text-slate-500 italic">{proj.technologies.join(", ")}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-800 mt-1">
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Education */}
            <section>
              <h2 className="text-[13px] font-bold border-b border-slate-900 pb-0.5 mb-2 uppercase">Education</h2>
              <div className="space-y-3">
                {cvData.education.map((edu) => (
                  <div key={edu.id}>
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-[12px] font-bold">{edu.institution}</h3>
                      <span className="text-[11px] font-medium">{edu.dates}</span>
                    </div>
                    <p className="text-[11px] italic text-slate-600 mb-1.5">{edu.degree}</p>
                    <ul className="list-disc ml-4 space-y-1">
                      {edu.details.map((d) => (
                        <li key={d.id} className="text-[11px] leading-relaxed text-slate-800">
                          {d.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-[13px] font-bold border-b border-slate-900 pb-0.5 mb-2 uppercase">Skills</h2>
              <p className="text-[11px] leading-relaxed text-slate-800">
                {cvData.skills.join(", ")}
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Suggestions Panel */}
      <div className="w-full lg:w-[380px] space-y-4 shrink-0">
        <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          AI Refinement Suggestions
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">
            {pendingSuggestions.length}
          </span>
        </h4>

        <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          {pendingSuggestions.map((s, i) => (
            <div
              key={s.id}
              className="surface-elevated p-4 animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-primary text-[10px] uppercase">{s.type.replace("_", " ")}</span>
              </div>

              <p className="text-[12px] font-bold mb-3 leading-snug">
                {s.issue}
              </p>

              <div className="space-y-2 mb-4">
                <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg">
                  <p className="text-[9px] uppercase font-bold text-destructive mb-1">Original</p>
                  <p className="text-[11px] text-foreground/60 line-through decoration-destructive/20 italic">
                    {s.original_text}
                  </p>
                </div>
                <div className="flex justify-center -my-1 relative z-10">
                  <div className="bg-background p-1 rounded-full border border-border">
                    <ArrowDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
                <div className="p-3 bg-success/5 border border-success/10 rounded-lg">
                  <p className="text-[9px] uppercase font-bold text-success mb-1">AI Improved</p>
                  <p className="text-[11px] text-foreground/90 font-medium leading-relaxed">
                    {s.replacement_text}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground italic mb-4 leading-relaxed bg-secondary/30 p-2 rounded-lg">
                &ldquo;{s.reason}&rdquo;
              </p>

              <button
                onClick={() => handleApply(s)}
                className="w-full btn-primary py-2 text-xs"
              >
                <Check className="h-3.5 w-3.5" />
                Apply This Change
              </button>
            </div>
          ))}

          {pendingSuggestions.length === 0 && (
            <div className="surface-elevated p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm font-bold">All Suggestions Applied!</p>
              <p className="text-xs text-muted-foreground mt-2">
                Your CV is now optimized for the target role.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

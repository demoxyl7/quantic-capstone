import { CheckCircle2, List, GraduationCap, Briefcase } from "lucide-react";

interface Experience {
  title: string;
  company: string;
  location?: string;
  dates?: string;
  responsibilities?: string[];
  bullets?: { id: string; text: string }[];
}

interface Education {
  id?: string;
  degree: string;
  institution: string;
  location?: string;
  dates?: string;
  details?: { id: string; text: string }[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
}

interface ExtractionCardProps {
  title: string;
  type: "cv" | "jd";
  data: {
    skills?: string[];
    experience?: Experience[];
    projects?: Project[];
    education?: Education[];
    role?: string;
    summary?: string;
    responsibilities?: string[];
    qualifications?: string[];
  };
}

export function ExtractionCard({ title, type, data }: ExtractionCardProps) {
  return (
    <div className="surface-elevated p-5">
      <div className="flex items-center gap-2 mb-5">
        <div
          className={`p-1.5 rounded-lg ${
            type === "cv" ? "bg-primary/8" : "bg-success/8"
          }`}
        >
          {type === "cv" ? (
            <Briefcase className="h-4 w-4 text-primary" />
          ) : (
            <List className="h-4 w-4 text-success" />
          )}
        </div>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>

      <div className="space-y-5">
        {/* Role / Name */}
        {(data.role || (type === "cv" && data.experience?.[0]?.title)) && (
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              {type === "jd" ? "Target Role" : "Current Role"}
            </p>
            <p className="text-sm font-semibold">
              {data.role || data.experience?.[0]?.title}
            </p>
          </div>
        )}

        {/* Summary */}
        {data.summary && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Summary
            </p>
            <p className="text-xs text-foreground/75 leading-relaxed italic">
              &ldquo;{data.summary}&rdquo;
            </p>
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              <span>Skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-secondary text-xs font-medium rounded-md text-foreground/70"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Responsibilities / Experience */}
        {(type === "jd" ? data.responsibilities : data.experience) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <List className="h-3 w-3" />
              <span>
                {type === "jd" ? "Key Responsibilities" : "Experience"}
              </span>
            </div>
            <ul className="space-y-1.5">
              {(type === "jd" ? data.responsibilities : data.experience)
                ?.slice(0, 4)
                .map((item, index) => (
                  <li
                    key={index}
                    className="text-xs text-foreground/65 leading-relaxed flex gap-2"
                  >
                    <span className="text-primary font-bold mt-px">•</span>
                    <span>
                      {typeof item === "string"
                        ? item
                        : `${item.title} at ${item.company}`}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span className="h-3 w-3 bg-primary/20 rounded flex items-center justify-center text-[8px]">P</span>
              <span>Projects</span>
            </div>
            <div className="space-y-3">
              {data.projects.slice(0, 2).map((proj) => (
                <div key={proj.id} className="p-2.5 rounded-lg bg-secondary/30">
                  <p className="text-xs font-bold mb-1">{proj.name}</p>
                  <p className="text-[11px] text-foreground/70 line-clamp-2 leading-relaxed mb-1.5">
                    {proj.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies.slice(0, 3).map((tech) => (
                      <span key={tech} className="text-[9px] px-1.5 py-0.5 bg-background/50 rounded text-muted-foreground">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education / Qualifications */}
        {(type === "cv" ? data.education : data.qualifications) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <GraduationCap className="h-3 w-3" />
              <span>{type === "cv" ? "Education" : "Qualifications"}</span>
            </div>
            <div className="text-xs text-foreground/65 leading-relaxed">
              {type === "cv" 
                ? (data.education as Education[])?.map((edu: Education, i: number) => (
                    <div key={i} className={i > 0 ? "mt-1.5" : ""}>
                      <span className="font-semibold text-foreground/80">{edu.degree}</span>
                      <span className="mx-1.5 text-muted-foreground">·</span>
                      <span>{edu.institution}</span>
                    </div>
                  ))
                : (data.qualifications as string[])?.join(" · ")
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { CheckCircle2, List, GraduationCap, Briefcase } from "lucide-react";

interface ExtractionCardProps {
  title: string;
  type: "cv" | "jd";
  data: {
    skills?: string[];
    experience?: any[];
    education?: string[];
    role?: string;
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

        {/* Education / Qualifications */}
        {(type === "cv" ? data.education : data.qualifications) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <GraduationCap className="h-3 w-3" />
              <span>{type === "cv" ? "Education" : "Qualifications"}</span>
            </div>
            <p className="text-xs text-foreground/65 leading-relaxed">
              {(type === "cv" ? data.education : data.qualifications)?.join(
                " · "
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

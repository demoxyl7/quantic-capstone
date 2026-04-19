import { CircularProgress } from "./CircularProgress";
import { CheckCircle2, AlertTriangle, BookOpen, TrendingUp } from "lucide-react";

interface AnalysisData {
  score: number;
  match_status: string;
  matched_skills: string[];
  missing_skills: string[];
  skill_gap_courses: { topic: string; description: string }[];
}

interface ResultsDashboardProps {
  visible: boolean;
  data: AnalysisData | null;
}

export function ResultsDashboard({ visible, data }: ResultsDashboardProps) {
  if (!visible || !data) return null;

  const scoreColor =
    data.score >= 75
      ? "text-success"
      : data.score >= 50
        ? "text-primary"
        : "text-destructive";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Score Header */}
      <div className="surface-elevated p-6 flex flex-col sm:flex-row gap-6 items-center">
        <div className="relative shrink-0">
          <CircularProgress value={data.score} size={120} strokeWidth={8} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={`text-2xl font-extrabold ${scoreColor}`}>
              {data.score}%
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Match
            </span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div
            className={`inline-flex badge ${
              data.score >= 75
                ? "badge-success"
                : data.score >= 50
                  ? "badge-primary"
                  : "badge-destructive"
            } mb-2`}
          >
            {data.score >= 75
              ? "Strong Match"
              : data.score >= 50
                ? "Moderate Match"
                : "Needs Work"}
          </div>
          <h2 className="text-lg font-bold mb-1">{data.match_status}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            {data.score >= 75
              ? "Your profile aligns well with this role. A few targeted refinements could make your application even stronger."
              : data.score >= 50
                ? "There's a solid foundation here. Focus on addressing the skill gaps below to improve your match."
                : "There are significant gaps between your profile and this role. Consider the learning paths suggested below."}
          </p>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Matched Skills */}
        <div className="surface-elevated p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <h3 className="text-sm font-bold">
              Skills You Have
              <span className="ml-2 text-muted-foreground font-normal">
                ({data.matched_skills.length})
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.matched_skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/6 text-xs font-medium text-foreground/70"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="surface-elevated p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-bold">
              Skills to Add
              <span className="ml-2 text-muted-foreground font-normal">
                ({data.missing_skills.length})
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.missing_skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/6 text-xs font-medium text-foreground/70"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Learning Path */}
        <div className="surface-elevated p-5 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Learning Path</h3>
          </div>
          <div className="space-y-3">
            {data.skill_gap_courses.map((course, i) => (
              <div
                key={i}
                className="group p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-default"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">{course.topic}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                  <TrendingUp className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
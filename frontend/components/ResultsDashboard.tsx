"use client";

import { CircularProgress } from "./CircularProgress";
import { AlertTriangle, CheckCircle2, Lightbulb, TrendingUp, XCircle } from "lucide-react";

// Define the data structure for the AI response
interface AnalysisData {
  score: number;
  match_status: string;
  matched_skills: string[];
  missing_skills: string[];
  suggestions: string[];
}

interface ResultsDashboardProps {
  visible: boolean;
  data: AnalysisData | null; // Receive real data from backend
}

export function ResultsDashboard({ visible, data }: ResultsDashboardProps) {
  if (!visible || !data) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-lg font-bold">Analysis Results</h2>

      {/* Match Score Card */}
      <div className="glass-card flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
        <CircularProgress value={data.score} />
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold">Overall Match Score</h3>
          <p className="text-sm text-muted-foreground italic">
            "{data.match_status}"
          </p>
          <div className="flex gap-4 pt-2">
            <Stat label="Matched" value={`${data.matched_skills.length}`} />
            <Stat label="Missing" value={`${data.missing_skills.length}`} />
            <Stat label="Status" value={data.score > 70 ? "Strong" : "Developing"} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Real Matched Skills */}
        <div className="glass-card space-y-3 p-5 border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <h3 className="text-sm font-semibold text-green-700">Matched Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.matched_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-700"
              >
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Real Missing Skills */}
        <div className="glass-card space-y-3 p-5 border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Missing Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.missing_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-destructive/10 border border-destructive/20 px-3 py-1 text-xs font-medium text-destructive"
              >
                + {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Optimization Tips from AI */}
      <div className="glass-card space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Strategic Recommendations</h3>
        </div>
        <div className="space-y-2">
          {data.suggestions.map((tip, i) => (
            <div key={i} className="flex gap-3 rounded-lg bg-secondary/50 px-3 py-2.5 hover:bg-secondary transition-colors">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-sm">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
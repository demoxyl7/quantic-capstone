import { FileText, Briefcase } from "lucide-react";

interface ComparisonViewProps {
  cvContent: string;
  jobDescription: string;
  visible: boolean;
}

export function ComparisonView({ cvContent, jobDescription, visible }: ComparisonViewProps) {
  if (!visible) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card space-y-3 p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Your CV</h3>
        </div>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{cvContent}</p>
      </div>
      <div className="glass-card space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Job Description</h3>
        </div>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">{jobDescription}</p>
      </div>
    </div>
  );
}
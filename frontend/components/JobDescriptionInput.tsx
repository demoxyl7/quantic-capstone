import { Briefcase } from "lucide-react";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescriptionInput({ value, onChange }: JobDescriptionInputProps) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/8">
          <Briefcase className="h-4 w-4 text-accent" />
        </div>
        <h3 className="text-sm font-semibold text-muted-foreground">
          Role Requirements
        </h3>
      </div>
      <textarea
        id="job-description-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full job description here..."
        className="textarea-field min-h-[220px]"
      />
    </div>
  );
}
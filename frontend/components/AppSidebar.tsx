"use client";

import { Search, PenLine, FileText, Sparkles, User, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

interface AppSidebarProps {
  currentPhase: "ANALYZE" | "REFINE" | "COVER_LETTER";
  onPhaseChange: (phase: "ANALYZE" | "REFINE" | "COVER_LETTER") => void;
  hasResults: boolean;
}

const navItems = [
  { key: "ANALYZE" as const, icon: Search, label: "Analyze" },
  { key: "REFINE" as const, icon: PenLine, label: "Refine CV" },
  { key: "COVER_LETTER" as const, icon: FileText, label: "Cover Letter" },
];

export function AppSidebar({ currentPhase, onPhaseChange, hasResults }: AppSidebarProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-card p-5 z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10 pt-1">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-none">Quantic</h1>
          <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
            Career Assistant
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-3 opacity-60">
          Workflow
        </p>
        {navItems.map((item) => {
          const isActive = currentPhase === item.key;
          const isDisabled = !hasResults && item.key !== "ANALYZE";

          return (
            <button
              key={item.key}
              onClick={() => {
                if (!isDisabled) onPhaseChange(item.key);
              }}
              disabled={isDisabled}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary/8 text-primary font-semibold"
                  : isDisabled
                    ? "text-muted-foreground opacity-30 cursor-not-allowed"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
              {item.label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-3 mt-auto">
        {/* Theme toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-3 bg-secondary rounded-xl">
          <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center shadow-sm">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">Guest User</p>
            <p className="text-[10px] text-muted-foreground">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
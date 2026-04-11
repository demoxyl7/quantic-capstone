import { LayoutDashboard, FileText, History, Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FileText, label: "My CVs", active: false },
  { icon: History, label: "Job History", active: false },
];

export function AppSidebar() {
  return (
    <aside className="glass-card flex h-screen w-64 flex-col border-r p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">Cappy Stony</h1>
          <p className="text-xs text-muted-foreground">Rojexe</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              item.active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">v1.0.0</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
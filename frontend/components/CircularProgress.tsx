interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({ value, size = 160, strokeWidth = 10 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 80 ? "hsl(142, 71%, 45%)" : value >= 60 ? "hsl(45, 93%, 47%)" : "hsl(0, 84%, 60%)";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="circular-progress">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-secondary"
          style={{ strokeWidth, transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{
            strokeWidth,
            stroke: color,
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transform: "rotate(-90deg)",
            transformOrigin: "center",
            transition: "stroke-dashoffset 1s ease-in-out",
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold">{Math.round(value)}%</span>
        <span className="text-xs text-muted-foreground">Match</span>
      </div>
    </div>
  );
}
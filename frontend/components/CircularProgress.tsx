interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const color =
    value >= 75
      ? "var(--color-success)"
      : value >= 50
        ? "var(--color-primary)"
        : "var(--color-destructive)";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--color-secondary)"
          strokeWidth={strokeWidth}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "center",
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
    </div>
  );
}
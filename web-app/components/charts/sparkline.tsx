import { cn } from "@/lib/utils";
import type { MetricStatus, Reading } from "@/lib/types";

interface SparklineProps {
  data: Reading[];
  status?: MetricStatus;
  className?: string;
  width?: number;
  height?: number;
}

const STROKE: Record<MetricStatus, string> = {
  ok: "#7DC97F",
  warn: "#F5A623",
  error: "#EF4444",
  nodata: "#9CA3AF",
};

const FILL: Record<MetricStatus, string> = {
  ok: "rgba(125, 201, 127, 0.25)",
  warn: "rgba(245, 166, 35, 0.25)",
  error: "rgba(239, 68, 68, 0.25)",
  nodata: "rgba(156, 163, 175, 0.20)",
};

export function Sparkline({
  data,
  status = "ok",
  className,
  width = 120,
  height = 36,
}: SparklineProps) {
  const points = data.filter((d) => Number.isFinite(d.value));
  if (points.length < 2) {
    return (
      <div
        className={cn("h-9 w-full text-card-foreground/30 text-[10px] font-medium flex items-center", className)}
        aria-hidden
      >
        No trend yet
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = height - ((p.value - min) / span) * (height - 4) - 2;
    return [x, y] as const;
  });

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={cn("block", className)}
      aria-hidden
    >
      <path d={areaPath} fill={FILL[status]} />
      <path d={linePath} fill="none" stroke={STROKE[status]} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/status-pill";
import { Sparkline } from "@/components/charts/sparkline";
import type { MetricStatus, Reading } from "@/lib/types";

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  status: MetricStatus;
  sparkline?: Reading[];
}

export function MetricCard({ label, value, unit, status, sparkline }: MetricCardProps) {
  return (
    <Card className="flex flex-col items-stretch gap-3 p-4 sm:p-5 bg-card text-card-foreground rounded-2xl">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-card-foreground/60">{label}</p>
        <StatusPill status={status} />
      </div>
      <p className="font-black text-card-foreground leading-none">
        <span className="text-4xl">{value}</span>
        <span className="text-xl ml-1">{unit}</span>
      </p>
      {sparkline && <Sparkline data={sparkline} status={status} />}
    </Card>
  );
}

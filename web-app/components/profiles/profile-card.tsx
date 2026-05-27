import Link from "next/link";
import { ArrowUpRight, Globe2, Lock, Thermometer, Droplets, Sun } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ThresholdRange, FlowerProfile } from "@/lib/types";

interface ProfileCardProps {
  profile: FlowerProfile;
}

function RangeBar({ range, unit }: { range: ThresholdRange; unit: string }) {
  const min = range.warn[0];
  const max = range.warn[1];
  const span = Math.max(max - min, 0.0001);
  const okStart = ((range.ok[0] - min) / span) * 100;
  const okWidth = ((range.ok[1] - range.ok[0]) / span) * 100;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="relative h-1.5 w-full rounded-full bg-[#F5A623]/30 overflow-hidden">
        <div
          className="absolute inset-y-0 bg-[#7DC97F]"
          style={{ left: `${okStart}%`, width: `${okWidth}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between gap-2 text-[10px] font-mono tabular-nums text-card-foreground/60">
        <span>{range.warn[0]}</span>
        <span className="text-card-foreground font-bold">
          {range.ok[0]}–{range.ok[1]} {unit}
        </span>
        <span>{range.warn[1]}</span>
      </div>
    </div>
  );
}

function MetricRow({
  icon: Icon,
  label,
  range,
  unit,
}: {
  icon: typeof Thermometer;
  label: string;
  range: ThresholdRange;
  unit: string;
}) {
  return (
    <div className="grid grid-cols-[auto_5.5rem_1fr] items-center gap-3">
      <div className="size-7 rounded-md bg-card-foreground/8 flex items-center justify-center text-card-foreground/70">
        <Icon className="size-3.5" />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-widest text-card-foreground/60">
        {label}
      </span>
      <RangeBar range={range} unit={unit} />
    </div>
  );
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Link
      href={`/profiles/${profile._id}`}
      className="group block transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <Card className="bg-card text-card-foreground rounded-2xl overflow-hidden h-full transition-all duration-300 ease-out group-hover:ring-foreground/25 group-hover:shadow-[0_18px_40px_-22px_rgba(0,0,0,0.6)]">
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 border-b border-card-foreground/10">
          <div className="flex flex-col gap-0.5 min-w-0">
            <h3 className="text-base font-black leading-tight truncate">{profile.flowerName}</h3>
            <span className="text-[11px] uppercase tracking-widest text-card-foreground/50">
              {profile.isOwner ? "Your profile" : "Community"}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {profile.public ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F5A623]/15 text-[#7a4d00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                <Globe2 className="size-3" />
                Public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-card-foreground/8 text-card-foreground/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                <Lock className="size-3" />
                Private
              </span>
            )}
            <ArrowUpRight className="size-4 text-card-foreground/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-card-foreground" />
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          <MetricRow icon={Thermometer} label="Temp" range={profile.temp} unit="°C" />
          <MetricRow icon={Droplets} label="Humidity" range={profile.humidity} unit="%" />
          <MetricRow icon={Sun} label="Light" range={profile.light} unit="lx" />
        </div>
      </Card>
    </Link>
  );
}

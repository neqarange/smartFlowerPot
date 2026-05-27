import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Droplets, Globe2, Lock, Sun, Thermometer } from "lucide-react";

import { PageHeading } from "@/components/page-heading";
import { ProfileForm } from "@/components/profiles/profile-form";
import { AssignToDevicePicker } from "@/components/profiles/assign-profile-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDevicesServer, getProfileByIdServer } from "@/lib/api-server";
import type { ThresholdRange } from "@/lib/types";

interface ProfileDetailPageProps {
  params: Promise<{ id: string }>;
}

function RangeBar({ range, unit }: { range: ThresholdRange; unit: string }) {
  const min = range.warn[0];
  const max = range.warn[1];
  const span = Math.max(max - min, 0.0001);
  const okStart = ((range.ok[0] - min) / span) * 100;
  const okWidth = ((range.ok[1] - range.ok[0]) / span) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-2 w-full rounded-full bg-[#F5A623]/30 overflow-hidden">
        <div
          className="absolute inset-y-0 bg-[#7DC97F] transition-all duration-500"
          style={{ left: `${okStart}%`, width: `${okWidth}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between text-[11px] font-mono tabular-nums text-card-foreground/60">
        <span>
          {range.warn[0]} {unit}
        </span>
        <span className="text-card-foreground font-bold">
          OK {range.ok[0]}–{range.ok[1]} {unit}
        </span>
        <span>
          {range.warn[1]} {unit}
        </span>
      </div>
    </div>
  );
}

function RangeRow({
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-md bg-card-foreground/8 flex items-center justify-center text-card-foreground/70">
          <Icon className="size-3.5" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-card-foreground/60">
          {label}
        </span>
      </div>
      <RangeBar range={range} unit={unit} />
    </div>
  );
}

export default async function ProfileDetailPage({ params }: ProfileDetailPageProps) {
  const { id } = await params;
  const profile = await getProfileByIdServer(id);
  if (!profile) notFound();

  if (profile.isOwner) {
    return (
      <div className="animate-in fade-in duration-300 ease-out">
        <Link
          href="/profiles"
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white mb-4 animate-in fade-in slide-in-from-left-2 duration-300 ease-out"
        >
          <ArrowLeft className="size-3" />
          Back to profiles
        </Link>
        <div
          className="animate-in fade-in slide-in-from-bottom-2 duration-[400ms] ease-out"
          style={{ animationDelay: "60ms", animationFillMode: "backwards" }}
        >
          <PageHeading title={profile.flowerName} subtitle="Edit this flower profile." />
        </div>
        <div
          className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
          style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
        >
          <ProfileForm profile={profile} />
        </div>
      </div>
    );
  }

  const devices = await getDevicesServer();

  return (
    <div className="animate-in fade-in duration-300 ease-out">
      <Link
        href="/profiles?tab=community"
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white mb-4 animate-in fade-in slide-in-from-left-2 duration-300 ease-out"
      >
        <ArrowLeft className="size-3" />
        Back to community
      </Link>
      <div
        className="animate-in fade-in slide-in-from-bottom-2 duration-[400ms] ease-out"
        style={{ animationDelay: "60ms", animationFillMode: "backwards" }}
      >
        <PageHeading title={profile.flowerName} subtitle="Community profile · read-only" />
      </div>

      <div className="max-w-3xl flex flex-col gap-5">
        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
          style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
        >
          <Card className="bg-card text-card-foreground rounded-2xl overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-card-foreground/10">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-bold">Ideal conditions</CardTitle>
                {profile.public ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F5A623]/15 text-[#7a4d00] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    <Globe2 className="size-3" /> Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-card-foreground/8 text-card-foreground/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    <Lock className="size-3" /> Private
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="py-5 flex flex-col gap-5">
              <RangeRow icon={Thermometer} label="Temperature" range={profile.temp} unit="°C" />
              <RangeRow icon={Droplets} label="Humidity" range={profile.humidity} unit="%" />
              <RangeRow icon={Sun} label="Light" range={profile.light} unit="lx" />
            </CardContent>
          </Card>
        </div>

        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out"
          style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
        >
          <Card className="bg-card text-card-foreground rounded-2xl overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-card-foreground/10">
              <CardTitle className="text-sm font-bold">Use this profile</CardTitle>
            </CardHeader>
            <CardContent className="py-5">
              <AssignToDevicePicker profile={profile} devices={devices} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

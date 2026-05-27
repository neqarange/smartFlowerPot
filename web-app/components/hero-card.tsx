import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/status-pill";
import { FlowerImage } from "@/components/flower-image";
import { FlowerDetails } from "@/components/flower-details";
import { DeviceSwitcher } from "@/components/device-switcher";
import { CareSuggestion } from "@/components/care-suggestion";
import { cn } from "@/lib/utils";
import type { FlowerProfile, MetricStatus } from "@/lib/types";
import type { Device } from "@/lib/api";
import type { CareSuggestionResult } from "@/lib/care-rules";

interface HeroCardProps {
  device: Device;
  devices: Device[];
  status: MetricStatus;
  suggestion: CareSuggestionResult;
  profile?: FlowerProfile | null;
}

const glowClass: Record<MetricStatus, string> = {
  ok: "shadow-[0_0_0_1px_var(--color-leaf)_inset,0_18px_55px_-30px_var(--color-leaf-glow)]",
  warn: "shadow-[0_0_0_1px_#F5A623_inset,0_18px_55px_-30px_var(--color-warn-glow)]",
  error: "shadow-[0_0_0_1px_#EF4444_inset,0_18px_55px_-30px_var(--color-error-glow)]",
  nodata: "",
};

export function HeroCard({ device, devices, status, suggestion, profile }: HeroCardProps) {
  const defaultName = device.name;
  const defaultSpecies = profile?.flowerName ?? "";

  return (
    <Card
      className={cn(
        "bg-card text-card-foreground rounded-3xl overflow-hidden transition-shadow duration-300",
        glowClass[status],
      )}
    >
      <CardContent
        key={device.deviceId}
        className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-start gap-5 sm:gap-7 p-5 sm:p-7 animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out"
      >
        <div className="flex items-start gap-4">
          <FlowerImage alt={defaultName} deviceId={device.deviceId} />
          <div className="md:hidden flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-widest text-card-foreground/60">
              Now caring for
            </span>
            <StatusPill status={status} className="self-start px-3 py-1 text-sm" />
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <div className="hidden md:block">
            <span className="text-xs font-bold uppercase tracking-widest text-card-foreground/60">
              Now caring for
            </span>
          </div>
          <FlowerDetails
            deviceId={device.deviceId}
            defaultName={defaultName}
            defaultSpecies={defaultSpecies}
          />
          {profile && (
            <p className="text-xs text-card-foreground/60">
              <span className="font-bold uppercase tracking-widest">Profile</span>{" "}
              <span className="italic">{profile.flowerName}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4 md:items-end md:text-right md:max-w-xs">
          <div className="hidden md:flex md:items-center md:gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-card-foreground/60">
              Status
            </span>
            <StatusPill status={status} className="px-3 py-1 text-sm" />
          </div>
          <CareSuggestion suggestion={suggestion} className="md:justify-end" />
          <div className="w-full md:w-56">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-card-foreground/60 mb-1 block md:text-right">
              Device
            </Label>
            <DeviceSwitcher devices={devices} selectedId={device.deviceId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

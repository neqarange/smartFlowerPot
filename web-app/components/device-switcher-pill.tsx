"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Sprout } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Device } from "@/lib/api";
import type { FlowerProfile } from "@/lib/types";

interface DeviceSwitcherPillProps {
  devices: Device[];
  profilesById: Record<string, FlowerProfile | null>;
}

function imageKey(deviceId: string) {
  return `flower-image-${deviceId}`;
}

function detailsKey(deviceId: string) {
  return `flower-details-${deviceId}`;
}

function useLocalImage(deviceId: string | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!deviceId) {
      setSrc(null);
      return;
    }
    const key = imageKey(deviceId);
    setSrc(localStorage.getItem(key));
    function onStorage(e: StorageEvent) {
      if (e.key === key) setSrc(e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [deviceId]);
  return src;
}

function useLocalDetails(
  deviceIds: string[],
): Record<string, { name?: string; species?: string } | null> {
  const [map, setMap] = useState<Record<string, { name?: string; species?: string } | null>>({});

  useEffect(() => {
    const next: Record<string, { name?: string; species?: string } | null> = {};
    for (const id of deviceIds) {
      const raw = localStorage.getItem(detailsKey(id));
      if (raw) {
        try {
          next[id] = JSON.parse(raw) as { name?: string; species?: string };
        } catch {
          next[id] = null;
        }
      } else {
        next[id] = null;
      }
    }
    setMap(next);

    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      const match = deviceIds.find((id) => detailsKey(id) === e.key);
      if (!match) return;
      setMap((prev) => ({
        ...prev,
        [match]: e.newValue
          ? (() => {
              try {
                return JSON.parse(e.newValue!) as { name?: string; species?: string };
              } catch {
                return null;
              }
            })()
          : null,
      }));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceIds.join("|")]);

  return map;
}

function PotAvatar({ deviceId, size = "md" }: { deviceId: string; size?: "sm" | "md" }) {
  const src = useLocalImage(deviceId);
  const dim = size === "md" ? "w-7 h-7" : "w-7 h-7";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        className={cn("rounded-full object-cover ring-2 ring-[#F5A623]", dim)}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center bg-[#F5A623]/20 text-[#F5A623] ring-2 ring-[#F5A623]",
        dim,
      )}
    >
      <Sprout className="size-3.5" aria-hidden />
    </div>
  );
}

function displayFor(
  device: Device,
  profile: FlowerProfile | null,
  details: { name?: string; species?: string } | null,
): { primary: string; secondary: string | null } {
  const custom = details?.name?.trim();
  const speciesCustom = details?.species?.trim();
  const profileName = profile?.flowerName;

  if (custom) {
    // user named their plant — show that, with species/device hint below
    const secondary = speciesCustom || profileName || device.name;
    return { primary: custom, secondary: secondary === custom ? null : secondary };
  }
  if (profileName) {
    return { primary: profileName, secondary: device.name };
  }
  return { primary: device.name, secondary: "No profile assigned" };
}

export function DeviceSwitcherPill({ devices, profilesById }: DeviceSwitcherPillProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const detailsByDevice = useLocalDetails(devices.map((d) => d.deviceId));

  if (devices.length === 0) return null;

  const selectedId = searchParams?.get("device") ?? devices[0].deviceId;
  const selected = devices.find((d) => d.deviceId === selectedId) ?? devices[0];
  const selectedProfile = profilesById[selected.deviceId] ?? null;
  const selectedDisplay = displayFor(
    selected,
    selectedProfile,
    detailsByDevice[selected.deviceId] ?? null,
  );

  function pick(deviceId: string) {
    if (deviceId === selected.deviceId) return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("device", deviceId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Switch plant — currently ${selectedDisplay.primary}`}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 active:scale-[0.97]",
          "border border-white/15 ring-1 ring-[#F5A623]/40",
          "pl-1 pr-3 py-1 text-sm font-semibold text-white shadow-sm cursor-pointer",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]",
          "data-[state=open]:bg-white/15 data-[state=open]:ring-[#F5A623]",
        )}
      >
        <PotAvatar deviceId={selected.deviceId} />
        <span
          key={`name-${selected.deviceId}`}
          className="max-w-[12rem] truncate animate-in fade-in slide-in-from-right-1 duration-200"
        >
          {selectedDisplay.primary}
        </span>
        <ChevronDown
          className="size-4 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 bg-popover text-popover-foreground"
      >
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/50">
          Plants
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {devices.map((d) => {
          const active = d.deviceId === selected.deviceId;
          const profile = profilesById[d.deviceId] ?? null;
          const display = displayFor(d, profile, detailsByDevice[d.deviceId] ?? null);
          return (
            <DropdownMenuItem
              key={d.deviceId}
              onSelect={() => pick(d.deviceId)}
              className={cn(
                "flex items-center gap-2.5 py-1.5 cursor-pointer transition-colors",
                active && "bg-white/5",
              )}
            >
              <PotAvatar deviceId={d.deviceId} size="sm" />
              <div className="flex flex-col leading-tight min-w-0 flex-1">
                <span className="text-sm font-semibold text-white truncate">{display.primary}</span>
                {display.secondary && (
                  <span className="text-[11px] text-white/55 truncate">{display.secondary}</span>
                )}
              </div>
              {active && <Check className="size-4 ml-auto text-[#F5A623]" aria-hidden />}
            </DropdownMenuItem>
          );
        })}
        {selectedProfile === null && selected.activeProfileId && (
          <p className="px-2 pt-1 pb-2 text-[10px] text-white/40">
            Assigned profile unavailable.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

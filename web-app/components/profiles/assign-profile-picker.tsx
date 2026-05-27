"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

import { ApiError, assignProfileToDevice, unassignProfileFromDevice } from "@/lib/api";
import type { Device } from "@/lib/api";
import type { FlowerProfile } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DeviceProfilePickerProps {
  device: Device;
  profiles: FlowerProfile[];
}

const NONE_VALUE = "__none__";

export function DeviceProfilePicker({ device, profiles }: DeviceProfilePickerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleChange(value: string) {
    setError(null);
    try {
      if (value === NONE_VALUE) {
        if (device.activeProfileId) await unassignProfileFromDevice(device.deviceId);
      } else {
        await assignProfileToDevice(device.deviceId, value);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile");
    }
  }

  const current = device.activeProfileId ?? NONE_VALUE;
  const currentProfile = profiles.find((p) => p._id === device.activeProfileId);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Select value={current} onValueChange={handleChange} disabled={pending}>
          <SelectTrigger className="bg-transparent border-card-foreground/20 text-card-foreground w-full max-w-xs">
            <SelectValue placeholder="No profile assigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>No profile</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.flowerName}
                {!p.isOwner ? " (community)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentProfile && !currentProfile.isOwner && (
          <span className="text-[11px] text-card-foreground/50">community</span>
        )}
        {device.activeProfileId && !currentProfile && (
          <span className="text-[11px] text-card-foreground/50">unavailable</span>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <X className="size-3" /> {error}
        </p>
      )}
    </div>
  );
}

interface AssignToDevicePickerProps {
  profile: FlowerProfile;
  devices: Device[];
}

export function AssignToDevicePicker({ profile, devices }: AssignToDevicePickerProps) {
  const router = useRouter();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!selectedDeviceId) return;
    setSaving(true);
    setError(null);
    setDone(false);
    try {
      await assignProfileToDevice(selectedDeviceId, profile._id);
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign");
    } finally {
      setSaving(false);
    }
  }

  if (devices.length === 0) {
    return (
      <p className="text-sm text-card-foreground/60">
        Add a device first to assign this profile.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
          <SelectTrigger className="bg-transparent border-card-foreground/20 text-card-foreground w-full max-w-xs">
            <SelectValue placeholder="Pick a device" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((d) => (
              <SelectItem key={d.deviceId} value={d.deviceId}>
                {d.name}
                {d.activeProfileId === profile._id ? " (already assigned)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          onClick={handleAssign}
          disabled={!selectedDeviceId || saving}
          className="bg-[#F5A623] hover:bg-[#e8941a] text-black font-bold"
        >
          {saving ? "Assigning…" : "Assign"}
        </Button>
      </div>
      {done && (
        <p className="text-xs text-green-500 flex items-center gap-1">
          <Check className="size-3" /> Profile assigned.
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

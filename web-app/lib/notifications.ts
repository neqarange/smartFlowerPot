import type { FlowerProfile, Notification, SensorReading } from "./types";
import type { Device } from "./api";
import { okBandFor, statusForWithProfile } from "./sensor-thresholds";
import type { NumericField } from "./sensor-thresholds";

const FIELD_META: Record<NumericField, { label: string; unit: string; adjLow: string; adjHigh: string }> = {
  airTemp:      { label: "temperature",  unit: "°C", adjLow: "too cold",     adjHigh: "too hot" },
  airMoisture:  { label: "air moisture", unit: "%",  adjLow: "too dry",      adjHigh: "too humid" },
  soilMoisture: { label: "soil",         unit: "%",  adjLow: "too dry",      adjHigh: "overwatered" },
  light:        { label: "light",        unit: " lx",adjLow: "too dark",     adjHigh: "too bright" },
  uvIndex:      { label: "UV index",     unit: "",   adjLow: "very low",     adjHigh: "too high" },
};

const FIELDS: NumericField[] = ["soilMoisture", "airTemp", "airMoisture", "light", "uvIndex"];

function buildMessage(
  field: NumericField,
  value: number,
  deviceName: string,
  profile?: FlowerProfile | null,
): string {
  const { label, unit, adjLow, adjHigh } = FIELD_META[field];
  const okBand = okBandFor(field, profile);
  const adj = value < okBand[0] ? adjLow : adjHigh;
  return `${deviceName} ${label} is ${adj} (${Math.round(value)}${unit})`;
}

export function deriveNotifications(
  devices: Device[],
  readingsByDevice: Record<string, SensorReading[]>,
  profilesByDevice: Record<string, FlowerProfile | null> = {},
): Notification[] {
  const results: Notification[] = [];
  for (const device of devices) {
    const readings = readingsByDevice[device.deviceId] ?? [];
    if (readings.length === 0) continue;
    const latest = readings[0];
    const profile = profilesByDevice[device.deviceId] ?? null;
    for (const field of FIELDS) {
      if (statusForWithProfile(field, latest[field], profile) === "ok") continue;
      results.push({
        id: `${device.deviceId}-${field}`,
        message: buildMessage(field, latest[field], device.name, profile),
        timestamp: latest.createdAt,
        read: false,
      });
    }
  }
  return results;
}

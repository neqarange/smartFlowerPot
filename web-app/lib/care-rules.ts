import { okBandFor, statusForWithProfile } from "./sensor-thresholds";
import type { NumericField } from "./sensor-thresholds";
import type { FlowerProfile, MetricStatus, SensorReading } from "./types";

type CareField = Extract<NumericField, "soilMoisture" | "airTemp" | "light">;

const CARE_FIELDS: CareField[] = ["soilMoisture", "airTemp", "light"];

const SEVERITY: Record<MetricStatus, number> = {
  ok: 0,
  nodata: 1,
  warn: 2,
  error: 3,
};

const MESSAGES: Record<CareField, Record<"warn" | "error", { low: string; high: string }>> = {
  soilMoisture: {
    warn: {
      low: "Soil is getting dry — water within 2 hrs.",
      high: "Soil is a bit wet — hold off on watering.",
    },
    error: {
      low: "Soil is bone dry — water now.",
      high: "Soil is waterlogged — let it drain.",
    },
  },
  airTemp: {
    warn: {
      low: "A little cool — move away from drafts.",
      high: "A little warm — keep an eye on it.",
    },
    error: {
      low: "Too cold — move somewhere warmer.",
      high: "Too hot — move out of direct sun.",
    },
  },
  light: {
    warn: {
      low: "Light is low — move closer to a window.",
      high: "Light is intense — consider partial shade.",
    },
    error: {
      low: "Not enough light — move into brighter spot.",
      high: "Way too bright — move out of direct sun.",
    },
  },
};

export type CareSuggestionResult = {
  status: MetricStatus;
  message: string;
};

export function deriveCareSuggestion(
  reading: SensorReading | undefined,
  profile?: FlowerProfile | null,
): CareSuggestionResult {
  if (!reading) {
    return { status: "nodata", message: "Waiting for the first reading…" };
  }

  let worst: { field: CareField; status: MetricStatus; value: number } | null = null;
  for (const field of CARE_FIELDS) {
    const value = reading[field];
    const status = statusForWithProfile(field, value, profile);
    if (!worst || SEVERITY[status] > SEVERITY[worst.status]) {
      worst = { field, status, value };
    }
  }

  if (!worst || worst.status === "ok" || worst.status === "nodata") {
    return { status: "ok", message: "Looking great — no action needed." };
  }

  const tone = worst.status === "error" ? "error" : "warn";
  const okBand = okBandFor(worst.field, profile);
  const direction = worst.value < okBand[0] ? "low" : "high";

  return {
    status: worst.status,
    message: MESSAGES[worst.field][tone][direction],
  };
}

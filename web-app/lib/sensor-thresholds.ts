import type { FlowerProfile, MetricStatus, ThresholdRange } from "./types";

type NumericField = "airTemp" | "airMoisture" | "light" | "uvIndex" | "soilMoisture";

const THRESHOLDS: Record<NumericField, ThresholdRange> = {
  airTemp:      { ok: [18, 28],     warn: [12, 33] },
  airMoisture:  { ok: [40, 70],     warn: [30, 80] },
  soilMoisture: { ok: [40, 70],     warn: [25, 80] },
  light:        { ok: [200, 80000], warn: [50, 100000] },
  uvIndex:      { ok: [0, 6],       warn: [0, 8] },
};

const PROFILE_FIELDS = {
  airTemp: "temp",
  airMoisture: "humidity",
  light: "light",
} as const;

type ProfileField = keyof typeof PROFILE_FIELDS;

function rangeFor(field: NumericField, profile?: FlowerProfile | null): ThresholdRange {
  if (profile && field in PROFILE_FIELDS) {
    return profile[PROFILE_FIELDS[field as ProfileField]];
  }
  return THRESHOLDS[field];
}

function classify(value: number, range: ThresholdRange): MetricStatus {
  if (value >= range.ok[0] && value <= range.ok[1]) return "ok";
  if (value >= range.warn[0] && value <= range.warn[1]) return "warn";
  return "error";
}

export function statusFor(field: NumericField, value: number): MetricStatus {
  return classify(value, THRESHOLDS[field]);
}

export function statusForWithProfile(
  field: NumericField,
  value: number,
  profile?: FlowerProfile | null,
): MetricStatus {
  return classify(value, rangeFor(field, profile));
}

export function okBandFor(field: NumericField, profile?: FlowerProfile | null): [number, number] {
  return rangeFor(field, profile).ok;
}

export { THRESHOLDS };
export type { NumericField };

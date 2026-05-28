import type { FlowerProfile, HistoryRow, Metric, Reading, SensorReading } from "./types";
import { statusForWithProfile } from "./sensor-thresholds";
import type { NumericField } from "./sensor-thresholds";
import { formatInAppTZ, formatYmd, toAppZonedDate } from "./date-utils";

export function latestMetric(
  readings: SensorReading[],
  field: NumericField,
  unit: string,
  profile?: FlowerProfile | null,
): Metric {
  if (readings.length === 0) return { value: 0, unit, status: "nodata" };
  const value = Math.round(readings[0][field]);
  return { value, unit, status: statusForWithProfile(field, readings[0][field], profile) };
}

export function aggregateByHour(
  readings: SensorReading[],
  field: NumericField,
  { startHour = 9, endHour = 20, date }: { startHour?: number; endHour?: number; date?: Date } = {},
): Reading[] {
  const anchor = date ?? new Date();
  const anchorYmd = formatYmd(anchor);
  const buckets = new Map<number, number[]>();

  for (const r of readings) {
    if (formatYmd(r.createdAt) !== anchorYmd) continue;
    const h = toAppZonedDate(r.createdAt).getHours();
    if (h < startHour || h > endHour) continue;
    if (!buckets.has(h)) buckets.set(h, []);
    buckets.get(h)!.push(r[field]);
  }

  const result: Reading[] = [];
  for (let h = startHour; h <= endHour; h++) {
    const vals = buckets.get(h);
    const value =
      vals && vals.length > 0
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0;
    result.push({ t: `${h}:00`, value });
  }
  return result;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dayIndex(d: Date): number {
  return d.getDay() === 0 ? 6 : d.getDay() - 1;
}

export function aggregateByDayOfWeek(readings: SensorReading[], field: NumericField): Reading[] {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const buckets = new Map<number, number[]>();

  for (const r of readings) {
    const createdAt = new Date(r.createdAt);
    if (createdAt < cutoff) continue;
    const idx = dayIndex(toAppZonedDate(createdAt));
    if (!buckets.has(idx)) buckets.set(idx, []);
    buckets.get(idx)!.push(r[field]);
  }

  return DAYS.map((t, i) => {
    const vals = buckets.get(i);
    const value =
      vals && vals.length > 0
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0;
    return { t, value };
  });
}

export function aggregateByDayOfMonth(readings: SensorReading[], field: NumericField): Reading[] {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const buckets = new Map<string, number[]>();

  for (const r of readings) {
    const createdAt = new Date(r.createdAt);
    if (createdAt < cutoff) continue;
    const key = formatInAppTZ(createdAt, "MM-dd");
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(r[field]);
  }

  const todayZoned = toAppZonedDate(new Date());
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(todayZoned);
    d.setDate(todayZoned.getDate() - (29 - i));
    const t = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const vals = buckets.get(t);
    const value = vals && vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    return { t, value };
  });
}

export function toHistoryRows(readings: SensorReading[], limit = 24, date?: Date): HistoryRow[] {
  const rows = date
    ? readings.filter((r) => formatYmd(r.createdAt) === formatYmd(date))
    : readings;

  return rows.slice(0, limit).map((r) => ({
    time: formatInAppTZ(r.createdAt, "HH:mm"),
    temperature: Math.round(r.airTemp),
    humidity: Math.round(r.soilMoisture),
    light: Math.round(r.light),
  }));
}

import "server-only";
import { getToken } from "./auth-server";
import type { Device } from "./api";
import type { FlowerProfile, SensorReading } from "./types";

const BASE = process.env.API_BASE_URL!;

async function authedGet<T>(path: string): Promise<T | null> {
  const token = await getToken();
  if (!token) return null;
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function getDevicesServer(): Promise<Device[]> {
  const data = await authedGet<{ devices: Device[] }>("/api/users/devices");
  return data?.devices ?? [];
}

export async function getReadingsServer(deviceId: string): Promise<SensorReading[]> {
  const data = await authedGet<{ readings: SensorReading[] }>(
    `/api/iot/readings?deviceId=${encodeURIComponent(deviceId)}`,
  );
  return data?.readings ?? [];
}

export async function getProfilesServer(): Promise<FlowerProfile[]> {
  const data = await authedGet<{ profiles: FlowerProfile[] }>("/api/profiles");
  return data?.profiles ?? [];
}

export async function getProfileByIdServer(id: string): Promise<FlowerProfile | null> {
  const data = await authedGet<{ profile: FlowerProfile }>(`/api/profiles/${id}`);
  return data?.profile ?? null;
}

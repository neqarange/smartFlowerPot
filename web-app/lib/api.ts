import type { FlowerProfile, ThresholdRange } from "./types";

export type Device = {
  deviceId: string;
  name: string;
  token: string;
  activeProfileId?: string;
};

export type ProfileInput = {
  flowerName: string;
  public: boolean;
  temp: ThresholdRange;
  humidity: ThresholdRange;
  light: ThresholdRange;
};

export type AuthResponse = {
  token: string;
  expiresIn: number;
};

export type DevicesResponse = {
  devices: Device[];
};

export type RegenerateResponse = {
  deviceId: string;
  name: string;
  token: string;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? "Something went wrong");
  }

  return data as T;
}

export function login(email: string, password: string) {
  return apiFetch<{ ok: true }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signup(values: {
  username: string;
  email: string;
  name: string;
  surname: string;
  password: string;
}) {
  return apiFetch<{ ok: true }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function logout() {
  return apiFetch<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

export function getDevices() {
  return apiFetch<DevicesResponse>("/api/proxy/users/devices");
}

export function addDevice(name: string, pairingCode: string) {
  return apiFetch<DevicesResponse>("/api/proxy/users/devices", {
    method: "POST",
    body: JSON.stringify({ name, pairingCode }),
  });
}

export function regenerateDeviceToken(deviceId: string) {
  return apiFetch<RegenerateResponse>(`/api/proxy/users/devices/${deviceId}/regenerate-token`, {
    method: "POST",
  });
}

export function listProfiles() {
  return apiFetch<{ profiles: FlowerProfile[] }>("/api/proxy/profiles");
}

export function getProfile(id: string) {
  return apiFetch<{ profile: FlowerProfile }>(`/api/proxy/profiles/${id}`);
}

export function createProfile(body: ProfileInput) {
  return apiFetch<{ profile: FlowerProfile }>("/api/proxy/profiles", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateProfile(id: string, body: ProfileInput) {
  return apiFetch<{ profile: FlowerProfile }>(`/api/proxy/profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteProfile(id: string) {
  return apiFetch<{ ok: true }>(`/api/proxy/profiles/${id}`, { method: "DELETE" });
}

export function assignProfileToDevice(deviceId: string, profileId: string) {
  return apiFetch<{ ok: true }>(`/api/proxy/users/devices/${deviceId}/profile`, {
    method: "PUT",
    body: JSON.stringify({ profileId }),
  });
}

export function unassignProfileFromDevice(deviceId: string) {
  return apiFetch<{ ok: true }>(`/api/proxy/users/devices/${deviceId}/profile`, {
    method: "DELETE",
  });
}

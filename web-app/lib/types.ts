export type Reading = { t: string; value: number };

export type MetricStatus = "ok" | "warn" | "error" | "nodata";

export type Metric = {
  value: number;
  unit: string;
  status: MetricStatus;
};

export type HistoryRow = {
  time: string;
  temperature: number;
  humidity: number;
  light: number;
};

export type Notification = {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export type SensorReading = {
  _id: string;
  deviceId: string;
  airTemp: number;
  airMoisture: number;
  light: number;
  uvIndex: number;
  soilMoisture: number;
  createdAt: string;
};

export type ThresholdRange = { ok: [number, number]; warn: [number, number] };

export type FlowerProfile = {
  _id: string;
  flowerName: string;
  userId: string;
  public: boolean;
  light: ThresholdRange;
  humidity: ThresholdRange;
  temp: ThresholdRange;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
};

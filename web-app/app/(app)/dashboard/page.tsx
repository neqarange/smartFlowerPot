import { CalendarDays } from "lucide-react";
import { HeroCard } from "@/components/hero-card";
import { MetricCard } from "@/components/metric-card";
import { TabbedTrendChart, type TrendKey } from "@/components/charts/tabbed-trend-chart";
import { PageHeading } from "@/components/page-heading";
import {
  getDevicesServer,
  getProfileByIdServer,
  getReadingsServer,
} from "@/lib/api-server";
import { latestMetric, aggregateByHour } from "@/lib/aggregations";
import { deriveCareSuggestion } from "@/lib/care-rules";
import { formatInAppTZ } from "@/lib/date-utils";

function resolveTrend(raw: string | undefined): TrendKey {
  if (raw === "soil" || raw === "temp" || raw === "light") return raw;
  return "soil";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ device?: string; trend?: string }>;
}) {
  const resolved = await searchParams;
  const trend = resolveTrend(resolved.trend);

  const devices = await getDevicesServer();

  if (devices.length === 0) {
    return (
      <>
        <PageHeading title="Dashboard" subtitle="Live plant overview" />
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-white/60">
          <p className="text-base">No device linked yet.</p>
          <a href="/devices" className="text-sm underline text-white/80">Add a device →</a>
        </div>
      </>
    );
  }

  const selectedDevice =
    devices.find((d) => d.deviceId === resolved.device) ?? devices[0];

  const [readings, profile] = await Promise.all([
    getReadingsServer(selectedDevice.deviceId),
    selectedDevice.activeProfileId
      ? getProfileByIdServer(selectedDevice.activeProfileId)
      : Promise.resolve(null),
  ]);

  const soilMetric = latestMetric(readings, "soilMoisture", "%");
  const tempMetric = latestMetric(readings, "airTemp", "°C", profile);
  const lightMetric = latestMetric(readings, "light", "lx", profile);

  const soilHourly = aggregateByHour(readings, "soilMoisture");
  const tempHourly = aggregateByHour(readings, "airTemp");
  const lightHourly = aggregateByHour(readings, "light");

  const datasets = {
    soil: soilHourly,
    temp: tempHourly,
    light: lightHourly,
  };

  const suggestion = deriveCareSuggestion(readings[0], profile);

  const todayLabel = formatInAppTZ(new Date(), "EEEE, d MMMM");

  return (
    <>
      <PageHeading title="Dashboard" subtitle="Live plant overview" />
      <div className="flex flex-col gap-6">
        <HeroCard
          device={selectedDevice}
          devices={devices}
          status={suggestion.status}
          suggestion={suggestion}
          profile={profile}
        />

        <div className="flex items-center justify-between gap-3 -mb-2 px-1">
          <div className="flex items-center gap-2 text-white/80">
            <CalendarDays className="size-4" aria-hidden />
            <span className="text-sm font-semibold">
              Today <span className="text-white/50 font-medium">· {todayLabel}</span>
            </span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
            Latest readings
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            label="Soil moisture"
            value={soilMetric.value}
            unit={soilMetric.unit}
            status={soilMetric.status}
            sparkline={soilHourly}
          />
          <MetricCard
            label="Temperature"
            value={tempMetric.value}
            unit={tempMetric.unit}
            status={tempMetric.status}
            sparkline={tempHourly}
          />
          <MetricCard
            label="Light"
            value={lightMetric.value}
            unit={lightMetric.unit}
            status={lightMetric.status}
            sparkline={lightHourly}
          />
        </div>

        <TabbedTrendChart active={trend} datasets={datasets} searchParams={resolved} />
      </div>
    </>
  );
}

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChartInner } from "@/components/charts/area-chart-card";
import { cn } from "@/lib/utils";
import type { Reading } from "@/lib/types";

export type TrendKey = "soil" | "temp" | "light";

interface TabConfig {
  key: TrendKey;
  label: string;
  unit: string;
}

const TABS: TabConfig[] = [
  { key: "soil", label: "Soil", unit: "%" },
  { key: "temp", label: "Temperature", unit: "°C" },
  { key: "light", label: "Light", unit: " lx" },
];

interface TabbedTrendChartProps {
  active: TrendKey;
  datasets: Record<TrendKey, Reading[]>;
  searchParams: Record<string, string | undefined>;
}

function buildHref(
  searchParams: Record<string, string | undefined>,
  trend: TrendKey,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v != null) params.set(k, v);
  }
  params.set("trend", trend);
  return `?${params.toString()}`;
}

export function TabbedTrendChart({ active, datasets, searchParams }: TabbedTrendChartProps) {
  const activeTab = TABS.find((t) => t.key === active) ?? TABS[0];
  return (
    <Card className="bg-card text-card-foreground rounded-2xl h-full">
      <CardHeader className="flex flex-col gap-3 px-5 pt-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base font-black">Today&apos;s trend</CardTitle>
        </div>
        <div
          role="tablist"
          aria-label="Trend metric"
          className="inline-flex items-center rounded-full bg-gray-100 p-0.5 border border-gray-200"
        >
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab.key;
            return (
              <Link
                key={tab.key}
                href={buildHref(searchParams, tab.key)}
                role="tab"
                aria-selected={isActive}
                scroll={false}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-[#F5A623] text-black shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <AreaChartInner
          key={activeTab.key}
          data={datasets[activeTab.key]}
          unit={activeTab.unit}
          label={`${activeTab.label} trend`}
        />
      </CardContent>
    </Card>
  );
}

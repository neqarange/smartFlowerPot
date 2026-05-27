"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { getDefaultClassNames } from "react-day-picker";

interface HistoryCalendarProps {
  activeDates?: string[];
  selected?: Date;
  onSelect: (day: Date | undefined) => void;
}

function formatYmd(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function HistoryCalendar({
  activeDates = [],
  selected,
  onSelect,
}: HistoryCalendarProps) {
  const defaults = getDefaultClassNames();
  const activeDateSet = useMemo(() => new Set(activeDates), [activeDates]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        className="p-0 w-full"
        classNames={{
          root: cn("w-full", defaults.root),
          months: cn("w-full relative flex flex-col gap-4", defaults.months),
          month: cn("w-full flex flex-col gap-4", defaults.month),
          caption_label: cn("font-semibold text-sm text-white", defaults.caption_label),
          weekday: cn("flex-1 text-[11px] font-medium text-white/55 select-none", defaults.weekday),
          button_previous: cn(
            "size-7 inline-flex items-center justify-center rounded-md text-white/80 hover:bg-white/10 transition-colors",
            defaults.button_previous,
          ),
          button_next: cn(
            "size-7 inline-flex items-center justify-center rounded-md text-white/80 hover:bg-white/10 transition-colors",
            defaults.button_next,
          ),
          day: "relative h-10 px-1 text-center select-none flex-1",
          today: "",
          selected: "",
        }}
        components={{
          DayButton: ({ day, modifiers, children, ...props }) => {
            const key = formatYmd(day.date);
            const hasData = activeDateSet.has(key);

            return (
              <button
                {...props}
                className={cn(
                  "relative w-full h-full flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ease-out cursor-pointer",
                  modifiers.selected &&
                    "bg-[#F5A623] text-black font-extrabold ring-2 ring-[#F5A623]/40 ring-offset-1 ring-offset-popover scale-[1.06]",
                  modifiers.today &&
                    !modifiers.selected &&
                    "bg-white/10 text-white font-bold",
                  !modifiers.selected &&
                    !modifiers.today &&
                    "text-white/90 hover:bg-white/10",
                  modifiers.outside && "text-white/30 hover:bg-transparent",
                )}
              >
                {children}
                {hasData && (
                  <span
                    className={cn(
                      "absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full",
                      modifiers.selected ? "bg-black/80" : "bg-amber-400",
                    )}
                  />
                )}
              </button>
            );
          },
        }}
      />
      {activeDates.length > 0 && (
        <p className="text-center text-[11px] text-white/55 pb-1">
          <span className="inline-block size-1.5 rounded-full bg-amber-400 mr-1.5 align-middle" />
          days with readings
        </p>
      )}
    </div>
  );
}

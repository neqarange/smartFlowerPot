"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HistoryCalendar } from "@/components/history/history-calendar";
import { cn } from "@/lib/utils";

interface HistoryDatePickerProps {
  selected?: Date;
  activeDates: string[];
}

function formatYmd(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function HistoryDatePicker({ selected, activeDates }: HistoryDatePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function handleSelect(day: Date | undefined) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (!day) {
      params.delete("date");
    } else {
      const ymd = formatYmd(day);
      if (selected && formatYmd(selected) === ymd) {
        params.delete("date");
      } else {
        params.set("date", ymd);
      }
    }

    const qs = params.toString();
    router.push(qs ? `/history?${qs}` : "/history");
    setOpen(false);
  }

  const label = selected ? `Showing ${formatLabel(selected)}` : "Showing today";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={selected ? `Change date — currently ${label}` : "Showing today — pick a different date"}
        className={cn(
          "group mt-1 inline-flex items-center gap-2 rounded-full",
          "bg-white/10 hover:bg-white/15 active:scale-[0.97]",
          "border border-white/15 ring-1 ring-[#F5A623]/40",
          "pl-2.5 pr-2.5 py-1 text-xs font-semibold text-white shadow-sm cursor-pointer",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]",
          "data-[state=open]:bg-white/15 data-[state=open]:ring-[#F5A623]",
        )}
      >
        <CalendarIcon className="size-3.5 text-[#F5A623]" aria-hidden />
        <span className="max-w-[14rem] truncate">{label}</span>
        <ChevronDown
          className="size-3.5 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[20rem] p-3"
      >
        <HistoryCalendar
          activeDates={activeDates}
          selected={selected}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}

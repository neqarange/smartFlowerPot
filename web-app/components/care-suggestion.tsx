import { Droplets, Sparkles, Sun, ThermometerSun } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CareSuggestionResult } from "@/lib/care-rules";

interface CareSuggestionProps {
  suggestion: CareSuggestionResult;
  className?: string;
}

const toneClass: Record<CareSuggestionResult["status"], string> = {
  ok: "text-card-foreground/80",
  warn: "text-[#8a5a00]",
  error: "text-red-700",
  nodata: "text-card-foreground/50",
};

function renderIcon(message: string) {
  const iconClass = "size-4 shrink-0";
  if (/water|soil|dry|wet|drain/i.test(message)) return <Droplets className={iconClass} aria-hidden />;
  if (/hot|cold|warm|cool/i.test(message)) return <ThermometerSun className={iconClass} aria-hidden />;
  if (/light|sun|shade|bright|window/i.test(message)) return <Sun className={iconClass} aria-hidden />;
  return <Sparkles className={iconClass} aria-hidden />;
}

export function CareSuggestion({ suggestion, className }: CareSuggestionProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-sm font-semibold leading-snug",
        toneClass[suggestion.status],
        className,
      )}
    >
      {renderIcon(suggestion.message)}
      <span>{suggestion.message}</span>
    </div>
  );
}

"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { ProfileFormInput } from "@/lib/schemas";

type RangeField = "temp" | "humidity" | "light";

interface ThresholdRangeInputProps {
  name: RangeField;
  label: string;
  unit: string;
  description?: string;
  step?: string;
}

const SUB_FIELDS = [
  { key: "warnMin", label: "Warn min", hint: "Below this is critical" },
  { key: "okMin", label: "OK min", hint: "Start of comfort zone" },
  { key: "okMax", label: "OK max", hint: "End of comfort zone" },
  { key: "warnMax", label: "Warn max", hint: "Above this is critical" },
] as const;

export function ThresholdRangeInput({ name, label, unit, description, step }: ThresholdRangeInputProps) {
  const form = useFormContext<ProfileFormInput>();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-card-foreground/15 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-card-foreground">{label}</h3>
          {description && <p className="text-xs text-card-foreground/50">{description}</p>}
        </div>
        <span className="text-xs font-mono text-card-foreground/60">{unit}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SUB_FIELDS.map((sf) => (
          <FormField
            key={sf.key}
            control={form.control}
            name={`${name}.${sf.key}` as const}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-card-foreground text-xs">{sf.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step={step ?? "any"}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={field.onChange}
                    value={
                      field.value === undefined || field.value === null ? "" : String(field.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}

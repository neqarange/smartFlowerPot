"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { ApiError, createProfile, deleteProfile, updateProfile, type ProfileInput } from "@/lib/api";
import { profileFormSchema, type ProfileFormInput, type ProfileFormValues } from "@/lib/schemas";
import type { FlowerProfile, ThresholdRange } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThresholdRangeInput } from "./threshold-range-input";

interface ProfileFormProps {
  profile?: FlowerProfile;
}

function rangeToForm(range: ThresholdRange) {
  return {
    warnMin: range.warn[0],
    okMin: range.ok[0],
    okMax: range.ok[1],
    warnMax: range.warn[1],
  };
}

function formToRange(v: { warnMin: number; okMin: number; okMax: number; warnMax: number }): ThresholdRange {
  return { ok: [v.okMin, v.okMax], warn: [v.warnMin, v.warnMax] };
}

const DEFAULTS: ProfileFormInput = {
  flowerName: "",
  public: false,
  temp: { warnMin: 12, okMin: 18, okMax: 27, warnMax: 32 },
  humidity: { warnMin: 35, okMin: 50, okMax: 70, warnMax: 80 },
  light: { warnMin: 200, okMin: 500, okMax: 10000, warnMax: 20000 },
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profile
      ? {
          flowerName: profile.flowerName,
          public: profile.public,
          temp: rangeToForm(profile.temp),
          humidity: rangeToForm(profile.humidity),
          light: rangeToForm(profile.light),
        }
      : DEFAULTS,
  });

  async function onSubmit(values: ProfileFormValues) {
    setServerError(null);
    const body: ProfileInput = {
      flowerName: values.flowerName,
      public: values.public,
      temp: formToRange(values.temp),
      humidity: formToRange(values.humidity),
      light: formToRange(values.light),
    };
    try {
      if (profile) {
        await updateProfile(profile._id, body);
      } else {
        await createProfile(body);
      }
      router.push("/profiles");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!profile) return;
    if (!confirm(`Delete profile "${profile.flowerName}"?`)) return;
    setDeleting(true);
    try {
      await deleteProfile(profile._id);
      router.push("/profiles");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <Card className="bg-card text-card-foreground rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]">
      <CardHeader className="py-3 px-5 border-b border-card-foreground/10">
        <CardTitle className="text-sm font-bold">
          {profile ? "Edit profile" : "Profile details"}
        </CardTitle>
        <CardDescription className="text-card-foreground/50 text-xs">
          Warn min/max define the alert thresholds. OK min/max define the comfort band.
        </CardDescription>
      </CardHeader>
      <CardContent className="py-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="flowerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground">Flower name</FormLabel>
                  <FormControl>
                    <Input placeholder="Monstera deliciosa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="public"
              render={({ field }) => (
                <FormItem>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mt-1 size-4 accent-[#F5A623]"
                      />
                    </FormControl>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-card-foreground">Share publicly</span>
                      <span className="text-xs text-card-foreground/50">
                        Other users can find this profile in the community catalog and assign it to their devices.
                      </span>
                    </div>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ThresholdRangeInput
              name="temp"
              label="Temperature"
              unit="°C"
              description="Ideal air temperature range"
              step="0.1"
            />
            <ThresholdRangeInput
              name="humidity"
              label="Humidity"
              unit="%"
              description="Relative air humidity"
              step="1"
            />
            <ThresholdRangeInput
              name="light"
              label="Light"
              unit="lux"
              description="Light intensity"
              step="10"
            />

            {serverError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
            )}

            <div className="flex gap-3 justify-between pt-2 border-t border-card-foreground/10">
              {profile ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting || form.formState.isSubmitting}
                  className="rounded-xl"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-[#F5A623] hover:bg-[#e8941a] text-black font-bold rounded-xl shadow-[0_8px_24px_-12px_rgba(245,166,35,0.7)]"
              >
                {form.formState.isSubmitting ? "Saving…" : profile ? "Save changes" : "Create profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { addDevice, ApiError } from "@/lib/api";
import { addDeviceSchema, type AddDeviceValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function AddDeviceForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<AddDeviceValues>({
    resolver: zodResolver(addDeviceSchema),
    defaultValues: { name: "", pairingCode: "" },
  });

  async function onSubmit(values: AddDeviceValues) {
    setServerError(null);
    setSuccess(null);
    try {
      await addDevice(values.name, values.pairingCode);
      setSuccess(`Device "${values.name}" paired! The pot will connect automatically.`);
      form.reset();
      router.refresh();
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Add device</CardTitle>
          <CardDescription className="text-zinc-400">
            Enter the pairing code shown on your pot&apos;s setup screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-card-foreground">Device name</FormLabel>
                      <FormControl>
                        <Input placeholder="Living room pot" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pairingCode"
                  render={({ field }) => (
                    <FormItem className="w-40">
                      <FormLabel className="text-card-foreground">Pairing code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="A3B2C1"
                          className="font-mono uppercase tracking-widest text-center"
                          maxLength={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-[#F5A623] hover:bg-[#e8941a] text-black font-bold w-full"
              >
                {form.formState.isSubmitting ? "Pairing…" : "Pair device"}
              </Button>
            </form>
          </Form>

          {serverError && (
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>
          )}
        </CardContent>
      </Card>

      {success && (
        <Card className="border-green-500/40 bg-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-green-400" />
              <p className="text-sm font-medium text-green-400">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

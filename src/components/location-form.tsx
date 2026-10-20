import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, NativeSelect, TextInput } from "./ui-kit";
import { COUNTRIES, TIME_ZONES } from "@/lib/reference";
import type { LocationDraft } from "@/lib/api/types";
import type { ReactNode } from "react";

export const locationSchema = z.object({
  name: z.string().trim().min(2, "Enter a location name").max(120),
  addressLine1: z.string().trim().min(3, "Enter the street address").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter the city").max(100),
  postalCode: z.string().trim().min(3, "Enter the postal code").max(12),
  country: z.string().length(2, "Choose a country"),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9][0-9 ]{6,18}$/, "Use international format, e.g. +49 30 1234567"),
  timeZone: z.string().min(3, "Choose a time zone"),
});

export function LocationForm({
  defaultValues,
  onSubmit,
  footer,
  id = "location-form",
}: {
  defaultValues?: Partial<LocationDraft> | undefined;
  onSubmit: (v: LocationDraft) => void;
  footer?: ReactNode | undefined;
  id?: string | undefined;
}) {
  const form = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: { country: "", timeZone: "", ...defaultValues },
  });
  const e = form.formState.errors;
  const p = id;
  return (
    <form
      id={id}
      noValidate
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit((v) => onSubmit({ ...v, addressLine2: v.addressLine2 || undefined }))}
    >
      <Field className="sm:col-span-2" label="Location name" htmlFor={`${p}-name`} error={e.name?.message}>
        <TextInput id={`${p}-name`} placeholder="e.g. Trattoria Lupo — Mitte" {...form.register("name")} />
      </Field>
      <Field className="sm:col-span-2" label="Street address" htmlFor={`${p}-a1`} error={e.addressLine1?.message}>
        <TextInput id={`${p}-a1`} autoComplete="address-line1" {...form.register("addressLine1")} />
      </Field>
      <Field className="sm:col-span-2" label="Address line 2 (optional)" htmlFor={`${p}-a2`} error={e.addressLine2?.message}>
        <TextInput id={`${p}-a2`} autoComplete="address-line2" {...form.register("addressLine2")} />
      </Field>
      <Field label="City" htmlFor={`${p}-city`} error={e.city?.message}>
        <TextInput id={`${p}-city`} autoComplete="address-level2" {...form.register("city")} />
      </Field>
      <Field label="Postal code" htmlFor={`${p}-pc`} error={e.postalCode?.message}>
        <TextInput id={`${p}-pc`} autoComplete="postal-code" {...form.register("postalCode")} />
      </Field>
      <Field label="Country" htmlFor={`${p}-country`} error={e.country?.message}>
        <NativeSelect
          id={`${p}-country`}
          {...form.register("country", {
            onChange: (ev) => {
              const c = COUNTRIES.find((x) => x.code === ev.target.value);
              if (c && !form.getValues("timeZone")) form.setValue("timeZone", c.tz);
            },
          })}
        >
          <option value="">Choose…</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </NativeSelect>
      </Field>
      <Field label="Time zone" htmlFor={`${p}-tz`} error={e.timeZone?.message}>
        <NativeSelect id={`${p}-tz`} {...form.register("timeZone")}>
          <option value="">Choose…</option>
          {TIME_ZONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </NativeSelect>
      </Field>
      <Field className="sm:col-span-2" label="Phone" htmlFor={`${p}-phone`} error={e.phone?.message}>
        <TextInput id={`${p}-phone`} type="tel" autoComplete="tel" placeholder="+49 30 1234567" {...form.register("phone")} />
      </Field>
      {footer && <div className="sm:col-span-2">{footer}</div>}
    </form>
  );
}

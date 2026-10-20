import type { ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, X } from "lucide-react";
import { Field, NativeSelect, TextArea, TextInput } from "./ui-kit";
import { CURRENCIES, EXPERIENCE_CATEGORIES, WEEKDAYS } from "@/lib/reference";
import { formatMoney, toMinorUnits } from "@/lib/lifecycle";
import type { Weekday } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export const experienceSchema = z
  .object({
    title: z.string().trim().min(3, "Give it a short title").max(80),
    description: z.string().trim().min(20, "Describe the experience in at least 20 characters").max(1500),
    category: z.string().min(1, "Choose a category"),
    price: z.coerce.number({ invalid_type_error: "Enter a price" }).positive("Price must be above zero").max(10000),
    currency: z.string().length(3),
    inclusions: z.string().refine((s) => lines(s).length > 0, "List at least one inclusion"),
    exclusions: z.string(),
    venueKeys: z.array(z.string()).min(1, "Choose at least one location"),
    validityDays: z.coerce.number().int().min(30, "At least 30 days").max(1095, "At most 3 years"),
    bookingLeadHours: z.coerce.number().int().min(0).max(720),
    weekdays: z.array(z.string()).min(1, "Choose at least one day"),
    blackoutDates: z.string().refine(
      (s) => s.split(",").map((x) => x.trim()).filter(Boolean).every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
      "Use YYYY-MM-DD dates separated by commas",
    ),
    redemptionInstructions: z.string().trim().min(10, "Tell guests how to redeem").max(1000),
  });

export type ExperienceFormValues = z.infer<typeof experienceSchema>;

export interface ExperienceOutput {
  title: string;
  description: string;
  category: string;
  price: { amountMinor: number; currency: string };
  inclusions: string[];
  exclusions: string[];
  venueKeys: string[];
  validityDays: number;
  bookingLeadHours: number;
  weekdays: Weekday[];
  blackoutDates: string[];
  redemptionInstructions: string;
}

export function toOutput(v: ExperienceFormValues): ExperienceOutput {
  return {
    title: v.title,
    description: v.description,
    category: v.category,
    price: { amountMinor: toMinorUnits(v.price, v.currency), currency: v.currency },
    inclusions: lines(v.inclusions),
    exclusions: lines(v.exclusions),
    venueKeys: v.venueKeys,
    validityDays: v.validityDays,
    bookingLeadHours: v.bookingLeadHours,
    weekdays: v.weekdays as Weekday[],
    blackoutDates: v.blackoutDates.split(",").map((x) => x.trim()).filter(Boolean),
    redemptionInstructions: v.redemptionInstructions,
  };
}

export function ExperienceForm({
  id = "experience-form",
  defaultValues,
  venueOptions,
  onSubmit,
  disabled,
  footer,
}: {
  id?: string | undefined;
  defaultValues?: Partial<ExperienceFormValues> | undefined;
  venueOptions: { value: string; label: string }[];
  onSubmit: (v: ExperienceOutput) => void;
  disabled?: boolean | undefined;
  footer?: ReactNode | undefined;
}) {
  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      currency: "EUR",
      category: "",
      inclusions: "",
      exclusions: "",
      venueKeys: [],
      validityDays: 365,
      bookingLeadHours: 24,
      weekdays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
      blackoutDates: "",
      ...defaultValues,
    },
  });
  const e = form.formState.errors;
  const w = form.watch();

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <form id={id} noValidate onSubmit={form.handleSubmit((v) => onSubmit(toOutput(v)))} className="space-y-10">
        <fieldset disabled={disabled} className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">The experience</legend>
          <Field label="Title" htmlFor={`${id}-title`} error={e.title?.message}>
            <TextInput id={`${id}-title`} placeholder="Pizza for two" {...form.register("title")} />
          </Field>
          <Field label="Description" htmlFor={`${id}-desc`} error={e.description?.message}>
            <TextArea id={`${id}-desc`} {...form.register("description")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category" htmlFor={`${id}-cat`} error={e.category?.message}>
              <NativeSelect id={`${id}-cat`} {...form.register("category")}>
                <option value="">Choose…</option>
                {EXPERIENCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Price" htmlFor={`${id}-price`} error={e.price?.message}>
              <TextInput id={`${id}-price`} type="number" step="0.01" min="0" inputMode="decimal" {...form.register("price")} />
            </Field>
            <Field label="Currency" htmlFor={`${id}-cur`}>
              <NativeSelect id={`${id}-cur`} {...form.register("currency")}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </NativeSelect>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Included" htmlFor={`${id}-inc`} hint="One item per line" error={e.inclusions?.message}>
              <TextArea id={`${id}-inc`} placeholder={"2 Margherita pizzas\n2 glasses of house wine"} {...form.register("inclusions")} />
            </Field>
            <Field label="Not included" htmlFor={`${id}-exc`} hint="One item per line">
              <TextArea id={`${id}-exc`} placeholder="Service charge" {...form.register("exclusions")} />
            </Field>
          </div>
        </fieldset>

        <fieldset disabled={disabled} className="space-y-3">
          <legend className="mb-2 text-lg font-semibold">Eligible locations</legend>
          {venueOptions.length === 0 && <p className="text-sm text-muted-foreground">Add a location first.</p>}
          <Controller
            control={form.control}
            name="venueKeys"
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2">
                {venueOptions.map((o) => {
                  const on = field.value.includes(o.value);
                  return (
                    <label key={o.value} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors", on && "border-foreground bg-surface")}>
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--color-primary)]"
                        checked={on}
                        onChange={() => field.onChange(on ? field.value.filter((x) => x !== o.value) : [...field.value, o.value])}
                      />
                      {o.label}
                    </label>
                  );
                })}
              </div>
            )}
          />
          {e.venueKeys && <p className="text-sm text-destructive" role="alert">{e.venueKeys.message}</p>}
        </fieldset>

        <fieldset disabled={disabled} className="space-y-4">
          <legend className="mb-2 text-lg font-semibold">Availability & terms</legend>
          <div>
            <p className="mb-2 text-sm font-medium">Redeemable on</p>
            <Controller
              control={form.control}
              name="weekdays"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Eligible weekdays">
                  {WEEKDAYS.map((d) => {
                    const on = field.value.includes(d.value);
                    return (
                      <button
                        type="button"
                        key={d.value}
                        aria-pressed={on}
                        onClick={() => field.onChange(on ? field.value.filter((x) => x !== d.value) : [...field.value, d.value])}
                        className={cn("h-10 min-w-12 rounded-full border px-3 text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {e.weekdays && <p className="mt-1.5 text-sm text-destructive">{e.weekdays.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valid for (days after purchase)" htmlFor={`${id}-valid`} error={e.validityDays?.message}>
              <TextInput id={`${id}-valid`} type="number" {...form.register("validityDays")} />
            </Field>
            <Field label="Booking lead time (hours)" htmlFor={`${id}-lead`} error={e.bookingLeadHours?.message}>
              <TextInput id={`${id}-lead`} type="number" {...form.register("bookingLeadHours")} />
            </Field>
          </div>
          <Field label="Blackout dates" htmlFor={`${id}-black`} hint="YYYY-MM-DD, separated by commas" error={e.blackoutDates?.message}>
            <TextInput id={`${id}-black`} placeholder="2026-12-24, 2026-12-31" {...form.register("blackoutDates")} />
          </Field>
          <Field label="Redemption instructions" htmlFor={`${id}-redeem`} error={e.redemptionInstructions?.message}>
            <TextArea id={`${id}-redeem`} placeholder="Book by phone and show your voucher code on arrival." {...form.register("redemptionInstructions")} />
          </Field>
        </fieldset>
        {footer}
      </form>

      <aside aria-label="Customer preview" className="lg:sticky lg:top-24 lg:self-start">
        <p className="eyebrow mb-3">Customer preview</p>
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="aspect-[4/3] bg-surface p-6">
            <span className="rounded-full bg-background px-3 py-1 text-xs">{w.category || "Category"}</span>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold">{w.title || "Experience title"}</h3>
            <p className="mt-1 text-lg">
              {Number(w.price) > 0 ? formatMoney(toMinorUnits(Number(w.price), w.currency), w.currency) : "—"}
            </p>
            <p className="mt-3 line-clamp-4 text-sm text-muted-foreground">{w.description || "Your description will appear here."}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {lines(w.inclusions ?? "").map((l) => <li key={l} className="flex gap-2"><Check className="mt-0.5 size-4 text-success" />{l}</li>)}
              {lines(w.exclusions ?? "").map((l) => <li key={l} className="flex gap-2 text-muted-foreground"><X className="mt-0.5 size-4" />{l}</li>)}
            </ul>
            <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
              Valid {w.validityDays || "—"} days · book {w.bookingLeadHours || 0}h ahead · {w.venueKeys?.length ?? 0} location(s)
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function toFull(v: ExperienceOutput) {
  return {
    title: v.title,
    description: v.description,
    category: v.category,
    price: v.price,
    inclusions: v.inclusions,
    exclusions: v.exclusions,
    venueIds: v.venueKeys,
    availability: { weekdays: v.weekdays, blackoutDates: v.blackoutDates, bookingLeadHours: v.bookingLeadHours },
    terms: { validityDays: v.validityDays, redemptionInstructions: v.redemptionInstructions },
  };
}


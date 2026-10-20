import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Check, CheckCircle2, Clock, FileText, MapPin, Pencil, RotateCw, Trash2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/brand";
import { ApiNotConnected, ErrorState, Field, LoadingState, NativeSelect, Panel, StatusBadge, TextInput } from "@/components/ui-kit";
import { LocationForm } from "@/components/location-form";
import { ExperienceForm, type ExperienceOutput } from "@/components/experience-form";
import { useMe } from "@/components/app-shell";
import { applicationQuery, applications, type ApplicationInput } from "@/lib/api/endpoints";
import { errorMessage, isApiConfigured } from "@/lib/api/client";
import { requireUser } from "@/lib/guards";
import { applicationActions, formatMoney, merchantRoleOf } from "@/lib/lifecycle";
import { ACCEPTED_DOC_TYPES, BUSINESS_TYPES, COUNTRIES, CURRENCIES, MAX_DOC_BYTES, countryName } from "@/lib/reference";
import type { LocationDraft, MerchantApplication } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "sorteddate.applicationId";
const STEPS = ["Business details", "Verification", "Locations", "First experience", "Review"] as const;

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => {
    const n = Number(s["step"]);
    return { step: Number.isInteger(n) && n >= 1 && n <= 5 ? n : 1 };
  },
  beforeLoad: async ({ context, location }) => {
    const me = await requireUser(context.queryClient, location);
    if (me && merchantRoleOf(me.roles)) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [
      { title: "Partner application — SortedDate" },
      { name: "description", content: "Apply to sell prepaid dining experiences with SortedDate." },
      { property: "og:title", content: "Partner application — SortedDate" },
      { property: "og:description", content: "Apply to sell prepaid dining experiences with SortedDate." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { step } = Route.useSearch();
  const navigate = useNavigate({ from: "/onboarding" });
  const { data: me } = useMe();
  const [appId, setAppId] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setAppId(me?.applicationId ?? localStorage.getItem(STORAGE_KEY));
    setResolved(true);
  }, [me?.applicationId]);

  const app = useQuery({ ...applicationQuery(appId ?? ""), enabled: !!appId });
  const go = (s: number) => navigate({ search: { step: s } });
  const remember = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setAppId(id);
  };

  let body: ReactNode;
  if (!resolved || (appId && app.isLoading)) body = <LoadingState />;
  else if (appId && app.error) body = <ErrorState error={app.error} onRetry={() => app.refetch()} />;
  else if (app.data && app.data.status !== "DRAFT") body = <StatusScreen app={app.data} />;
  else {
    const a = app.data ?? null;
    body = (
      <>
        <Stepper step={step} onStep={(s) => a && go(s)} />
        <div className="mt-10">
          {step === 1 && <BusinessStep app={a} onSaved={(saved) => { remember(saved.id); go(2); }} />}
          {step > 1 && !a && <Panel><p className="text-muted-foreground">Start with your business details first.</p><Button className="mt-4" onClick={() => go(1)}>Go to step 1</Button></Panel>}
          {step === 2 && a && <DocumentsStep app={a} onNext={() => go(3)} onBack={() => go(1)} />}
          {step === 3 && a && <LocationsStep app={a} onNext={() => go(4)} onBack={() => go(2)} />}
          {step === 4 && a && <ExperienceStep app={a} onNext={() => go(5)} onBack={() => go(3)} />}
          {step === 5 && a && <ReviewStep app={a} onEdit={go} />}
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5">
          <Logo suffix="Partners" />
          <span className="text-sm text-muted-foreground">Drafts save as you go</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Partner application</h1>
        <p className="mt-1.5 text-muted-foreground">Tell us about your restaurant. You can leave and resume any time.</p>
        {!isApiConfigured() && <div className="mt-6"><ApiNotConnected /></div>}
        <div className="mt-8">{body}</div>
      </main>
    </div>
  );
}

function Stepper({ step, onStep }: { step: number; onStep: (s: number) => void }) {
  return (
    <nav aria-label="Application progress">
      <Progress value={((step - 1) / (STEPS.length - 1)) * 100} className="h-1 sm:hidden" />
      <p className="mt-2 text-sm sm:hidden">Step {step} of {STEPS.length}: {STEPS[step - 1]}</p>
      <ol className="hidden gap-2 sm:grid sm:grid-cols-5">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "current" : "todo";
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => onStep(n)}
                aria-current={state === "current" ? "step" : undefined}
                className="group w-full text-left"
              >
                <span className={cn("block h-1 rounded-full", state === "todo" ? "bg-border" : "bg-primary")} />
                <span className={cn("mt-2 flex items-center gap-1.5 text-sm", state === "todo" ? "text-muted-foreground" : "font-medium")}>
                  {state === "done" && <Check className="size-3.5" />}{label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepNav({ onBack, nextLabel = "Save and continue", pending, form, onNext }: { onBack?: () => void | undefined; nextLabel?: string | undefined; pending?: boolean | undefined; form?: string | undefined; onNext?: () => void | undefined }) {
  return (
    <div className="mt-8 flex items-center justify-between border-t pt-6">
      {onBack ? <Button type="button" variant="ghost" onClick={onBack}>Back</Button> : <span />}
      <Button type={form ? "submit" : "button"} form={form} onClick={onNext} size="lg" className="rounded-full" disabled={pending}>
        {pending ? "Saving…" : nextLabel}
      </Button>
    </div>
  );
}

function useSaveApp(app: MerchantApplication | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApplicationInput) => (app ? applications.update(app.id, body) : applications.create(body)),
    onSuccess: (saved) => qc.setQueryData(["application", saved.id], saved),
  });
}

// ---------- Step 1 ----------
const businessSchema = z.object({
  legalName: z.string().trim().min(2, "Enter the registered legal name").max(200),
  tradingName: z.string().trim().max(200).optional(),
  country: z.string().length(2, "Choose a country"),
  registrationNumber: z.string().trim().min(3, "Enter the registration number").max(50),
  taxId: z.string().trim().max(50).optional(),
  defaultCurrency: z.string().length(3, "Choose a currency"),
  businessType: z.string().optional(),
});

function BusinessStep({ app, onSaved }: { app: MerchantApplication | null; onSaved: (a: MerchantApplication) => void }) {
  const save = useSaveApp(app);
  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      legalName: app?.legalName ?? "",
      tradingName: app?.tradingName ?? "",
      country: app?.country ?? "",
      registrationNumber: app?.registrationNumber ?? "",
      taxId: app?.taxId ?? "",
      defaultCurrency: app?.defaultCurrency ?? "EUR",
      businessType: app?.businessType ?? "",
    },
  });
  const e = form.formState.errors;
  return (
    <Panel className="p-8">
      <h2 className="text-xl font-semibold">Business details</h2>
      <p className="mt-1 text-sm text-muted-foreground">As shown on your company registration.</p>
      <form id="business" noValidate className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => save.mutate(v, { onSuccess: onSaved }))}>
        <Field label="Legal business name" htmlFor="legalName" error={e.legalName?.message}><TextInput id="legalName" {...form.register("legalName")} /></Field>
        <Field label="Trading name" htmlFor="tradingName" hint="The name guests know you by"><TextInput id="tradingName" {...form.register("tradingName")} /></Field>
        <Field label="Country" htmlFor="country" error={e.country?.message}>
          <NativeSelect id="country" {...form.register("country", { onChange: (ev) => { const c = COUNTRIES.find((x) => x.code === ev.target.value); if (c) form.setValue("defaultCurrency", c.currency); } })}>
            <option value="">Choose…</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Default currency" htmlFor="defaultCurrency" error={e.defaultCurrency?.message}>
          <NativeSelect id="defaultCurrency" {...form.register("defaultCurrency")}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</NativeSelect>
        </Field>
        <Field label="Business registration number" htmlFor="registrationNumber" error={e.registrationNumber?.message}><TextInput id="registrationNumber" {...form.register("registrationNumber")} /></Field>
        <Field label="Tax ID (where applicable)" htmlFor="taxId" hint="e.g. VAT number"><TextInput id="taxId" {...form.register("taxId")} /></Field>
        <Field label="Business type" htmlFor="businessType">
          <NativeSelect id="businessType" {...form.register("businessType")}>
            <option value="">Not specified</option>
            {BUSINESS_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </NativeSelect>
        </Field>
      </form>
      {save.error && <p className="mt-4 text-sm text-destructive" role="alert">{errorMessage(save.error)}</p>}
      <StepNav form="business" pending={save.isPending} />
    </Panel>
  );
}

// ---------- Step 2 ----------
interface PendingUpload { key: string; file: File; progress: number; error?: string | undefined }

function DocumentsStep({ app, onNext, onBack }: { app: MerchantApplication; onNext: () => void; onBack: () => void }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("COMPANY_REGISTRATION");
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [rejectMsg, setRejectMsg] = useState<string | null>(null);

  const patch = (key: string, p: Partial<PendingUpload>) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, ...p } : x)));

  async function start(u: PendingUpload) {
    patch(u.key, { progress: 0, error: undefined });
    try {
      await applications.uploadDocument(app.id, u.file, docType, (p) => patch(u.key, { progress: p }));
      setUploads((all) => all.filter((x) => x.key !== u.key));
      qc.invalidateQueries({ queryKey: ["application", app.id] });
      toast.success(`${u.file.name} uploaded`);
    } catch (err) {
      patch(u.key, { error: errorMessage(err) });
    }
  }

  function onFiles(files: FileList | null) {
    setRejectMsg(null);
    for (const file of Array.from(files ?? [])) {
      if (!ACCEPTED_DOC_TYPES.includes(file.type)) { setRejectMsg(`${file.name}: only PDF, JPG or PNG files are accepted.`); continue; }
      if (file.size > MAX_DOC_BYTES) { setRejectMsg(`${file.name}: files must be 10 MB or smaller.`); continue; }
      const u = { key: `${file.name}-${file.size}-${file.lastModified}`, file, progress: 0 };
      setUploads((all) => [...all, u]);
      void start(u);
    }
    if (input.current) input.current.value = "";
  }

  const docs = app.documents ?? [];
  return (
    <Panel className="p-8">
      <h2 className="text-xl font-semibold">Business verification</h2>
      <p className="mt-1 text-sm text-muted-foreground">Upload your company registration and proof of address. PDF, JPG or PNG up to 10 MB.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-[220px_1fr]">
        <Field label="Document type" htmlFor="docType">
          <NativeSelect id="docType" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="COMPANY_REGISTRATION">Company registration</option>
            <option value="PROOF_OF_ADDRESS">Proof of address</option>
            <option value="TAX_CERTIFICATE">Tax certificate</option>
            <option value="ID_DOCUMENT">Representative ID</option>
            <option value="OTHER">Other</option>
          </NativeSelect>
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
            className="flex h-[2.875rem] w-full items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <Upload className="size-4" /> Choose files or drop them here
          </button>
          <input ref={input} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => onFiles(e.target.files)} aria-label="Upload documents" />
        </div>
      </div>
      {rejectMsg && <p className="mt-3 text-sm text-destructive" role="alert">{rejectMsg}</p>}
      <ul className="mt-6 space-y-2">
        {uploads.map((u) => (
          <li key={u.key} className="rounded-xl border px-4 py-3">
            <div className="flex items-center gap-3 text-sm">
              <FileText className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{u.file.name}</span>
              {u.error ? (
                <>
                  <span className="text-destructive">Failed</span>
                  <Button size="sm" variant="outline" onClick={() => start(u)}><RotateCw className="size-3.5" /> Retry</Button>
                  <Button size="icon" variant="ghost" aria-label="Discard" onClick={() => setUploads((a) => a.filter((x) => x.key !== u.key))}><Trash2 className="size-4" /></Button>
                </>
              ) : <span className="tabular-nums text-muted-foreground">{u.progress}%</span>}
            </div>
            {u.error ? <p className="mt-1 text-xs text-destructive">{u.error}</p> : <Progress value={u.progress} className="mt-2 h-1" />}
          </li>
        ))}
        {docs.map((d) => (
          <li key={d.id} className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            <span className="flex-1 truncate">{d.fileName}</span>
            <span className="hidden text-muted-foreground sm:inline">{(d.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
            <StatusBadge status={d.verificationStatus ?? "PENDING"} />
          </li>
        ))}
        {docs.length === 0 && uploads.length === 0 && <li className="rounded-xl bg-surface px-4 py-6 text-center text-sm text-muted-foreground">No documents uploaded yet.</li>}
      </ul>
      <StepNav onBack={onBack} onNext={onNext} nextLabel="Continue" />
    </Panel>
  );
}

// ---------- Step 3 ----------
function LocationsStep({ app, onNext, onBack }: { app: MerchantApplication; onNext: () => void; onBack: () => void }) {
  const save = useSaveApp(app);
  const [list, setList] = useState<LocationDraft[]>(app.locations ?? []);
  const [editing, setEditing] = useState<number | "new" | null>(list.length === 0 ? "new" : null);

  const persist = (next: LocationDraft[], after?: () => void) =>
    save.mutate({ locations: next }, { onSuccess: () => { setList(next); after?.(); } });

  return (
    <Panel className="p-8">
      <h2 className="text-xl font-semibold">Restaurant locations</h2>
      <p className="mt-1 text-sm text-muted-foreground">Add each place guests can redeem experiences.</p>
      <ul className="mt-6 space-y-2">
        {list.map((l, i) => (
          <li key={`${l.name}-${i}`} className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm">
            <MapPin className="size-4 text-muted-foreground" />
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{l.name}</p><p className="truncate text-muted-foreground">{l.addressLine1}, {l.city}, {countryName(l.country)}</p></div>
            <Button size="icon" variant="ghost" aria-label={`Edit ${l.name}`} onClick={() => setEditing(i)}><Pencil className="size-4" /></Button>
            <Button size="icon" variant="ghost" aria-label={`Remove ${l.name}`} onClick={() => persist(list.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
          </li>
        ))}
      </ul>
      {editing !== null ? (
        <div className="mt-6 rounded-2xl bg-surface p-6">
          <h3 className="mb-4 font-semibold">{editing === "new" ? "New location" : "Edit location"}</h3>
          <LocationForm
            key={String(editing)}
            id="onb-location"
            defaultValues={editing === "new" ? { country: app.country ?? "" } : list[editing]}
            onSubmit={(v) => persist(editing === "new" ? [...list, v] : list.map((x, j) => (j === editing ? v : x)), () => setEditing(null))}
            footer={
              <div className="flex gap-2">
                <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save location"}</Button>
                {list.length > 0 && <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>}
              </div>
            }
          />
        </div>
      ) : (
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => setEditing("new")}>Add another location</Button>
      )}
      {save.error && <p className="mt-4 text-sm text-destructive" role="alert">{errorMessage(save.error)}</p>}
      <StepNav onBack={onBack} onNext={onNext} nextLabel="Continue" />
    </Panel>
  );
}

// ---------- Step 4 ----------
function ExperienceStep({ app, onNext, onBack }: { app: MerchantApplication; onNext: () => void; onBack: () => void }) {
  const save = useSaveApp(app);
  const fx = app.firstExperience;
  const locs = app.locations ?? [];
  const digits = fx ? new Intl.NumberFormat("en", { style: "currency", currency: fx.price.currency }).resolvedOptions().maximumFractionDigits ?? 2 : 2;
  const onSubmit = (v: ExperienceOutput) =>
    save.mutate(
      {
        firstExperience: {
          title: v.title, description: v.description, category: v.category, price: v.price,
          inclusions: v.inclusions, exclusions: v.exclusions, locationNames: v.venueKeys,
          validityDays: v.validityDays, bookingLeadHours: v.bookingLeadHours, weekdays: v.weekdays,
          blackoutDates: v.blackoutDates, redemptionInstructions: v.redemptionInstructions,
        },
      },
      { onSuccess: onNext },
    );
  return (
    <Panel className="p-8">
      <h2 className="text-xl font-semibold">Your first dining experience</h2>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">It will be reviewed together with your application.</p>
      <ExperienceForm
        id="onb-exp"
        venueOptions={locs.map((l) => ({ value: l.name, label: l.name }))}
        defaultValues={
          fx
            ? {
                title: fx.title, description: fx.description, category: fx.category,
                price: fx.price.amountMinor / 10 ** digits, currency: fx.price.currency,
                inclusions: fx.inclusions.join("\n"), exclusions: fx.exclusions.join("\n"),
                venueKeys: fx.locationNames, validityDays: fx.validityDays, bookingLeadHours: fx.bookingLeadHours,
                weekdays: fx.weekdays, blackoutDates: fx.blackoutDates.join(", "), redemptionInstructions: fx.redemptionInstructions,
              }
            : { currency: app.defaultCurrency ?? "EUR" }
        }
        onSubmit={onSubmit}
      />
      {save.error && <p className="mt-4 text-sm text-destructive" role="alert">{errorMessage(save.error)}</p>}
      <StepNav onBack={onBack} form="onb-exp" pending={save.isPending} />
    </Panel>
  );
}

// ---------- Step 5 ----------
function ReviewStep({ app, onEdit }: { app: MerchantApplication; onEdit: (s: number) => void }) {
  const qc = useQueryClient();
  const [accepted, setAccepted] = useState(!!app.termsAccepted);
  const submit = useMutation({
    mutationFn: async () => {
      await applications.update(app.id, { termsAccepted: true });
      return applications.submit(app.id);
    },
    onSuccess: (saved) => qc.setQueryData(["application", saved.id], saved),
  });
  const missing: { text: string; step: number }[] = [];
  if (!app.legalName || !app.registrationNumber || !app.country) missing.push({ text: "Business details are incomplete", step: 1 });
  if (!app.documents?.length) missing.push({ text: "Upload at least one verification document", step: 2 });
  if (!app.locations?.length) missing.push({ text: "Add at least one location", step: 3 });
  if (!app.firstExperience) missing.push({ text: "Create your first experience", step: 4 });
  const fx = app.firstExperience;
  const canSubmit = applicationActions(app.status).includes("submit") && missing.length === 0 && accepted;

  const Section = ({ title, step, children }: { title: string; step: number; children: ReactNode }) => (
    <section className="border-t py-5 first:border-t-0">
      <div className="flex items-center justify-between"><h3 className="font-semibold">{title}</h3><Button variant="link" size="sm" onClick={() => onEdit(step)}>Edit</Button></div>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );

  return (
    <Panel className="p-8">
      <h2 className="text-xl font-semibold">Review and submit</h2>
      {missing.length > 0 && (
        <ul className="mt-5 space-y-2 rounded-xl bg-warning-soft p-4 text-sm">
          {missing.map((m) => (
            <li key={m.text} className="flex items-center gap-2 text-warning">
              <AlertTriangle className="size-4" /> {m.text}
              <button className="ml-auto underline" onClick={() => onEdit(m.step)}>Fix</button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <Section title="Business" step={1}>
          {app.legalName ?? "—"}{app.tradingName ? ` (trading as ${app.tradingName})` : ""} · {countryName(app.country)} · Reg. {app.registrationNumber ?? "—"} · {app.defaultCurrency}
        </Section>
        <Section title="Documents" step={2}>{app.documents?.length ? app.documents.map((d) => d.fileName).join(", ") : "None uploaded"}</Section>
        <Section title="Locations" step={3}>{app.locations?.length ? app.locations.map((l) => `${l.name}, ${l.city}`).join(" · ") : "None added"}</Section>
        <Section title="First experience" step={4}>
          {fx ? `${fx.title} · ${formatMoney(fx.price.amountMinor, fx.price.currency)} · valid ${fx.validityDays} days` : "Not created"}
        </Section>
      </div>
      <label className="mt-4 flex items-start gap-3 rounded-xl bg-surface p-4 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 accent-[var(--color-primary)]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>I confirm the information is accurate and I'm authorised to act for this business. I accept the partner terms and privacy policy.</span>
      </label>
      {submit.error && <p className="mt-4 text-sm text-destructive" role="alert">{errorMessage(submit.error)}</p>}
      <div className="mt-8 flex items-center justify-between border-t pt-6">
        <Button variant="ghost" onClick={() => onEdit(4)}>Back</Button>
        <Button size="lg" className="rounded-full" disabled={!canSubmit || submit.isPending} onClick={() => submit.mutate()}>
          {submit.isPending ? "Submitting…" : "Submit for review"}
        </Button>
      </div>
    </Panel>
  );
}

function StatusScreen({ app }: { app: MerchantApplication }) {
  const map = {
    SUBMITTED: { icon: Clock, tone: "text-info", title: "Application submitted", text: "Thanks — our team is reviewing your business. We'll email you when there's an update." },
    APPROVED: { icon: CheckCircle2, tone: "text-success", title: "You're approved", text: "Your business is verified. Sign in again if the partner portal doesn't open automatically." },
    REJECTED: { icon: XCircle, tone: "text-destructive", title: "Application not approved", text: "Unfortunately we couldn't approve this application." },
    DRAFT: { icon: Clock, tone: "", title: "", text: "" },
  }[app.status];
  return (
    <Panel className="p-10 text-center">
      <map.icon className={cn("mx-auto size-12", map.tone)} aria-hidden />
      <h2 className="mt-5 text-2xl font-semibold">{map.title}</h2>
      <div className="mt-3"><StatusBadge status={app.status} /></div>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">{map.text}</p>
      {app.status === "REJECTED" && (
        <div className="mx-auto mt-6 max-w-md rounded-xl bg-danger-soft p-4 text-left text-sm">
          <p className="font-medium text-destructive">Reason</p>
          <p className="mt-1">{app.rejectionReason ?? "No reason was provided."}</p>
          <p className="mt-3 text-muted-foreground">Contact partners@sorteddate.example if you believe this is a mistake.</p>
        </div>
      )}
      {app.status === "APPROVED" && <Button asChild className="mt-6 rounded-full"><Link to="/app">Open partner portal</Link></Button>}
    </Panel>
  );
}

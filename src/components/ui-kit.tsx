import type { ReactNode, SelectHTMLAttributes } from "react";
import * as React from "react";
import { AlertCircle, Inbox, Loader2, PlugZap, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-destructive",
};

const STATUS_TONE: Record<string, Tone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  PENDING: "warning",
  APPROVED: "success",
  VERIFIED: "success",
  PUBLISHED: "success",
  ACCEPTED: "success",
  PAUSED: "warning",
  REJECTED: "danger",
  SUSPENDED: "danger",
  EXPIRED: "neutral",
  ARCHIVED: "neutral",
  INACTIVE: "neutral",
};

export function StatusBadge({ status, className }: { status: string; className?: string | undefined }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ className, children }: { className?: string | undefined; children: ReactNode }) {
  return <div className={cn("rounded-2xl border bg-card p-6", className)}>{children}</div>;
}

export function LoadingState({ label = "Loading" }: { label?: string | undefined }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden /> {label}…
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string | undefined;
  action?: ReactNode | undefined;
  icon?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-surface px-6 py-14 text-center">
      <div className="mb-4 grid size-11 place-items-center rounded-full bg-background text-muted-foreground">
        {icon ?? <Inbox className="size-5" aria-hidden />}
      </div>
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: (() => unknown) | undefined }) {
  if (error instanceof ApiError && error.code === "API_NOT_CONFIGURED") return <ApiNotConnected />;
  const forbidden = error instanceof ApiError && error.status === 403;
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-danger-soft/40 px-6 py-12 text-center" role="alert">
      <AlertCircle className="mb-3 size-6 text-destructive" aria-hidden />
      <h3 className="font-semibold">{forbidden ? "You don't have access to this" : "This didn't load"}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && !forbidden && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw className="size-4" /> Try again
        </Button>
      )}
    </div>
  );
}

export function ApiNotConnected() {
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-warning-soft/50 px-6 py-12 text-center">
      <PlugZap className="mb-3 size-6 text-warning" aria-hidden />
      <h3 className="font-semibold">Partner API not connected</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        This screen reads live data from the platform backend. Once the API address is configured,
        your real information will appear here. Nothing on this screen is simulated.
      </p>
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn("field-control", className)} {...props} />,
);
TextInput.displayName = "TextInput";

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn("field-control h-auto min-h-28 py-3", className)} {...props} />
  ),
);
TextArea.displayName = "TextArea";

export const NativeSelect = React.forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn("field-control appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  ),
);
NativeSelect.displayName = "NativeSelect";

export function Pager({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

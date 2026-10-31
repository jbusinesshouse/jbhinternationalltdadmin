"use client";

import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { titleCase } from "@/lib/format";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "success";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark shadow-[var(--shadow-sm)] focus-visible:ring-primary/30",
  secondary:
    "bg-surface text-foreground border border-border-strong hover:bg-surface-muted shadow-[var(--shadow-sm)]",
  danger: "bg-danger text-white hover:brightness-95 shadow-[var(--shadow-sm)]",
  success: "bg-success text-white hover:brightness-95 shadow-[var(--shadow-sm)]",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] font-medium transition-[background-color,color,box-shadow,opacity] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.98]",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-sm",
        buttonVariants[variant],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

const toneClasses = {
  gray: "bg-surface-muted text-muted ring-border",
  green: "bg-success-soft text-success ring-emerald-200/80",
  yellow: "bg-warning-soft text-warning ring-amber-200/80",
  red: "bg-danger-soft text-danger ring-red-200/80",
  blue: "bg-info-soft text-info ring-sky-200/80",
  orange: "bg-primary-soft text-primary-dark ring-orange-200/80",
  purple: "bg-violet-50 text-violet-700 ring-violet-200/80",
};

export type Tone = keyof typeof toneClasses;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  active: "green",
  approved: "green",
  completed: "green",
  resolved: "green",
  live: "green",
  clear: "green",
  pending: "yellow",
  open: "yellow",
  processing: "blue",
  shipped: "purple",
  in_progress: "blue",
  reviewed: "blue",
  warn: "orange",
  hold: "orange",
  restricted: "orange",
  rejected: "red",
  cancelled: "red",
  freeze: "red",
  critical: "red",
  deleted: "red",
  inactive: "gray",
  dismissed: "gray",
  closed: "gray",
  ended: "gray",
  wholesale: "purple",
  retail: "blue",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status ?? "unknown").toLowerCase();
  return <Badge tone={STATUS_TONES[key] ?? "gray"}>{titleCase(key)}</Badge>;
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 hidden text-xs text-muted sm:block">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-3 sm:p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

const fieldClass =
  "w-full rounded-[var(--radius)] border border-border-strong bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-sm)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-soft focus:border-primary focus:ring-2 focus:ring-[var(--primary-ring)] disabled:bg-surface-muted disabled:text-muted";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, "h-9", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldClass, "h-9 pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-20 py-2", className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2.5 py-8 text-sm text-muted sm:py-12"
      role="status"
    >
      <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
      {label}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center sm:py-12">
      <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-surface-muted sm:size-10">
        <Inbox className="size-4 text-muted-soft" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-xs leading-relaxed text-muted">{description}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong";
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center sm:py-12">
      <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-danger-soft sm:size-10">
        <AlertTriangle className="size-4 text-danger" aria-hidden />
      </div>
      <p className="max-w-md text-sm text-foreground">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Avatar({ src, name, size = 32 }: { src?: string | null; name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return src ? (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-surface-muted object-cover ring-1 ring-border"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary-dark ring-1 ring-orange-200/60"
    >
      {initials || "?"}
    </span>
  );
}

export function Thumb({ src, size = 40 }: { src?: string | null; size?: number }) {
  return src ? (
    <img
      src={src}
      alt=""
      style={{ width: size, height: size }}
      className="shrink-0 rounded-[var(--radius)] border border-border bg-surface-muted object-cover"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="inline-block shrink-0 rounded-[var(--radius)] border border-dashed border-border-strong bg-surface-muted"
    />
  );
}

export function KeyValue({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-soft">{label}</dt>
          <dd className="mt-1 break-words text-sm text-foreground">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Compact filter chip used to clear seller/buyer scope filters. */
export function FilterChip({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-dark transition hover:border-primary/40"
    >
      {children}
    </Link>
  );
}

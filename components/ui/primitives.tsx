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
    "bg-gradient-to-b from-[#f78d3a] to-primary text-white shadow-[0_1px_2px_rgba(217,112,26,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] hover:from-primary hover:to-primary-dark focus-visible:ring-primary/30",
  secondary:
    "bg-surface text-foreground border border-border-strong hover:bg-surface-muted hover:border-muted-soft/60 shadow-[var(--shadow-sm)]",
  danger:
    "bg-danger text-white shadow-[0_1px_2px_rgba(194,54,44,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-95",
  success:
    "bg-success text-white shadow-[0_1px_2px_rgba(13,122,78,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:brightness-95",
  ghost: "text-muted hover:bg-ink/[0.05] hover:text-foreground",
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
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius)] font-semibold transition-[background-color,color,box-shadow,opacity,border-color] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.98]",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
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
  gray: "bg-surface-muted text-muted ring-border-strong/70",
  green: "bg-success-soft text-success ring-emerald-200/80",
  yellow: "bg-warning-soft text-warning ring-amber-200/80",
  red: "bg-danger-soft text-danger ring-red-200/80",
  blue: "bg-info-soft text-info ring-sky-200/80",
  orange: "bg-primary-soft text-primary-dark ring-orange-200/80",
  purple: "bg-violet-50 text-violet-700 ring-violet-200/80",
};

const toneDots: Record<keyof typeof toneClasses, string> = {
  gray: "bg-muted-soft",
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  blue: "bg-sky-500",
  orange: "bg-primary",
  purple: "bg-violet-500",
};

export type Tone = keyof typeof toneClasses;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        toneClasses[tone]
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", toneDots[tone])} aria-hidden />
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
        "min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-card",
        className
      )}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-3.5 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 hidden text-xs text-muted sm:block">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("p-3.5 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

const fieldClass =
  "w-full rounded-[var(--radius)] border border-border-strong bg-surface px-3 text-sm text-foreground shadow-[var(--shadow-sm)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-soft hover:border-muted-soft/70 focus:border-primary focus:ring-[3px] focus:ring-[var(--primary-ring)] disabled:bg-surface-muted disabled:text-muted";

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
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">{label}</span>
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
      <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-surface-muted ring-1 ring-border sm:size-12">
        <Inbox className="size-5 text-muted-soft" aria-hidden />
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
      <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-danger-soft ring-1 ring-red-200/70 sm:size-12">
        <AlertTriangle className="size-5 text-danger" aria-hidden />
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
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-soft to-orange-100 text-[11px] font-bold text-primary-dark ring-1 ring-orange-200/70"
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
          <dt className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-soft">{label}</dt>
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

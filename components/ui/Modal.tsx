"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[8vh]">
      <div
        className="animate-fade-in absolute inset-0 bg-ink-deep/55 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "animate-pop-in relative w-full rounded-2xl border border-border bg-surface shadow-[0_24px_60px_-12px_rgba(13,22,48,0.35)]",
          wide ? "max-w-2xl" : "max-w-md"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/80 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h3 id="modal-title" className="text-base font-semibold tracking-tight text-ink">
              {title}
            </h3>
            {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius)] p-1.5 text-muted-soft transition hover:bg-surface-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 rounded-b-2xl border-t border-border/80 bg-surface-muted/70 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

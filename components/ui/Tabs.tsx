"use client";

import { cn } from "@/lib/cn";

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (value: T) => void;
  items: { value: T; label: string; count?: number }[];
}) {
  return (
    <div
      role="tablist"
      className="inline-flex max-w-full flex-wrap gap-0.5 rounded-xl border border-border bg-surface-muted p-1"
    >
      {items.map((item) => {
        const selected = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 sm:px-3.5",
              selected
                ? "bg-surface text-ink shadow-[0_1px_3px_rgba(15,23,42,0.1),0_0_0_1px_rgba(15,23,42,0.04)]"
                : "text-muted hover:text-foreground"
            )}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-bold leading-4 tabular-nums",
                  selected ? "bg-primary text-white" : "bg-ink/10 text-ink-soft"
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

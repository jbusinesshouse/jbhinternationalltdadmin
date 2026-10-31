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
      className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-ink/[0.04] p-0.5"
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
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 sm:px-3",
              selected
                ? "bg-surface text-ink shadow-[var(--shadow-sm)]"
                : "text-muted hover:text-foreground"
            )}
          >
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <span
                className={cn(
                  "rounded px-1.5 text-[10px] font-semibold leading-4 tabular-nums",
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

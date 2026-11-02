"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "./primitives";

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/80 bg-surface-muted/60 px-3 py-3 sm:px-5">
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full min-w-0 flex-1 sm:min-w-56 sm:max-w-sm">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-soft"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder ?? "Search"}
      />
    </div>
  );
}

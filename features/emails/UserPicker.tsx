"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  EmptyState,
  Input,
  Spinner,
  StatusBadge,
} from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { displayName } from "@/lib/format";
import { useAdminQuery, useDebounced } from "@/lib/hooks";
import type { Paged, Profile } from "@/lib/types";

export type PickedUser = {
  id: string;
  full_name: string | null;
  store_name: string | null;
  store_type: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string | null;
};

type Props = {
  selected: PickedUser[];
  onChange: (users: PickedUser[]) => void;
  max?: number;
};

export function UserPicker({ selected, onChange, max = 200 }: Props) {
  const [q, setQ] = useState("");
  const search = useDebounced(q.trim(), 300);
  const selectedIds = useMemo(() => new Set(selected.map((u) => u.id)), [selected]);

  const results = useAdminQuery<Paged<"users", Profile>>(
    "email-user-search",
    "/users",
    { q: search, limit: 20, offset: 0 },
    { enabled: search.length >= 2 || search.length === 0 }
  );

  function toggle(user: Profile) {
    if (selectedIds.has(user.id)) {
      onChange(selected.filter((u) => u.id !== user.id));
      return;
    }
    if (selected.length >= max) return;
    onChange([
      ...selected,
      {
        id: user.id,
        full_name: user.full_name,
        store_name: user.store_name,
        store_type: user.store_type,
        phone: user.phone,
        avatar_url: user.avatar_url,
        status: user.status,
      },
    ]);
  }

  function remove(id: string) {
    onChange(selected.filter((u) => u.id !== id));
  }

  const users = results.data?.users ?? [];

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface-muted/40 p-2">
          {selected.map((u) => (
            <span
              key={u.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-surface py-1 pl-1 pr-1.5 text-xs"
            >
              <Avatar src={u.avatar_url} name={displayName(u)} size={18} />
              <span className="min-w-0 truncate font-medium text-foreground">
                {displayName(u)}
              </span>
              <button
                type="button"
                onClick={() => remove(u.id)}
                className="rounded p-0.5 text-muted-soft hover:bg-surface-muted hover:text-foreground"
                aria-label={`Remove ${displayName(u)}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-soft"
          aria-hidden
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by store, name, or phone…"
          className="pl-9"
          aria-label="Search users"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
        {results.isPending ? (
          <Spinner label="Searching…" />
        ) : !users.length ? (
          <EmptyState
            title={search ? "No users match" : "No users found"}
            description="Try a store name, person name, or phone number."
          />
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => {
              const checked = selectedIds.has(u.id);
              const disabled = !checked && selected.length >= max;
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(u)}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left transition",
                      checked ? "bg-primary-soft/40" : "hover:bg-surface-muted/80",
                      disabled && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border text-[10px]",
                        checked
                          ? "border-primary bg-primary text-white"
                          : "border-border-strong bg-surface"
                      )}
                      aria-hidden
                    >
                      {checked ? "✓" : ""}
                    </span>
                    <Avatar src={u.avatar_url} name={displayName(u)} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {displayName(u)}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                        {u.phone && <span className="tabular-nums">{u.phone}</span>}
                        {u.store_type && <StatusBadge status={u.store_type} />}
                        {u.status && u.status !== "active" && (
                          <StatusBadge status={u.status} />
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>
          {selected.length} selected
          {selected.length >= max ? ` · max ${max}` : ""}
        </span>
        {search.length > 0 && search.length < 2 && (
          <Badge tone="yellow">Type at least 2 characters to narrow results</Badge>
        )}
      </div>
    </div>
  );
}

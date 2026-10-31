"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { api, errorMessage } from "./api";
import type { Overview } from "./types";

type Query = Record<string, string | number | boolean | null | undefined>;

/** GET an admin endpoint; query params are part of the cache key. */
export function useAdminQuery<T>(
  key: string,
  path: string,
  query?: Query,
  options?: { enabled?: boolean; refetchInterval?: number }
) {
  return useQuery({
    queryKey: [key, path, query ?? {}],
    queryFn: ({ signal }) => api<T>(path, { query, signal }),
    placeholderData: keepPreviousData,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });
}

export function useOverview() {
  return useAdminQuery<Overview>("overview", "/overview", undefined, {
    refetchInterval: 60_000,
  });
}

/**
 * Mutation with toast feedback. Invalidates the given query key prefixes plus
 * the dashboard overview so pending badges stay in sync.
 */
export function useAdminMutation<TVars, TResult = unknown>(
  fn: (vars: TVars) => Promise<TResult>,
  options: {
    success?: string | ((result: TResult, vars: TVars) => string);
    invalidate?: string[];
    onSuccess?: (result: TResult, vars: TVars) => void;
  } = {}
) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: fn,
    onSuccess: (result, vars) => {
      // Do not await invalidation — refetching overview/audit can take tens of
      // seconds and would keep isPending (and confirm modals) stuck after the
      // mutation itself already succeeded.
      const keys = [...(options.invalidate ?? []), "overview"];
      void Promise.all(
        keys.map((k) => queryClient.invalidateQueries({ queryKey: [k] as QueryKey }))
      );
      if (options.success) {
        toast.success(
          typeof options.success === "function" ? options.success(result, vars) : options.success
        );
      }
      options.onSuccess?.(result, vars);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export const PAGE_SIZE = 25;

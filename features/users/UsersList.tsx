"use client";

import { UserCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FilterBar, SearchInput } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Select,
  Spinner,
  StatusBadge,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { api } from "@/lib/api";
import { displayName, formatDate } from "@/lib/format";
import {
  PAGE_SIZE,
  useAdminMutation,
  useAdminQuery,
  useDebounced,
  useOverview,
} from "@/lib/hooks";
import type { Paged, Profile } from "@/lib/types";

export function UsersList() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [storeType, setStoreType] = useState(params.get("storeType") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [offset, setOffset] = useState(0);
  const search = useDebounced(q);
  const overview = useOverview();

  const { data, error, isPending, isFetching, refetch } = useAdminQuery<Paged<"users", Profile>>(
    "users",
    "/users",
    { q: search, storeType, status, limit: PAGE_SIZE, offset }
  );

  const activate = useAdminMutation(
    (userId: string) =>
      api(`/profiles/${userId}/status`, {
        method: "PATCH",
        body: { status: "active", reason: "Wholesale seller verified" },
      }),
    { invalidate: ["users"], success: "Account activated" }
  );

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setOffset(0);
  };

  const awaitingOnly = storeType === "wholesale" && status === "restricted";

  return (
    <>
      <PageHeader
        title="Users & stores"
        description="Buyers and sellers on J Business House. New wholesale sellers start restricted until you activate them."
        actions={
          <Button
            variant={awaitingOnly ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setStoreType(awaitingOnly ? "" : "wholesale");
              setStatus(awaitingOnly ? "" : "restricted");
              setOffset(0);
            }}
          >
            <UserCheck className="size-3.5" />
            Wholesale awaiting activation
            {overview.data?.pending.wholesaleActivations ? (
              <span className="rounded-full bg-white/80 px-1.5 text-[11px] text-gray-900">
                {overview.data.pending.wholesaleActivations}
              </span>
            ) : null}
          </Button>
        }
      />
      <Card bodyClassName="p-0">
        <FilterBar>
          <SearchInput
            value={q}
            onChange={resetPage(setQ)}
            placeholder="Search store, name, phone or user ID"
          />
          <Select
            value={storeType}
            onChange={(e) => resetPage(setStoreType)(e.target.value)}
            className="w-auto"
          >
            <option value="">All account types</option>
            <option value="wholesale">Wholesale</option>
            <option value="retail">Retail</option>
            <option value="none">Profile incomplete</option>
          </Select>
          <Select
            value={status}
            onChange={(e) => resetPage(setStatus)(e.target.value)}
            className="w-auto"
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="freeze">Frozen</option>
            <option value="restricted">Restricted</option>
          </Select>
          {isFetching && !isPending && <span className="text-xs text-muted-soft">Updating…</span>}
        </FilterBar>

        {isPending ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !data.users.length ? (
          <EmptyState title="No users match these filters" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Phone</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Location</Th>
                <Th>Joined</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <Tr key={u.id} onClick={() => router.push(`/users/${u.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar_url} name={displayName(u)} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{displayName(u)}</p>
                        {u.store_name && u.full_name && (
                          <p className="truncate text-xs text-muted">{u.full_name}</p>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td className="tabular-nums">{u.phone ?? "—"}</Td>
                  <Td>{u.store_type ? <StatusBadge status={u.store_type} /> : "—"}</Td>
                  <Td>
                    <StatusBadge status={u.status ?? "active"} />
                  </Td>
                  <Td className="text-xs">
                    {[u.upazila, u.district].filter(Boolean).join(", ") || "—"}
                  </Td>
                  <Td className="text-xs tabular-nums text-muted-soft">{formatDate(u.created_at)}</Td>
                  <Td className="text-right">
                    {u.status === "restricted" && (
                      <Button
                        size="sm"
                        variant="success"
                        loading={activate.isPending && activate.variables === u.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          activate.mutate(u.id);
                        }}
                      >
                        Activate
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        {data && (
          <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />
        )}
      </Card>
    </>
  );
}

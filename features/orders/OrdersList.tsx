"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FilterBar, SearchInput } from "@/components/ui/Filters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  Card,
  EmptyState,
  ErrorState,
  FilterChip,
  Spinner,
  StatusBadge,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { displayName, formatBdt, formatDateTime, shortId } from "@/lib/format";
import { PAGE_SIZE, useAdminQuery, useDebounced, useOverview } from "@/lib/hooks";
import type { OrderRow, Paged } from "@/lib/types";

const STATUSES = ["", "pending", "processing", "shipped", "completed", "hold", "cancelled"] as const;
type StatusFilter = (typeof STATUSES)[number];

export function OrdersList() {
  const router = useRouter();
  const params = useSearchParams();
  const sellerId = params.get("sellerId") ?? "";
  const buyerId = params.get("buyerId") ?? "";
  const initialStatus = params.get("status") ?? "";
  const [status, setStatus] = useState<StatusFilter>(
    (STATUSES as readonly string[]).includes(initialStatus) ? (initialStatus as StatusFilter) : ""
  );
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const search = useDebounced(q);
  const overview = useOverview();
  const counts = overview.data?.stats.orders.byStatus;

  const { data, error, isPending, refetch } = useAdminQuery<Paged<"orders", OrderRow>>(
    "orders",
    "/orders",
    { status, q: search, sellerId, buyerId, limit: PAGE_SIZE, offset }
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description="All marketplace orders. Orders on hold mean the buyer declined a seller's cancel request."
      />
      <Card bodyClassName="p-0">
        <div className="border-b border-gray-100 px-5 py-3">
          <Tabs
            value={status}
            onChange={(v) => {
              setStatus(v);
              setOffset(0);
            }}
            items={STATUSES.map((s) => ({
              value: s,
              label: s ? s[0].toUpperCase() + s.slice(1) : "All",
              count: s === "hold" ? counts?.hold : undefined,
            }))}
          />
        </div>
        <FilterBar>
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setOffset(0);
            }}
            placeholder="Search buyer name, phone, email or order ID"
          />
          {(sellerId || buyerId) && (
            <FilterChip href="/orders">
              Filtered to one {sellerId ? "seller" : "buyer"} <X className="size-3" />
            </FilterChip>
          )}
        </FilterBar>

        {isPending ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !data.orders.length ? (
          <EmptyState title="No orders match these filters" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Product</Th>
                <Th>Buyer</Th>
                <Th>Seller</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Placed</Th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <Tr key={o.id} onClick={() => router.push(`/orders/${o.id}`)}>
                  <Td className="font-mono text-xs tabular-nums text-muted">#{shortId(o.id)}</Td>
                  <Td className="max-w-56 truncate font-medium text-foreground">{o.product_name ?? "—"}</Td>
                  <Td>
                    <span className="block">{o.full_name ?? "—"}</span>
                    <span className="text-xs text-muted-soft">{o.phone}</span>
                  </Td>
                  <Td className="max-w-40 truncate">{o.seller ? displayName(o.seller) : "—"}</Td>
                  <Td className="font-medium tabular-nums text-foreground">{formatBdt(o.total)}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-xs tabular-nums text-muted-soft">
                    {formatDateTime(o.created_at)}
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

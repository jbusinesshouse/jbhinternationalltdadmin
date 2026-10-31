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
  Select,
  Spinner,
  StatusBadge,
  Thumb,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { displayName, formatBdt, formatDate } from "@/lib/format";
import { PAGE_SIZE, useAdminQuery, useDebounced } from "@/lib/hooks";
import type { Catalog, Paged, ProductRow } from "@/lib/types";

export function ProductsList() {
  const router = useRouter();
  const params = useSearchParams();
  const sellerId = params.get("sellerId") ?? "";
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [offset, setOffset] = useState(0);
  const search = useDebounced(q);

  const catalog = useAdminQuery<Catalog>("catalog", "/catalog");
  const { data, error, isPending, refetch } = useAdminQuery<Paged<"products", ProductRow>>(
    "products",
    "/products",
    { q: search, status, categoryId, sellerId, limit: PAGE_SIZE, offset }
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="Every listing across wholesale and retail stores. Open one to moderate it."
      />
      <Card bodyClassName="p-0">
        <FilterBar>
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setOffset(0);
            }}
            placeholder="Search product name or ID"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
            className="w-auto"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deleted">Deleted</option>
          </Select>
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setOffset(0);
            }}
            className="w-auto"
          >
            <option value="">All categories</option>
            {catalog.data?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {sellerId && (
            <FilterChip href="/products">
              Filtered to one seller <X className="size-3" />
            </FilterChip>
          )}
        </FilterBar>

        {isPending ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !data.products.length ? (
          <EmptyState title="No products match these filters" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Seller</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>MOQ</Th>
                <Th>Status</Th>
                <Th>Listed</Th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <Tr key={p.id} onClick={() => router.push(`/products/${p.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Thumb src={p.image_url} />
                      <span className="max-w-64 truncate font-medium text-foreground">{p.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <span className="block max-w-40 truncate">{displayName(p.seller)}</span>
                    {p.seller?.store_type && (
                      <span className="text-xs capitalize text-muted">{p.seller.store_type}</span>
                    )}
                  </Td>
                  <Td className="text-xs">{p.category_name ?? "—"}</Td>
                  <Td className="font-medium tabular-nums text-foreground">{formatBdt(p.price)}</Td>
                  <Td className="tabular-nums">{p.moq ?? "—"}</Td>
                  <Td>
                    <StatusBadge status={p.is_deleted ? "deleted" : p.status} />
                  </Td>
                  <Td className="text-xs tabular-nums text-muted-soft">{formatDate(p.created_at)}</Td>
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

"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
  StatusBadge,
  Thumb,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/api";
import { daysLeft, displayName, formatBdt, formatDate, timeAgo } from "@/lib/format";
import { mainImage } from "@/lib/media";
import { PAGE_SIZE, useAdminMutation, useAdminQuery, useOverview } from "@/lib/hooks";
import type { AdRequest, Paged, ProductAd, ReviewStatus } from "@/lib/types";
import { ReviewActions, ReviewStatusTabs } from "../review/ReviewKit";

export function Ads() {
  const [view, setView] = useState<"requests" | "running">("requests");
  const overview = useOverview();
  return (
    <>
      <PageHeader
        title="Product ads"
        description="Sellers request sponsored placement for products. Approving starts the ad immediately for the requested duration."
        actions={
          <Tabs
            value={view}
            onChange={setView}
            items={[
              { value: "requests", label: "Requests", count: overview.data?.pending.adRequests },
              { value: "running", label: "Ads" },
            ]}
          />
        }
      />
      {view === "requests" ? <Requests /> : <Running />}
    </>
  );
}

function Requests() {
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [offset, setOffset] = useState(0);
  const overview = useOverview();
  const { data, error, isPending, refetch } = useAdminQuery<Paged<"requests", AdRequest>>(
    "ad-requests",
    "/ad-requests",
    { status, limit: PAGE_SIZE, offset }
  );

  const review = useAdminMutation(
    (vars: { id: string; decision: "approved" | "rejected"; adminNote: string }) =>
      api(`/ad-requests/${vars.id}`, {
        method: "PATCH",
        body: { decision: vars.decision, adminNote: vars.adminNote || null },
      }),
    { invalidate: ["ad-requests", "ads"], success: (_r, v) => `Ad request ${v.decision}` }
  );

  return (
    <Card bodyClassName="p-0">
      <div className="border-b border-gray-100 px-5 py-3">
        <ReviewStatusTabs
          value={status}
          onChange={(v) => {
            setStatus(v);
            setOffset(0);
          }}
          pendingCount={overview.data?.pending.adRequests}
        />
      </div>
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data.requests.length ? (
        <EmptyState title={status === "pending" ? "No ad requests waiting" : "No ad requests"} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {data.requests.map((r) => (
            <li key={r.id} className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/users/${r.seller_id}`} className="font-medium text-gray-900 hover:text-primary">
                    {displayName(r.profiles)}
                  </Link>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">{r.profiles?.phone}</span>
                  <span className="text-xs text-gray-400">· {timeAgo(r.created_at)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span>
                    <span className="text-gray-500">Budget </span>
                    <strong>{formatBdt(r.budget_bdt)}</strong>
                  </span>
                  <span>
                    <span className="text-gray-500">Sell target </span>
                    {formatBdt(r.sell_target_bdt)}
                  </span>
                  <span>
                    <span className="text-gray-500">Duration </span>
                    {r.duration_days} days
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.product_ad_request_items.map((item) => (
                    <Link
                      key={item.product_id}
                      href={`/products/${item.product_id}`}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 py-1 pl-1 pr-3 text-xs hover:border-primary"
                    >
                      <Thumb src={mainImage(item.products?.product_images)} size={32} />
                      <span className="max-w-40 truncate">{item.products?.name ?? "Deleted product"}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <ReviewActions
                status={r.status}
                adminNote={r.admin_note}
                reviewedAt={r.reviewed_at}
                subject="ad request"
                approveDescription={`Starts ${r.product_ad_request_items.length} sponsored product ad(s) now for ${r.duration_days} days. Any running ad on the same products is replaced. Confirm the ${formatBdt(r.budget_bdt)} budget was received first.`}
                rejectDescription="The seller is notified with your reason."
                loading={review.isPending && review.variables?.id === r.id}
                onDecide={(decision, adminNote) => review.mutate({ id: r.id, decision, adminNote })}
              />
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />}
    </Card>
  );
}

function Running() {
  const [scope, setScope] = useState<"live" | "all">("live");
  const [offset, setOffset] = useState(0);
  const [ending, setEnding] = useState<ProductAd | null>(null);
  const { data, error, isPending, refetch } = useAdminQuery<Paged<"ads", ProductAd>>(
    "ads",
    "/ads",
    { scope, limit: PAGE_SIZE, offset }
  );
  const end = useAdminMutation(
    (id: string) => api(`/ads/${id}/end`, { method: "POST" }),
    { invalidate: ["ads"], success: "Ad stopped", onSuccess: () => setEnding(null) }
  );

  return (
    <Card bodyClassName="p-0">
      <div className="border-b border-gray-100 px-5 py-3">
        <Tabs
          value={scope}
          onChange={(v) => {
            setScope(v);
            setOffset(0);
          }}
          items={[
            { value: "live", label: "Running now" },
            { value: "all", label: "All ads" },
          ]}
        />
      </div>
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data.ads.length ? (
        <EmptyState title="No ads" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Seller</Th>
              <Th>Window</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {data.ads.map((ad) => {
              const left = daysLeft(ad.ends_at);
              const live = ad.is_active && left !== null && left > 0;
              return (
                <Tr key={ad.id}>
                  <Td>
                    <Link href={`/products/${ad.product_id}`} className="flex items-center gap-3 hover:text-primary">
                      <Thumb src={ad.product?.image_url} size={36} />
                      <span className="max-w-56 truncate font-medium">{ad.product?.name ?? "—"}</span>
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/users/${ad.seller_id}`} className="hover:text-primary">
                      {displayName(ad.seller)}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {formatDate(ad.starts_at)} → {formatDate(ad.ends_at)}
                    {live && <span className="ml-1 text-gray-500">({left}d left)</span>}
                  </Td>
                  <Td>
                    <StatusBadge status={live ? "live" : "ended"} />
                  </Td>
                  <Td className="text-right">
                    {live && (
                      <Button size="sm" variant="secondary" onClick={() => setEnding(ad)}>
                        Stop
                      </Button>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
      {data && <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />}
      <ConfirmModal
        open={Boolean(ending)}
        title="Stop this ad?"
        description={`"${ending?.product?.name ?? "This product"}" stops appearing as sponsored immediately.`}
        confirmLabel="Stop ad"
        tone="danger"
        loading={end.isPending}
        onClose={() => setEnding(null)}
        onConfirm={() => ending && end.mutate(ending.id)}
      />
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Spinner,
  StatusBadge,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/api";
import { daysLeft, displayName, formatDate, timeAgo } from "@/lib/format";
import { PAGE_SIZE, useAdminMutation, useAdminQuery, useOverview } from "@/lib/hooks";
import type { FeaturedRequest, FeaturedStore, Paged, ReviewStatus } from "@/lib/types";
import { ReviewActions, ReviewStatusTabs } from "../review/ReviewKit";

export function Featured() {
  const [view, setView] = useState<"requests" | "stores">("requests");
  const overview = useOverview();
  return (
    <>
      <PageHeader
        title="Featured stores"
        description="Featured stores appear in the app's featured strip. To feature a store without a request, open the seller in Users."
        actions={
          <Tabs
            value={view}
            onChange={setView}
            items={[
              { value: "requests", label: "Requests", count: overview.data?.pending.featuredRequests },
              { value: "stores", label: "Featured stores" },
            ]}
          />
        }
      />
      {view === "requests" ? <Requests /> : <Stores />}
    </>
  );
}

function RequestRow({ r }: { r: FeaturedRequest }) {
  const [days, setDays] = useState("30");
  const validDays = Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 365;
  const review = useAdminMutation(
    (vars: { decision: "approved" | "rejected"; adminNote: string }) =>
      api(`/featured-requests/${r.id}`, {
        method: "PATCH",
        body: {
          decision: vars.decision,
          adminNote: vars.adminNote || null,
          durationDays: vars.decision === "approved" ? Number(days) : undefined,
        },
      }),
    { invalidate: ["featured"], success: (_r, v) => `Request ${v.decision}` }
  );

  return (
    <li className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 gap-3">
        <Avatar src={r.profiles?.avatar_url} name={displayName(r.profiles)} size={40} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href={`/users/${r.seller_id}`} className="font-medium text-gray-900 hover:text-primary">
              {displayName(r.profiles)}
            </Link>
            <span className="text-gray-500">{r.profiles?.phone}</span>
            <span className="text-xs text-gray-400">· {timeAgo(r.created_at)}</span>
          </div>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-600">
            {r.message || <span className="text-gray-400">No message</span>}
          </p>
        </div>
      </div>
      <ReviewActions
        status={r.status}
        adminNote={r.admin_note}
        reviewedAt={r.reviewed_at}
        subject="featured request"
        approveDescription="The store is featured from now for the chosen duration, replacing any current window."
        rejectDescription="The seller is notified with your reason."
        canApprove={validDays}
        approveExtra={
          <Field label="Duration (days)" hint="1–365">
            <Input type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} />
          </Field>
        }
        loading={review.isPending}
        onDecide={(decision, adminNote) => review.mutate({ decision, adminNote })}
      />
    </li>
  );
}

function Requests() {
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [offset, setOffset] = useState(0);
  const overview = useOverview();
  const { data, error, isPending, refetch } = useAdminQuery<Paged<"requests", FeaturedRequest>>(
    "featured",
    "/featured-requests",
    { status, limit: PAGE_SIZE, offset }
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
          pendingCount={overview.data?.pending.featuredRequests}
        />
      </div>
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data.requests.length ? (
        <EmptyState title={status === "pending" ? "No requests waiting" : "No requests"} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {data.requests.map((r) => (
            <RequestRow key={r.id} r={r} />
          ))}
        </ul>
      )}
      {data && <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />}
    </Card>
  );
}

function Stores() {
  const [scope, setScope] = useState<"live" | "all">("live");
  const [ending, setEnding] = useState<FeaturedStore | null>(null);
  const { data, error, isPending, refetch } = useAdminQuery<{ stores: FeaturedStore[] }>(
    "featured",
    "/featured-stores",
    { scope }
  );
  const end = useAdminMutation(
    (sellerId: string) => api(`/featured-stores/${sellerId}/end`, { method: "POST" }),
    { invalidate: ["featured", "users"], success: "Featured window ended", onSuccess: () => setEnding(null) }
  );

  return (
    <Card bodyClassName="p-0">
      <div className="border-b border-gray-100 px-5 py-3">
        <Tabs
          value={scope}
          onChange={setScope}
          items={[
            { value: "live", label: "Featured now" },
            { value: "all", label: "History" },
          ]}
        />
      </div>
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data.stores.length ? (
        <EmptyState title="No featured stores" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Store</Th>
              <Th>Window</Th>
              <Th>Status</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {data.stores.map((s) => {
              const left = daysLeft(s.ends_at);
              const live = s.is_active && left !== null && left > 0;
              return (
                <Tr key={`${s.seller_id}-${s.created_at}`}>
                  <Td>
                    <Link href={`/users/${s.seller_id}`} className="flex items-center gap-3 hover:text-primary">
                      <Avatar src={s.seller?.avatar_url} name={displayName(s.seller)} />
                      <span className="font-medium">{displayName(s.seller)}</span>
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {formatDate(s.starts_at)} → {formatDate(s.ends_at)}
                    {live && <span className="ml-1 text-gray-500">({left}d left)</span>}
                  </Td>
                  <Td>
                    <StatusBadge status={live ? "live" : "ended"} />
                  </Td>
                  <Td className="text-right">
                    {live && (
                      <Button size="sm" variant="secondary" onClick={() => setEnding(s)}>
                        End now
                      </Button>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <ConfirmModal
        open={Boolean(ending)}
        title="End featured window?"
        description={`${displayName(ending?.seller)} is removed from the featured strip immediately.`}
        confirmLabel="End now"
        tone="danger"
        loading={end.isPending}
        onClose={() => setEnding(null)}
        onConfirm={() => ending && end.mutate(ending.seller_id)}
      />
    </Card>
  );
}

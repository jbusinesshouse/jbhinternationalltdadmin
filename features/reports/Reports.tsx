"use client";

import { Ban, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Select,
  Spinner,
  StatusBadge,
  Thumb,
} from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/api";
import { displayName, formatDateTime, timeAgo, titleCase } from "@/lib/format";
import { PAGE_SIZE, useAdminMutation, useAdminQuery, useOverview } from "@/lib/hooks";
import type { Paged, Report } from "@/lib/types";

type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed" | "all";
type Decision = "reviewed" | "resolved" | "dismissed";

const REASON_TONE: Record<string, "red" | "orange" | "yellow" | "gray"> = {
  scam: "red",
  inappropriate: "orange",
  spam: "yellow",
  other: "gray",
};

const DECISION_COPY: Record<Decision, { title: string; body: string; label: string }> = {
  resolved: {
    title: "Resolve report",
    body: "Use when action was taken (product hidden, account frozen, seller warned).",
    label: "Resolve",
  },
  dismissed: {
    title: "Dismiss report",
    body: "Use when the report is invalid or not a violation.",
    label: "Dismiss",
  },
  reviewed: {
    title: "Mark as reviewed",
    body: "Closes the report from the queue without a final outcome, e.g. while monitoring.",
    label: "Mark reviewed",
  },
};

function ReportRow({ r }: { r: Report }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [moderation, setModeration] = useState<"hide" | "freeze" | null>(null);

  const review = useAdminMutation(
    (vars: { status: Decision; adminNote: string }) =>
      api(`/reports/${r.id}`, {
        method: "PATCH",
        body: { status: vars.status, adminNote: vars.adminNote || null },
      }),
    { invalidate: ["reports"], success: (_r, v) => `Report ${v.status}`, onSuccess: () => setDecision(null) }
  );

  const moderate = useAdminMutation(
    (v: { kind: "hide" | "freeze"; reason: string }) =>
      v.kind === "hide"
        ? api(`/products/${r.product_id}/moderate`, {
            method: "PATCH",
            body: { action: "deactivate", reason: v.reason || `Report ${r.id}` },
          })
        : api(`/profiles/${r.profile_id}/status`, {
            method: "PATCH",
            body: { status: "freeze", reason: v.reason || `Report ${r.id}` },
          }),
    {
      invalidate: ["reports", "products", "users"],
      success: (_r, v) => (v.kind === "hide" ? "Product hidden" : "Account frozen"),
      onSuccess: () => setModeration(null),
    }
  );

  const product = r.target_product;
  const profile = r.target_profile;

  return (
    <li className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={REASON_TONE[r.reason] ?? "gray"}>{titleCase(r.reason)}</Badge>
          <span className="text-sm font-medium text-gray-900">
            {r.target_type === "product" ? "Product report" : "User report"}
          </span>
          <span className="text-xs text-gray-400">· {timeAgo(r.created_at)}</span>
        </div>
        {r.details && <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{r.details}</p>}

        <div className="mt-3 flex flex-wrap gap-3">
          {product && (
            <Link
              href={`/products/${product.id}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-2 pr-4 hover:border-primary"
            >
              <Thumb src={product.image_url} />
              <div className="min-w-0">
                <p className="max-w-56 truncate text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">by {displayName(product.seller)}</p>
              </div>
              <StatusBadge status={product.is_deleted ? "deleted" : product.status} />
            </Link>
          )}
          {profile && (
            <Link
              href={`/users/${profile.id}`}
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-2 pr-4 hover:border-primary"
            >
              <Avatar src={profile.avatar_url} name={displayName(profile)} />
              <div>
                <p className="text-sm font-medium text-gray-900">{displayName(profile)}</p>
                <p className="text-xs capitalize text-gray-500">{profile.store_type ?? "user"}</p>
              </div>
              <StatusBadge status={profile.status ?? "active"} />
            </Link>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Reported by{" "}
          {r.reporter ? (
            <Link href={`/users/${r.reporter_id}`} className="font-medium hover:text-primary">
              {displayName(r.reporter)}
            </Link>
          ) : (
            "unknown"
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {r.status === "pending" ? (
          <>
            <div className="flex flex-wrap justify-end gap-2">
              {product && product.status === "active" && !product.is_deleted && (
                <Button size="sm" variant="secondary" onClick={() => setModeration("hide")}>
                  <EyeOff className="size-3.5" /> Hide product
                </Button>
              )}
              {profile && (profile.status ?? "active") === "active" && (
                <Button size="sm" variant="secondary" onClick={() => setModeration("freeze")}>
                  <Ban className="size-3.5" /> Freeze account
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDecision("reviewed")}>
                Reviewed
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setDecision("dismissed")}>
                Dismiss
              </Button>
              <Button size="sm" variant="success" onClick={() => setDecision("resolved")}>
                Resolve
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-end gap-1 text-right">
            <StatusBadge status={r.status} />
            {r.reviewed_at && <span className="text-[11px] text-gray-400">{formatDateTime(r.reviewed_at)}</span>}
            {r.admin_note && <span className="max-w-60 text-xs text-gray-600">“{r.admin_note}”</span>}
          </div>
        )}
      </div>

      {decision && (
        <ConfirmModal
          open
          title={DECISION_COPY[decision].title}
          description={DECISION_COPY[decision].body}
          confirmLabel={DECISION_COPY[decision].label}
          tone={decision === "resolved" ? "success" : "primary"}
          note={{ label: "Internal note", placeholder: "What was done?" }}
          loading={review.isPending}
          onClose={() => setDecision(null)}
          onConfirm={(adminNote) => review.mutate({ status: decision, adminNote })}
        />
      )}
      {moderation && (
        <ConfirmModal
          open
          title={moderation === "hide" ? "Hide reported product" : "Freeze reported account"}
          description={
            moderation === "hide"
              ? "The product is deactivated and leaves the feed. Resolve the report afterwards."
              : "The account can no longer order or sell. Resolve the report afterwards."
          }
          confirmLabel={moderation === "hide" ? "Hide product" : "Freeze account"}
          tone="danger"
          note={{ label: "Internal reason (audit log)" }}
          loading={moderate.isPending}
          onClose={() => setModeration(null)}
          onConfirm={(reason) => moderate.mutate({ kind: moderation, reason })}
        />
      )}
    </li>
  );
}

export function Reports() {
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [targetType, setTargetType] = useState("");
  const [offset, setOffset] = useState(0);
  const overview = useOverview();
  const { data, error, isPending, refetch } = useAdminQuery<Paged<"reports", Report>>(
    "reports",
    "/reports",
    { status, targetType, limit: PAGE_SIZE, offset }
  );

  return (
    <>
      <PageHeader
        title="Reports"
        description="Users report products and accounts from the app (spam, scam, inappropriate)."
      />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3">
          <Tabs
            value={status}
            onChange={(v) => {
              setStatus(v);
              setOffset(0);
            }}
            items={[
              { value: "pending", label: "Open", count: overview.data?.pending.reports },
              { value: "resolved", label: "Resolved" },
              { value: "reviewed", label: "Reviewed" },
              { value: "dismissed", label: "Dismissed" },
              { value: "all", label: "All" },
            ]}
          />
          <Select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setOffset(0);
            }}
            className="w-auto"
          >
            <option value="">Products & users</option>
            <option value="product">Products only</option>
            <option value="user">Users only</option>
          </Select>
        </div>
        {isPending ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !data.reports.length ? (
          <EmptyState title={status === "pending" ? "No open reports" : "No reports"} />
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.reports.map((r) => (
              <ReportRow key={r.id} r={r} />
            ))}
          </ul>
        )}
        {data && <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />}
      </Card>
    </>
  );
}

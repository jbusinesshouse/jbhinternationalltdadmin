"use client";

import { useState } from "react";
import { Ban, Gauge, RotateCcw, Send } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Pagination } from "@/components/ui/Pagination";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
  StatusBadge,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDateTime, formatNumber, timeAgo } from "@/lib/format";
import { useAdminMutation, useAdminQuery } from "@/lib/hooks";

type Quota = {
  limit: number;
  used: number;
  remaining: number;
  bulkRemaining: number;
  reserve: number;
  resetsAt: string;
};

type Kind = "bulk" | "quick";

type Campaign = {
  id: string;
  audience: string;
  subject: string;
  status: "active" | "completed" | "cancelled";
  total_count: number;
  sent_count: number;
  failed_count: number;
  skipped_count: number;
  pending_count: number;
  created_at: string;
  last_sent_at: string | null;
};

type Recipient = {
  id: number;
  email: string;
  name: string | null;
  status: string;
  error: string | null;
  sent_at: string | null;
};

type RecipientFilter = "pending" | "sent" | "failed" | "skipped";

const PAGE = 50;
const RESEND_BATCH_MAX = 100;

function Progress({ campaign }: { campaign: Campaign }) {
  const total = Math.max(campaign.total_count, 1);
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="flex h-2 overflow-hidden rounded bg-border">
      <div className="bg-success" style={{ width: pct(campaign.sent_count) }} />
      <div className="bg-danger" style={{ width: pct(campaign.failed_count) }} />
      <div className="bg-muted/40" style={{ width: pct(campaign.skipped_count) }} />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-0.5 text-lg font-semibold tabular-nums text-foreground", tone)}>
        {formatNumber(value)}
      </p>
    </div>
  );
}

function QuotaBar({ quota }: { quota: Quota }) {
  const pct = Math.min(100, (quota.used / Math.max(quota.limit, 1)) * 100);
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="size-4 text-muted" />
          <p className="text-sm font-medium text-foreground">
            Today&apos;s sending limit: {formatNumber(quota.used)} / {formatNumber(quota.limit)} used
          </p>
          <Badge tone={quota.remaining === 0 ? "red" : "green"}>
            {formatNumber(quota.remaining)} left
          </Badge>
        </div>
        <p className="text-xs text-muted">
          {quota.reserve > 0
            ? `${formatNumber(quota.reserve)} kept for quick emails · `
            : ""}
          Resets {formatDateTime(quota.resetsAt)}
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded bg-border">
        <div
          className={cn("h-full transition-all", quota.remaining === 0 ? "bg-danger" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}

function CampaignDetail({ id, quota, kind }: { id: string; quota: Quota; kind: Kind }) {
  const [filter, setFilter] = useState<RecipientFilter>("pending");
  const [offset, setOffset] = useState(0);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const changeFilter = (f: RecipientFilter) => {
    setFilter(f);
    setOffset(0);
  };

  const detail = useAdminQuery<{ campaign: Campaign }>("email-campaigns", `/emails/campaigns/${id}`);
  const recipients = useAdminQuery<{ recipients: Recipient[]; total: number }>(
    "email-campaigns",
    `/emails/campaigns/${id}/recipients`,
    { status: filter, limit: PAGE, offset }
  );

  const refresh = { invalidate: ["email-campaigns", "audit"] };

  const send = useAdminMutation(
    () =>
      api<{ sent: number; failed: number }>(`/emails/campaigns/${id}/send-next`, {
        method: "POST",
      }),
    {
      ...refresh,
      success: (r) =>
        `Sent ${formatNumber(r.sent)} email(s)` + (r.failed ? ` · ${formatNumber(r.failed)} failed` : ""),
      onSuccess: () => setConfirmSend(false),
    }
  );
  const retry = useAdminMutation(
    () => api(`/emails/campaigns/${id}/retry-failed`, { method: "POST" }),
    { ...refresh, success: "Failed recipients moved back to pending" }
  );
  const cancel = useAdminMutation(
    () => api(`/emails/campaigns/${id}/cancel`, { method: "POST" }),
    {
      ...refresh,
      success: "Campaign cancelled",
      onSuccess: () => setConfirmCancel(false),
    }
  );

  const c = detail.data?.campaign;
  if (detail.isLoading && !c) return <Spinner />;
  if (detail.error || !c) return <ErrorState error={detail.error} onRetry={() => detail.refetch()} />;

  const available = kind === "quick" ? quota.remaining : quota.bulkRemaining;
  const nextCount = Math.min(available, c.pending_count, RESEND_BATCH_MAX);
  const active = c.status === "active";
  const canSend = active && nextCount > 0 && !send.isPending;

  return (
    <div className="space-y-4">
      <Card
        title={c.subject}
        description={`Created ${formatDateTime(c.created_at)} · audience: ${c.audience}`}
        actions={<StatusBadge status={c.status} />}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Stat label="Total" value={c.total_count} />
          <Stat label="Sent" value={c.sent_count} tone="text-success" />
          <Stat label="Left to send" value={c.pending_count} />
          <Stat label="Failed" value={c.failed_count} tone={c.failed_count ? "text-danger" : undefined} />
          <Stat label="Skipped" value={c.skipped_count} />
        </div>
        <div className="mt-3">
          <Progress campaign={c} />
          <p className="mt-1.5 text-xs text-muted">
            {c.last_sent_at ? `Last batch ${timeAgo(c.last_sent_at)}` : "Nothing sent yet"}
            {c.skipped_count ? " · skipped = unsubscribed since the campaign was created" : ""}
          </p>
        </div>

        {active && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button disabled={!canSend} onClick={() => setConfirmSend(true)}>
              <Send className="size-4" />
              {kind === "quick"
                ? "Retry send"
                : nextCount > 0
                  ? `Send next ${formatNumber(nextCount)}`
                  : "Send next batch"}
            </Button>
            {c.failed_count > 0 && (
              <Button variant="secondary" disabled={retry.isPending} onClick={() => retry.mutate(undefined)}>
                <RotateCcw className="size-4" /> Retry {formatNumber(c.failed_count)} failed
              </Button>
            )}
            <Button variant="secondary" onClick={() => setConfirmCancel(true)}>
              <Ban className="size-4" /> Cancel campaign
            </Button>
            {available === 0 && c.pending_count > 0 && (
              <p className="text-sm text-danger">
                {kind === "bulk" && quota.remaining > 0
                  ? `Bulk limit reached for today — the last ${formatNumber(quota.reserve)} emails are kept for quick emails. `
                  : "Daily limit reached. "}
                You can send more after {formatDateTime(quota.resetsAt)}.
              </p>
            )}
          </div>
        )}
        {c.status === "completed" && c.failed_count > 0 && (
          <div className="mt-4">
            <Button variant="secondary" disabled={retry.isPending} onClick={() => retry.mutate(undefined)}>
              <RotateCcw className="size-4" /> Retry {formatNumber(c.failed_count)} failed
            </Button>
          </div>
        )}
      </Card>

      <Card
        title="Recipients"
        actions={
          <Tabs<RecipientFilter>
            value={filter}
            onChange={changeFilter}
            items={[
              { value: "pending", label: "Left to send", count: c.pending_count },
              { value: "sent", label: "Sent", count: c.sent_count },
              { value: "failed", label: "Failed", count: c.failed_count },
              { value: "skipped", label: "Skipped", count: c.skipped_count },
            ]}
          />
        }
      >
        {recipients.isLoading && !recipients.data ? (
          <Spinner />
        ) : recipients.error ? (
          <ErrorState error={recipients.error} onRetry={() => recipients.refetch()} />
        ) : !recipients.data?.recipients.length ? (
          <EmptyState title="Nobody here" />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>{filter === "sent" ? "Sent at" : filter === "pending" ? "Status" : "Reason"}</Th>
                </tr>
              </thead>
              <tbody>
                {recipients.data.recipients.map((r) => (
                  <Tr key={r.id}>
                    <Td className="text-foreground">{r.name ?? "—"}</Td>
                    <Td>{r.email}</Td>
                    <Td>
                      {filter === "sent"
                        ? formatDateTime(r.sent_at)
                        : filter === "pending"
                          ? r.status === "sending"
                            ? "Sending…"
                            : "Waiting"
                          : (r.error ?? "—")}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination offset={offset} limit={PAGE} total={recipients.data.total} onChange={setOffset} />
          </>
        )}
      </Card>

      <ConfirmModal
        open={confirmSend}
        title="Send next batch?"
        description={`This emails the next ${formatNumber(nextCount)} recipient(s) now. ${formatNumber(
          Math.max(c.pending_count - nextCount, 0)
        )} will still be left afterwards. It cannot be recalled.`}
        confirmLabel={`Send ${formatNumber(nextCount)}`}
        loading={send.isPending}
        onClose={() => setConfirmSend(false)}
        onConfirm={() => send.mutate(undefined)}
      />
      <ConfirmModal
        open={confirmCancel}
        title="Cancel this campaign?"
        description={`${formatNumber(c.pending_count)} recipient(s) who haven't been emailed yet will not receive it. Emails already sent are not affected.`}
        confirmLabel="Cancel campaign"
        tone="danger"
        loading={cancel.isPending}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => cancel.mutate(undefined)}
      />
    </div>
  );
}

export function CampaignsPanel({
  kind,
  selectedId,
  onSelect,
}: {
  kind: Kind;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const list = useAdminQuery<{ campaigns: Campaign[]; quota: Quota }>(
    "email-campaigns",
    "/emails/campaigns",
    { kind }
  );

  const campaigns = list.data?.campaigns;
  const quota = list.data?.quota;
  const activeId = selectedId ?? campaigns?.[0]?.id ?? null;

  if (list.isLoading && !list.data) return <Spinner />;
  if (list.error || !quota) return <ErrorState error={list.error} onRetry={() => list.refetch()} />;

  return (
    <div className="space-y-4">
      <QuotaBar quota={quota} />
      {!campaigns?.length ? (
        <EmptyState
          title={kind === "quick" ? "No quick emails yet" : "No campaigns yet"}
          description={
            kind === "quick"
              ? "Emails you send to selected users appear here."
              : "Create one from the New bulk campaign tab. Recipients are saved so you can send in daily batches."
          }
        />
      ) : (
        <div className="grid min-w-0 gap-4 lg:grid-cols-5 lg:gap-6">
          <div className="min-w-0 space-y-2 lg:col-span-2">
            {campaigns.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  "w-full rounded-xl border bg-surface p-3 text-left transition-colors",
                  activeId === c.id ? "border-primary ring-1 ring-primary" : "border-border hover:bg-ink/[0.02]"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-foreground">{c.subject}</p>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-2">
                  <Progress campaign={c} />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {formatNumber(c.sent_count)} sent · {formatNumber(c.pending_count)} left of{" "}
                  {formatNumber(c.total_count)} · {timeAgo(c.created_at)}
                </p>
              </button>
            ))}
          </div>
          <div className="min-w-0 lg:col-span-3">
            {activeId ? <CampaignDetail key={activeId} id={activeId} quota={quota} kind={kind} /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

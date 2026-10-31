"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Select,
  Spinner,
  StatusBadge,
  Textarea,
} from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { displayName, formatDateTime, timeAgo } from "@/lib/format";
import { PAGE_SIZE, useAdminMutation, useAdminQuery } from "@/lib/hooks";
import type { Paged, SupportRequest } from "@/lib/types";

type StatusFilter = "open" | "in_progress" | "resolved" | "closed" | "";
const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

function normalizeStatus(s: string | null): string {
  return !s || s === "pending" ? "open" : s;
}

function TicketDetail({ ticket }: { ticket: SupportRequest }) {
  const [reply, setReply] = useState("");
  const [replyStatus, setReplyStatus] = useState<string>("resolved");

  const update = useAdminMutation(
    (body: { status?: string; isRead?: boolean }) =>
      api(`/support/${ticket.id}`, { method: "PATCH", body }),
    { invalidate: ["support"] }
  );
  const send = useAdminMutation(
    () =>
      api(`/support/${ticket.id}/reply`, {
        method: "POST",
        body: { message: reply.trim(), status: replyStatus },
      }),
    {
      invalidate: ["support"],
      success: "Reply sent to the user's notifications",
      onSuccess: () => setReply(""),
    }
  );

  const { mutate: markRead } = update;
  useEffect(() => {
    if (!ticket.is_read) markRead({ isRead: true });
  }, [ticket.id, ticket.is_read, markRead]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">{ticket.subject}</h2>
          <StatusBadge status={normalizeStatus(ticket.status)} />
        </div>
        <Link href={`/users/${ticket.user_id}`} className="mt-2 flex items-center gap-2 hover:opacity-80">
          <Avatar src={ticket.user?.avatar_url} name={displayName(ticket.user)} size={24} />
          <span className="text-sm text-gray-700">{displayName(ticket.user)}</span>
          {ticket.user?.phone && <span className="text-xs text-gray-500">{ticket.user.phone}</span>}
        </Link>
        <p className="mt-1 text-xs text-gray-400">{formatDateTime(ticket.created_at)}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">{ticket.message}</p>
      </div>
      <div className="space-y-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
        <Field label="Reply" hint="Sent as an in-app + push notification. The user cannot reply in-thread; they can open a new ticket.">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply in Bangla or English…"
            maxLength={2000}
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Status</span>
            <Select
              value={normalizeStatus(ticket.status)}
              onChange={(e) => update.mutate({ status: e.target.value })}
              className="h-8 w-auto text-xs"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value)}
              className="h-8 w-auto text-xs"
              aria-label="Status after reply"
            >
              <option value="resolved">Reply & resolve</option>
              <option value="in_progress">Reply & keep in progress</option>
              <option value="closed">Reply & close</option>
            </Select>
            <Button size="sm" disabled={!reply.trim()} loading={send.isPending} onClick={() => send.mutate(undefined)}>
              <Send className="size-3.5" /> Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Support() {
  const [status, setStatus] = useState<StatusFilter>("open");
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, error, isPending, refetch } = useAdminQuery<Paged<"requests", SupportRequest>>(
    "support",
    "/support",
    { status, limit: PAGE_SIZE, offset }
  );
  const selected = data?.requests.find((r) => r.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        title="Support"
        description="Tickets submitted from the app's Support screen."
      />
      <div className="mb-4">
        <Tabs
          value={status}
          onChange={(v) => {
            setStatus(v);
            setOffset(0);
            setSelectedId(null);
          }}
          items={[
            { value: "open", label: "Open" },
            { value: "in_progress", label: "In progress" },
            { value: "resolved", label: "Resolved" },
            { value: "closed", label: "Closed" },
            { value: "", label: "All" },
          ]}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2" bodyClassName="p-0">
          {isPending ? (
            <Spinner />
          ) : error ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : !data.requests.length ? (
            <EmptyState title="No tickets here" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.requests.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "block w-full px-4 py-3 text-left transition hover:bg-surface-muted",
                      selectedId === t.id && "bg-primary-soft/50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "truncate text-sm",
                          t.is_read ? "text-gray-700" : "font-semibold text-gray-900"
                        )}
                      >
                        {!t.is_read && <span className="mr-1.5 inline-block size-2 rounded-full bg-primary" />}
                        {t.subject}
                      </span>
                      <span className="shrink-0 text-[11px] text-gray-400">{timeAgo(t.created_at)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {displayName(t.user)} · {t.message}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />}
        </Card>
        <Card className="min-h-96 lg:col-span-3" bodyClassName="p-0 h-full">
          {selected ? (
            <TicketDetail key={selected.id} ticket={selected} />
          ) : (
            <EmptyState title="Select a ticket" description="Pick a ticket on the left to read and reply." />
          )}
        </Card>
      </div>
    </>
  );
}

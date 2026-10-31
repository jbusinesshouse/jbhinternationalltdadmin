"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  Card,
  EmptyState,
  ErrorState,
  Select,
  Spinner,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { formatDateTime, shortId, titleCase } from "@/lib/format";
import { useAdminQuery } from "@/lib/hooks";
import type { AuditLog as AuditLogRow, Paged } from "@/lib/types";

const LIMIT = 50;

const TARGETS = [
  "profile",
  "product",
  "platform_fee_payment",
  "product_ad_request",
  "product_ad",
  "featured_store_request",
  "referral_creator_application",
  "referral_creator",
  "report",
  "support_request",
  "notification",
  "email",
  "category",
  "subcategory",
  "size",
];

function targetHref(type: string, id: string | null): string | null {
  if (!id) return null;
  if (type === "profile") return `/users/${id}`;
  if (type === "product") return `/products/${id}`;
  return null;
}

function summarize(details: Record<string, unknown> | null): string {
  if (!details) return "";
  return Object.entries(details)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(" · ");
}

export function AuditLog() {
  const [targetType, setTargetType] = useState("");
  const [offset, setOffset] = useState(0);
  const { data, error, isPending, refetch } = useAdminQuery<Paged<"logs", AuditLogRow>>(
    "audit",
    "/audit-logs",
    { targetType, limit: LIMIT, offset }
  );

  return (
    <>
      <PageHeader title="Audit log" description="Every change made from this admin panel, newest first." />
      <Card bodyClassName="p-0">
        <div className="border-b border-gray-100 px-5 py-3">
          <Select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setOffset(0);
            }}
            className="w-auto"
          >
            <option value="">All targets</option>
            {TARGETS.map((t) => (
              <option key={t} value={t}>
                {titleCase(t)}
              </option>
            ))}
          </Select>
        </div>
        {isPending ? (
          <Spinner />
        ) : error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !data.logs.length ? (
          <EmptyState
            title="No admin actions recorded"
            description="If you have taken actions, apply the admin panel migration so the audit table exists."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Admin</Th>
                <Th>Action</Th>
                <Th>Target</Th>
                <Th>Details</Th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log) => {
                const href = targetHref(log.target_type, log.target_id);
                return (
                  <Tr key={log.id}>
                    <Td className="whitespace-nowrap text-xs text-gray-500">{formatDateTime(log.created_at)}</Td>
                    <Td className="text-xs">{log.admin_email ?? shortId(log.admin_id)}</Td>
                    <Td>
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{log.action}</code>
                    </Td>
                    <Td className="whitespace-nowrap text-xs">
                      {titleCase(log.target_type)}{" "}
                      {href ? (
                        <Link href={href} className="font-mono text-primary hover:underline">
                          {shortId(log.target_id)}
                        </Link>
                      ) : (
                        <span className="font-mono text-gray-500">{shortId(log.target_id)}</span>
                      )}
                    </Td>
                    <Td className="max-w-md truncate text-xs text-gray-600" title={summarize(log.details)}>
                      {summarize(log.details)}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {data && <Pagination offset={offset} limit={LIMIT} total={data.total} onChange={setOffset} />}
      </Card>
    </>
  );
}

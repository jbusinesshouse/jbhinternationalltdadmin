"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import {
  Badge,
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
import { displayName, formatBdt, formatDateTime, shortId, timeAgo } from "@/lib/format";
import { PAGE_SIZE, useAdminMutation, useAdminQuery } from "@/lib/hooks";

type Tab = "attention" | "shipments" | "stores" | "ledger";

type Shipment = {
  id: string;
  order_id: string;
  seller_id: string;
  merchant_order_id: string;
  consignment_id: string | null;
  status: string;
  pathao_status: string | null;
  needs_attention: boolean;
  attention_reason: string | null;
  amount_to_collect: number;
  delivery_fee_quoted: number | null;
  delivery_fee_charged: number | null;
  cod_fee: number | null;
  item_weight_kg: number;
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  settled_at: string | null;
};

type PickupStore = {
  id: string;
  seller_id: string;
  contact_name: string;
  contact_number: string;
  address: string;
  city_id: number;
  zone_id: number;
  area_id: number;
  status: string;
  pathao_store_id: number | null;
  pathao_store_name: string | null;
  admin_note: string | null;
  last_error: string | null;
  updated_at: string;
  seller: { id: string; full_name: string | null; store_name: string | null; store_type: string | null; phone: string | null } | null;
};

type Balance = {
  seller_id: string;
  available: number;
  awaiting_settlement: number;
  paid_out: number;
  last_entry_at: string | null;
  seller: { id: string; full_name: string | null; store_name: string | null; phone: string | null } | null;
};

type Config = {
  enabled: boolean;
  sandbox: boolean;
  webhookConfigured: boolean;
  storeAutoApprove: boolean;
  maxParcelWeightKg: number;
  sellerPayoutIncludesServiceCharge: boolean;
};

const SHIPMENT_TONE: Record<string, "green" | "yellow" | "red" | "blue" | "purple" | "gray" | "orange"> = {
  queued: "yellow",
  submitting: "yellow",
  unknown: "orange",
  booked: "blue",
  pickup: "blue",
  in_transit: "purple",
  delivered: "green",
  partial_delivered: "orange",
  returned: "red",
  failed: "red",
  cancelled: "gray",
};

export function ShipmentStatus({ status }: { status: string }) {
  return <Badge tone={SHIPMENT_TONE[status] ?? "gray"}>{status.replace(/_/g, " ")}</Badge>;
}

/** Retry / link / cancel / resolve buttons for one shipment. Shared with order detail. */
export function ShipmentActions({ s, invalidate = [] }: { s: Shipment; invalidate?: string[] }) {
  const [action, setAction] = useState<"retry" | "cancel" | "resolve" | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [consignment, setConsignment] = useState("");
  const keys = ["shipments", "order", ...invalidate];

  const act = useAdminMutation(
    (v: { action: "retry" | "cancel" | "resolve" } | { action: "link"; consignment_id: string }) =>
      api(`/delivery/shipments/${s.id}/actions`, { method: "POST", body: v }),
    {
      invalidate: keys,
      success: (_r, v) => `Shipment: ${v.action} done`,
      onSuccess: () => {
        setAction(null);
        setLinkOpen(false);
        setConsignment("");
      },
    }
  );

  const canRetry = s.status === "failed" || s.status === "unknown";
  const canLink = s.status === "unknown" && !s.consignment_id;
  const canCancel = !["delivered", "partial_delivered", "cancelled"].includes(s.status);

  const COPY = {
    retry: {
      title: "Retry booking",
      body:
        s.status === "unknown"
          ? `Only retry if merchant order ID ${s.merchant_order_id} is NOT in the Pathao panel — otherwise use "Link consignment" to avoid a duplicate parcel.`
          : "Send the booking to Pathao again.",
      label: "Retry",
    },
    cancel: {
      title: "Mark parcel cancelled",
      body: "Do this after cancelling the parcel in the Pathao panel (or if it was never sent). The seller can then handle delivery manually.",
      label: "Mark cancelled",
    },
    resolve: { title: "Clear attention flag", body: "Mark this issue as handled.", label: "Resolve" },
  } as const;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {canLink && (
        <Button size="sm" variant="secondary" onClick={() => setLinkOpen(true)}>
          Link consignment
        </Button>
      )}
      {canRetry && (
        <Button size="sm" variant="secondary" onClick={() => setAction("retry")}>
          Retry
        </Button>
      )}
      {canCancel && (
        <Button size="sm" variant="ghost" onClick={() => setAction("cancel")}>
          Cancel
        </Button>
      )}
      {s.needs_attention && (
        <Button size="sm" variant="success" onClick={() => setAction("resolve")}>
          Resolve
        </Button>
      )}
      {action && (
        <ConfirmModal
          open
          title={COPY[action].title}
          description={COPY[action].body}
          confirmLabel={COPY[action].label}
          tone={action === "cancel" ? "danger" : "primary"}
          loading={act.isPending}
          onClose={() => setAction(null)}
          onConfirm={() => act.mutate({ action })}
        />
      )}
      {linkOpen && (
        <Modal
          open
          title="Link Pathao consignment"
          description={`Find merchant order ID ${s.merchant_order_id} in the Pathao panel and paste its consignment ID. It is verified with Pathao before saving.`}
          onClose={() => setLinkOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setLinkOpen(false)}>
                Cancel
              </Button>
              <Button
                loading={act.isPending}
                disabled={consignment.trim().length < 3}
                onClick={() => act.mutate({ action: "link", consignment_id: consignment.trim() })}
              >
                Link
              </Button>
            </>
          }
        >
          <Field label="Consignment ID">
            <Input value={consignment} onChange={(e) => setConsignment(e.target.value)} />
          </Field>
        </Modal>
      )}
    </div>
  );
}

function ShipmentsTable({ attention }: { attention: boolean }) {
  const [offset, setOffset] = useState(0);
  const [q, setQ] = useState("");
  const { data, error, isPending, refetch } = useAdminQuery<{ shipments: Shipment[]; total: number }>(
    "shipments",
    "/delivery/shipments",
    { attention: attention ? "true" : undefined, q, limit: PAGE_SIZE, offset },
    { refetchInterval: 60_000 }
  );

  return (
    <Card bodyClassName="p-0">
      <div className="border-b border-gray-100 px-5 py-3">
        <Input
          placeholder="Search merchant order ID or consignment…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOffset(0);
          }}
          className="max-w-sm"
        />
      </div>
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data?.shipments.length ? (
        <EmptyState title={attention ? "Nothing needs attention" : "No shipments yet"} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Parcel</Th>
                <Th>Status</Th>
                <Th>COD / fees</Th>
                <Th>Issue</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.shipments.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <p className="font-mono text-xs font-semibold">{s.merchant_order_id}</p>
                    <p className="text-xs text-gray-500">{s.consignment_id ?? "no consignment"}</p>
                    <Link href={`/orders/${s.order_id}`} className="text-xs text-primary hover:underline">
                      Order #{shortId(s.order_id)}
                    </Link>
                  </Td>
                  <Td>
                    <ShipmentStatus status={s.status} />
                    {s.pathao_status && <p className="mt-1 text-xs text-gray-500">{s.pathao_status}</p>}
                    <p className="text-[11px] text-gray-400">{timeAgo(s.updated_at)}</p>
                  </Td>
                  <Td className="text-xs">
                    <p>COD {formatBdt(s.amount_to_collect)}</p>
                    <p className="text-gray-500">
                      Buyer fee {formatBdt(s.delivery_fee_quoted)} · Pathao {s.delivery_fee_charged != null ? formatBdt(s.delivery_fee_charged) : "—"}
                    </p>
                    <p className="text-gray-500">{s.item_weight_kg} kg{s.settled_at ? " · settled" : ""}</p>
                  </Td>
                  <Td className="max-w-72 text-xs text-gray-700">
                    {s.attention_reason ?? s.last_error ?? "—"}
                  </Td>
                  <Td className="text-right">
                    <ShipmentActions s={s} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />
        </>
      )}
    </Card>
  );
}

function PickupStores() {
  const [status, setStatus] = useState("pending_review");
  const [offset, setOffset] = useState(0);
  const [pending, setPending] = useState<{ store: PickupStore; action: "approve" | "reject" | "disable" | "reopen" } | null>(null);
  const { data, error, isPending, refetch } = useAdminQuery<{ stores: PickupStore[]; total: number }>(
    "pickup-stores",
    "/delivery/pickup-stores",
    { status: status === "all" ? undefined : status, limit: PAGE_SIZE, offset }
  );
  const review = useAdminMutation(
    (v: { id: string; action: string; note: string }) =>
      api(`/delivery/pickup-stores/${v.id}`, { method: "PATCH", body: { action: v.action, note: v.note || null } }),
    { invalidate: ["pickup-stores"], success: (_r, v) => `Pickup store ${v.action}d`, onSuccess: () => setPending(null) }
  );

  return (
    <Card bodyClassName="p-0">
      <div className="border-b border-gray-100 px-5 py-3">
        <Tabs
          value={status}
          onChange={(v) => {
            setStatus(v);
            setOffset(0);
          }}
          items={[
            { value: "pending_review", label: "To review" },
            { value: "awaiting_pathao", label: "Waiting for Pathao" },
            { value: "active", label: "Active" },
            { value: "failed", label: "Failed" },
            { value: "rejected", label: "Rejected" },
            { value: "all", label: "All" },
          ]}
        />
      </div>
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data?.stores.length ? (
        <EmptyState title="No pickup stores here" />
      ) : (
        <>
          <ul className="divide-y divide-gray-100">
            {data.stores.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/users/${s.seller_id}`} className="font-medium hover:text-primary">
                      {s.seller ? displayName(s.seller) : shortId(s.seller_id)}
                    </Link>
                    <StatusBadge status={s.status} />
                    {s.seller?.store_type && <StatusBadge status={s.seller.store_type} />}
                  </div>
                  <p className="mt-1 text-gray-700">{s.address}</p>
                  <p className="text-xs text-gray-500">
                    {s.contact_name} · {s.contact_number} · city {s.city_id} / zone {s.zone_id} / area {s.area_id}
                  </p>
                  {s.pathao_store_id && (
                    <p className="text-xs text-gray-500">
                      Pathao store #{s.pathao_store_id} ({s.pathao_store_name})
                    </p>
                  )}
                  {(s.last_error || s.admin_note) && (
                    <p className="mt-1 text-xs text-red-600">{s.last_error ?? s.admin_note}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  {["pending_review", "rejected", "failed"].includes(s.status) && (
                    <Button size="sm" variant="success" onClick={() => setPending({ store: s, action: "approve" })}>
                      Approve
                    </Button>
                  )}
                  {["pending_review", "failed"].includes(s.status) && (
                    <Button size="sm" variant="secondary" onClick={() => setPending({ store: s, action: "reject" })}>
                      Reject
                    </Button>
                  )}
                  {["active", "awaiting_pathao", "approved", "failed"].includes(s.status) && (
                    <Button size="sm" variant="ghost" onClick={() => setPending({ store: s, action: "disable" })}>
                      Disable
                    </Button>
                  )}
                  {["disabled", "failed", "rejected", "active"].includes(s.status) && (
                    <Button size="sm" variant="ghost" onClick={() => setPending({ store: s, action: "reopen" })}>
                      Let seller edit
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />
        </>
      )}
      {pending && (
        <ConfirmModal
          open
          title={`${pending.action[0].toUpperCase()}${pending.action.slice(1)} pickup store`}
          description={
            pending.action === "approve"
              ? "The store will be created in Pathao under JBH's merchant account. Pathao approves it in about an hour."
              : pending.action === "reopen"
                ? "The seller can edit the address again. A new Pathao store will be created after approval; courier orders pause until then."
                : pending.action === "disable"
                  ? "Courier delivery stops for this seller's products until re-enabled."
                  : "The seller is notified with your note and can resubmit."
          }
          confirmLabel={pending.action}
          tone={pending.action === "approve" ? "success" : pending.action === "disable" ? "danger" : "primary"}
          note={{ label: pending.action === "reject" ? "Message to seller" : "Internal note", required: pending.action === "reject" }}
          loading={review.isPending}
          onClose={() => setPending(null)}
          onConfirm={(note) => review.mutate({ id: pending.store.id, action: pending.action, note })}
        />
      )}
    </Card>
  );
}

function Ledger() {
  const [offset, setOffset] = useState(0);
  const [payTo, setPayTo] = useState<Balance | null>(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const { data, error, isPending, refetch } = useAdminQuery<{ balances: Balance[]; total: number }>(
    "ledger",
    "/delivery/ledger/balances",
    { limit: PAGE_SIZE, offset }
  );
  const pay = useAdminMutation(
    (v: { sellerId: string; amount: number; reference: string }) =>
      api(`/delivery/ledger/${v.sellerId}/payouts`, {
        method: "POST",
        body: { amount: v.amount, reference: v.reference },
      }),
    {
      invalidate: ["ledger"],
      success: "Payout recorded",
      onSuccess: () => {
        setPayTo(null);
        setAmount("");
        setReference("");
      },
    }
  );
  const amountNum = Number(amount);

  return (
    <Card
      bodyClassName="p-0"
      description="Sales become available once Pathao pays JBH (order.paid). Record a payout after sending money to the seller."
    >
      {isPending ? (
        <Spinner />
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : !data?.balances.length ? (
        <EmptyState title="No seller balances yet" description="Entries appear when courier parcels are delivered." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Seller</Th>
                <Th>Available</Th>
                <Th>Awaiting Pathao</Th>
                <Th>Paid out</Th>
                <Th className="text-right" />
              </tr>
            </thead>
            <tbody>
              {data.balances.map((b) => (
                <Tr key={b.seller_id}>
                  <Td>
                    <Link href={`/users/${b.seller_id}`} className="font-medium hover:text-primary">
                      {b.seller ? displayName(b.seller) : shortId(b.seller_id)}
                    </Link>
                    <p className="text-xs text-gray-500">{b.seller?.phone}</p>
                  </Td>
                  <Td className="font-semibold">{formatBdt(b.available)}</Td>
                  <Td>{formatBdt(b.awaiting_settlement)}</Td>
                  <Td>{formatBdt(b.paid_out)}</Td>
                  <Td className="text-right">
                    <Button size="sm" disabled={Number(b.available) <= 0} onClick={() => setPayTo(b)}>
                      Record payout
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination offset={offset} limit={PAGE_SIZE} total={data.total} onChange={setOffset} />
        </>
      )}
      {payTo && (
        <Modal
          open
          title="Record seller payout"
          description={`Available: ${formatBdt(payTo.available)}. Send the money first (bank/bKash), then record it here.`}
          onClose={() => setPayTo(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setPayTo(null)}>
                Cancel
              </Button>
              <Button
                loading={pay.isPending}
                disabled={!(amountNum > 0) || amountNum > Number(payTo.available) || reference.trim().length < 3}
                onClick={() => pay.mutate({ sellerId: payTo.seller_id, amount: amountNum, reference: reference.trim() })}
              >
                Record
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <Field label="Amount (BDT)">
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Transaction reference (bank/bKash TrxID)">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </Field>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export function Delivery() {
  const [tab, setTab] = useState<Tab>("attention");
  const config = useAdminQuery<Config>("delivery-config", "/delivery/config");
  const sync = useAdminMutation(() => api("/delivery/locations/sync", { method: "POST" }), {
    success: "Location sync queued",
  });
  const c = config.data;

  return (
    <>
      <PageHeader
        title="Delivery (Pathao)"
        description="Courier bookings, seller pickup stores and seller payouts."
        actions={
          <Button variant="secondary" size="sm" loading={sync.isPending} onClick={() => sync.mutate(undefined)}>
            Sync Pathao locations
          </Button>
        }
      />
      {c && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone={c.enabled ? "green" : "red"}>{c.enabled ? "Courier ON" : "Courier OFF"}</Badge>
          <Badge tone={c.sandbox ? "yellow" : "blue"}>{c.sandbox ? "Sandbox" : "Live"}</Badge>
          <Badge tone={c.webhookConfigured ? "green" : "orange"}>
            {c.webhookConfigured ? "Webhook configured" : "Webhook not configured"}
          </Badge>
          <Badge tone="gray">Store review: {c.storeAutoApprove ? "auto" : "manual"}</Badge>
          <Badge tone="gray">Max parcel: {c.maxParcelWeightKg ? `${c.maxParcelWeightKg} kg` : "no cap"}</Badge>
          <Badge tone="gray">Payout: {c.sellerPayoutIncludesServiceCharge ? "incl. service charge" : "excl. service charge"}</Badge>
        </div>
      )}
      <div className="mb-4">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "attention", label: "Needs attention" },
            { value: "shipments", label: "All shipments" },
            { value: "stores", label: "Pickup stores" },
            { value: "ledger", label: "Seller payouts" },
          ]}
        />
      </div>
      {tab === "attention" && <ShipmentsTable key="attention" attention />}
      {tab === "shipments" && <ShipmentsTable key="all" attention={false} />}
      {tab === "stores" && <PickupStores />}
      {tab === "ledger" && <Ledger />}
      <p className="mt-4 text-xs text-gray-400">Times shown in local time · {formatDateTime(new Date().toISOString())}</p>
    </>
  );
}

export type { Shipment };

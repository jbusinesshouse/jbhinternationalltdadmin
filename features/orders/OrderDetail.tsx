"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Avatar,
  Card,
  ErrorState,
  KeyValue,
  Spinner,
  StatusBadge,
  Thumb,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { displayName, formatBdt, formatDateTime, shortId, titleCase } from "@/lib/format";
import { useAdminQuery } from "@/lib/hooks";
import type { OrderItem, ProfileLite } from "@/lib/types";
import { ShipmentActions, ShipmentStatus, type Shipment } from "@/features/delivery/Delivery";

type OrderDetailResponse = {
  order: {
    id: string;
    status: string;
    created_at: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    delivery_address: string | null;
    user_id: string;
    order_items: OrderItem[];
    total: number;
  };
  product: { id: string; name: string; image_url: string | null; status: string | null } | null;
  buyer: ProfileLite | null;
  seller: ProfileLite | null;
  timeline: {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string | null;
    is_read: boolean | null;
    action_completed: boolean | null;
    created_at: string;
  }[];
  review: { id: string; rating: number; comment: string | null; created_at: string } | null;
  /** Courier shipments (absent on older APIs). */
  shipments?: (Shipment & {
    events?: { event: string; pathao_status: string | null; source: string; applied: boolean; note: string | null; created_at: string }[];
  })[];
};

type CourierFields = {
  delivery_method?: string | null;
  delivery_fee?: number | string | null;
  cod_amount?: number | string | null;
  cod_fee?: number | string | null;
  parcel_weight_kg?: number | string | null;
};

function PartyCard({ title, person }: { title: string; person: ProfileLite | null }) {
  return (
    <Card title={title}>
      {person ? (
        <Link href={`/users/${person.id}`} className="flex items-center gap-3 hover:opacity-80">
          <Avatar src={person.avatar_url} name={displayName(person)} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{displayName(person)}</p>
            <p className="text-xs text-gray-500">{person.phone ?? "no phone"}</p>
          </div>
          <StatusBadge status={person.status ?? "active"} />
        </Link>
      ) : (
        <p className="text-sm text-gray-500">Profile not found.</p>
      )}
    </Card>
  );
}

export function OrderDetail({ id }: { id: string }) {
  const { data, error, isPending, refetch } = useAdminQuery<OrderDetailResponse>(
    "orders",
    `/orders/${id}`
  );

  if (isPending) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { order, product } = data;
  const courier = order as typeof order & CourierFields;
  const shipments = data.shipments ?? [];

  return (
    <>
      <PageHeader
        backHref="/orders"
        title={
          <span className="flex items-center gap-3">
            Order #{shortId(order.id)} <StatusBadge status={order.status} />
          </span>
        }
        description={`Placed ${formatDateTime(order.created_at)}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Items" bodyClassName="p-0">
            {product && (
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-3 border-b border-gray-100 px-5 py-3 hover:bg-gray-50"
              >
                <Thumb src={product.image_url} />
                <span className="font-medium text-gray-900">{product.name}</span>
                <StatusBadge status={product.status} />
              </Link>
            )}
            <Table>
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th>Color</Th>
                  <Th>Size</Th>
                  <Th>Qty</Th>
                  <Th>Base</Th>
                  <Th>Service charge</Th>
                  <Th>Unit (incl.)</Th>
                  <Th className="text-right">Line total</Th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item, i) => {
                  const base = item.base_price_snapshot;
                  const serviceChargeAmt = item.service_charge_amount_snapshot;
                  const serviceChargeRate = item.service_charge_rate_snapshot;
                  const hasServiceCharge =
                    base != null &&
                    serviceChargeAmt != null &&
                    Number(serviceChargeRate) > 0;
                  return (
                    <Tr key={item.id ?? i}>
                      <Td>{item.product_name_snapshot ?? "—"}</Td>
                      <Td>{item.product_variants?.color ?? "—"}</Td>
                      <Td>{item.product_sizes?.size ?? "—"}</Td>
                      <Td>{item.quantity}</Td>
                      <Td>
                        {base != null ? formatBdt(base) : "—"}
                      </Td>
                      <Td>
                        {hasServiceCharge
                          ? `${formatBdt(serviceChargeAmt)} (${Math.round(Number(serviceChargeRate) * 100)}%)`
                          : serviceChargeAmt != null
                            ? formatBdt(serviceChargeAmt)
                            : "—"}
                      </Td>
                      <Td>{formatBdt(item.price_snapshot)}</Td>
                      <Td className="text-right font-medium">
                        {formatBdt(item.quantity * Number(item.price_snapshot))}
                      </Td>
                    </Tr>
                  );
                })}
                <Tr>
                  <Td colSpan={7} className="text-right font-medium text-gray-900">
                    Total
                  </Td>
                  <Td className="text-right text-base font-semibold text-gray-900">
                    {formatBdt(order.total)}
                  </Td>
                </Tr>
              </tbody>
            </Table>
          </Card>

          <Card title="Activity" description="Notifications sent for this order">
            {data.timeline.length ? (
              <ol className="relative space-y-4 border-l border-gray-200 pl-5">
                {data.timeline.map((n) => (
                  <li key={n.id}>
                    <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border-2 border-white bg-primary" />
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="whitespace-pre-line text-xs text-gray-600">{n.message}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {formatDateTime(n.created_at)} · to{" "}
                      {n.user_id === order.user_id ? "buyer" : "seller"}
                      {n.type ? ` · ${titleCase(n.type)}` : ""}
                      {n.action_completed === false ? " · awaiting response" : ""}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-500">No notifications recorded.</p>
            )}
          </Card>

          {(courier.delivery_method === "pathao" || shipments.length > 0) && (
            <Card
              title="Courier (Pathao)"
              description={`Delivery fee ${formatBdt(courier.delivery_fee)} paid by buyer · COD ${formatBdt(courier.cod_amount)} · COD fee (JBH) ${formatBdt(courier.cod_fee)} · ${courier.parcel_weight_kg ?? "—"} kg`}
            >
              {shipments.length ? (
                <ul className="space-y-4">
                  {shipments.map((s) => (
                    <li key={s.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="text-sm">
                          <p className="font-mono text-xs font-semibold">{s.merchant_order_id}</p>
                          <p className="text-xs text-gray-500">Consignment: {s.consignment_id ?? "—"}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <ShipmentStatus status={s.status} />
                            {s.pathao_status && <span className="text-xs text-gray-500">{s.pathao_status}</span>}
                          </div>
                          {(s.attention_reason || s.last_error) && (
                            <p className="mt-1 text-xs text-red-600">{s.attention_reason ?? s.last_error}</p>
                          )}
                        </div>
                        <ShipmentActions s={s} invalidate={["orders"]} />
                      </div>
                      {s.events && s.events.length > 0 && (
                        <ol className="mt-3 space-y-1 border-t border-gray-100 pt-2 text-xs text-gray-600">
                          {s.events.map((e, i) => (
                            <li key={i}>
                              {formatDateTime(e.created_at)} · {e.event}
                              {e.pathao_status ? ` (${e.pathao_status})` : ""} · {e.source}
                              {!e.applied ? ` · not applied${e.note ? `: ${e.note}` : ""}` : ""}
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Not booked yet — waiting for the seller to accept the order.</p>
              )}
            </Card>
          )}

          {data.review && (
            <Card title="Buyer review">
              <p className="flex items-center gap-1 text-sm font-medium">
                <Star className="size-4 fill-amber-400 text-amber-400" /> {data.review.rating} / 5
              </p>
              {data.review.comment && <p className="mt-1 text-sm text-gray-600">{data.review.comment}</p>}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Delivery">
            <KeyValue
              items={[
                ["Name", order.full_name],
                ["Phone", order.phone],
                ["Email", order.email],
                ["City", order.city],
                ["Address", order.delivery_address],
              ]}
            />
          </Card>
          <PartyCard title="Buyer" person={data.buyer} />
          <PartyCard title="Seller" person={data.seller} />
        </div>
      </div>
    </>
  );
}

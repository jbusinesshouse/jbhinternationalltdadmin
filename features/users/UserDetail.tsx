"use client";

import { Ban, Bell, Lock, Repeat, Star, Unlock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  KeyValue,
  Spinner,
  StatusBadge,
  Textarea,
  Thumb,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { api } from "@/lib/api";
import {
  daysLeft,
  displayName,
  formatBdt,
  formatDate,
  formatDateTime,
  timeAgo,
  titleCase,
} from "@/lib/format";
import { useAdminMutation, useAdminQuery } from "@/lib/hooks";
import type { OrderRow, Profile, Report } from "@/lib/types";
import { useRouter } from "next/navigation";

type UserDetailResponse = {
  profile: Profile & { address: string | null };
  account: {
    email: string | null;
    phone: string | null;
    createdAt: string;
    lastSignInAt: string | null;
    emailConfirmedAt: string | null;
    isAnonymous: boolean;
  } | null;
  stats: { products: number; ordersAsBuyer: number; sales: number; reportsAgainst: number };
  recentProducts: {
    id: string;
    name: string;
    price: number;
    moq: number | null;
    status: string | null;
    is_deleted: boolean | null;
    created_at: string;
    image_url: string | null;
  }[];
  recentOrders: OrderRow[];
  reports: Report[];
  referralCreator: { id: string; name: string; code: string; active: boolean } | null;
  referredBy: { id: string; name: string; code: string } | null;
  featured: { starts_at: string; ends_at: string; is_active: boolean } | null;
};

type StatusAction = "active" | "freeze" | "restricted";

const STATUS_COPY: Record<StatusAction, { title: string; body: string; label: string }> = {
  freeze: {
    title: "Freeze account",
    body: "Blocks orders, seller actions, new chat/reviews, and hides the seller’s public listings. Use for fraud or abuse.",
    label: "Freeze",
  },
  restricted: {
    title: "Restrict account",
    body: "Blocks seller actions only (listing, editing, sales). Retail buyers can still order and chat. New wholesale sellers sit here until verified.",
    label: "Restrict",
  },
  active: {
    title: "Activate account",
    body: "The user can place orders and, for sellers, list products and manage sales again. Frozen sellers’ listings become public again.",
    label: "Activate",
  },
};

export function UserDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, error, isPending, refetch } = useAdminQuery<UserDetailResponse>(
    "users",
    `/users/${id}`
  );
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null);
  const [storeTypeOpen, setStoreTypeOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [featureOpen, setFeatureOpen] = useState(false);

  const setStatus = useAdminMutation(
    (vars: { status: StatusAction; reason: string }) =>
      api(`/profiles/${id}/status`, { method: "PATCH", body: vars }),
    {
      invalidate: ["users"],
      success: (_r, v) => `Account set to ${titleCase(v.status)}`,
      onSuccess: () => setStatusAction(null),
    }
  );

  if (isPending) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { profile, account, stats } = data;
  const name = displayName(profile);
  const status = (profile.status ?? "active") as StatusAction;
  const isSeller = profile.store_type === "wholesale" || profile.store_type === "retail";
  const featuredDays = data.featured ? daysLeft(data.featured.ends_at) : null;

  return (
    <>
      <PageHeader
        backHref="/users"
        title={
          <span className="flex items-center gap-3">
            <Avatar src={profile.avatar_url} name={name} size={40} />
            <span>
              {name}
              <span className="ml-3 inline-flex gap-1.5 align-middle">
                {profile.store_type && <StatusBadge status={profile.store_type} />}
                <StatusBadge status={status} />
                {featuredDays !== null && featuredDays > 0 && <Badge tone="orange">Featured</Badge>}
              </span>
            </span>
          </span>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setMessageOpen(true)}>
              <Bell className="size-3.5" /> Message
            </Button>
            {isSeller && (
              <Button variant="secondary" size="sm" onClick={() => setFeatureOpen(true)}>
                <Star className="size-3.5" /> Feature store
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setStoreTypeOpen(true)}>
              <Repeat className="size-3.5" /> Account type
            </Button>
            {status === "active" ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => setStatusAction("restricted")}>
                  <Lock className="size-3.5" /> Restrict
                </Button>
                <Button variant="danger" size="sm" onClick={() => setStatusAction("freeze")}>
                  <Ban className="size-3.5" /> Freeze
                </Button>
              </>
            ) : (
              <Button variant="success" size="sm" onClick={() => setStatusAction("active")}>
                <Unlock className="size-3.5" /> Activate
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Products", stats.products, `/products?sellerId=${id}`],
          ["Sales (as seller)", stats.sales, `/orders?sellerId=${id}`],
          ["Orders (as buyer)", stats.ordersAsBuyer, `/orders?buyerId=${id}`],
          ["Reports against", stats.reportsAgainst, null],
        ].map(([label, value, href]) => {
          const body = (
            <>
              <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-soft">
                {label}
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight text-ink">
                {value as number}
              </p>
            </>
          );
          return href ? (
            <Link
              key={label as string}
              href={href as string}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-sm)] transition hover:border-border-strong"
            >
              {body}
            </Link>
          ) : (
            <div
              key={label as string}
              className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-sm)]"
            >
              {body}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Profile">
            <KeyValue
              items={[
                ["Full name", profile.full_name],
                ["Store name", profile.store_name],
                ["Phone", profile.phone],
                ["Account type", titleCase(profile.store_type)],
                ["Role", profile.role],
                ["District / upazila", [profile.district, profile.upazila].filter(Boolean).join(" / ") || "—"],
                ["Address", profile.address],
                ["Joined", formatDateTime(profile.created_at)],
                ["User ID", <code key="id" className="text-xs">{profile.id}</code>],
                [
                  "Referred by",
                  data.referredBy ? `${data.referredBy.name} (${data.referredBy.code})` : "—",
                ],
              ]}
            />
          </Card>

          <Card
            title="Recent products"
            bodyClassName="p-0"
            actions={
              stats.products > 0 && (
                <Link href={`/products?sellerId=${id}`} className="text-xs font-medium text-primary hover:underline">
                  View all
                </Link>
              )
            }
          >
            {data.recentProducts.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>Price</Th>
                    <Th>MOQ</Th>
                    <Th>Status</Th>
                    <Th>Listed</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentProducts.map((p) => (
                    <Tr key={p.id} onClick={() => router.push(`/products/${p.id}`)}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Thumb src={p.image_url} size={36} />
                          <span className="max-w-64 truncate font-medium text-gray-900">{p.name}</span>
                        </div>
                      </Td>
                      <Td>{formatBdt(p.price)}</Td>
                      <Td>{p.moq ?? "—"}</Td>
                      <Td>
                        <StatusBadge status={p.is_deleted ? "deleted" : p.status} />
                      </Td>
                      <Td className="text-xs text-gray-500">{formatDate(p.created_at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState title="No products" />
            )}
          </Card>

          <Card title="Recent orders as buyer" bodyClassName="p-0">
            {data.recentOrders.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Product</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th>Placed</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <Tr key={o.id} onClick={() => router.push(`/orders/${o.id}`)}>
                      <Td className="max-w-64 truncate font-medium text-gray-900">
                        {o.order_items[0]?.product_name_snapshot ?? "—"}
                      </Td>
                      <Td>{formatBdt(o.total)}</Td>
                      <Td>
                        <StatusBadge status={o.status} />
                      </Td>
                      <Td className="text-xs text-gray-500">{timeAgo(o.created_at)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <EmptyState title="No orders" />
            )}
          </Card>

          <Card title="Reports involving this user">
            {data.reports.length ? (
              <ul className="divide-y divide-gray-100">
                {data.reports.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {titleCase(r.reason)} · {r.target_type === "product" ? "Product" : "Profile"}
                      </p>
                      {r.details && <p className="mt-0.5 text-xs text-gray-600">{r.details}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={r.status} />
                      <span className="text-[11px] text-gray-400">{timeAgo(r.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No reports" />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Login account">
            {account ? (
              <KeyValue
                items={[
                  ["Email", account.email ?? (account.isAnonymous ? "Guest (anonymous)" : "—")],
                  ["Auth phone", account.phone || "—"],
                  ["Email confirmed", account.emailConfirmedAt ? formatDate(account.emailConfirmedAt) : "No"],
                  ["Last sign-in", account.lastSignInAt ? timeAgo(account.lastSignInAt) : "Never"],
                ]}
              />
            ) : (
              <p className="text-sm text-gray-500">No auth user found for this profile.</p>
            )}
          </Card>

          {data.featured && (
            <Card title="Featured store">
              <KeyValue
                items={[
                  ["Started", formatDate(data.featured.starts_at)],
                  ["Ends", formatDate(data.featured.ends_at)],
                  ["Days left", featuredDays !== null ? Math.max(featuredDays, 0) : "—"],
                ]}
              />
            </Card>
          )}

          {data.referralCreator && (
            <Card title="Referral creator">
              <KeyValue
                items={[
                  ["Name", data.referralCreator.name],
                  ["Code", <code key="c" className="font-semibold">{data.referralCreator.code}</code>],
                  ["Status", <StatusBadge key="s" status={data.referralCreator.active ? "active" : "inactive"} />],
                ]}
              />
            </Card>
          )}
        </div>
      </div>

      {statusAction && (
        <ConfirmModal
          open
          title={STATUS_COPY[statusAction].title}
          description={STATUS_COPY[statusAction].body}
          confirmLabel={STATUS_COPY[statusAction].label}
          tone={statusAction === "active" ? "success" : "danger"}
          note={{ label: "Internal reason (audit log)", placeholder: "Why is this being changed?" }}
          loading={setStatus.isPending}
          onClose={() => setStatusAction(null)}
          onConfirm={(reason) => setStatus.mutate({ status: statusAction, reason })}
        />
      )}

      <StoreTypeModal
        open={storeTypeOpen}
        userId={id}
        current={profile.store_type}
        onClose={() => setStoreTypeOpen(false)}
      />
      <MessageModal open={messageOpen} userId={id} name={name} onClose={() => setMessageOpen(false)} />
      <FeatureModal open={featureOpen} sellerId={id} onClose={() => setFeatureOpen(false)} />
    </>
  );
}

function StoreTypeModal({
  open,
  userId,
  current,
  onClose,
}: {
  open: boolean;
  userId: string;
  current: string | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState<"wholesale" | "retail">(
    current === "retail" ? "wholesale" : "retail"
  );
  const mutation = useAdminMutation(
    (storeType: string) =>
      api(`/users/${userId}/store-type`, { method: "PATCH", body: { storeType } }),
    { invalidate: ["users"], success: "Account type updated", onSuccess: onClose }
  );

  return (
    <ConfirmModal
      open={open}
      title="Change account type"
      description="Users cannot change this themselves after signup. Wholesale listings require MOQ ≥ 6; existing products keep their current MOQ until edited."
      confirmLabel="Change type"
      loading={mutation.isPending}
      onClose={onClose}
      onConfirm={() => mutation.mutate(value)}
    >
      <div className="grid grid-cols-2 gap-2">
        {(["wholesale", "retail"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setValue(t)}
            className={`rounded-[var(--radius)] border px-3 py-3 text-sm font-medium capitalize transition ${
              value === t
                ? "border-primary bg-primary-soft text-ink"
                : "border-border text-muted hover:border-border-strong"
            }`}
          >
            {t}
            {current === t && (
              <span className="block text-xs font-normal text-muted-soft">current</span>
            )}
          </button>
        ))}
      </div>
    </ConfirmModal>
  );
}

function MessageModal({
  open,
  userId,
  name,
  onClose,
}: {
  open: boolean;
  userId: string;
  name: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const mutation = useAdminMutation(
    () =>
      api("/notifications", {
        method: "POST",
        body: { audience: "user", userId, title: title.trim(), message: message.trim() },
      }),
    {
      success: "Notification sent",
      onSuccess: () => {
        setTitle("");
        setMessage("");
        onClose();
      },
    }
  );

  return (
    <Modal
      open={open}
      title={`Message ${name}`}
      description="Delivered as an in-app notification and a push notification."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            loading={mutation.isPending}
            disabled={!title.trim() || !message.trim()}
            onClick={() => mutation.mutate(undefined)}
          >
            Send
          </Button>
        </>
      }
    >
      <Field label="Title">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </Field>
      <Field label="Message">
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
      </Field>
    </Modal>
  );
}

function FeatureModal({
  open,
  sellerId,
  onClose,
}: {
  open: boolean;
  sellerId: string;
  onClose: () => void;
}) {
  const [days, setDays] = useState("30");
  const mutation = useAdminMutation(
    () =>
      api("/featured-stores", {
        method: "POST",
        body: { sellerId, durationDays: Number(days) },
      }),
    { invalidate: ["users", "featured"], success: "Store is now featured", onSuccess: onClose }
  );
  const valid = Number.isInteger(Number(days)) && Number(days) > 0 && Number(days) <= 365;

  return (
    <ConfirmModal
      open={open}
      title="Feature this store"
      description="Shows the store in the app's featured stores strip. Replaces any current featured window."
      confirmLabel="Feature store"
      loading={mutation.isPending}
      confirmDisabled={!valid}
      onClose={onClose}
      onConfirm={() => mutation.mutate(undefined)}
    >
      <Field label="Duration (days)" hint="1–365 days, starting now">
        <Input type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} />
      </Field>
    </ConfirmModal>
  );
}

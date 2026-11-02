"use client";

import {
  ArrowUpRight,
  Banknote,
  Flag,
  LifeBuoy,
  Megaphone,
  Package,
  Star,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
  StatusBadge,
} from "@/components/ui/primitives";
import { Table, Td, Th, Tr } from "@/components/ui/Table";
import { cn } from "@/lib/cn";
import { displayName, formatBdt, formatNumber, timeAgo } from "@/lib/format";
import { useOverview } from "@/lib/hooks";
import type { Overview } from "@/lib/types";

const QUEUES: {
  key: keyof Overview["pending"];
  label: string;
  href: string;
  icon: typeof Flag;
}[] = [
  {
    key: "wholesaleActivations",
    label: "Wholesale activations",
    href: "/users?storeType=wholesale&status=restricted",
    icon: UserCheck,
  },
  { key: "adRequests", label: "Ad requests", href: "/ads", icon: Megaphone },
  {
    key: "featuredRequests",
    label: "Featured stores",
    href: "/featured",
    icon: Star,
  },
  {
    key: "referralApplications",
    label: "Creator applications",
    href: "/referrals",
    icon: UsersRound,
  },
  { key: "reports", label: "Open reports", href: "/reports", icon: Flag },
  {
    key: "unreadSupport",
    label: "Unread support",
    href: "/support",
    icon: LifeBuoy,
  },
];

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-400",
  processing: "bg-sky-500",
  shipped: "bg-violet-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-400",
  hold: "bg-primary",
};

function ActivityChart({ series }: { series: Overview["stats"]["series"] }) {
  const max = Math.max(1, ...series.map((d) => Math.max(d.signups, d.orders)));
  return (
    <div>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-dashed border-border/80" />
          ))}
        </div>
        <div className="relative flex h-36 items-end gap-px sm:h-44 sm:gap-[2px]">
        {series.map((d) => (
          <div
            key={d.day}
            className="group relative flex h-full flex-1 items-end gap-px"
            title={`${d.day}: ${d.signups} signups, ${d.orders} orders`}
          >
            <div
              className="flex-1 rounded-t bg-gradient-to-t from-primary/55 to-primary/30 transition-colors group-hover:from-primary group-hover:to-primary/70"
              style={{ height: `${(d.signups / max) * 100}%`, minHeight: d.signups ? 2 : 0 }}
            />
            <div
              className="flex-1 rounded-t bg-gradient-to-t from-ink to-ink-soft/80 transition-colors group-hover:from-ink-deep group-hover:to-ink"
              style={{ height: `${(d.orders / max) * 100}%`, minHeight: d.orders ? 2 : 0 }}
            />
          </div>
        ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted-soft sm:text-[11px]">
        <span>{series[0]?.day}</span>
        <span>{series[series.length - 1]?.day}</span>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-primary/70" aria-hidden /> Signups
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-ink" aria-hidden /> Orders
        </span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const router = useRouter();
  const { data, error, isPending, refetch } = useOverview();

  if (isPending) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { pending, stats } = data;
  const orderTotal = Math.max(stats.orders.total, 1);
  const attentionItems = QUEUES.map((q) => ({ ...q, count: pending[q.key] })).filter(
    (q) => q.count > 0
  );
  const totalAttention = attentionItems.reduce((sum, q) => sum + q.count, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Queues and marketplace health for JBH International Limited."
      />

      {/* Hero attention + metrics */}
      <div className="mb-5 grid min-w-0 gap-3 sm:mb-6 lg:mb-7 lg:grid-cols-12 lg:gap-4">
        <section className="relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br from-ink to-ink-deep text-white shadow-[var(--shadow-md)] lg:col-span-4">
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full bg-primary/25 blur-3xl" aria-hidden />
          <div className="relative px-4 py-5 sm:px-6 sm:py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
              Needs attention
            </p>
            <p className="mt-3 text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
              {formatNumber(totalAttention)}
            </p>
            <p className="mt-1.5 text-sm text-white/55">
              {totalAttention > 0
                ? `${attentionItems.length} active queue${attentionItems.length === 1 ? "" : "s"}`
                : "All review queues are clear"}
            </p>
          </div>
          <ul className="relative border-t border-white/10">
            {QUEUES.filter((q) => pending[q.key] > 0)
              .slice(0, 4)
              .map((q) => (
                <li key={q.key} className="border-b border-white/10 last:border-b-0">
                  <Link
                    href={q.href}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/[0.07] sm:px-6"
                  >
                    <q.icon className="size-3.5 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-white/80">{q.label}</span>
                    <span className="font-semibold tabular-nums text-white">
                      {pending[q.key]}
                    </span>
                    <ArrowUpRight className="size-3.5 text-white/35" aria-hidden />
                  </Link>
                </li>
              ))}
            {totalAttention === 0 && (
              <li className="px-4 py-3 text-sm text-white/45 sm:px-5">Nothing waiting.</li>
            )}
          </ul>
        </section>

        <section className="grid min-w-0 grid-cols-2 gap-3 lg:col-span-8 lg:grid-cols-3">
          {[
            {
              label: "Users",
              value: formatNumber(stats.users.total),
              sub: `+${formatNumber(stats.users.newLast7Days)} in 7 days`,
              icon: Users,
              tint: "bg-sky-50 text-sky-600 ring-sky-100",
            },
            {
              label: "Active products",
              value: formatNumber(stats.products.active),
              sub: `${formatNumber(stats.products.total)} listed`,
              icon: Package,
              tint: "bg-violet-50 text-violet-600 ring-violet-100",
            },
            {
              label: "Completed sales",
              value: formatBdt(stats.revenue.completedSalesTotal),
              sub: `${formatNumber(stats.orders.byStatus.completed ?? 0)} orders`,
              icon: Banknote,
              tint: "bg-emerald-50 text-emerald-600 ring-emerald-100",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface px-4 py-4 shadow-card transition-shadow last:col-span-2 hover:shadow-[var(--shadow-md)] sm:px-5 sm:py-5 lg:last:col-span-1"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted">{m.label}</p>
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg ring-1 ring-inset",
                    m.tint
                  )}
                  aria-hidden
                >
                  <m.icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-ink sm:text-[1.75rem]">
                {m.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-soft sm:text-xs">{m.sub}</p>
            </div>
          ))}
        </section>
      </div>

      {/* Full queue list — compact, correctly aligned */}
      <section className="mb-5 overflow-hidden rounded-2xl border border-border bg-surface shadow-card sm:mb-6 lg:mb-7">
        <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-3 sm:px-5">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">All queues</h2>
          <p className="text-xs text-muted">{QUEUES.length} queues</p>
        </div>
        <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
          {QUEUES.map((q) => {
            const count = pending[q.key];
            return (
              <li key={q.key}>
                <Link
                  href={q.href}
                  className={cn(
                    "flex items-center gap-3 bg-surface px-3.5 py-3 transition-colors hover:bg-surface-muted/80 sm:px-5",
                    count > 0 && "bg-primary-soft/40 hover:bg-primary-soft/70"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                      count > 0
                        ? "bg-primary/10 text-primary ring-primary/20"
                        : "bg-surface-muted text-muted-soft ring-border"
                    )}
                  >
                    <q.icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                    {q.label}
                  </span>
                  <span
                    className={cn(
                      "w-8 shrink-0 text-right text-sm font-semibold tabular-nums",
                      count > 0 ? "text-ink" : "text-muted-soft"
                    )}
                  >
                    {count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mb-5 grid min-w-0 gap-3 sm:mb-6 sm:gap-4 lg:mb-7 lg:grid-cols-3">
        <Card
          title="Last 30 days"
          description="Daily signups vs orders"
          className="min-w-0 lg:col-span-2"
        >
          <ActivityChart series={stats.series} />
        </Card>
        <Card title="Orders by status" description={`${formatNumber(stats.orders.total)} total`}>
          <div className="mb-4 flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-muted">
            {Object.entries(stats.orders.byStatus).map(([status, count]) => (
              <div
                key={status}
                className={ORDER_STATUS_COLORS[status] ?? "bg-gray-400"}
                style={{ width: `${(count / orderTotal) * 100}%` }}
                title={`${status}: ${count}`}
              />
            ))}
          </div>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(stats.orders.byStatus).map(([status, count]) => (
              <li key={status}>
                <Link
                  href={`/orders?status=${status}`}
                  className="flex items-center justify-between rounded-md px-1.5 py-1 text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn("size-2 rounded-full", ORDER_STATUS_COLORS[status])}
                      aria-hidden
                    />
                    <span className="capitalize">{status}</span>
                  </span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatNumber(count)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-[0.04em] text-muted-soft">
              Accounts
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-base font-semibold tabular-nums text-ink">
                  {formatNumber(stats.users.wholesale)}
                </p>
                <p className="text-[11px] text-muted">Wholesale</p>
              </div>
              <div>
                <p className="text-base font-semibold tabular-nums text-ink">
                  {formatNumber(stats.users.retail)}
                </p>
                <p className="text-[11px] text-muted">Retail</p>
              </div>
              <div>
                <p className="text-base font-semibold tabular-nums text-ink">
                  {formatNumber(stats.users.frozen + stats.users.restricted)}
                </p>
                <p className="text-[11px] text-muted">Held</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-3">
        <Card
          title="Latest orders"
          className="min-w-0 lg:col-span-2"
          bodyClassName="!p-0"
          actions={
            <Link
              href="/orders"
              className="text-xs font-semibold text-primary transition hover:text-primary-dark"
            >
              View all
            </Link>
          }
        >
          {stats.latestOrders.length ? (
            <>
              {/* Mobile: stacked rows — avoids wide-table page overflow */}
              <ul className="divide-y divide-border md:hidden">
                {stats.latestOrders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/orders/${o.id}`)}
                      className="flex w-full min-w-0 items-start gap-3 px-3 py-3 text-left transition hover:bg-surface-muted/70"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">
                          {o.order_items[0]?.product_name_snapshot ?? "—"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {o.full_name ?? "—"} · {timeAgo(o.created_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13px] font-semibold tabular-nums text-ink">
                          {formatBdt(o.total)}
                        </p>
                        <div className="mt-1 flex justify-end">
                          <StatusBadge status={o.status} />
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="hidden md:block">
                <Table>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>Buyer</Th>
                      <Th className="text-right">Total</Th>
                      <Th>Status</Th>
                      <Th>Placed</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.latestOrders.map((o) => (
                      <Tr key={o.id} onClick={() => router.push(`/orders/${o.id}`)}>
                        <Td className="max-w-[12rem] truncate font-medium text-foreground">
                          {o.order_items[0]?.product_name_snapshot ?? "—"}
                        </Td>
                        <Td className="max-w-[8rem] truncate">{o.full_name ?? "—"}</Td>
                        <Td className="whitespace-nowrap text-right font-medium tabular-nums text-foreground">
                          {formatBdt(o.total)}
                        </Td>
                        <Td>
                          <StatusBadge status={o.status} />
                        </Td>
                        <Td className="whitespace-nowrap text-xs tabular-nums text-muted-soft">
                          {timeAgo(o.created_at)}
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          ) : (
            <EmptyState title="No orders yet" />
          )}
        </Card>
        <Card
          title="New signups"
          className="min-w-0"
          actions={
            <Link
              href="/users"
              className="text-xs font-semibold text-primary transition hover:text-primary-dark"
            >
              View all
            </Link>
          }
        >
          {stats.latestUsers.length ? (
            <ul className="min-w-0 space-y-0.5">
              {stats.latestUsers.map((u) => (
                <li key={u.id} className="min-w-0">
                  <Link
                    href={`/users/${u.id}`}
                    className="flex min-w-0 items-center gap-3 rounded-lg px-1 py-2 transition hover:bg-surface-muted sm:px-2"
                  >
                    <Avatar src={u.avatar_url} name={displayName(u)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {displayName(u)}
                      </p>
                      <p className="truncate text-xs text-muted-soft">{timeAgo(u.created_at)}</p>
                    </div>
                    {u.store_type && (
                      <span className="shrink-0">
                        <StatusBadge status={u.store_type} />
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No recent signups" />
          )}
        </Card>
      </div>
    </>
  );
}

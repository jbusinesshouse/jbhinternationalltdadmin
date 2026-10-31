"use client";

import { EyeOff, Eye, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  KeyValue,
  Spinner,
  StatusBadge,
} from "@/components/ui/primitives";
import { api } from "@/lib/api";
import {
  displayName,
  formatBdt,
  formatDate,
  formatDateTime,
  timeAgo,
  titleCase,
} from "@/lib/format";
import { useAdminMutation, useAdminQuery } from "@/lib/hooks";
import type { ProfileLite, Report } from "@/lib/types";

type ProductDetailResponse = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    moq: number | null;
    status: string | null;
    active: boolean | null;
    is_deleted: boolean | null;
    created_at: string;
    seller_id: string;
    selected_category: string | null;
    product_images: { id: string; image_url: string; is_main: boolean | null }[];
    product_variants: {
      id: string;
      color: string | null;
      product_sizes: { id: string; size: string | null; stock: number | null }[];
    }[];
  };
  seller: ProfileLite | null;
  category: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    image_urls: string[] | null;
    created_at: string;
    buyer: ProfileLite | null;
  }[];
  ratingAvg: number | null;
  reports: Report[];
  orderCount: number;
  ads: { id: string; starts_at: string; ends_at: string; is_active: boolean }[];
};

type Action = "activate" | "deactivate" | "soft_delete";

const ACTION_COPY: Record<Action, { title: string; body: string; label: string }> = {
  deactivate: {
    title: "Hide this product",
    body: "The listing disappears from the feed and search and cannot be ordered. The seller can see it as inactive.",
    label: "Deactivate",
  },
  soft_delete: {
    title: "Delete this product",
    body: "Soft-deletes the listing. Past orders keep their snapshots. You can restore it later by activating.",
    label: "Delete",
  },
  activate: {
    title: "Activate this product",
    body: "The listing becomes visible and orderable again.",
    label: "Activate",
  },
};

/** Product descriptions are stored as HTML from the rich text editor. */
function plainText(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function ProductDetail({ id }: { id: string }) {
  const { data, error, isPending, refetch } = useAdminQuery<ProductDetailResponse>(
    "products",
    `/products/${id}`
  );
  const [action, setAction] = useState<Action | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const moderate = useAdminMutation(
    (vars: { action: Action; reason: string }) =>
      api(`/products/${id}/moderate`, { method: "PATCH", body: vars }),
    {
      invalidate: ["products", "reports"],
      success: (_r, v) => `Product ${ACTION_COPY[v.action].label.toLowerCase()}d`,
      onSuccess: () => setAction(null),
    }
  );

  if (isPending) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const { product, seller } = data;
  const status = product.is_deleted ? "deleted" : product.status;
  const images = product.product_images;
  const totalStock = product.product_variants.reduce(
    (sum, v) => sum + v.product_sizes.reduce((s, sz) => s + (Number(sz.stock) || 0), 0),
    0
  );
  const liveAd = data.ads.find((a) => a.is_active && new Date(a.ends_at) > new Date());

  return (
    <>
      <PageHeader
        backHref="/products"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {product.name} <StatusBadge status={status} />
            {liveAd && <StatusBadge status="live" />}
          </span>
        }
        description={`Listed ${formatDateTime(product.created_at)}`}
        actions={
          <>
            {status === "active" ? (
              <Button variant="secondary" size="sm" onClick={() => setAction("deactivate")}>
                <EyeOff className="size-3.5" /> Deactivate
              </Button>
            ) : (
              <Button variant="success" size="sm" onClick={() => setAction("activate")}>
                <Eye className="size-3.5" /> Activate
              </Button>
            )}
            {!product.is_deleted && (
              <Button variant="danger" size="sm" onClick={() => setAction("soft_delete")}>
                <Trash2 className="size-3.5" /> Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Listing">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                {images.length ? (
                  <>
                    <img
                      src={images[activeImage]?.image_url}
                      alt=""
                      className="aspect-square w-full rounded-lg border border-gray-200 bg-gray-50 object-contain"
                    />
                    {images.length > 1 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {images.map((img, i) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setActiveImage(i)}
                            className={`overflow-hidden rounded-md border-2 ${
                              i === activeImage ? "border-primary" : "border-transparent"
                            }`}
                          >
                            <img src={img.image_url} alt="" className="size-14 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400">
                    No images
                  </div>
                )}
              </div>
              <KeyValue
                items={[
                  ["Price", formatBdt(product.price)],
                  ["Minimum order qty", product.moq ?? "—"],
                  ["Category", data.category?.name ?? product.selected_category ?? "—"],
                  ["Subcategory", data.subcategory?.name ?? "—"],
                  ["Total stock", totalStock],
                  ["Orders", data.orderCount],
                  [
                    "Rating",
                    data.ratingAvg !== null ? `${data.ratingAvg} ★ (${data.reviews.length})` : "No reviews",
                  ],
                  ["Product ID", <code key="id" className="text-xs">{product.id}</code>],
                ]}
              />
            </div>
            {product.description && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="mb-1 text-xs text-gray-500">Description</p>
                <p className="whitespace-pre-line text-sm text-gray-700">{plainText(product.description)}</p>
              </div>
            )}
          </Card>

          <Card title="Variants & stock">
            {product.product_variants.length ? (
              <div className="space-y-3">
                {product.product_variants.map((v) => (
                  <div key={v.id} className="rounded-lg border border-gray-200 p-3">
                    <p className="mb-2 text-sm font-medium text-gray-900">{v.color || "Default"}</p>
                    <div className="flex flex-wrap gap-2">
                      {v.product_sizes.map((s) => (
                        <span
                          key={s.id}
                          className={`rounded-md px-2.5 py-1 text-xs ${
                            Number(s.stock) > 0 ? "bg-gray-100 text-gray-700" : "bg-red-50 text-red-600"
                          }`}
                        >
                          {s.size ?? "—"} · {s.stock ?? 0}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No variants" />
            )}
          </Card>

          <Card title={`Reviews (${data.reviews.length})`}>
            {data.reviews.length ? (
              <ul className="divide-y divide-gray-100">
                {data.reviews.map((r) => (
                  <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" /> {r.rating} ·{" "}
                        {displayName(r.buyer)}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                    {r.image_urls?.length ? (
                      <div className="mt-2 flex gap-2">
                        {r.image_urls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="" className="size-14 rounded-md object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No reviews yet" />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Seller">
            {seller ? (
              <Link href={`/users/${seller.id}`} className="flex items-center gap-3 hover:opacity-80">
                <Avatar src={seller.avatar_url} name={displayName(seller)} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{displayName(seller)}</p>
                  <p className="text-xs text-gray-500">
                    {titleCase(seller.store_type)} · {seller.phone ?? "no phone"}
                  </p>
                </div>
                <StatusBadge status={seller.status ?? "active"} />
              </Link>
            ) : (
              <p className="text-sm text-gray-500">Seller profile not found.</p>
            )}
          </Card>

          <Card title={`Reports (${data.reports.length})`}>
            {data.reports.length ? (
              <ul className="space-y-3">
                {data.reports.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{titleCase(r.reason)}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.details && <p className="mt-0.5 text-xs text-gray-600">{r.details}</p>}
                    <p className="mt-0.5 text-[11px] text-gray-400">{timeAgo(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No reports.</p>
            )}
          </Card>

          <Card title="Ad history">
            {data.ads.length ? (
              <ul className="space-y-2 text-sm">
                {data.ads.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span>
                      {formatDate(a.starts_at)} → {formatDate(a.ends_at)}
                    </span>
                    <StatusBadge
                      status={a.is_active && new Date(a.ends_at) > new Date() ? "live" : "ended"}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Never advertised.</p>
            )}
          </Card>
        </div>
      </div>

      {action && (
        <ConfirmModal
          open
          title={ACTION_COPY[action].title}
          description={ACTION_COPY[action].body}
          confirmLabel={ACTION_COPY[action].label}
          tone={action === "activate" ? "success" : "danger"}
          note={{ label: "Internal reason (audit log)", placeholder: "e.g. Counterfeit item reported" }}
          loading={moderate.isPending}
          onClose={() => setAction(null)}
          onConfirm={(reason) => moderate.mutate({ action, reason })}
        />
      )}
    </>
  );
}

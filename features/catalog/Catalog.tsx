"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Spinner,
} from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAdminMutation, useAdminQuery } from "@/lib/hooks";
import type { Catalog as CatalogData } from "@/lib/types";

type DeleteTarget = { kind: "category" | "subcategory" | "size"; id: string; name: string };

function InlineEdit({
  value,
  onSave,
  saving,
  className,
}: {
  value: string;
  onSave: (next: string) => void;
  saving?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <span className={cn("group inline-flex items-center gap-1.5", className)}>
        {value}
        <button
          type="button"
          onClick={() => {
            setDraft(value);
            setEditing(true);
          }}
          className="text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-gray-600"
          aria-label="Rename"
        >
          <Pencil className="size-3.5" />
        </button>
      </span>
    );
  }

  return (
    <form
      className="inline-flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
        setEditing(false);
      }}
    >
      <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 w-48" />
      <Button type="submit" size="sm" variant="ghost" loading={saving} aria-label="Save">
        <Check className="size-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)} aria-label="Cancel">
        <X className="size-3.5" />
      </Button>
    </form>
  );
}

function AddInline({
  placeholder,
  onAdd,
  saving,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
  saving?: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue("");
      }}
    >
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="h-8" />
      <Button type="submit" size="sm" variant="secondary" loading={saving} disabled={!value.trim()}>
        <Plus className="size-3.5" /> Add
      </Button>
    </form>
  );
}

export function Catalog() {
  const { data, error, isPending, refetch } = useAdminQuery<CatalogData>("catalog", "/catalog");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);

  const inv = { invalidate: ["catalog"] };
  const createCategory = useAdminMutation(
    (name: string) => api("/catalog/categories", { method: "POST", body: { name } }),
    { ...inv, success: "Category added" }
  );
  const renameCategory = useAdminMutation(
    (v: { id: string; name: string }) =>
      api(`/catalog/categories/${v.id}`, { method: "PATCH", body: { name: v.name } }),
    { ...inv, success: "Category renamed" }
  );
  const createSub = useAdminMutation(
    (v: { categoryId: string; name: string }) =>
      api(`/catalog/categories/${v.categoryId}/subcategories`, { method: "POST", body: { name: v.name } }),
    { ...inv, success: "Subcategory added" }
  );
  const renameSub = useAdminMutation(
    (v: { id: string; name: string }) =>
      api(`/catalog/subcategories/${v.id}`, { method: "PATCH", body: { name: v.name } }),
    { ...inv, success: "Subcategory renamed" }
  );
  const createSize = useAdminMutation(
    (v: { category: string; label: string; sortOrder: number }) =>
      api("/catalog/sizes", { method: "POST", body: v }),
    { ...inv, success: "Size added" }
  );
  const renameSize = useAdminMutation(
    (v: { id: string; label: string }) =>
      api(`/catalog/sizes/${v.id}`, { method: "PATCH", body: { label: v.label } }),
    { ...inv, success: "Size updated" }
  );
  const remove = useAdminMutation(
    (t: DeleteTarget) =>
      api(
        t.kind === "category"
          ? `/catalog/categories/${t.id}`
          : t.kind === "subcategory"
            ? `/catalog/subcategories/${t.id}`
            : `/catalog/sizes/${t.id}`,
        { method: "DELETE" }
      ),
    { ...inv, success: (_r, t) => `${t.name} deleted`, onSuccess: () => setDeleting(null) }
  );

  if (isPending) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  const selected = data.categories.find((c) => c.id === selectedId) ?? data.categories[0] ?? null;
  const sizes = selected ? data.sizes.filter((s) => s.category === selected.sizeKey) : [];

  return (
    <>
      <PageHeader
        title="Catalog"
        description="Categories, subcategories and size options sellers pick from when uploading products."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Categories" bodyClassName="p-0">
          <ul className="divide-y divide-gray-100">
            {data.categories.map((c) => (
              <li
                key={c.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 px-4 py-2.5",
                  selected?.id === c.id ? "bg-primary-soft/60" : "hover:bg-surface-muted"
                )}
                onClick={() => setSelectedId(c.id)}
              >
                <div className="min-w-0" onClick={(e) => selected?.id === c.id && e.stopPropagation()}>
                  {selected?.id === c.id ? (
                    <InlineEdit
                      value={c.name}
                      className="text-sm font-medium text-gray-900"
                      saving={renameCategory.isPending}
                      onSave={(name) => renameCategory.mutate({ id: c.id, name })}
                    />
                  ) : (
                    <span className="text-sm text-gray-800">{c.name}</span>
                  )}
                </div>
                <Badge>{c.productCount}</Badge>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 p-4">
            <AddInline
              placeholder="New category"
              saving={createCategory.isPending}
              onAdd={(name) => createCategory.mutate(name)}
            />
          </div>
        </Card>

        {selected ? (
          <div className="space-y-6 lg:col-span-2">
            <Card
              title={`Subcategories of ${selected.name}`}
              description={`${selected.productCount} active product(s) in this category`}
              actions={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleting({ kind: "category", id: selected.id, name: selected.name })}
                >
                  <Trash2 className="size-3.5" /> Delete category
                </Button>
              }
            >
              {selected.subcategories.length ? (
                <ul className="mb-4 divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {selected.subcategories.map((s) => (
                    <li key={s.id} className="flex items-center justify-between px-3 py-2">
                      <InlineEdit
                        value={s.name}
                        className="text-sm text-gray-800"
                        saving={renameSub.isPending}
                        onSave={(name) => renameSub.mutate({ id: s.id, name })}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{s.productCount} products</span>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-red-600"
                          aria-label="Delete subcategory"
                          onClick={() => setDeleting({ kind: "subcategory", id: s.id, name: s.name })}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="No subcategories" />
              )}
              <AddInline
                placeholder="New subcategory"
                saving={createSub.isPending}
                onAdd={(name) => createSub.mutate({ categoryId: selected.id, name })}
              />
            </Card>

            <Card
              title="Size options"
              description={
                <>
                  Shown when a seller picks <strong>{selected.name}</strong>. Stored under key{" "}
                  <code className="rounded bg-gray-100 px-1">{selected.sizeKey}</code>.
                </>
              }
            >
              {sizes.length ? (
                <div className="mb-4 flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm"
                    >
                      <InlineEdit
                        value={s.label}
                        saving={renameSize.isPending}
                        onSave={(label) => renameSize.mutate({ id: s.id, label })}
                      />
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-600"
                        aria-label="Delete size"
                        onClick={() => setDeleting({ kind: "size", id: s.id, name: s.label })}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-sm text-gray-500">No sizes. Sellers will not see size options for this category.</p>
              )}
              <AddInline
                placeholder="New size, e.g. XL or 42"
                saving={createSize.isPending}
                onAdd={(label) =>
                  createSize.mutate({ category: selected.name, label, sortOrder: (sizes.length + 1) * 10 })
                }
              />
            </Card>
          </div>
        ) : (
          <Card className="lg:col-span-2">
            <EmptyState title="No categories yet" description="Add your first category on the left." />
          </Card>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleting)}
        title={`Delete ${deleting?.kind}`}
        description={`Delete "${deleting?.name}"? This is blocked automatically if any product still uses it.`}
        confirmLabel="Delete"
        tone="danger"
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </>
  );
}

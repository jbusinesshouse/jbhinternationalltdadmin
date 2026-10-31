"use client";

import { Check, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button, StatusBadge } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/Tabs";
import { formatDateTime } from "@/lib/format";
import type { ReviewStatus } from "@/lib/types";

export function ReviewStatusTabs({
  value,
  onChange,
  pendingCount,
}: {
  value: ReviewStatus;
  onChange: (v: ReviewStatus) => void;
  pendingCount?: number;
}) {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      items={[
        { value: "pending", label: "Pending", count: pendingCount },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
        { value: "all", label: "All" },
      ]}
    />
  );
}

/**
 * Approve / reject controls for a pending item, or the recorded decision for
 * a reviewed one. `approveExtra` renders extra inputs inside the approve modal.
 */
export function ReviewActions({
  status,
  adminNote,
  reviewedAt,
  subject,
  approveDescription,
  rejectDescription,
  approveExtra,
  canApprove = true,
  loading,
  onDecide,
}: {
  status: string;
  adminNote?: string | null;
  reviewedAt?: string | null;
  subject: string;
  approveDescription: ReactNode;
  rejectDescription: ReactNode;
  approveExtra?: ReactNode;
  canApprove?: boolean;
  loading: boolean;
  onDecide: (decision: "approved" | "rejected", note: string) => void;
}) {
  const [open, setOpen] = useState<"approved" | "rejected" | null>(null);

  if (status !== "pending") {
    return (
      <div className="flex flex-col items-end gap-1 text-right">
        <StatusBadge status={status} />
        {reviewedAt && <span className="text-[11px] text-gray-400">{formatDateTime(reviewedAt)}</span>}
        {adminNote && <span className="max-w-60 text-xs text-gray-600">“{adminNote}”</span>}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setOpen("rejected")}>
          <X className="size-3.5" /> Reject
        </Button>
        <Button size="sm" variant="success" onClick={() => setOpen("approved")}>
          <Check className="size-3.5" /> Approve
        </Button>
      </div>
      {open && (
        <ConfirmModal
          open
          title={`${open === "approved" ? "Approve" : "Reject"} ${subject}`}
          description={open === "approved" ? approveDescription : rejectDescription}
          confirmLabel={open === "approved" ? "Approve" : "Reject"}
          tone={open === "approved" ? "success" : "danger"}
          note={{
            label: open === "approved" ? "Note to user (optional)" : "Reason shown to user",
            placeholder:
              open === "approved" ? "Optional message" : "e.g. Transaction ID could not be found",
            required: open === "rejected",
            hint: "Included in the user's in-app and push notification.",
          }}
          loading={loading}
          confirmDisabled={open === "approved" && !canApprove}
          onClose={() => setOpen(null)}
          onConfirm={(note) => onDecide(open, note)}
        >
          {open === "approved" && approveExtra}
        </ConfirmModal>
      )}
    </>
  );
}

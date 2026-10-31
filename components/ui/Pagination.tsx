"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { Button } from "./primitives";

export function Pagination({
  offset,
  limit,
  total,
  onChange,
}: {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}) {
  if (total <= limit && offset === 0) {
    return total ? (
      <p className="px-3 py-2.5 text-xs tabular-nums text-muted sm:px-5 sm:py-3">
        {formatNumber(total)} total
      </p>
    ) : null;
  }

  const from = total ? offset + 1 : 0;
  const to = Math.min(offset + limit, total);

  return (
    <div className="flex items-center justify-between border-t border-border px-3 py-2.5 sm:px-5 sm:py-3">
      <p className="text-xs tabular-nums text-muted">
        {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)}
      </p>
      <div className="flex gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={offset === 0}
          onClick={() => onChange(Math.max(offset - limit, 0))}
          aria-label="Previous page"
          className="px-2"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={to >= total}
          onClick={() => onChange(offset + limit)}
          aria-label="Next page"
          className="px-2"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

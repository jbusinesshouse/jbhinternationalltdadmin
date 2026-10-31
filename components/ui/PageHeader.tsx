import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  backHref,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0 max-w-2xl">
        {backHref && (
          <Link
            href={backHref}
            className="mb-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-foreground sm:mb-2"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Back
          </Link>
        )}
        <h1 className="text-lg font-semibold tracking-tight text-ink text-balance sm:text-[1.375rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted sm:mt-1.5 sm:line-clamp-none sm:text-sm">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[36rem] text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-border bg-ink/[0.03] px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-muted sm:px-4 sm:py-2.5",
        className
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-3 py-2.5 align-middle text-[13px] text-muted sm:px-4 sm:py-3", className)}
      {...props}
    />
  );
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-border/70 last:border-b-0 transition-colors duration-100",
        onClick && "cursor-pointer hover:bg-ink/[0.03]"
      )}
    >
      {children}
    </tr>
  );
}

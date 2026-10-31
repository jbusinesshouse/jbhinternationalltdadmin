import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/shell/AdminShell";
import { Spinner } from "@/components/ui/primitives";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

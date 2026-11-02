import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandPanel } from "./BrandPanel";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

function FormSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="h-11 animate-pulse rounded-[var(--radius)] bg-surface-muted" />
      <div className="h-11 animate-pulse rounded-[var(--radius)] bg-surface-muted" />
      <div className="h-11 animate-pulse rounded-[var(--radius)] bg-primary/20" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-surface">
      <BrandPanel />

      <main className="bg-app relative flex min-h-screen flex-1 flex-col px-6 py-10 sm:px-10 lg:justify-center lg:px-16 lg:py-12 xl:px-24">
        {/* Mobile brand strip */}
        <div className="mb-10 shrink-0 lg:hidden">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f99a50] to-primary-dark text-sm font-extrabold tracking-tight text-white shadow-[0_4px_12px_-2px_rgba(245,131,43,0.55)]">
              J
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-ink">JBH Admin</p>
              <p className="text-[11px] text-muted">JBH International Limited</p>
            </div>
          </div>
        </div>

        <div className="animate-fade-in mx-auto w-full max-w-[24rem] flex-1 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-md)] sm:p-8 lg:flex-none">
          <header className="mb-7">
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-soft lg:block">
              JBH International Limited
            </p>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-ink lg:mt-3">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Sign in to manage your marketplace operations.
            </p>
          </header>

          <Suspense fallback={<FormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-10 shrink-0 text-center text-[11px] text-muted-soft lg:hidden">
          © JBH International Limited
        </p>
      </main>
    </div>
  );
}

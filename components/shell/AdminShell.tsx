"use client";

import {
  Bell,
  ChevronRight,
  Flag,
  FolderTree,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Package,
  ScrollText,
  ShieldAlert,
  ShoppingCart,
  Star,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useOverview } from "@/lib/hooks";
import type { Overview } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: (p: Overview["pending"]) => number;
};

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Marketplace",
    items: [
      {
        href: "/users",
        label: "Users & stores",
        icon: Users,
        badge: (p) => p.wholesaleActivations,
      },
      { href: "/products", label: "Products", icon: Package },
      { href: "/orders", label: "Orders", icon: ShoppingCart },
    ],
  },
  {
    section: "Revenue",
    items: [
      { href: "/ads", label: "Product ads", icon: Megaphone, badge: (p) => p.adRequests },
      {
        href: "/featured",
        label: "Featured stores",
        icon: Star,
        badge: (p) => p.featuredRequests,
      },
      {
        href: "/referrals",
        label: "Referral program",
        icon: UsersRound,
        badge: (p) => p.referralApplications,
      },
    ],
  },
  {
    section: "Trust & support",
    items: [
      { href: "/reports", label: "Reports", icon: Flag, badge: (p) => p.reports },
      { href: "/support", label: "Support", icon: LifeBuoy, badge: (p) => p.unreadSupport },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/catalog", label: "Catalog", icon: FolderTree },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/emails", label: "Email broadcast", icon: Mail },
      { href: "/audit-log", label: "Audit log", icon: ScrollText },
    ],
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/users": "Users & stores",
  "/products": "Products",
  "/orders": "Orders",
  "/ads": "Product ads",
  "/featured": "Featured stores",
  "/referrals": "Referral program",
  "/reports": "Reports",
  "/support": "Support",
  "/catalog": "Catalog",
  "/notifications": "Notifications",
  "/emails": "Email broadcast",
  "/audit-log": "Audit log",
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function currentPageTitle(pathname: string) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const base = Object.keys(PAGE_TITLES)
    .filter((k) => k !== "/" && pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return base ? PAGE_TITLES[base] : "Admin";
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data } = useOverview();
  const pending = data?.pending;

  return (
    <nav
      className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-ink to-ink-deep text-white"
      aria-label="Admin navigation"
    >
      <div
        className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div className="relative flex h-16 items-center gap-3 border-b border-white/[0.08] px-5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f99a50] to-primary-dark text-sm font-extrabold tracking-tight text-white shadow-[0_4px_12px_-2px_rgba(245,131,43,0.55),inset_0_1px_0_rgba(255,255,255,0.3)]"
          aria-hidden
        >
          J
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-bold tracking-tight">JBH Admin</p>
          <p className="truncate text-[11px] text-white/45">International Limited</p>
        </div>
      </div>

      <div className="relative flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const count = pending && item.badge ? item.badge(pending) : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150",
                        active
                          ? "bg-gradient-to-r from-primary/20 to-white/[0.06] font-semibold text-white ring-1 ring-inset ring-white/10"
                          : "font-medium text-white/60 hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      {active && (
                        <span
                          className="absolute inset-y-2 -left-3 w-[3px] rounded-r-full bg-primary shadow-[0_0_12px_rgba(245,131,43,0.8)]"
                          aria-hidden
                        />
                      )}
                      <item.icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          active ? "text-primary" : "text-white/40 group-hover:text-white/75"
                        )}
                        strokeWidth={active ? 2.25 : 1.75}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span className="min-w-[1.35rem] rounded-full bg-primary px-1.5 text-center text-[10px] font-bold leading-[1.15rem] tabular-nums text-white shadow-[0_2px_6px_-1px_rgba(245,131,43,0.6)]">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative border-t border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold text-white/70">J Business House</p>
            <p className="text-[10px] text-white/40">Operations console</p>
          </div>
        </div>
      </div>
    </nav>
  );
}

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="bg-app flex min-h-screen items-center justify-center p-6">
      <div className="animate-pop-in w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-md)]">
        {children}
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { state, signOut, recheck } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (state.status === "signed_out") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [state.status, router, pathname]);

  if (state.status === "loading" || state.status === "signed_out") {
    return (
      <div className="bg-app flex min-h-screen items-center justify-center">
        <Spinner label="Checking admin session…" />
      </div>
    );
  }

  if (state.status === "not_admin") {
    return (
      <FullScreen>
        <ShieldAlert className="mx-auto mb-3 size-9 text-danger" aria-hidden />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Access denied</h1>
        <p className="mt-2 text-sm text-muted">{state.reason}</p>
        {state.email && <p className="mt-1 text-xs text-muted-soft">Signed in as {state.email}</p>}
        <Button className="mt-5" variant="secondary" onClick={() => void signOut()}>
          Sign out
        </Button>
      </FullScreen>
    );
  }

  if (state.status === "error") {
    return (
      <FullScreen>
        <ShieldAlert className="mx-auto mb-3 size-9 text-warning" aria-hidden />
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Cannot reach the admin API
        </h1>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={recheck}>Retry</Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </FullScreen>
    );
  }

  const pageTitle = currentPageTitle(pathname);

  return (
    <div className="bg-app min-h-screen">
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] lg:block"
        aria-label="Sidebar"
      >
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-ink-deep/60 backdrop-blur-[3px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="animate-slide-in relative h-full w-[var(--sidebar-width)] shadow-[var(--shadow-md)]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-[var(--sidebar-width)]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/80 bg-surface/80 px-3 backdrop-blur-xl sm:h-16 sm:gap-3 sm:px-5 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-ink lg:hidden">
              JBH Admin
            </p>
            <div className="hidden items-center gap-2 lg:flex">
              <p className="text-xs font-medium text-muted-soft">JBH International Limited</p>
              <ChevronRight className="size-3.5 text-border-strong" aria-hidden />
              <p className="text-sm font-semibold text-ink">{pageTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface py-1 pl-1 pr-1 shadow-[var(--shadow-sm)] sm:pr-3.5">
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink-soft to-ink text-[11px] font-bold uppercase text-white"
                aria-hidden
              >
                {(state.email ?? "A").charAt(0)}
              </span>
              <div className="hidden min-w-0 leading-tight sm:block">
                <p className="max-w-[11rem] truncate text-xs font-semibold text-foreground">
                  {state.email}
                </p>
                <p className="text-[10px] text-muted-soft">Administrator</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void signOut()} aria-label="Sign out">
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[90rem] overflow-x-hidden px-3 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Logo } from "@/components/brand";
import { Icon, type IconName } from "@/components/icons";
import { Avatar, cn, PageSpinner } from "@/components/ui";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Match only this exact path (for section roots like /patient). */
  exact?: boolean;
  /** A count to flag on the tab (e.g. open requests); hidden when 0. */
  badge?: number;
}

function NavBadge({ count, className }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-bold leading-none text-white shadow-xs",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * Lets only signed-in users with `role` through: anyone else goes to login (and comes back
 * to the same page, query string included, afterwards) or to their own area.
 */
export function RoleGate({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const here = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    } else if (user.role !== role) {
      router.replace(homeFor(user.role));
    }
  }, [loading, user, role, router]);

  if (loading || !user || user.role !== role) return <PageSpinner />;
  return <>{children}</>;
}

/**
 * Signed-in chrome: top bar on desktop, bottom tab bar on mobile. Must sit inside a
 * <Suspense> boundary — it reads the pathname (for the active tab), which suspends below
 * dynamic routes when Cache Components is on.
 */
export function AppShell({ nav, children }: { nav: NavItem[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo href={nav[0]?.href ?? "/"} />
          <nav className="hidden items-center gap-2 sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-11 items-center gap-2.5 rounded-xl px-4 text-base font-semibold transition-all",
                  isActive(item)
                    ? "bg-brand-50 text-brand-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon name={item.icon} className="size-5" />
                {item.label}
                <NavBadge count={item.badge} />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <Avatar name={user.full_name} size="sm" />
                <span className="hidden text-sm font-semibold text-slate-800 lg:inline">{user.full_name}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Icon name="logout" className="size-4" />
              <span className="hidden md:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg sm:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1.5 py-3 text-xs font-semibold transition-colors",
                isActive(item) ? "text-brand-600" : "text-slate-500 hover:text-slate-800",
              )}
            >
              <Icon name={item.icon} className="size-6" />
              {item.label}
              <NavBadge count={item.badge} className="absolute left-1/2 top-1.5 ml-2" />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

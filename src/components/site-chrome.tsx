"use client";

import Link from "next/link";

import { Logo } from "@/components/brand";
import { ButtonLink } from "@/components/ui";
import { homeFor, useAuth } from "@/lib/auth";

/** Header for the public pages (home, services, login, register). */
export function SiteHeader() {
  const { user, loading } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-base font-semibold text-slate-700 md:flex">
          <Link href="/services" className="transition-colors hover:text-brand-600">
            Services
          </Link>
          <Link href="/#how-it-works" className="transition-colors hover:text-brand-600">
            How it works
          </Link>
          <Link href="/#for-professionals" className="transition-colors hover:text-brand-600">
            For professionals
          </Link>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          {loading ? null : user ? (
            <ButtonLink href={homeFor(user.role)} size="md">
              My dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 text-base text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm text-slate-500">Healthcare at home — and flexible work for the people who provide it.</p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 font-medium">
          <Link href="/services" className="transition-colors hover:text-brand-600">
            Services
          </Link>
          <Link href="/register/professional" className="transition-colors hover:text-brand-600">
            Work with us
          </Link>
          <Link href="/login" className="transition-colors hover:text-brand-600">
            Log in
          </Link>
        </div>
      </div>
      <p className="border-t border-slate-100 py-6 text-center text-sm text-slate-400">
        © Mendyr · Prototype · Maps data © OpenStreetMap contributors
      </p>
    </footer>
  );
}

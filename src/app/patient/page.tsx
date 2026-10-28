"use client";

import Link from "next/link";

import { PatientBookingRow } from "@/components/booking-cards";
import { ProfessionIcon } from "@/components/brand";
import { Icon } from "@/components/icons";
import { useCatalog } from "@/components/service-catalog";
import { Alert, Button, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ACTIVE_STATUSES } from "@/lib/constants";
import { formatDateTime, formatINR } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Address } from "@/lib/types";

import { usePatientBookings } from "./patient-context";

export default function PatientHomePage() {
  const { user } = useAuth();
  const bookings = usePatientBookings();
  const addresses = useApi<Address[]>("/addresses");
  const { groups } = useCatalog();

  const allBookings = bookings.data ?? [];
  const activeBookings = allBookings
    .filter((b) => ACTIVE_STATUSES.includes(b.status))
    .sort((a, b) => a.scheduled_start_at.localeCompare(b.scheduled_start_at));

  const currentActive = activeBookings[0] ?? null;
  const firstName = user?.full_name?.trim() ? user.full_name.split(" ")[0] : "there";

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Hello, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            Certified nurses, physiotherapists and caregivers at your doorstep.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ButtonLink href="/patient/book" icon="plus" size="md" className="w-full sm:w-auto shadow-sm">
            Book Home Visit
          </ButtonLink>
        </div>
      </div>

      {/* Prominent Live Active Booking Card (if any booking is live) */}
      {currentActive && (
        <div className="rounded-3xl border-2 border-brand-200 bg-gradient-to-r from-brand-50/90 via-sky-50/60 to-white p-5 sm:p-6 shadow-md transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-brand-600" />
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-brand-800">
                  {currentActive.status === "searching"
                    ? "Looking for Nurse within 10 km"
                    : currentActive.status === "confirmed" || currentActive.status === "assigned"
                      ? "Nurse Assigned & Confirmed"
                      : "Visit Active"}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {currentActive.service_name_snapshot}
              </h2>
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <Icon name="calendar" className="size-4 text-brand-600 shrink-0" />
                <span>{formatDateTime(currentActive.scheduled_start_at)}</span>
                {currentActive.professional_name && (
                  <span className="font-semibold text-emerald-700">· Nurse: {currentActive.professional_name}</span>
                )}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <ButtonLink href={`/patient/bookings/${currentActive.id}`} size="md" variant="primary">
                Track Visit →
              </ButtonLink>
            </div>
          </div>
        </div>
      )}

      {/* Address Warning if none saved */}
      {addresses.data?.length === 0 && (
        <Alert tone="info" title="Add your home address">
          Add your address so qualified nurses in your neighborhood can reach you quickly.{" "}
          <Link href="/patient/account" className="font-bold underline text-brand-700 ml-1">
            Add address now →
          </Link>
        </Alert>
      )}

      {/* Quick Services Carousel / Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionHeading title="Popular Home Services" />
          <Link href="/services" className="text-sm font-bold text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>

        {!groups ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.flatMap(({ services }) =>
              services.slice(0, 2).map((service) => (
                <Link key={service.id} href={`/patient/book?service=${service.id}`} className="group block">
                  <Card className="flex items-center gap-4 p-5 transition-all hover:border-brand-500 hover:shadow-md cursor-pointer border-slate-200/90 group-active:scale-[0.99]">
                    <ProfessionIcon type={service.required_professional_type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base sm:text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">
                        {service.name}
                      </p>
                      <p className="mt-1 text-sm font-bold text-emerald-700">
                        {formatINR(service.base_price)}
                        <span className="text-xs font-normal text-slate-400 ml-1.5">({service.duration_minutes} min)</span>
                      </p>
                    </div>
                    <span className="shrink-0 size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <Icon name="chevronRight" className="size-4" />
                    </span>
                  </Card>
                </Link>
              )),
            )}
          </div>
        )}
      </section>

      {/* Upcoming Visits */}
      {activeBookings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionHeading title="Your Active Bookings" />
            <Link href="/patient/bookings" className="text-sm font-bold text-brand-600 hover:text-brand-700">
              All bookings ({allBookings.length}) →
            </Link>
          </div>
          <div className="space-y-3.5">
            {activeBookings.slice(0, 3).map((booking) => (
              <PatientBookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        </section>
      )}

      {/* Patient Trust & Safety Banner */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 text-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Icon name="shield" className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">100% Verified Nurses</p>
              <p className="text-xs text-slate-500">Aadhaar & clinical license verified</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
              <Icon name="pin" className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Within 10 km</p>
              <p className="text-xs text-slate-500">Fast arrival from nearby healthcare pros</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <Icon name="check" className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Pay After Visit</p>
              <p className="text-xs text-slate-500">No advance payment required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

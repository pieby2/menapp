"use client";

import Link from "next/link";

import { PatientBookingRow } from "@/components/booking-cards";
import { ProfessionIcon } from "@/components/brand";
import { Icon } from "@/components/icons";
import { useCatalog } from "@/components/service-catalog";
import { Alert, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ACTIVE_STATUSES } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Address } from "@/lib/types";

import { usePatientBookings } from "./patient-context";

export default function PatientHomePage() {
  const { user } = useAuth();
  const bookings = usePatientBookings();
  const addresses = useApi<Address[]>("/addresses");
  const { groups } = useCatalog();

  const upcoming = (bookings.data ?? [])
    .filter((b) => ACTIVE_STATUSES.includes(b.status))
    .sort((a, b) => a.scheduled_start_at.localeCompare(b.scheduled_start_at));
  const firstName = user?.full_name.split(" ")[0];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Hello, {firstName} 👋
          </h1>
          <p className="mt-2 text-base sm:text-lg text-slate-600">What healthcare service do you need at home today?</p>
        </div>
        <ButtonLink href="/patient/book" icon="plus" size="md">
          Book a visit
        </ButtonLink>
      </div>

      {addresses.data?.length === 0 && (
        <Alert tone="info" title="Add your home address">
          We use your address to match you with verified nurses and healthcare professionals near you.{" "}
          <Link href="/patient/account" className="font-bold underline text-brand-700">
            Add an address
          </Link>
        </Alert>
      )}

      {upcoming.length > 0 && (
        <section>
          <SectionHeading
            title="Upcoming Visits"
            action={
              <Link href="/patient/bookings" className="text-base font-bold text-brand-600 hover:text-brand-700">
                All bookings →
              </Link>
            }
          />
          <div className="space-y-4">
            {upcoming.slice(0, 3).map((booking) => (
              <PatientBookingRow key={booking.id} booking={booking} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading title="Book a Service" />
        {!groups ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.flatMap(({ services }) =>
              services.map((service) => (
                <Link key={service.id} href={`/patient/book?service=${service.id}`}>
                  <Card className="flex items-center gap-4 p-5 sm:p-6 transition-all hover:border-brand-500 hover:shadow-md cursor-pointer">
                    <ProfessionIcon type={service.required_professional_type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold text-slate-900">{service.name}</p>
                      <p className="mt-0.5 text-base font-semibold text-slate-600">{formatINR(service.base_price)} <span className="text-xs font-normal text-slate-400">+ GST</span></p>
                    </div>
                    <Icon name="chevronRight" className="size-5 text-slate-400 shrink-0" />
                  </Card>
                </Link>
              )),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";

import { PatientBookingRow } from "@/components/booking-cards";
import { Alert, ButtonLink, Chip, EmptyState, PageHeader, PageSpinner } from "@/components/ui";
import { ACTIVE_STATUSES } from "@/lib/constants";

import { usePatientBookings } from "../patient-context";

export default function PatientBookingsPage() {
  const { data, error, loading, reload } = usePatientBookings();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  const all = data ?? [];
  const upcoming = all
    .filter((b) => ACTIVE_STATUSES.includes(b.status))
    .sort((a, b) => a.scheduled_start_at.localeCompare(b.scheduled_start_at));
  const past = all.filter((b) => !ACTIVE_STATUSES.includes(b.status));
  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="My Home Visits"
        subtitle="Track ongoing requests and past healthcare appointments."
        action={
          <ButtonLink href="/patient/book" icon="plus" size="md">
            New Visit
          </ButtonLink>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2.5 border-b border-slate-200/80 pb-3">
        <Chip selected={tab === "upcoming"} onClick={() => setTab("upcoming")}>
          Upcoming ({upcoming.length})
        </Chip>
        <Chip selected={tab === "past"} onClick={() => setTab("past")}>
          Past Visits ({past.length})
        </Chip>
      </div>

      {error ? (
        <Alert tone="error">{error.message}</Alert>
      ) : loading && all.length === 0 ? (
        <PageSpinner label="Loading your visits…" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={tab === "upcoming" ? "No upcoming visits scheduled" : "No past visits yet"}
          action={
            tab === "upcoming" && (
              <ButtonLink href="/patient/book" icon="plus" size="md">
                Book a Nurse or Physio
              </ButtonLink>
            )
          }
        >
          {tab === "upcoming"
            ? "Need a nurse, dressing change, or physiotherapist at home? Book in seconds."
            : "Your completed appointments and medical visit records will appear here."}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {shown.map((booking) => (
            <PatientBookingRow key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}

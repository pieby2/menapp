"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import { Alert, Button, Card, Field, PageSpinner, Textarea } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { displayPhone, durationLabel, formatDateTime, formatINR, formatTime } from "@/lib/format";
import { useApi, useNow } from "@/lib/hooks";
import type { ProBooking } from "@/lib/types";

const STARTABLE = ["assigned", "confirmed", "en_route"];
const EARLY_START_MS = 2 * 60 * 60 * 1000; // matches the backend's 2-hour window

function CompleteVisitForm({ booking, onDone }: { booking: ProBooking; onDone: (b: ProBooking) => void }) {
  const toast = useToast();
  const [notes, setNotes] = useState("");
  const [vitals, setVitals] = useState("");
  const [saving, setSaving] = useState(false);

  async function complete() {
    setSaving(true);
    try {
      const updated = await api<ProBooking>(`/bookings/${booking.id}/check-out`, {
        method: "POST",
        body: { visit_summary_notes: notes.trim() || null, vitals_recorded: vitals.trim() || null },
      });
      toast.success(`Visit completed — ${formatINR(booking.earning_amount)} earned.`);
      onDone(updated);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 sm:p-7 border-emerald-200 bg-emerald-50/20">
      <h2 className="text-xl font-bold text-slate-900">Finish the visit</h2>
      <p className="mt-1 text-base text-slate-600">The patient sees your notes in their booking once completed.</p>
      <div className="mt-5 space-y-5">
        <Field label="Visit notes" htmlFor="visit-notes" optional>
          <Textarea
            id="visit-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What you did, how the patient is doing, anything to watch for."
          />
        </Field>
        <Field label="Vitals" htmlFor="vitals" optional>
          <Textarea
            id="vitals"
            rows={2}
            value={vitals}
            onChange={(e) => setVitals(e.target.value)}
            placeholder="e.g. BP 128/82, pulse 76, SpO2 97%, temp 98.4°F"
          />
        </Field>
        <Button onClick={complete} loading={saving} icon="check" size="md">
          Mark visit completed
        </Button>
      </div>
    </Card>
  );
}

export function ProBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: booking, error, mutate } = useApi<ProBooking>(`/bookings/professional/${id}`, { pollMs: 30_000 });
  const [busy, setBusy] = useState<"start" | "release" | null>(null);
  const now = useNow();

  if (error && !booking) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{error.message}</Alert>
        <Link href="/pro/bookings" className="text-base font-semibold text-brand-700 hover:underline">
          ← Back to my bookings
        </Link>
      </div>
    );
  }
  if (!booking) return <PageSpinner />;

  const startsAt = Date.parse(booking.scheduled_start_at);
  const minutes = (Date.parse(booking.scheduled_end_at) - startsAt) / 60_000;
  const startable = STARTABLE.includes(booking.status);
  const tooEarly = startable && startsAt - now > EARLY_START_MS;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`;

  async function start() {
    setBusy("start");
    try {
      mutate(await api<ProBooking>(`/bookings/${booking!.id}/check-in`, { method: "POST" }));
      toast.success("Visit started.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function release() {
    if (!window.confirm("Hand this booking back? It will be offered to other professionals.")) return;
    setBusy("release");
    try {
      await api(`/bookings/${booking!.id}/release`, { method: "POST" });
      toast.success("Booking handed back. The patient will be matched with someone else.");
      router.replace("/pro/bookings");
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/pro/bookings" className="inline-flex items-center gap-2 text-base font-semibold text-slate-600 hover:text-slate-900 transition-colors">
        <Icon name="chevronLeft" className="size-5" /> My bookings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{booking.service_name}</h1>
          <p className="mt-1.5 text-base font-medium text-slate-500">Booking code: <span className="font-mono text-slate-800 font-bold">{booking.booking_code}</span></p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={booking.status} />
          <p className="text-base font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            You earn {formatINR(booking.earning_amount)}
          </p>
        </div>
      </div>

      <Card className="divide-y divide-slate-100">
        <div className="flex gap-4 p-5">
          <Icon name="calendar" className="mt-0.5 size-5 shrink-0 text-slate-400" />
          <div>
            <p className="text-base font-semibold text-slate-900">{formatDateTime(booking.scheduled_start_at)}</p>
            <p className="text-sm text-slate-500">{durationLabel(minutes)} · India Standard Time</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 p-5">
          <Icon name="user" className="size-5 shrink-0 text-slate-400" />
          <div className="flex-1 min-w-[200px]">
            <p className="text-base font-bold text-slate-900">{booking.patient_name}</p>
            <p className="text-sm font-medium text-slate-500">{displayPhone(booking.patient_phone)}</p>
          </div>
          <a
            href={`tel:${booking.patient_phone}`}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-base font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 active:scale-95 transition-all"
          >
            <Icon name="phone" className="size-4.5" /> Call patient
          </a>
        </div>
        <div className="flex flex-wrap items-start gap-4 p-5">
          <Icon name="pin" className="mt-1 size-5 shrink-0 text-slate-400" />
          <div className="flex-1 min-w-[200px]">
            <p className="text-base font-medium text-slate-900 leading-relaxed">{booking.address}</p>
            {booking.landmark && <p className="mt-0.5 text-sm text-slate-500">Landmark: {booking.landmark}</p>}
            {booking.instructions && <p className="mt-1.5 text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg">“{booking.instructions}”</p>}
          </div>
          <a
            href={directions}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-base font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Icon name="navigation" className="size-4.5" /> Directions
          </a>
        </div>
        {booking.patient_notes && (
          <div className="flex gap-4 p-5 bg-slate-50/50">
            <Icon name="list" className="mt-0.5 size-5 shrink-0 text-slate-400" />
            <p className="whitespace-pre-line text-base text-slate-700 leading-relaxed">{booking.patient_notes}</p>
          </div>
        )}
      </Card>

      {startable && (
        <Card className="p-6 sm:p-7 border-brand-200 bg-brand-50/20">
          <h2 className="text-xl font-bold text-slate-900">Start the visit</h2>
          <p className="mt-1.5 text-base text-slate-600">
            {tooEarly
              ? `You can start from 2 hours before — at ${formatTime(new Date(startsAt - EARLY_START_MS))} on the day.`
              : "Tap start when you reach the patient's address."}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button onClick={start} loading={busy === "start"} disabled={tooEarly || busy !== null} icon="check" size="md">
              Start visit
            </Button>
            <Button variant="dangerGhost" size="md" loading={busy === "release"} disabled={busy !== null} onClick={release}>
              Can&apos;t make it
            </Button>
          </div>
        </Card>
      )}

      {booking.status === "in_progress" && <CompleteVisitForm booking={booking} onDone={mutate} />}

      {booking.status === "completed" && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900">Visit completed</h2>
          {booking.completed_at && (
            <p className="mt-1 text-base text-slate-500">Finished at {formatDateTime(booking.completed_at)}</p>
          )}
          {booking.visit_summary_notes && (
            <p className="mt-3 whitespace-pre-line text-base text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">{booking.visit_summary_notes}</p>
          )}
        </Card>
      )}

      {booking.status === "cancelled" && (
        <Alert tone="error" title="The patient cancelled this booking" />
      )}
    </div>
  );
}

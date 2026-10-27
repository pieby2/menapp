"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BookingProgress } from "@/components/booking-cards";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  cn,
  PageSpinner,
  Spinner,
  Stars,
  Textarea,
} from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { ACTIVE_STATUSES, PROFESSION_LABEL } from "@/lib/constants";
import { displayPhone, durationLabel, formatDateTime, formatINR, formatTime } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Booking } from "@/lib/types";

const CANCEL_REASONS = [
  "Plans changed",
  "Booked by mistake",
  "Found care elsewhere",
  "Taking too long",
  "Other",
];

function LiveSearchingBanner({ booking }: { booking: Booking }) {
  return (
    <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/40 to-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
          <span className="absolute -inset-1 rounded-2xl bg-amber-400 opacity-40 animate-ping" />
          <Icon name="locate" className="size-6 text-white relative z-10" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-amber-800">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" /> Live Request
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Within 10 km radius
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            Searching for qualified nurses near you…
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Your request has been broadcast to all verified healthcare professionals in your area. As soon as a nurse accepts, their full profile and contact details will appear here immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (rating === 0) {
      toast.error("Please select a star rating first.");
      return;
    }
    setSaving(true);
    try {
      await api("/reviews", {
        method: "POST",
        body: { booking_id: bookingId, rating, comment: comment.trim() || null },
      });
      toast.success("Thank you for your rating!");
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 border-brand-200 bg-brand-50/20">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900">How was your visit?</h3>
      <p className="mt-1 text-sm text-slate-600">Rate your healthcare professional to help us maintain high clinical standards.</p>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="cursor-pointer rounded-xl p-1 transition-transform hover:scale-110 active:scale-95"
          >
            <Icon
              name="star"
              className={cn("size-8 sm:size-9", n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300")}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="mt-4 space-y-4">
          <Textarea
            rows={3}
            placeholder="Share feedback on punctuality, care quality, or hygiene (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button onClick={submit} loading={saving}>
            Submit review
          </Button>
        </div>
      )}
    </Card>
  );
}

function CancelPanel({ booking, onCancelled }: { booking: Booking; onCancelled: (b: Booking) => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [saving, setSaving] = useState(false);

  async function cancel() {
    setSaving(true);
    try {
      const updated = await api<Booking>(`/bookings/${booking.id}/cancel`, {
        method: "POST",
        body: { reason },
      });
      toast.success("Booking cancelled.");
      onCancelled(updated);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="pt-2">
        <Button variant="dangerGhost" onClick={() => setOpen(true)} size="sm">
          Cancel this booking
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6 border-rose-200 bg-rose-50/30">
      <h3 className="text-lg sm:text-xl font-bold text-slate-900">Cancel this visit request?</h3>
      <p className="mt-1 text-sm sm:text-base text-slate-600">Please choose a reason so we can improve our service:</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {CANCEL_REASONS.map((r) => (
          <Chip key={r} selected={reason === r} onClick={() => setReason(r)}>
            {r}
          </Chip>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button variant="danger" loading={saving} onClick={cancel} size="md">
          Confirm Cancellation
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)} size="md">
          Keep Booking
        </Button>
      </div>
    </Card>
  );
}

export function PatientBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [live, setLive] = useState(true);

  // Poll every 3 seconds for active requests so nurse acceptance reflects immediately!
  const { data: booking, error, mutate, reload } = useApi<Booking>(`/bookings/${id}`, {
    pollMs: live ? 3_000 : undefined,
  });

  const isLive = booking ? ACTIVE_STATUSES.includes(booking.status) : true;
  if (live !== isLive) setLive(isLive);

  // Re-poll immediately on window focus
  useEffect(() => {
    function onFocus() {
      void reload();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload]);

  if (error && !booking) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <Alert tone="error">{error.message}</Alert>
        <Link href="/patient/bookings" className="inline-block text-base font-semibold text-brand-700 hover:underline">
          ← Back to my bookings
        </Link>
      </div>
    );
  }

  if (!booking) return <PageSpinner label="Loading visit details…" />;

  const pro = booking.professional;
  const minutes = (Date.parse(booking.scheduled_end_at) - Date.parse(booking.scheduled_start_at)) / 60_000;
  const isSearching = booking.status === "searching";
  const isAssigned = ["assigned", "confirmed", "en_route", "in_progress"].includes(booking.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top back navigation */}
      <Link
        href="/patient/bookings"
        className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <Icon name="chevronLeft" className="size-4.5" /> All bookings
      </Link>

      {/* Booking Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug">
            {booking.service_name_snapshot}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Booking Code: <span className="font-mono text-slate-800 font-bold tracking-wider">{booking.booking_code}</span>
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Progress Stepper */}
      <BookingProgress status={booking.status} />

      {/* Live Status Banners */}
      {isSearching && <LiveSearchingBanner booking={booking} />}

      {/* Assigned Nurse / Professional Profile Card */}
      {isAssigned && pro && (
        <Card className="overflow-hidden border-2 border-emerald-300 shadow-md">
          <div className="bg-emerald-50/80 px-6 py-3 border-b border-emerald-200 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-900 uppercase tracking-wide">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              Nurse Assigned & Confirmed
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
              Verified Professional
            </span>
          </div>

          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Avatar name={pro.full_name} size="lg" />
              <div className="min-w-0">
                <p className="text-lg sm:text-xl font-bold text-slate-900">{pro.full_name}</p>
                <p className="text-sm sm:text-base font-medium text-slate-600">
                  {PROFESSION_LABEL[pro.professional_type]} · {pro.years_of_experience} yrs exp
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Stars value={pro.average_rating || 5} />
                  <span className="font-bold text-slate-800">
                    {pro.average_rating ? pro.average_rating.toFixed(1) : "5.0"}
                  </span>
                  <span className="text-slate-400">({pro.total_ratings || 1} visits)</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <a
                href={`tel:${pro.phone_number}`}
                className="flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700 active:scale-95 transition-all w-full sm:w-auto"
              >
                <Icon name="phone" className="size-5" /> Call Nurse
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Completed State Review */}
      {booking.status === "completed" && (
        <ReviewForm bookingId={booking.id} onDone={reload} />
      )}

      {/* Booking Details Card */}
      <Card className="divide-y divide-slate-100 overflow-hidden shadow-xs">
        <div className="p-5 flex items-start gap-4">
          <div className="size-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
            <Icon name="calendar" className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Visit Scheduled For</p>
            <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {formatDateTime(booking.scheduled_start_at)}
            </p>
            <p className="text-sm text-slate-500">
              Estimated duration: {durationLabel(minutes)} · India Standard Time
            </p>
          </div>
        </div>

        <div className="p-5 flex items-start gap-4">
          <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Icon name="pin" className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Visit Location</p>
            <p className="text-base text-slate-800 font-medium leading-relaxed mt-0.5">
              {booking.address_snapshot}
            </p>
          </div>
        </div>

        {booking.patient_notes && (
          <div className="p-5 flex items-start gap-4">
            <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <Icon name="list" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient Notes</p>
              <p className="text-base text-slate-700 leading-relaxed mt-0.5 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {booking.patient_notes}
              </p>
            </div>
          </div>
        )}

        <div className="p-5 flex items-start gap-4">
          <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            <Icon name="shield" className="size-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Status</p>
              <span className="text-base sm:text-lg font-bold text-slate-900">{formatINR(booking.total_amount)}</span>
            </div>
            <p className="text-sm font-semibold text-emerald-700 mt-0.5">
              Pay after the visit · No advance required
            </p>
          </div>
        </div>
      </Card>

      {/* Cancellation Option (if cancellable) */}
      {["created", "searching", "assigned", "confirmed"].includes(booking.status) && (
        <CancelPanel booking={booking} onCancelled={mutate} />
      )}
    </div>
  );
}

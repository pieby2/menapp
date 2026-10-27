"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

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
import { ACTIVE_STATUSES, CANCELLABLE_STATUSES, PROFESSION_LABEL } from "@/lib/constants";
import { displayPhone, durationLabel, formatDateTime, formatINR, formatTime } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Booking } from "@/lib/types";

const CANCEL_REASONS = ["Plans changed", "Booked by mistake", "Found care elsewhere", "Taking too long"];

function StatusMessage({ booking }: { booking: Booking }) {
  const name = booking.professional?.full_name.split(" ")[0];
  switch (booking.status) {
    case "searching":
      return new Date(booking.scheduled_start_at) < new Date() ? (
        <Alert tone="warning" title="No one accepted this request in time">
          Cancel it and book another time — earlier slots usually get picked up faster.
        </Alert>
      ) : (
        <div className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-base text-amber-950">
          <Spinner className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-bold text-amber-900">Finding a professional near you</p>
            <p className="leading-relaxed text-amber-800">
              Your request is with professionals in your area who are free at this time. You&apos;ll
              see who&apos;s coming here as soon as someone accepts.
            </p>
          </div>
        </div>
      );
    case "assigned":
    case "confirmed":
    case "en_route":
      return (
        <Alert tone="success" title={`${name} will visit at ${formatTime(booking.scheduled_start_at)}`}>
          You can call them if you need to share anything before the visit.
        </Alert>
      );
    case "in_progress":
      return <Alert tone="info" title="Visit in progress" />;
    case "completed":
      return <Alert tone="success" title="Visit completed">Thank you for using Mendyr.</Alert>;
    case "cancelled":
      return (
        <Alert tone="error" title="Booking cancelled">
          {booking.cancellation_reason}
        </Alert>
      );
    default:
      return null;
  }
}

function ReviewForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await api("/reviews", {
        method: "POST",
        body: { booking_id: bookingId, rating, comment: comment.trim() || null },
      });
      toast.success("Thanks for your feedback!");
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-slate-900">How was your visit?</h2>
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="cursor-pointer rounded-xl p-1 transition-transform hover:scale-110"
          >
            <Icon
              name="star"
              className={cn("size-9", n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300")}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <div className="mt-4 space-y-4">
          <Textarea
            rows={3}
            placeholder="Anything you'd like to share? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button onClick={submit} loading={saving}>
            Submit rating
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
        <Button variant="dangerGhost" onClick={() => setOpen(true)}>
          Cancel booking
        </Button>
      </div>
    );
  }
  return (
    <Card className="p-6 border-rose-200 bg-rose-50/20">
      <h2 className="text-xl font-bold text-slate-900">Cancel this booking?</h2>
      <p className="mt-1 text-base text-slate-600">Tell us why — it helps us improve our service.</p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {CANCEL_REASONS.map((r) => (
          <Chip key={r} selected={reason === r} onClick={() => setReason(r)}>
            {r}
          </Chip>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button variant="danger" loading={saving} onClick={cancel}>
          Yes, cancel booking
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Keep booking
        </Button>
      </div>
    </Card>
  );
}

export function PatientBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [live, setLive] = useState(true);
  const { data: booking, error, mutate, reload } = useApi<Booking>(`/bookings/${id}`, {
    pollMs: live ? 10_000 : undefined,
  });
  const isLive = booking ? ACTIVE_STATUSES.includes(booking.status) : true;
  if (live !== isLive) setLive(isLive);

  if (error && !booking) {
    return (
      <div className="space-y-4">
        <Alert tone="error">{error.message}</Alert>
        <Link href="/patient/bookings" className="text-base font-semibold text-brand-700 hover:underline">
          ← Back to my bookings
        </Link>
      </div>
    );
  }
  if (!booking) return <PageSpinner />;

  const pro = booking.professional;
  const minutes = (Date.parse(booking.scheduled_end_at) - Date.parse(booking.scheduled_start_at)) / 60_000;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/patient/bookings" className="inline-flex items-center gap-2 text-base font-semibold text-slate-600 hover:text-slate-900 transition-colors">
        <Icon name="chevronLeft" className="size-5" /> My bookings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{booking.service_name_snapshot}</h1>
          <p className="mt-1.5 text-base font-medium text-slate-500">Booking code: <span className="font-mono text-slate-800 font-bold">{booking.booking_code}</span></p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <BookingProgress status={booking.status} />
      <StatusMessage booking={booking} />

      {pro && (
        <Card className="flex flex-wrap items-center gap-5 p-6">
          <Avatar name={pro.full_name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-slate-900">{pro.full_name}</p>
            <p className="text-base text-slate-600">
              {PROFESSION_LABEL[pro.professional_type]} · {pro.years_of_experience} yrs experience
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              {pro.total_ratings > 0 ? (
                <>
                  <Stars value={pro.average_rating} /> <span className="font-semibold text-slate-800">{pro.average_rating.toFixed(1)}</span>
                </>
              ) : (
                "New on Mendyr"
              )}
              {pro.languages_spoken?.length ? ` · ${pro.languages_spoken.join(", ")}` : null}
            </p>
          </div>
          {booking.status !== "cancelled" && (
            <a
              href={`tel:${pro.phone_number}`}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-base font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 active:scale-95 transition-all"
              title={displayPhone(pro.phone_number)}
            >
              <Icon name="phone" className="size-5" /> Call
            </a>
          )}
        </Card>
      )}

      <Card className="divide-y divide-slate-100">
        <div className="flex gap-4 p-5">
          <Icon name="calendar" className="mt-0.5 size-5 shrink-0 text-slate-400" />
          <div>
            <p className="text-base font-semibold text-slate-900">{formatDateTime(booking.scheduled_start_at)}</p>
            <p className="text-sm text-slate-500">{durationLabel(minutes)} visit · India Standard Time</p>
          </div>
        </div>
        <div className="flex gap-4 p-5">
          <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-slate-400" />
          <p className="text-base text-slate-700 leading-relaxed">{booking.address_snapshot}</p>
        </div>
        {booking.patient_notes && (
          <div className="flex gap-4 p-5">
            <Icon name="list" className="mt-0.5 size-5 shrink-0 text-slate-400" />
            <p className="whitespace-pre-line text-base text-slate-700 leading-relaxed">{booking.patient_notes}</p>
          </div>
        )}
      </Card>

      {booking.visit_summary_notes && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-slate-900">Visit notes from {pro?.full_name.split(" ")[0] ?? "your professional"}</h2>
          <p className="mt-3 whitespace-pre-line text-base text-slate-700 leading-relaxed">{booking.visit_summary_notes}</p>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900">Payment Breakdown</h2>
        <dl className="mt-4 space-y-3 text-base">
          <div className="flex justify-between text-slate-600">
            <dt>Visit charge</dt>
            <dd className="font-medium text-slate-800">{formatINR(booking.base_price)}</dd>
          </div>
          {booking.discount_amount > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <dt>Discount</dt>
              <dd>−{formatINR(booking.discount_amount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <dt>GST</dt>
            <dd className="font-medium text-slate-800">{formatINR(booking.tax_amount)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-extrabold text-slate-900">
            <dt>Total</dt>
            <dd>{formatINR(booking.total_amount)}</dd>
          </div>
        </dl>
        {booking.status !== "cancelled" && (
          <p className="mt-4 text-xs font-medium text-slate-500">Paid directly after the visit — zero online payment required now.</p>
        )}
      </Card>

      {booking.status === "completed" &&
        (booking.review_rating ? (
          <Card className="flex items-center justify-between p-6">
            <p className="text-base font-semibold text-slate-800">Your rating</p>
            <Stars value={booking.review_rating} />
          </Card>
        ) : (
          <ReviewForm bookingId={booking.id} onDone={reload} />
        ))}

      {CANCELLABLE_STATUSES.includes(booking.status) && <CancelPanel booking={booking} onCancelled={mutate} />}
    </div>
  );
}

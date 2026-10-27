"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import { Button, Card } from "@/components/ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { durationLabel, formatDateTime, formatINR } from "@/lib/format";
import type { BookingRequest, ProBooking } from "@/lib/types";

/** An open request: what, when, roughly where, and what they'd earn — with Accept. */
export function RequestCard({ request, onGone }: { request: BookingRequest; onGone: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [accepting, setAccepting] = useState(false);
  const minutes = (Date.parse(request.scheduled_end_at) - Date.parse(request.scheduled_start_at)) / 60_000;

  async function accept() {
    setAccepting(true);
    try {
      await api(`/bookings/${request.id}/accept`, { method: "POST" });
      toast.success("Booking accepted — it's in your bookings now.");
      router.push(`/pro/bookings/${request.id}`);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.status === 409
          ? "Another professional accepted this one first."
          : errorMessage(err),
      );
      onGone();
    } finally {
      setAccepting(false);
    }
  }

  return (
    <Card className="p-6 sm:p-7 border-slate-200/90 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-bold text-slate-900">{request.service_name}</p>
          <p className="mt-2 flex items-center gap-2 text-base text-slate-600">
            <Icon name="calendar" className="size-4.5 text-slate-400" />
            {formatDateTime(request.scheduled_start_at)} · {durationLabel(minutes)}
          </p>
          <p className="mt-1 flex items-center gap-2 text-base text-slate-600">
            <Icon name="pin" className="size-4.5 text-slate-400" />
            {request.area} · <span className="font-semibold text-slate-800">{request.distance_km} km away</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">You earn</p>
          <p className="text-2xl font-black text-emerald-700">{formatINR(request.earning_amount)}</p>
        </div>
      </div>
      {request.patient_notes && (
        <p className="mt-4 rounded-xl bg-slate-50 p-3.5 text-base text-slate-700 border border-slate-100 italic">
          &ldquo;{request.patient_notes}&rdquo;
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
        <p className="text-xs font-medium text-slate-500">Full address and contact are shared once you accept.</p>
        <Button onClick={accept} loading={accepting} icon="check" size="md">
          Accept visit
        </Button>
      </div>
    </Card>
  );
}

/** One of the professional's own bookings in a list. */
export function ProBookingRow({ booking }: { booking: ProBooking }) {
  return (
    <Link
      href={`/pro/bookings/${booking.id}`}
      className="flex items-center gap-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-brand-500 hover:shadow-md"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-bold text-slate-900">{booking.service_name}</p>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-1.5 flex items-center gap-2 text-base text-slate-600">
          <Icon name="calendar" className="size-4.5 text-slate-400" /> {formatDateTime(booking.scheduled_start_at)}
        </p>
        <p className="mt-1 truncate text-base text-slate-600">
          <span className="font-semibold text-slate-800">{booking.patient_name}</span> · {booking.address}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-bold text-emerald-700">{formatINR(booking.earning_amount)}</p>
        <Icon name="chevronRight" className="ml-auto mt-2 size-5 text-slate-400" />
      </div>
    </Link>
  );
}

import Link from "next/link";

import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/components/ui";
import { formatDateTime, formatINR } from "@/lib/format";
import type { BookingListItem, BookingStatus } from "@/lib/types";

/** One booking in a patient's list. */
export function PatientBookingRow({ booking }: { booking: BookingListItem }) {
  return (
    <Link
      href={`/patient/bookings/${booking.id}`}
      className="flex items-center gap-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-brand-500 hover:shadow-md"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-bold text-slate-900">{booking.service_name_snapshot}</p>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-1.5 flex items-center gap-2 text-base text-slate-600">
          <Icon name="calendar" className="size-4.5 text-slate-400" /> {formatDateTime(booking.scheduled_start_at)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {booking.professional_name ? `Assigned to ${booking.professional_name}` : "Matching with a professional"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-bold text-slate-900">{formatINR(booking.total_amount)}</p>
        <Icon name="chevronRight" className="ml-auto mt-2 size-5 text-slate-400" />
      </div>
    </Link>
  );
}

const STEPS: { label: string; reached: BookingStatus[] }[] = [
  { label: "Requested", reached: ["searching", "assigned", "confirmed", "en_route", "in_progress", "completed"] },
  { label: "Accepted", reached: ["assigned", "confirmed", "en_route", "in_progress", "completed"] },
  { label: "In progress", reached: ["in_progress", "completed"] },
  { label: "Completed", reached: ["completed"] },
];

/** Requested → Accepted → In progress → Completed. */
export function BookingProgress({ status }: { status: BookingStatus }) {
  if (["cancelled", "failed", "no_show"].includes(status)) return null;
  return (
    <ol className="flex items-center gap-3 py-2">
      {STEPS.map((step, index) => {
        const done = step.reached.includes(status);
        return (
          <li key={step.label} className="flex flex-1 items-center gap-2.5">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-xs",
                done ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600",
              )}
            >
              {done ? <Icon name="check" className="size-5" /> : index + 1}
            </span>
            <span className={cn("hidden text-sm font-bold sm:inline", done ? "text-slate-900" : "text-slate-400")}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className={cn("h-1 flex-1 rounded-full", done ? "bg-brand-500" : "bg-slate-200")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

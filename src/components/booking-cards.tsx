import Link from "next/link";

import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/components/ui";
import { formatDateTime, formatINR } from "@/lib/format";
import type { BookingListItem, BookingStatus } from "@/lib/types";

/** Modern, responsive card for a booking in the patient's list. */
export function PatientBookingRow({ booking }: { booking: BookingListItem }) {
  const isSearching = booking.status === "searching";
  const isAssigned = ["assigned", "confirmed", "en_route", "in_progress"].includes(booking.status);

  return (
    <Link
      href={`/patient/bookings/${booking.id}`}
      className="group block rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-brand-500 hover:shadow-md active:scale-[0.99]"
    >
      {/* Top Header: Service Title and Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors leading-snug">
            {booking.service_name_snapshot}
          </p>
          <p className="mt-0.5 text-xs text-slate-400 font-mono">
            #{booking.booking_code}
          </p>
        </div>
        <div className="shrink-0 pt-0.5">
          <StatusBadge status={booking.status} />
        </div>
      </div>

      {/* Middle Row: Schedule & Nurse Info */}
      <div className="mt-3.5 space-y-1.5 border-t border-slate-100/80 pt-3">
        <p className="flex items-center gap-2 text-sm sm:text-base text-slate-600">
          <Icon name="calendar" className="size-4 shrink-0 text-brand-600" />
          <span className="font-medium text-slate-800">{formatDateTime(booking.scheduled_start_at)}</span>
        </p>

        {isSearching && (
          <p className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-700">
            <span className="inline-block size-2 rounded-full bg-amber-500 animate-pulse" />
            Finding nurse within 10 km…
          </p>
        )}

        {isAssigned && booking.professional_name && (
          <p className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700">
            <Icon name="check" className="size-4 shrink-0 text-emerald-600" />
            Nurse: <span className="text-slate-900">{booking.professional_name}</span>
          </p>
        )}
      </div>

      {/* Bottom Footer: Price and CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <div>
          <span className="text-xs text-slate-500">Total: </span>
          <span className="text-base sm:text-lg font-bold text-slate-900">{formatINR(booking.total_amount)}</span>
          <span className="ml-1 text-[11px] text-slate-400">incl. tax</span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform">
          Track visit <Icon name="chevronRight" className="size-4" />
        </span>
      </div>
    </Link>
  );
}

const STEPS: { key: string; label: string; reached: BookingStatus[] }[] = [
  { key: "req", label: "Requested", reached: ["searching", "assigned", "confirmed", "en_route", "in_progress", "completed"] },
  { key: "acc", label: "Accepted", reached: ["assigned", "confirmed", "en_route", "in_progress", "completed"] },
  { key: "act", label: "In Progress", reached: ["en_route", "in_progress", "completed"] },
  { key: "com", label: "Completed", reached: ["completed"] },
];

/** Responsive, modern booking progress tracker. */
export function BookingProgress({ status }: { status: BookingStatus }) {
  if (["cancelled", "failed", "no_show"].includes(status)) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Visit Progress</p>
      <ol className="flex items-center justify-between gap-1 sm:gap-3">
        {STEPS.map((step, index) => {
          const done = step.reached.includes(status);
          const isCurrent = step.reached[0] === status || (status === "searching" && index === 0);

          return (
            <li key={step.key} className="flex flex-1 flex-col items-center relative text-center">
              {/* Connector line between steps */}
              {index > 0 && (
                <div
                  className={cn(
                    "absolute top-4 -left-1/2 w-full h-1 -z-0 rounded-full",
                    done ? "bg-brand-600" : "bg-slate-200",
                  )}
                  style={{ transform: "translateY(-50%)" }}
                />
              )}

              {/* Step Circle */}
              <div
                className={cn(
                  "relative z-10 flex size-8 sm:size-9 items-center justify-center rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs",
                  done
                    ? "bg-brand-600 text-white ring-4 ring-brand-100"
                    : "bg-slate-100 text-slate-400 border border-slate-300",
                  isCurrent && "animate-pulse ring-4 ring-amber-200 bg-amber-500 text-white",
                )}
              >
                {done ? <Icon name="check" className="size-4 sm:size-5" /> : index + 1}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "mt-2 text-[11px] sm:text-xs font-semibold leading-tight max-w-[70px] sm:max-w-none",
                  done ? "text-slate-900 font-bold" : "text-slate-400",
                  isCurrent && "text-brand-700 font-extrabold",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

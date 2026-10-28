"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AddressForm, addressLine } from "@/components/address-form";
import { Icon } from "@/components/icons";
import { serviceCopy, useCatalog } from "@/components/service-catalog";
import { useToast } from "@/components/toast";
import { Alert, Button, Card, cn, PageHeader, Select, Textarea } from "@/components/ui";
import { api, errorMessage, query } from "@/lib/api";
import { PROFESSION_LABEL } from "@/lib/constants";
import { durationLabel, formatDateTime, formatINR, istDateKey, istIso, MARKET_TZ } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Address, Booking, NearbyProfessional, Quote } from "@/lib/types";

const FIRST_SLOT_HOUR = 6;
const LAST_SLOT_HOUR = 22;
const LEAD_MINUTES = 60; // earliest bookable time is an hour from now
const DAYS_SHOWN = 14;

const SLOTS = Array.from({ length: (LAST_SLOT_HOUR - FIRST_SLOT_HOUR) * 2 + 1 }, (_, i) => {
  const minutes = FIRST_SLOT_HOUR * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

function slotsFor(dateKey: string, now: Date): string[] {
  const earliest = now.getTime() + LEAD_MINUTES * 60_000;
  return SLOTS.filter((slot) => new Date(istIso(dateKey, slot)).getTime() >= earliest);
}

function buildDates(now: Date) {
  const weekday = new Intl.DateTimeFormat("en-IN", { timeZone: MARKET_TZ, weekday: "short" });
  const day = new Intl.DateTimeFormat("en-IN", { timeZone: MARKET_TZ, day: "numeric" });
  const month = new Intl.DateTimeFormat("en-IN", { timeZone: MARKET_TZ, month: "short" });
  return Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const date = new Date(now.getTime() + i * 86_400_000);
    return {
      key: istDateKey(date),
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : weekday.format(date),
      day: day.format(date),
      month: month.format(date),
    };
  });
}

function slotLabel(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function Step({
  number,
  title,
  optional,
  children,
}: {
  number: number;
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-7 shadow-xs">
      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3.5">
        <h2 className="flex items-center gap-3 text-lg sm:text-xl font-bold tracking-tight text-slate-900">
          <span className="flex size-7 sm:size-8 items-center justify-center rounded-xl bg-brand-600 text-xs sm:text-sm font-black text-white shadow-xs">
            {number}
          </span>
          {title}
        </h2>
        {optional && <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Optional</span>}
      </div>
      {children}
    </Card>
  );
}

export function BookingFlow() {
  const router = useRouter();
  const toast = useToast();
  const { groups } = useCatalog();
  const services = useMemo(() => groups?.flatMap((g) => g.services) ?? [], [groups]);

  const [serviceId, setServiceId] = useState<string | null>(useSearchParams().get("service"));
  const service = services.find((s) => s.id === serviceId) ?? null;

  const addresses = useApi<Address[]>("/addresses");
  const addressList = addresses.data ?? [];
  const [pickedAddressId, setPickedAddressId] = useState<string | null>(null);
  const addressId =
    pickedAddressId ?? addressList.find((a) => a.is_default)?.id ?? addressList[0]?.id ?? null;
  const address = addressList.find((a) => a.id === addressId) ?? null;
  const [addingAddress, setAddingAddress] = useState(false);
  const showAddressForm = addingAddress || (addresses.data !== undefined && addressList.length === 0);

  const [now] = useState(() => new Date());
  const dates = useMemo(() => buildDates(now), [now]);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const dateKey = pickedDate ?? dates.find((d) => slotsFor(d.key, now).length > 0)?.key ?? dates[1].key;
  const slots = slotsFor(dateKey, now);
  const [pickedTime, setPickedTime] = useState<string | null>(null);
  const time = pickedTime && slots.includes(pickedTime) ? pickedTime : null;
  const scheduledAt = time ? istIso(dateKey, time) : null;

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Price preview
  const [quoted, setQuoted] = useState<{ serviceId: string; quote: Quote } | null>(null);
  useEffect(() => {
    if (!serviceId) return;
    let active = true;
    api<Quote>("/bookings/quote", { method: "POST", body: { service_id: serviceId } })
      .then((quote) => active && setQuoted({ serviceId, quote }))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [serviceId]);
  const quote = quoted?.serviceId === serviceId ? quoted.quote : null;

  const nearby = useApi<NearbyProfessional[]>(
    serviceId && addressId
      ? `/professionals/nearby${query({ service_id: serviceId, address_id: addressId, scheduled_at: scheduledAt })}`
      : null,
  );

  const missing = !service
    ? "Choose a service"
    : !address
      ? "Add an address"
      : !scheduledAt
        ? "Pick a time slot"
        : null;

  async function confirm() {
    if (missing || !service || !address || !scheduledAt) return;
    setSubmitting(true);
    setError(null);
    try {
      const booking = await api<Booking>("/bookings", {
        method: "POST",
        body: {
          service_id: service.id,
          address_id: address.id,
          scheduled_start_at: scheduledAt,
          patient_notes: notes.trim() || null,
        },
      });
      toast.success("Request submitted! Broadcasting to verified nurses within 10 km.");
      setPickedTime(null);
      setNotes("");
      router.push(`/patient/bookings/${booking.id}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const gstPct = quote && quote.base_price > 0 ? Math.round((quote.tax_amount / (quote.base_price - quote.discount_amount)) * 100) : 18;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Book a Home Visit"
        subtitle="Match with verified healthcare professionals in your neighborhood within minutes."
      />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 space-y-6">
          {/* Step 1: Choose Service */}
          <Step number={1} title="Choose Service">
            <Select
              aria-label="Service"
              value={serviceId ?? ""}
              onChange={(e) => setServiceId(e.target.value || null)}
            >
              <option value="">Select a healthcare service…</option>
              {groups?.map(({ category, services: inCategory }) => (
                <optgroup key={category.id} label={category.name}>
                  {inCategory.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatINR(s.base_price)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>

            {service && (
              <div className="mt-4 rounded-2xl bg-brand-50/80 p-4 sm:p-5 border border-brand-200/80 text-slate-800 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-brand-950 text-base">
                    {PROFESSION_LABEL[service.required_professional_type]} Visit
                  </p>
                  <span className="text-xs font-bold text-brand-700 bg-white px-2.5 py-0.5 rounded-full border border-brand-200">
                    {durationLabel(service.duration_minutes)}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{serviceCopy(service)}</p>
              </div>
            )}
          </Step>

          {/* Step 2: Address */}
          <Step number={2} title="Select Patient Address">
            {addresses.loading ? (
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ) : (
              <div className="space-y-3">
                {addressList.map((a) => (
                  <label
                    key={a.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 sm:p-5 transition-all",
                      a.id === addressId
                        ? "border-brand-500 bg-brand-50/70 ring-2 ring-brand-500/30 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={a.id === addressId}
                      onChange={() => setPickedAddressId(a.id)}
                      className="mt-1 size-5 accent-brand-600 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-base font-bold capitalize text-slate-900">{a.label}</span>
                        {a.is_default && (
                          <span className="text-[11px] font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-sm sm:text-base text-slate-600 leading-relaxed">
                        {addressLine(a)}
                      </span>
                      {a.contact_name && (
                        <span className="mt-1.5 block text-xs font-semibold text-slate-500">
                          Patient: {a.contact_name} {a.contact_phone ? `(${a.contact_phone})` : ""}
                        </span>
                      )}
                    </span>
                  </label>
                ))}

                {showAddressForm ? (
                  <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/70">
                    <p className="mb-4 text-base font-bold text-slate-900">Add New Address</p>
                    <AddressForm
                      makeDefault={addressList.length === 0}
                      onSaved={(saved) => {
                        addresses.mutate([...addressList, saved]);
                        setPickedAddressId(saved.id);
                        setAddingAddress(false);
                      }}
                      onCancel={addressList.length > 0 ? () => setAddingAddress(false) : undefined}
                    />
                  </div>
                ) : (
                  <div className="pt-2">
                    <Button variant="outline" size="sm" icon="plus" onClick={() => setAddingAddress(true)}>
                      Add new address
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Step>

          {/* Step 3: Date & Time */}
          <Step number={3} title="Select Date & Time">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Available Dates
            </label>
            <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-3">
              {dates.map((d) => {
                const full = slotsFor(d.key, now).length === 0;
                return (
                  <button
                    key={d.key}
                    type="button"
                    disabled={full}
                    onClick={() => setPickedDate(d.key)}
                    className={cn(
                      "flex w-20 sm:w-22 shrink-0 cursor-pointer flex-col items-center rounded-2xl border py-3 text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95",
                      d.key === dateKey
                        ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/30 scale-[1.02]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <span className="text-[11px] font-semibold">{d.label}</span>
                    <span className="text-xl font-black leading-none my-1">{d.day}</span>
                    <span className="text-[11px] uppercase tracking-wider font-semibold opacity-90">{d.month}</span>
                  </button>
                );
              })}
            </div>

            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mt-6 mb-2.5">
              Available Time Slots (IST)
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setPickedTime(slot)}
                  className={cn(
                    "h-11 cursor-pointer rounded-xl border text-sm sm:text-base font-semibold transition-all active:scale-95 flex items-center justify-center",
                    slot === time
                      ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25 ring-2 ring-brand-300"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {slotLabel(slot)}
                </button>
              ))}
            </div>
          </Step>

          {/* Step 4: Notes */}
          <Step number={4} title="Notes for Healthcare Staff" optional>
            <Textarea
              value={notes}
              maxLength={1000}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Patient is 65-year old, recovering from surgery. Please bring sterile dressing kit and blood pressure monitor."
              rows={3}
            />
          </Step>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:sticky lg:top-28 space-y-4">
          <Card className="p-6 shadow-sm border-slate-200/90">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Booking Summary
            </h3>

            <dl className="mt-4 space-y-3.5 text-sm sm:text-base">
              <div className="flex items-start gap-3">
                <Icon name="list" className="size-5 shrink-0 text-brand-600 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs font-bold text-slate-400 uppercase">Service</dt>
                  <dd className="font-bold text-slate-900">{service?.name ?? "None selected"}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon name="calendar" className="size-5 shrink-0 text-brand-600 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs font-bold text-slate-400 uppercase">Scheduled For</dt>
                  <dd className="font-bold text-slate-900">
                    {scheduledAt ? formatDateTime(scheduledAt) : "Pick date and slot"}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Icon name="pin" className="size-5 shrink-0 text-brand-600 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs font-bold text-slate-400 uppercase">Address</dt>
                  <dd className="text-slate-800 font-medium leading-snug">
                    {address ? addressLine(address) : "No address selected"}
                  </dd>
                </div>
              </div>
            </dl>

            {/* Price breakdown */}
            {quote && (
              <div className="mt-5 border-t border-slate-100 pt-4 space-y-2 text-sm sm:text-base">
                <div className="flex justify-between text-slate-600">
                  <span>Visit Charge</span>
                  <span className="font-semibold text-slate-900">{formatINR(quote.base_price)}</span>
                </div>
                {quote.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount</span>
                    <span>−{formatINR(quote.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>GST ({gstPct}%)</span>
                  <span className="font-semibold text-slate-900">{formatINR(quote.tax_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2.5 text-lg font-black text-slate-900">
                  <span>Total Amount</span>
                  <span>{formatINR(quote.total_amount)}</span>
                </div>
              </div>
            )}

            {/* 10km Radius Availability Banner */}
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm font-semibold text-emerald-900 flex items-center gap-2">
              <Icon name="check" className="size-4 shrink-0 text-emerald-600" />
              <span>Broadcasts to verified nurses within 10 km</span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-500">
              <Icon name="shield" className="size-4 text-emerald-600 shrink-0" />
              <span>Zero advance charge · Pay securely after visit</span>
            </div>

            {error && (
              <Alert tone="error" className="mt-4 text-sm">
                {error}
              </Alert>
            )}

            <div className="mt-5">
              <Button
                className="w-full shadow-md"
                size="lg"
                disabled={!!missing}
                loading={submitting}
                onClick={confirm}
              >
                {missing ? missing : "Request Home Visit →"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect } from "react";

import { AppShell, type NavItem } from "@/components/app-shell";
import { useApi } from "@/lib/hooks";
import type { BookingListItem } from "@/lib/types";

import { PatientAlerts, useBookingUpdates } from "./patient-alerts";

function navFor(updates: number): NavItem[] {
  return [
    { href: "/patient", label: "Home", icon: "home", exact: true },
    { href: "/patient/book", label: "Book", icon: "plus" },
    { href: "/patient/bookings", label: "Bookings", icon: "calendar", badge: updates },
    { href: "/patient/account", label: "Account", icon: "user" },
  ];
}

type MyBookings = ReturnType<typeof useApi<BookingListItem[]>>;

const PatientBookingsContext = createContext<MyBookings | null>(null);

/**
 * Polls the patient's bookings for every /patient page — feeding the confirmed / professional
 * cancelled pop-ups and the Bookings badge, and shared with the pages that list them. Sits
 * inside the layout's Suspense boundary: it reads the pathname.
 */
export function PatientProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Poll every 4 seconds so that pro acceptance reflects quickly in patient app
  const bookings = useApi<BookingListItem[]>("/bookings?page_size=100", { pollMs: 4_000 });
  const updates = useBookingUpdates(bookings.data);
  const { reload } = bookings;

  // Refreshing on navigation and window focus keeps the lists fresh
  useEffect(() => {
    void reload();
  }, [pathname, reload]);

  useEffect(() => {
    function onFocus() {
      void reload();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload]);

  return (
    <PatientBookingsContext.Provider value={bookings}>
      <AppShell nav={navFor(updates.confirmed.length + updates.dropped.length)}>
        {children}
        <PatientAlerts {...updates} />
      </AppShell>
    </PatientBookingsContext.Provider>
  );
}

/** The patient's bookings, polled by the provider for every /patient page. */
export function usePatientBookings(): MyBookings {
  const context = useContext(PatientBookingsContext);
  if (!context) throw new Error("Must be used inside <PatientProvider>");
  return context;
}

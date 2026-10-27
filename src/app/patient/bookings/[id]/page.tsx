import { Suspense } from "react";

import { PageSpinner } from "@/components/ui";

import { PatientBookingDetail } from "./booking-detail";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function PatientBookingPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <PatientBookingDetail />
    </Suspense>
  );
}

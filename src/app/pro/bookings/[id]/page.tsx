import { Suspense } from "react";

import { PageSpinner } from "@/components/ui";

import { ProBookingDetail } from "./booking-detail";

export function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function ProBookingPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ProBookingDetail />
    </Suspense>
  );
}

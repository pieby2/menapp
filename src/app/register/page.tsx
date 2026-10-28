import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthCard, RegisterChoiceFooter, RegisterChoices } from "@/components/auth-forms";
import { PageSpinner } from "@/components/ui";

export const metadata: Metadata = { title: "Sign up" };

function RegisterChoiceContent() {
  return (
    <AuthCard
      title="Join Mendyr"
      subtitle="How will you use Mendyr?"
      footer={<RegisterChoiceFooter />}
    >
      <RegisterChoices />
    </AuthCard>
  );
}

export default function RegisterChoicePage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <RegisterChoiceContent />
    </Suspense>
  );
}

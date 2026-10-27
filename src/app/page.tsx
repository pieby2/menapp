import Link from "next/link";

import { ProfessionIcon } from "@/components/brand";
import { Icon, type IconName } from "@/components/icons";
import { ServiceShowcase } from "@/components/service-catalog";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Avatar, Badge, ButtonLink, Card } from "@/components/ui";

const STEPS: { number: string; title: string; body: string }[] = [
  {
    number: "01",
    title: "Pick what you need",
    body: "Choose the service, add your address, and pick a time slot. We show upfront pricing.",
  },
  {
    number: "02",
    title: "We match someone near you",
    body: "Qualified professionals in your area see your request. The first to accept is assigned.",
  },
  {
    number: "03",
    title: "Care at your door, pay after",
    body: "They visit, deliver the care and share visit notes. You pay afterwards — nothing is charged online.",
  },
];

const PRO_POINTS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "clock",
    title: "Your timings, your radius",
    body: "Set the days, hours and travel radius that suit your existing hospital or clinic shifts.",
  },
  {
    icon: "shield",
    title: "Verified professionals only",
    body: "Council registration and identity checks keep patients safe and professionals trusted.",
  },
  {
    icon: "rupee",
    title: "Transparent earnings",
    body: "See exactly what you'll earn before you accept a visit.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
            <div>
              <Badge tone="brand" className="mb-6">
                <Icon name="sparkles" className="size-4" /> Home healthcare, on demand
              </Badge>
              <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Nurses & caregivers, <span className="text-brand-600">at your doorstep</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg sm:text-xl leading-relaxed text-slate-600">
                Book verified nurses, physiotherapists, elder-care attendants and lab technicians for home visits.
                Book in 2 minutes. Pay safely after the visit.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
                <ButtonLink href="/services" size="lg" icon="calendar">
                  Book a service
                </ButtonLink>
                <ButtonLink href="/register/professional" size="lg" variant="outline">
                  Join as a professional
                </ButtonLink>
              </div>
              <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-base font-semibold text-slate-700">
                {["Book in under 2 minutes", "Verified professionals", "Pay after the visit"].map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <Icon name="check" className="size-5 text-brand-600 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Illustration: what a booking looks like, drawn with real UI pieces */}
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
              <div className="absolute -right-6 -top-6 size-48 rounded-full bg-brand-100 blur-3xl opacity-60" />
              <div className="relative space-y-5">
                <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <ProfessionIcon type="nurse" />
                      <div>
                        <p className="text-lg font-bold text-slate-900">General nursing visit</p>
                        <p className="text-sm font-medium text-slate-500">Today · 6:00 pm · Indiranagar</p>
                      </div>
                    </div>
                    <Badge tone="blue">Confirmed</Badge>
                  </div>
                  <div className="mt-5 flex items-center gap-3.5 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <Avatar name="Priya Sharma" size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-slate-900">Priya Sharma</p>
                      <p className="text-sm text-slate-500">Nurse · 6 yrs exp · ★ 4.9</p>
                    </div>
                    <span className="flex size-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-xs">
                      <Icon name="phone" className="size-4.5" />
                    </span>
                  </div>
                </div>

                <div className="ml-6 sm:ml-12 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-lg shadow-slate-200/50">
                  <div className="flex items-center gap-3.5">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <Icon name="rupee" className="size-5" />
                    </span>
                    <div>
                      <p className="text-base font-bold text-slate-900">You earn ₹1,440</p>
                      <p className="text-sm text-slate-500">Evening shift · 4.2 km away</p>
                    </div>
                    <span className="ml-auto rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-xs">
                      Accept
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Care we bring home</h2>
              <p className="mt-2 text-base sm:text-lg text-slate-600">Transparent pricing. Qualified professionals. Pay after the visit.</p>
            </div>
            <ButtonLink href="/services" variant="secondary" icon="arrowRight" size="md">
              All services
            </ButtonLink>
          </div>
          <ServiceShowcase />
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-slate-200/80 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-xl">
              <Badge tone="brand">Simple & transparent</Badge>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                How Mendyr works
              </h2>
              <p className="mt-3 text-base sm:text-lg text-slate-600">
                No subscription, no prepayment, no waiting on hold.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((step) => (
                <Card key={step.number} className="p-7 space-y-4">
                  <p className="font-display text-4xl font-black text-brand-600">{step.number}</p>
                  <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                  <p className="text-base text-slate-600 leading-relaxed">{step.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* For professionals */}
        <section id="for-professionals" className="scroll-mt-20 mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-14 text-white sm:px-14 shadow-2xl">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <Badge tone="dark">For nurses & healthcare staff</Badge>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
                  Turn your free hours into extra income
                </h2>
                <p className="mt-5 text-lg text-slate-300 leading-relaxed">
                  Nurses, physiotherapists, caretakers, lab technicians — accept home visits near you,
                  on the days and hours that fit your hospital or clinic schedule.
                </p>
                <div className="mt-8">
                  <ButtonLink href="/register/professional" size="lg">
                    Start earning with Mendyr
                  </ButtonLink>
                </div>
              </div>
              <div className="space-y-5">
                {PRO_POINTS.map((point) => (
                  <div key={point.title} className="flex gap-4.5 rounded-2xl bg-white/5 border border-white/10 p-6">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300">
                      <Icon name={point.icon} className="size-6" />
                    </span>
                    <div>
                      <p className="text-lg font-bold">{point.title}</p>
                      <p className="mt-1.5 text-base text-slate-300 leading-relaxed">{point.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

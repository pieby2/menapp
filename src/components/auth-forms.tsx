"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Logo } from "@/components/brand";
import { Icon, type IconName } from "@/components/icons";
import { Alert, Button, Field, Input } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import { isValidIndianMobile, toE164India } from "@/lib/format";
import type { Role } from "@/lib/types";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-slate-600">{footer}</div>}
    </div>
  );
}

/** Only follow same-site relative redirects (`/patient/book?...`), never `//evil.com`. */
function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

/**
 * Where a signed-in user goes from a login/register page — both for someone who arrives
 * already signed in and right after the form succeeds. The only navigation on these pages:
 * a second `router.replace` in the submit handler would race this one.
 */
function useRedirectWhenSignedIn(destination: (role: Role) => string) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const target = !loading && user ? destination(user.role) : null;
  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);
}

export function LoginForm() {
  const { login } = useAuth();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useRedirectWhenSignedIn((role) => next ?? homeFor(role));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password); // the redirect hook takes it from here
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to book visits or manage your work."
      footer={
        <>
          New to Mendyr?{" "}
          <Link href={registerHref} className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}

interface RegisterErrors {
  full_name?: string;
  phone?: string;
  email?: string;
  password?: string;
}

function validate(values: { full_name: string; phone: string; email: string; password: string }) {
  const errors: RegisterErrors = {};
  if (values.full_name.trim().length < 2) errors.full_name = "Please enter your full name.";
  if (!isValidIndianMobile(values.phone)) errors.phone = "Enter a 10-digit mobile number.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

export function RegisterForm({ role }: { role: "patient" | "professional" }) {
  const { register } = useAuth();
  const next = safeNext(useSearchParams().get("next"));
  const [values, setValues] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // New professionals continue to onboarding; patients back to where they started (e.g. a
  // booking). Someone already signed in as the other role still lands in their own area.
  useRedirectWhenSignedIn((signedInRole) =>
    signedInRole !== role ? homeFor(signedInRole) : role === "professional" ? "/pro/onboarding" : (next ?? "/patient"),
  );

  const set = (field: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setFormError(null);
    setSubmitting(true);
    try {
      await register({
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        phone_number: toE164India(values.phone),
        password: values.password,
        role,
      }); // the redirect hook takes it from here
    } catch (err) {
      setFormError(errorMessage(err));
      setSubmitting(false);
    }
  }

  const isPro = role === "professional";
  return (
    <AuthCard
      title={isPro ? "Join as a healthcare professional" : "Create your account"}
      subtitle={
        isPro
          ? "Step 1 of 2 — your account. Next you'll add your profession, area and timings."
          : "Book home visits for yourself or your family."
      }
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-semibold text-brand-700 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="Full name" htmlFor="full_name" error={errors.full_name}>
          <Input id="full_name" autoComplete="name" value={values.full_name} onChange={set("full_name")} />
        </Field>
        <Field label="Mobile number" htmlFor="phone" error={errors.phone}>
          <div className="flex">
            <span className="inline-flex h-11 items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-600">
              +91
            </span>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              className="rounded-l-none"
              value={values.phone}
              onChange={set("phone")}
            />
          </div>
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={set("password")}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          {isPro ? "Continue" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}

const CHOICES: { role: "patient" | "professional"; icon: IconName; title: string; body: string }[] = [
  {
    role: "patient",
    icon: "heart",
    title: "I need care at home",
    body: "Book nurses, physiotherapists and caregivers for yourself or family.",
  },
  {
    role: "professional",
    icon: "briefcase",
    title: "I'm a healthcare professional",
    body: "Nurse, physio, caretaker, lab technician — earn on your own schedule.",
  },
];

/** The two sign-up paths. Carries ?next= through to patient sign-up, so someone who hit
 * "Book" before having an account lands back on the booking afterwards. */
export function RegisterChoices() {
  const next = safeNext(useSearchParams().get("next"));
  return (
    <div className="space-y-3">
      {CHOICES.map((choice) => {
        const href =
          choice.role === "patient" && next
            ? `/register/patient?next=${encodeURIComponent(next)}`
            : `/register/${choice.role}`;
        return (
          <Link
            key={choice.role}
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-brand-400 hover:bg-brand-50/50"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100">
              <Icon name={choice.icon} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-slate-900">{choice.title}</span>
              <span className="mt-0.5 block text-sm text-slate-500">{choice.body}</span>
            </span>
            <Icon name="chevronRight" className="size-5 text-slate-400" />
          </Link>
        );
      })}
    </div>
  );
}

export function RegisterChoiceFooter() {
  const next = safeNext(useSearchParams().get("next"));
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  return (
    <>
      Already have an account?{" "}
      <Link href={loginHref} className="font-semibold text-brand-700 hover:underline">
        Log in
      </Link>
    </>
  );
}

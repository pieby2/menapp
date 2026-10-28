import Link from "next/link";
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { Icon, type IconName } from "@/components/icons";
import { initials } from "@/lib/format";

/** Join class names. It doesn't resolve conflicts: Tailwind orders utilities by value, not by
 * class order, so `className="h-9"` can't reliably override a built-in `h-11`. Components
 * expose props (variant, tone, size) for anything that differs — add one rather than
 * overriding a class the component already sets. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Buttons ──────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dangerGhost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:outline-brand-600 disabled:bg-brand-300",
  secondary:
    "bg-brand-50 text-brand-800 hover:bg-brand-100 focus-visible:outline-brand-600 disabled:text-brand-300",
  outline:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:outline-slate-400 disabled:text-slate-400",
  ghost: "text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-400 disabled:text-slate-400",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-600 disabled:bg-red-300",
  dangerGhost: "text-red-600 hover:bg-red-50 focus-visible:outline-red-600 disabled:text-red-300",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-3.5 text-sm gap-1.5",
  md: "h-12 px-5 text-[15px] gap-2",
  lg: "h-14 px-6 text-base gap-2.5",
};

function buttonClasses(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center rounded-xl font-semibold transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: IconName;
}) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : icon ? <Icon name={icon} className="size-4" /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)}>
      {icon && <Icon name={icon} className="size-4" />}
      {children}
    </Link>
  );
}

// ── Form fields ──────────────────────────────────────────────────────────

const CONTROL =
  "block rounded-xl border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 shadow-xs " +
  "placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 " +
  "disabled:bg-slate-50 disabled:text-slate-500";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  htmlFor?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, "h-12 w-full", className)} {...props} />;
  },
);

/** Height comes from `rows` (default 4). */
export function Textarea({ className, rows = 4, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(CONTROL, "w-full py-3", className)} {...props} />;
}

export function Select({
  className,
  children,
  size = "md",
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: "sm" | "md" }) {
  return (
    <select className={cn(CONTROL, size === "sm" ? "h-10 w-32 pr-7" : "h-12 w-full pr-8", className)} {...props}>
      {children}
    </select>
  );
}

/** A selectable pill — for small single/multi choices (labels, languages, radius). */
export function Chip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
        selected
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-brand-600" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "inline-block size-6 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

// ── Display ──────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-xs", className)}>
      {children}
    </div>
  );
}

type Tone = "gray" | "amber" | "blue" | "green" | "red" | "violet" | "brand" | "dark";

const BADGE_TONES: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-sky-100 text-sky-800",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-700",
  violet: "bg-violet-100 text-violet-800",
  brand: "bg-brand-100 text-brand-800",
  dark: "bg-white/10 text-brand-200", // on dark backgrounds
};

export function Badge({
  tone = "gray",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("animate-spin", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="size-7 text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

const ALERT_TONES = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: "info" as const },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: "check" as const },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: "alert" as const },
  error: { box: "border-red-200 bg-red-50 text-red-800", icon: "alert" as const },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof ALERT_TONES;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const style = ALERT_TONES[tone];
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5 text-sm", style.box, className)} role="status">
      <Icon name={style.icon} className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  children,
  action,
}: {
  icon?: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon name={icon} className="size-6" />
      </div>
      <p className="font-semibold text-slate-900">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-slate-500">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const AVATAR_SIZES = { sm: "size-9 text-sm", md: "size-11", lg: "size-14 text-lg" };

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof AVATAR_SIZES }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800",
        AVATAR_SIZES[size],
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          className={cn("size-4", n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300")}
        />
      ))}
    </span>
  );
}

export function SectionHeading({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

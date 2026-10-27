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

/** Join class names. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Buttons ──────────────────────────────────────────────────────────────

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dangerGhost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/30 focus-visible:outline-brand-600 active:scale-[0.98] disabled:bg-brand-300 disabled:shadow-none",
  secondary:
    "bg-brand-50 border border-brand-200/80 text-brand-800 hover:bg-brand-100 hover:text-brand-900 focus-visible:outline-brand-600 active:scale-[0.98] disabled:text-brand-300",
  outline:
    "border-2 border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-slate-400 active:scale-[0.98] disabled:text-slate-400",
  ghost:
    "text-slate-700 hover:bg-slate-100/90 focus-visible:outline-slate-400 active:scale-[0.98] disabled:text-slate-400",
  danger:
    "bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 hover:shadow-lg focus-visible:outline-rose-600 active:scale-[0.98] disabled:bg-rose-300 disabled:shadow-none",
  dangerGhost:
    "text-rose-600 hover:bg-rose-50 focus-visible:outline-rose-600 active:scale-[0.98] disabled:text-rose-300",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-sm font-semibold gap-2 rounded-xl",
  md: "h-12 px-5 text-base font-semibold gap-2.5 rounded-xl shadow-xs",
  lg: "h-14 px-7 text-lg font-bold gap-3 rounded-2xl shadow-sm",
};

function buttonClasses(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center font-semibold transition-all cursor-pointer",
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
      {loading ? <Spinner className="size-5" /> : icon ? <Icon name={icon} className="size-5" /> : null}
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
      {icon && <Icon name={icon} className="size-5" />}
      {children}
    </Link>
  );
}

// ── Form fields ──────────────────────────────────────────────────────────

const CONTROL =
  "block rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-xs " +
  "placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/15 " +
  "disabled:bg-slate-50 disabled:text-slate-500 transition-all";

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
    <div className={cn("space-y-2", className)}>
      <label htmlFor={htmlFor} className="block text-base font-semibold text-slate-800">
        {label}
        {optional && <span className="ml-1.5 font-normal text-slate-400 text-sm">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(CONTROL, "h-12 w-full text-base", className)} {...props} />;
  },
);

/** Height comes from `rows` (default 4). */
export function Textarea({ className, rows = 4, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(CONTROL, "w-full py-3 text-base leading-relaxed", className)} {...props} />;
}

export function Select({
  className,
  children,
  size = "md",
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: "sm" | "md" }) {
  return (
    <select className={cn(CONTROL, size === "sm" ? "h-10 w-36 pr-8 text-sm" : "h-12 w-full pr-10 text-base", className)} {...props}>
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
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all cursor-pointer active:scale-95",
        selected
          ? "border-brand-600 bg-brand-600 text-white shadow-sm"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
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
        "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-brand-600" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "inline-block size-6 rounded-full bg-white shadow-md transition-transform",
          checked ? "translate-x-7" : "translate-x-1",
        )}
      />
    </button>
  );
}

// ── Display ──────────────────────────────────────────────────────────────

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-shadow hover:shadow-sm", className)}>
      {children}
    </div>
  );
}

type Tone = "gray" | "amber" | "blue" | "green" | "red" | "violet" | "brand" | "dark";

const BADGE_TONES: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700 border border-slate-200/80",
  amber: "bg-amber-50 text-amber-800 border border-amber-200/80",
  blue: "bg-sky-50 text-sky-800 border border-sky-200/80",
  green: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
  red: "bg-rose-50 text-rose-700 border border-rose-200/80",
  violet: "bg-violet-50 text-violet-800 border border-violet-200/80",
  brand: "bg-brand-50 text-brand-800 border border-brand-200/80",
  dark: "bg-white/10 text-brand-200 border border-white/20",
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
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs sm:text-sm font-semibold",
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
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3.5 text-slate-500">
      <Spinner className="size-8 text-brand-600" />
      <p className="text-base font-medium">{label}</p>
    </div>
  );
}

const ALERT_TONES = {
  info: { box: "border-sky-200 bg-sky-50/90 text-sky-950", icon: "info" as const },
  success: { box: "border-emerald-200 bg-emerald-50/90 text-emerald-950", icon: "check" as const },
  warning: { box: "border-amber-200 bg-amber-50/90 text-amber-950", icon: "alert" as const },
  error: { box: "border-rose-200 bg-rose-50/90 text-rose-950", icon: "alert" as const },
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
    <div className={cn("flex gap-3.5 rounded-2xl border p-4 sm:p-5 text-base", style.box, className)} role="status">
      <Icon name={style.icon} className="mt-0.5 size-5 shrink-0" />
      <div className="space-y-1">
        {title && <p className="font-bold text-slate-900">{title}</p>}
        {children && <div className="leading-relaxed text-slate-700">{children}</div>}
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
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-xs">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon name={icon} className="size-7" />
      </div>
      <p className="text-xl font-bold text-slate-900">{title}</p>
      {children && <div className="mt-2 max-w-md text-base leading-relaxed text-slate-600">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

const AVATAR_SIZES = { sm: "size-10 text-sm", md: "size-12 text-base", lg: "size-16 text-xl" };

export function Avatar({ name, size = "md" }: { name: string; size?: keyof typeof AVATAR_SIZES }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800 shadow-xs",
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
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          className={cn("size-5", n <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-300")}
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
    <div className={cn("mb-4 flex items-center justify-between gap-4", className)}>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-base sm:text-lg text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

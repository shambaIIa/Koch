import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-[var(--border)]">
      <div>
        <h3 className="font-semibold text-base">{title}</h3>
        {subtitle && (
          <p className="text-sm text-[var(--muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[var(--primary)] text-[var(--primary-fg)] hover:opacity-90 shadow-sm",
    secondary:
      "bg-white border border-[var(--border)] text-[var(--foreground)] hover:bg-slate-50",
    ghost: "text-[var(--muted)] hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const variants = {
    primary: "bg-[var(--primary)] text-[var(--primary-fg)] hover:opacity-90",
    secondary:
      "bg-white border border-[var(--border)] text-[var(--foreground)] hover:bg-slate-50",
    ghost: "text-[var(--muted)] hover:bg-slate-100",
  };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
        variants[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium mb-1.5 text-[var(--foreground)]"
    >
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]",
        props.className
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]",
        props.className
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]",
        props.className
      )}
    />
  );
}

const severityStyles: Record<string, string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-sky-50 text-sky-700 border-sky-200",
  info: "bg-emerald-50 text-emerald-700 border-emerald-200",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof severityStyles;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        severityStyles[tone] ?? severityStyles.neutral
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-6">
      <p className="font-medium text-[var(--foreground)]">{title}</p>
      {description && (
        <p className="text-sm text-[var(--muted)] mt-1 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {hint && <p className="text-xs text-[var(--muted)] mt-1">{hint}</p>}
    </Card>
  );
}

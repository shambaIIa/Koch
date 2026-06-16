"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▤" },
  { href: "/students", label: "Öğrenciler", icon: "☺" },
  { href: "/agenda", label: "Görüşme Gündemi", icon: "◎" },
  { href: "/settings", label: "Modüller", icon: "⚙" },
];

export function Sidebar({ coachName }: { coachName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] px-3 py-4">
      <div className="flex items-center gap-2 px-2 pb-4 mb-2 border-b border-[var(--border)]">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white font-bold">
          K
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Koç Paneli</p>
          <p className="text-xs text-[var(--muted)]">{coachName}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--muted)] hover:bg-slate-100"
              )}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 flex border-t border-[var(--border)] bg-[var(--surface)]">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px]",
              active ? "text-[var(--primary)]" : "text-[var(--muted)]"
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

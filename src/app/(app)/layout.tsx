import { requireUser } from "@/lib/guard";
import { logoutAction } from "@/actions/auth";
import { Sidebar, MobileNav } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      <Sidebar coachName={user.name} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 md:px-6 py-3">
          <div className="md:hidden flex items-center gap-2">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)] text-white text-sm font-bold">
              K
            </div>
            <span className="font-semibold text-sm">Koç Paneli</span>
          </div>
          <div className="hidden md:block" />
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
            >
              Çıkış
            </button>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 max-w-6xl w-full mx-auto">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
